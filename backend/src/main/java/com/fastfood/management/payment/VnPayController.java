package com.fastfood.management.payment;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import com.fastfood.management.service.WalletService;
import java.util.Map;
import java.util.TreeMap;

@Controller
@RequestMapping("/payment/vnpay")
public class VnPayController {
    private final VnPayService service;
    private final WalletService wallet;
    public VnPayController(VnPayService service, WalletService wallet) { this.service=service; this.wallet=wallet; }

    @GetMapping("/return")
    public String paymentReturn(@RequestParam Map<String, String> params, HttpServletRequest request) {
        boolean isWalletTopUp = wallet.isWalletReference(params.get("vnp_TxnRef"));
        boolean success = service.processReturn(new TreeMap<>(params));
        if (isWalletTopUp) return "redirect:/account?topup=" + (success ? "success" : "failed");
        return "redirect:/?payment=" + (success ? "success" : "failed") + "&provider=vnpay";
    }
}
