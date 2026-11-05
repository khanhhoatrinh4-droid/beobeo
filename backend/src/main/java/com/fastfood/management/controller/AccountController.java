package com.fastfood.management.controller;

import com.fastfood.management.entity.User;
import com.fastfood.management.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/account")
public class AccountController {
    private final UserRepository users;

    public AccountController(UserRepository users) { this.users = users; }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody ProfileRequest request,
                                           @AuthenticationPrincipal UserDetails principal) {
        User user = users.findByUsername(principal.getUsername()).orElseThrow();
        if (request == null || request.fullName() == null || request.fullName().isBlank() || request.fullName().trim().length() > 150) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập họ tên hợp lệ (tối đa 150 ký tự)."));
        }
        String email = trimToNull(request.email());
        String phone = trimToNull(request.phone());
        if (email != null && (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$") || email.length() > 254))
            return ResponseEntity.badRequest().body(Map.of("message", "Email không hợp lệ."));
        if (email != null && users.existsByEmailIgnoreCaseAndUsernameNot(email, user.getUsername()))
            return ResponseEntity.badRequest().body(Map.of("message", "Email đã được sử dụng."));
        if (phone != null && !phone.matches("[0-9+() .-]{9,20}"))
            return ResponseEntity.badRequest().body(Map.of("message", "Số điện thoại không hợp lệ."));
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPhone(phone);
        user.setAddress(trimToNull(request.address()));
        User saved = users.save(user);
        return ResponseEntity.ok(Map.of("fullName", saved.getFullName(), "email", saved.getEmail() == null ? "" : saved.getEmail(),
                "phone", saved.getPhone() == null ? "" : saved.getPhone(), "address", saved.getAddress() == null ? "" : saved.getAddress()));
    }

    private String trimToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    public record ProfileRequest(String fullName, String email, String phone, String address) {}
}
