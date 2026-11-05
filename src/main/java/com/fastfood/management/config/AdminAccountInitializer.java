package com.fastfood.management.config;

import com.fastfood.management.entity.User;
import com.fastfood.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminAccountInitializer implements ApplicationRunner {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    @Value("${fasty.admin.username:}") private String username;
    @Value("${fasty.admin.password:}") private String password;

    public AdminAccountInitializer(UserRepository users, PasswordEncoder passwords) {
        this.users = users;
        this.passwords = passwords;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (username == null || username.isBlank() || password == null || password.length() < 8) return;
        User account = users.findByUsername(username.trim()).orElseGet(() -> {
            User created = new User();
            created.setUsername(username.trim());
            created.setPassword(passwords.encode(password));
            created.setFullName("FASTY Administrator");
            return created;
        });
        account.setRole("ADMIN");
        account.setActive(true);
        users.save(account);
    }
}
