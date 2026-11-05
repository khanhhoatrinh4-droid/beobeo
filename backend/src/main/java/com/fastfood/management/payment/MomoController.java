package com.fastfood.management.payment;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Controller
@RequestMapping("/payment/momo")
public class MomoController {
    private final MomoService momo;
    public MomoController(MomoService momo) { this.momo = momo; }

    @GetMapping("/return")
    public String result(@RequestParam Map<String, Object> params) {
        String reference = String.valueOf(params.getOrDefault("orderId", ""));
        boolean success = momo.processReturn(reference);
        return "redirect:/?payment=" + (success ? "success" : "pending") + "&provider=momo";
    }

    @PostMapping("/ipn")
    @ResponseBody
    public ResponseEntity<Void> ipn(@RequestBody Map<String, Object> params) {
        momo.processNotification(params);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
