package com.fastfood.management.controller;

import com.fastfood.management.service.VnPayService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.Map;
import java.util.TreeMap;

@Controller
@RequestMapping("/payment/vnpay")
public class VnPayController {
    private final VnPayService service;
    public VnPayController(VnPayService service) { this.service=service; }

    @GetMapping("/return")
    public String paymentReturn(@RequestParam Map<String, String> params, HttpServletRequest request) {
        boolean success = service.processReturn(new TreeMap<>(params));
        return "redirect:/?payment=" + (success ? "success" : "failed");
    }
}
