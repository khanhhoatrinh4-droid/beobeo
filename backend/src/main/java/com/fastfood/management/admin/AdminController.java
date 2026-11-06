package com.fastfood.management.admin;

import org.springframework.stereotype.Controller;
import org.springframework.security.core.Authentication;
import com.fastfood.management.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class AdminController {
    private final UserRepository users;

    public AdminController(UserRepository users) {
        this.users = users;
    }

    @GetMapping("/admin")
    public String adminRoot() { return "redirect:/admin/dashboard"; }

    @GetMapping("/admin/login")
    public String login(@RequestParam(required = false) String error,
                        @RequestParam(required = false) String required,
                        @RequestParam(required = false) String logout,
                        @RequestParam(required = false) String inactive,
                        Model model) {
        model.addAttribute("error", inactive != null ? "Tài khoản không hoạt động. Vui lòng liên hệ quản trị viên." : error != null
                ? "Thông tin đăng nhập quản trị không đúng hoặc tài khoản không có quyền Admin."
                : required != null ? "Vui lòng đăng nhập Admin để tiếp tục." : null);
        model.addAttribute("loggedOut", logout != null);
        return "admin-login";
    }

    @GetMapping("/admin/dashboard")
    public String dashboard(Authentication authentication, Model model) {
        model.addAttribute("adminUsername", authentication.getName());
        return "admin";
    }

    @GetMapping("/admin/profile")
    public String profile(Authentication authentication, Model model) {
        users.findByUsername(authentication.getName()).ifPresent(user -> model.addAttribute("adminProfile", user));
        return "admin-profile";
    }
}
