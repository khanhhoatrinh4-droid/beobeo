package com.fastfood.management.controller;

import com.fastfood.management.entity.User;
import com.fastfood.management.repository.OrderRepository;
import com.fastfood.management.repository.ProductRepository;
import com.fastfood.management.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

@RestController
@RequestMapping("/api/admin")
public class AdminApiController {
    private final UserRepository users;
    private final OrderRepository orders;
    private final ProductRepository products;

    public AdminApiController(UserRepository users, OrderRepository orders, ProductRepository products) {
        this.users = users;
        this.orders = orders;
        this.products = products;
    }

    @GetMapping("/users")
    public List<Map<String, Object>> userList() {
        return users.findAll().stream().map(user -> Map.<String, Object>of(
                "id", user.getId(), "username", user.getUsername(),
                "fullName", user.getFullName() == null ? "" : user.getFullName(),
                "email", user.getEmail() == null ? "" : user.getEmail(),
                "phone", user.getPhone() == null ? "" : user.getPhone(),
                "address", user.getAddress() == null ? "" : user.getAddress(),
                "role", user.getRole(), "active", user.isActive())).toList();
    }

    @GetMapping("/orders")
    public List<Map<String, Object>> orderList() {
        return orders.findAll().stream().map(order -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", order.getId());
            row.put("customerName", order.getCustomerName());
            row.put("customerPhone", order.getCustomerPhone());
            row.put("shippingAddress", order.getShippingAddress());
            row.put("orderDate", order.getOrderDate());
            row.put("status", order.getStatus());
            row.put("totalAmount", order.getTotalAmount());
            row.put("paymentMethod", order.getPaymentMethod());
            row.put("paid", order.isPaid());
            row.put("items", order.getItems().stream().map(item -> Map.of(
                    "productName", item.getProduct().getName(),
                    "quantity", item.getQuantity(),
                    "unitPrice", item.getUnitPrice(),
                    "subtotal", item.getSubtotal())).toList());
            return row;
        }).toList();
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<?> userStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        return users.findById(id).map(user -> {
            user.setActive(Boolean.TRUE.equals(body.get("active")));
            User saved = users.save(user);
            return ResponseEntity.ok(Map.of("id", saved.getId(), "active", saved.isActive()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/stats")
    public Map<String, Long> stats() {
        return Map.of("products", products.count(), "orders", orders.count(), "users", users.count());
    }
}
