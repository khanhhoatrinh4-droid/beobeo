package com.fastfood.management.service;

import com.fastfood.management.config.VnPayProperties;
import com.fastfood.management.entity.Order;
import com.fastfood.management.enums.OrderStatus;
import com.fastfood.management.repository.OrderRepository;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@Service
@EnableConfigurationProperties(VnPayProperties.class)
public class VnPayService {
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private final VnPayProperties config;
    private final OrderRepository orders;
    public VnPayService(VnPayProperties config, OrderRepository orders) { this.config=config; this.orders=orders; }

    public String createPaymentUrl(Order order, String ip) {
        if (config.getTmnCode().isBlank() || config.getHashSecret().isBlank())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "VNPay chưa được cấu hình merchant. Hãy thiết lập VNPAY_TMN_CODE và VNPAY_HASH_SECRET.");
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        TreeMap<String, String> params = new TreeMap<>();
        params.put("vnp_Version", config.getVersion()); params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", config.getTmnCode());
        params.put("vnp_Amount", order.getTotalAmount().multiply(BigDecimal.valueOf(100)).toBigInteger().toString());
        params.put("vnp_CurrCode", "VND"); params.put("vnp_TxnRef", order.getPaymentReference());
        params.put("vnp_OrderInfo", "Thanh toan don FASTY " + order.getId()); params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn"); params.put("vnp_ReturnUrl", config.getReturnUrl());
        params.put("vnp_IpAddr", ip == null || ip.isBlank() ? "127.0.0.1" : ip);
        params.put("vnp_CreateDate", DATE.format(now)); params.put("vnp_ExpireDate", DATE.format(now.plusMinutes(15)));
        String query = encode(params);
        return config.getPayUrl() + "?" + query + "&vnp_SecureHash=" + hmac(query);
    }

    public boolean processReturn(Map<String, String> params) {
        String received = params.get("vnp_SecureHash");
        if (received == null || !constantEquals(received, hmac(encode(withoutHash(params))))) return false;
        String ref = params.get("vnp_TxnRef");
        Order order = orders.findByPaymentReference(ref).orElse(null);
        if (order == null || !params.getOrDefault("vnp_TmnCode", "").equals(config.getTmnCode())) return false;
        String amount = params.get("vnp_Amount");
        String expected = order.getTotalAmount().multiply(BigDecimal.valueOf(100)).toBigInteger().toString();
        if (!Objects.equals(amount, expected)) return false;
        if (order.isPaid()) return true;
        if ("00".equals(params.get("vnp_ResponseCode")) && "00".equals(params.get("vnp_TransactionStatus"))) {
            order.setPaid(true); order.setStatus(OrderStatus.CONFIRMED); orders.save(order);
            return true;
        }
        order.setStatus(OrderStatus.CANCELLED); orders.save(order);
        return false;
    }

    private TreeMap<String,String> withoutHash(Map<String,String> input) {
        TreeMap<String,String> clean = new TreeMap<>();
        input.forEach((key,value) -> { if (!key.equals("vnp_SecureHash") && !key.equals("vnp_SecureHashType")) clean.put(key,value); });
        return clean;
    }
    private String encode(Map<String,String> params) {
        return params.entrySet().stream().map(entry -> url(entry.getKey()) + "=" + url(entry.getValue()))
                .reduce((a,b) -> a + "&" + b).orElse("");
    }
    private String url(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }
    private String hmac(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(config.getHashSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) { throw new IllegalStateException("Không tạo được chữ ký VNPay.", exception); }
    }
    private boolean constantEquals(String a, String b) { return java.security.MessageDigest.isEqual(a.toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8), b.toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8)); }
}
