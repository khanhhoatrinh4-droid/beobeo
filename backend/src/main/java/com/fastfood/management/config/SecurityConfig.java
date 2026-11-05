package com.fastfood.management.config;

import com.fastfood.management.repository.UserRepository;
import com.fastfood.management.entity.User;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.core.annotation.Order;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.savedrequest.NullRequestCache;
import org.springframework.security.web.util.matcher.AndRequestMatcher;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.util.matcher.NegatedRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

@Configuration
public class SecurityConfig {
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    UserDetailsService userDetailsService(UserRepository users) {
        return username -> users.findByUsername(username)
                .map(user -> org.springframework.security.core.userdetails.User.withUsername(user.getUsername())
                        .password(user.getPassword()).roles(user.getRole()).disabled(!user.isActive()).build())
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản."));
    }

    @Bean
    @Primary
    AuthenticationManager userAuthenticationManager(
            @Qualifier("userDetailsService") UserDetailsService users,
            PasswordEncoder passwords) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(users);
        provider.setPasswordEncoder(passwords);
        return new ProviderManager(provider);
    }

    @Bean
    AuthenticationManager adminAuthenticationManager(
            UserRepository users,
            PasswordEncoder passwords) {
        UserDetailsService adminUsers = username -> users.findByUsername(username)
                .filter(user -> "ADMIN".equals(user.getRole()))
                .map(SecurityConfig::toUserDetails)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản quản trị."));
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(adminUsers);
        provider.setPasswordEncoder(passwords);
        return new ProviderManager(provider);
    }

    @Bean
    SecurityContextRepository adminSecurityContextRepository() {
        HttpSessionSecurityContextRepository repository = new HttpSessionSecurityContextRepository();
        repository.setSpringSecurityContextKey("ADMIN_SECURITY_CONTEXT");
        return repository;
    }

    @Bean
    @Order(1)
    SecurityFilterChain adminSecurityFilterChain(
            HttpSecurity http,
            @Qualifier("adminAuthenticationManager") AuthenticationManager adminAuthenticationManager,
            @Qualifier("adminSecurityContextRepository") SecurityContextRepository adminSecurityContextRepository)
            throws Exception {
        http.securityMatcher(adminRequestMatcher())
                .authenticationManager(adminAuthenticationManager)
                .securityContext(context -> context.securityContextRepository(adminSecurityContextRepository))
                .requestCache(cache -> cache.requestCache(new NullRequestCache()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/admin/login").permitAll()
                        .anyRequest().hasRole("ADMIN"))
                .formLogin(form -> form
                        .loginPage("/admin/login")
                        .loginProcessingUrl("/admin/login")
                        .usernameParameter("username").passwordParameter("password")
                        .defaultSuccessUrl("/admin/dashboard", true)
                        .failureUrl("/admin/login?error"))
                .logout(logout -> logout
                        .logoutUrl("/admin/logout")
                        .logoutSuccessUrl("/admin/login?logout")
                        .invalidateHttpSession(false))
                .exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, exception) -> {
                    if (request.getRequestURI().startsWith("/api/")) {
                        response.setStatus(401);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"message\":\"Vui lòng đăng nhập quản trị để tiếp tục.\"}");
                    } else response.sendRedirect("/admin/login?required");
                }).accessDeniedHandler((request, response, exception) -> response.sendRedirect("/access-denied")))
                .csrf(csrf -> csrf.csrfTokenRepository(
                        org.springframework.security.web.csrf.CookieCsrfTokenRepository.withHttpOnlyFalse()));
        return http.build();
    }

    @Bean
    @Order(2)
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            @Qualifier("userAuthenticationManager") AuthenticationManager userAuthenticationManager)
            throws Exception {
        http.authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/", "/css/**", "/js/**", "/images/**", "/auth/**", "/login", "/register",
                                "/access-denied", "/error", "/payment/vnpay/return", "/payment/momo/return",
                                "/payment/momo/ipn", "/payment/zalopay/return", "/payment/zalopay/callback")
                        .permitAll()
                        .requestMatchers("/account").hasRole("CUSTOMER")
                        .requestMatchers("/api/account/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/orders/*/cancel").hasRole("CUSTOMER")
                        .requestMatchers("/api/orders/**", "/checkout/**").authenticated()
                        .anyRequest().permitAll())
                .authenticationManager(userAuthenticationManager)
                .securityContext(context -> context.securityContextRepository(
                        new HttpSessionSecurityContextRepository()))
                .formLogin(form -> form
                        .loginPage("/login")
                        .loginProcessingUrl("/login")
                        .usernameParameter("username").passwordParameter("password")
                        .defaultSuccessUrl("/", false).failureUrl("/login?error"))
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/?logout")
                        .invalidateHttpSession(false))
                .exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, exception) -> {
                    if (request.getRequestURI().startsWith("/api/")) {
                        response.setStatus(401);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"message\":\"Vui lòng đăng nhập để tiếp tục.\"}");
                    } else response.sendRedirect("/login?required");
                }).accessDeniedHandler((request, response, exception) -> response.sendRedirect("/access-denied")))
                .csrf(csrf -> csrf.csrfTokenRepository(
                        org.springframework.security.web.csrf.CookieCsrfTokenRepository.withHttpOnlyFalse()));
        return http.build();
    }

    private static UserDetails toUserDetails(User user) {
        return org.springframework.security.core.userdetails.User.withUsername(user.getUsername())
                .password(user.getPassword()).roles(user.getRole()).disabled(!user.isActive()).build();
    }

    private static RequestMatcher adminRequestMatcher() {
        return new OrRequestMatcher(
                new AntPathRequestMatcher("/admin/**"),
                new AntPathRequestMatcher("/api/admin/**"),
                new AntPathRequestMatcher("/api/products/admin/**"),
                new AntPathRequestMatcher("/api/categories/admin/**"),
                new AntPathRequestMatcher("/api/posts/admin/**"),
                new AntPathRequestMatcher("/api/orders/admin/**"),
                new AntPathRequestMatcher("/api/categories/**", HttpMethod.POST.name()),
                new AntPathRequestMatcher("/api/categories/**", HttpMethod.PUT.name()),
                new AntPathRequestMatcher("/api/categories/**", HttpMethod.DELETE.name()),
                new AntPathRequestMatcher("/api/posts/**", HttpMethod.POST.name()),
                new AntPathRequestMatcher("/api/posts/**", HttpMethod.PUT.name()),
                new AntPathRequestMatcher("/api/posts/**", HttpMethod.DELETE.name()),
                new AntPathRequestMatcher("/api/products/**", HttpMethod.POST.name()),
                new AntPathRequestMatcher("/api/products/**", HttpMethod.PUT.name()),
                new AntPathRequestMatcher("/api/products/**", HttpMethod.DELETE.name()),
                new AndRequestMatcher(
                        new AntPathRequestMatcher("/api/orders/**", HttpMethod.PATCH.name()),
                        new NegatedRequestMatcher(
                                new AntPathRequestMatcher("/api/orders/*/cancel", HttpMethod.PATCH.name()))));
    }
}
