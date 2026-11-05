package com.fastfood.management.controller;

import com.fastfood.management.payment.VnPayService;
import com.fastfood.management.service.WalletService;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/account/wallet")
public class WalletController {
    private final WalletService wallet;
    private final VnPayService vnPay;

    public WalletController(WalletService wallet, VnPayService vnPay) {
        this.wallet = wallet;
        this.vnPay = vnPay;
    }

    @GetMapping
    public Map<String, Object> summary(@AuthenticationPrincipal UserDetails principal) {
        return wallet.summary(principal.getUsername());
    }

    @PostMapping("/top-ups")
    public ResponseEntity<?> topUp(@RequestBody TopUpRequest request,
                                   @AuthenticationPrincipal UserDetails principal,
                                   jakarta.servlet.http.HttpServletRequest servletRequest) {
        try {
            if (!vnPay.isConfigured()) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(Map.of("message", "VNPay chưa được cấu hình merchant sandbox."));
            }
            var transaction = wallet.createTopUp(principal.getUsername(), request == null ? null : request.amount());
            String url = vnPay.createPaymentUrl(transaction.getTransactionReference(), transaction.getAmount(),
                    "Nap tien tai khoan beobeo", servletRequest.getRemoteAddr());
            return ResponseEntity.ok(Map.of("paymentUrl", url));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }

    public record TopUpRequest(BigDecimal amount) { }
}
