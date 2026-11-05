package com.fastfood.management.auth;

import com.fastfood.management.entity.User;
import com.fastfood.management.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

@Controller
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    public AuthController(UserRepository users, PasswordEncoder passwords) { this.users = users; this.passwords = passwords; }

    @GetMapping("/login")
    public String login(@RequestParam(required = false) String error, @RequestParam(required = false) String required, Model model) {
        model.addAttribute("error", error != null ? "Tên đăng nhập hoặc mật khẩu không đúng, hoặc tài khoản đã khóa." : required != null ? "Vui lòng đăng nhập để tiếp tục." : null);
        model.addAttribute("registered", false);
        return "login";
    }

    @GetMapping("/access-denied")
    public String accessDenied() { return "access-denied"; }

    @GetMapping("/register")
    public String register(Model model) { model.addAttribute("registration", new Registration()); return "register"; }

    @PostMapping("/register")
    public String register(@Valid @ModelAttribute("registration") Registration registration, BindingResult result, Model model) {
        if (users.findByUsername(registration.getUsername()).isPresent()) result.rejectValue("username", "duplicate", "Tên đăng nhập đã được sử dụng.");
        String email = registration.getEmail() == null ? null : registration.getEmail().trim();
        if (email != null && !email.isBlank() && users.existsByEmailIgnoreCase(email)) result.rejectValue("email", "duplicate", "Email đã được sử dụng.");
        if (result.hasErrors()) return "register";
        User user = new User(); user.setUsername(registration.getUsername().trim()); user.setPassword(passwords.encode(registration.getPassword()));
        user.setFullName(registration.getFullName().trim()); user.setEmail(email); user.setPhone(registration.getPhone().trim()); user.setRole("CUSTOMER"); users.save(user);
        return "redirect:/login?registered";
    }

    public static class Registration {
        @NotBlank @Size(min = 3, max = 100) private String username;
        @NotBlank @Size(min = 8, max = 72) private String password;
        @NotBlank @Size(max = 150) private String fullName;
        @Email @Size(max = 254) private String email;
        @NotBlank @Pattern(regexp = "[0-9+() .-]{9,20}", message = "Số điện thoại không hợp lệ.") private String phone;
        public String getUsername(){return username;} public void setUsername(String v){username=v;}
        public String getPassword(){return password;} public void setPassword(String v){password=v;}
        public String getFullName(){return fullName;} public void setFullName(String v){fullName=v;}
        public String getEmail(){return email;} public void setEmail(String v){email=v;}
        public String getPhone(){return phone;} public void setPhone(String v){phone=v;}
    }
}
