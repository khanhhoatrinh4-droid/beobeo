package com.fastfood.management.payment;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Controller
@RequestMapping("/payment/zalopay")
public class ZaloPayController {
    private final ZaloPayService zaloPay;
    private final ObjectMapper json;
    public ZaloPayController(ZaloPayService zaloPay, ObjectMapper json) {
        this.zaloPay = zaloPay; this.json = json;
    }

    @GetMapping("/return")
    public String result(@RequestParam("order") String order) {
        boolean success = zaloPay.processReturnByOrderId(order);
        return "redirect:/?payment=" + (success ? "success" : "pending") + "&provider=zalopay";
    }

    @PostMapping("/callback")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> callback(@RequestBody Map<String, Object> body) {
        Object rawData = body.get("data");
        Object mac = body.get("mac");
        if (!(rawData instanceof String raw) || !(mac instanceof String signature))
            return ResponseEntity.ok(Map.of("return_code", 2, "return_message", "Invalid"));
        try {
            Map<String, Object> data = json.readValue(raw, Map.class);
            boolean accepted = zaloPay.processCallback(raw, signature, data);
            return ResponseEntity.ok(Map.of("return_code", accepted ? 1 : 2,
                    "return_message", accepted ? "Success" : "Invalid"));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("return_code", 2, "return_message", "Invalid"));
        }
    }
}
