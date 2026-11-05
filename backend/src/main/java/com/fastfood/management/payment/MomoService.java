package com.fastfood.management.payment;

import com.fastfood.management.entity.Order;
import com.fastfood.management.repository.OrderRepository;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@EnableConfigurationProperties(MomoProperties.class)
public class MomoService {
    private final MomoProperties config;
    private final PaymentResultService paymentResult;
    private final OrderRepository orders;
    private final RestClient http = RestClient.create();

    public MomoService(MomoProperties config, PaymentResultService paymentResult, OrderRepository orders) {
        this.config = config;
        this.paymentResult = paymentResult;
        this.orders = orders;
    }

    public String createPaymentUrl(Order order) {
        if (!config.isConfigured())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "MoMo chưa được cấu hình. Hãy đặt MOMO_PARTNER_CODE, MOMO_ACCESS_KEY và MOMO_SECRET_KEY.");
        String orderId = order.getPaymentReference();
        String requestId = UUID.randomUUID().toString();
        String amount = order.getTotalAmount().toBigInteger().toString();
        String orderInfo = "Thanh toan don beobeo " + order.getId();
        String extraData = "";
        String requestType = "captureWallet";
        String raw = "accessKey=" + config.getAccessKey() + "&amount=" + amount + "&extraData=" + extraData
                + "&ipnUrl=" + config.getIpnUrl() + "&orderId=" + orderId + "&orderInfo=" + orderInfo
                + "&partnerCode=" + config.getPartnerCode() + "&redirectUrl=" + config.getRedirectUrl()
                + "&requestId=" + requestId + "&requestType=" + requestType;
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("partnerCode", config.getPartnerCode()); body.put("requestId", requestId);
        body.put("orderId", orderId); body.put("amount", Long.parseLong(amount)); body.put("orderInfo", orderInfo);
        body.put("partnerName", "beobeo"); body.put("storeId", "beobeo");
        body.put("redirectUrl", config.getRedirectUrl()); body.put("ipnUrl", config.getIpnUrl());
        body.put("requestType", requestType); body.put("extraData", extraData); body.put("lang", "vi");
        body.put("autoCapture", true);
        body.put("signature", hmac(config.getSecretKey(), raw));
        try {
            Map<String, Object> response = http.post().uri(config.getEndpoint()).body(body).retrieve()
                    .body(new org.springframework.core.ParameterizedTypeReference<>() {});
            if (response == null || !"0".equals(String.valueOf(response.get("resultCode")))
                    || response.get("payUrl") == null)
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "MoMo không tạo được liên kết thanh toán.");
            return String.valueOf(response.get("payUrl"));
        } catch (ResponseStatusException e) { throw e; }
        catch (Exception e) { throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Không kết nối được MoMo."); }
    }

    public boolean isConfigured() { return config.isConfigured(); }

    public boolean processReturn(String reference) {
        if (!config.isConfigured()) return false;
        Order order = orders.findByPaymentReference(reference).orElse(null);
        if (order == null) return false;
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("partnerCode", config.getPartnerCode());
        params.put("requestId", UUID.randomUUID().toString());
        params.put("orderId", reference);
        params.put("lang", "vi");
        String raw = "accessKey=" + config.getAccessKey() + "&orderId=" + reference
                + "&partnerCode=" + config.getPartnerCode() + "&requestId=" + params.get("requestId");
        params.put("signature", hmac(config.getSecretKey(), raw));
        try {
            Map<String, Object> response = http.post().uri("https://test-payment.momo.vn/v2/gateway/api/query")
                    .body(params).retrieve().body(new org.springframework.core.ParameterizedTypeReference<>() {});
            if (response == null || !config.getPartnerCode().equals(String.valueOf(response.get("partnerCode")))
                    || !reference.equals(String.valueOf(response.get("orderId")))
                    || !order.getTotalAmount().toBigInteger().toString().equals(String.valueOf(response.get("amount")))) return false;
            boolean success = "0".equals(String.valueOf(response.get("resultCode")));
            return paymentResult.complete(reference, String.valueOf(response.get("transId")),
                    String.valueOf(response.get("resultCode")), success, "MOMO", order.getTotalAmount());
        } catch (Exception e) { return false; }
    }

    public boolean processNotification(Map<String, Object> data) {
        if (config.getAccessKey().isBlank() || config.getSecretKey().isBlank()) return false;
        String raw = "accessKey=" + config.getAccessKey() + "&amount=" + data.get("amount")
                + "&extraData=" + data.get("extraData") + "&message=" + data.get("message")
                + "&orderId=" + data.get("orderId") + "&orderInfo=" + data.get("orderInfo")
                + "&orderType=" + data.get("orderType") + "&partnerCode=" + data.get("partnerCode")
                + "&payType=" + data.get("payType") + "&requestId=" + data.get("requestId")
                + "&responseTime=" + data.get("responseTime") + "&resultCode=" + data.get("resultCode")
                + "&transId=" + data.get("transId");
        if (!constantEquals(String.valueOf(data.get("signature")), hmac(config.getSecretKey(), raw))) return false;
        if (!config.getPartnerCode().equals(String.valueOf(data.get("partnerCode")))) return false;
        Order order = orders.findByPaymentReference(String.valueOf(data.get("orderId"))).orElse(null);
        if (order == null || !order.getTotalAmount().toBigInteger().toString().equals(String.valueOf(data.get("amount")))) return false;
        return paymentResult.complete(String.valueOf(data.get("orderId")), String.valueOf(data.get("transId")),
                String.valueOf(data.get("resultCode")), "0".equals(String.valueOf(data.get("resultCode"))), "MOMO", order.getTotalAmount());
    }

    private String hmac(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return java.util.HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) { throw new IllegalStateException("Không thể ký yêu cầu MoMo.", e); }
    }
    private boolean constantEquals(String a, String b) {
        return a != null && b != null && java.security.MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }
}
