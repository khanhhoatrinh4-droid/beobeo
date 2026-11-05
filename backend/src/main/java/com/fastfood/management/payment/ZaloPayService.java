package com.fastfood.management.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fastfood.management.entity.Order;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@EnableConfigurationProperties(ZaloPayProperties.class)
public class ZaloPayService {
    private final ZaloPayProperties config;
    private final ObjectMapper json;
    private final com.fastfood.management.repository.OrderRepository orders;
    private final PaymentResultService paymentResult;
    private final RestClient http = RestClient.create();
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("yyMMdd").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    public ZaloPayService(ZaloPayProperties config, ObjectMapper json,
                          com.fastfood.management.repository.OrderRepository orders, PaymentResultService paymentResult) {
        this.config = config;
        this.json = json;
        this.orders = orders;
        this.paymentResult = paymentResult;
    }

    public String createPaymentUrl(Order order, String username) {
        if (!config.isConfigured())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "ZaloPay chưa được cấu hình. Hãy đặt ZALOPAY_APP_ID và ZALOPAY_KEY1.");
        try {
            String appTransId = DAY.format(Instant.now()) + "_" + order.getId();
            String appUser = username == null || username.isBlank() ? "beobeo" : username;
            long appTime = System.currentTimeMillis();
            String amount = order.getTotalAmount().toBigInteger().toString();
            String redirectUrl = config.getRedirectUrl() + "?order=" + order.getId();
            String embed = json.writeValueAsString(Map.of("redirecturl", redirectUrl));
            String item = "[]";
            String macInput = config.getAppId() + "|" + appTransId + "|" + appUser + "|" + amount + "|" + appTime + "|" + embed + "|" + item;
            paymentResult.setGatewayOrderReference(order.getPaymentReference(), "ZALOPAY", appTransId);
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("app_id", config.getAppId()); body.put("app_user", appUser); body.put("app_trans_id", appTransId);
            body.put("app_time", appTime); body.put("amount", Long.parseLong(amount));
            body.put("description", "Thanh toan don beobeo " + order.getId()); body.put("callback_url", config.getCallbackUrl());
            body.put("item", item); body.put("embed_data", embed); body.put("bank_code", "");
            body.put("mac", hmac(config.getKey1(), macInput));
            Map<String, Object> response = http.post().uri(config.getEndpoint()).body(body).retrieve()
                    .body(new org.springframework.core.ParameterizedTypeReference<>() {});
            if (response == null || !"1".equals(String.valueOf(response.get("return_code"))) || response.get("order_url") == null)
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "ZaloPay không tạo được liên kết thanh toán.");
            return String.valueOf(response.get("order_url"));
        } catch (ResponseStatusException e) { throw e; }
        catch (Exception e) { throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Không kết nối được ZaloPay."); }
    }

    public boolean isConfigured() { return config.isConfigured(); }

    public boolean verifyCallback(String rawData, String receivedMac) {
        return !config.getKey2().isBlank() && constantEquals(receivedMac, hmac(config.getKey2(), rawData));
    }

    public boolean processReturnByOrderId(String orderIdValue) {
        if (!config.isConfigured()) return false;
        try {
            long id = Long.parseLong(orderIdValue);
            Order order = orders.findById(id).orElse(null);
            if (order == null || order.getPaymentReference() == null) return false;
            String reference = order.getPaymentReference();
            if (paymentResult.findOrder(reference, "ZALOPAY").isEmpty()) return false;
            String appTransId = paymentResult.findPaymentByOrderAndProvider(id, "ZALOPAY")
                    .map(com.fastfood.management.entity.PaymentTransaction::getGatewayOrderReference).orElse(null);
            if (appTransId == null || appTransId.isBlank()) return false;
            String macInput = config.getAppId() + "|" + appTransId + "|" + config.getKey1();
            Map<String, Object> body = Map.of("app_id", config.getAppId(), "app_trans_id", appTransId,
                    "mac", hmac(config.getKey1(), macInput));
            Map<String, Object> response = http.post().uri("https://sb-openapi.zalopay.vn/v2/query").body(body).retrieve()
                    .body(new org.springframework.core.ParameterizedTypeReference<>() {});
            if (response == null || !"1".equals(String.valueOf(response.get("return_code")))
                    || !order.getTotalAmount().toBigInteger().toString().equals(String.valueOf(response.get("amount")))) return false;
            return paymentResult.complete(reference, String.valueOf(response.get("zp_trans_id")), "1", true,
                    "ZALOPAY", order.getTotalAmount());
        } catch (Exception e) { return false; }
    }

    public boolean processCallback(String rawData, String receivedMac, Map<String, Object> data) {
        if (!verifyCallback(rawData, receivedMac)) return false;
        try {
            String transactionId = String.valueOf(data.get("app_trans_id"));
            String suffix = transactionId.substring(transactionId.lastIndexOf('_') + 1);
            Order order = orders.findById(Long.parseLong(suffix)).orElse(null);
            if (order == null) return false;
            if (order == null || !String.valueOf(order.getTotalAmount().toBigInteger()).equals(String.valueOf(data.get("amount")))) return false;
            String expectedTransactionId = paymentResult.findPaymentByOrderAndProvider(order.getId(), "ZALOPAY")
                    .map(com.fastfood.management.entity.PaymentTransaction::getGatewayOrderReference).orElse("");
            if (!expectedTransactionId.equals(transactionId) || !String.valueOf(config.getAppId()).equals(String.valueOf(data.get("app_id")))) return false;
            String reference = order.getPaymentReference();
            if (reference == null || paymentResult.findOrder(reference, "ZALOPAY").isEmpty()) return false;
            if (!"1".equals(String.valueOf(data.get("status"))) || data.get("zp_trans_id") == null) return false;
            // Callback is trusted only after MAC verification; the amount must still match the recorded order.
            return paymentResult.complete(reference, String.valueOf(data.get("zp_trans_id")), "CALLBACK",
                    true, "ZALOPAY", order.getTotalAmount());
        } catch (Exception e) { return false; }
    }

    private String hmac(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return java.util.HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) { throw new IllegalStateException("Không thể ký yêu cầu ZaloPay.", e); }
    }
    private boolean constantEquals(String a, String b) {
        return a != null && b != null && java.security.MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }
}
