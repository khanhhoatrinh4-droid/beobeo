package com.fastfood.management.config;

import com.fastfood.management.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.filter.OncePerRequestFilter;

/** Re-check account status because an existing login retains its original enabled flag. */
final class ActiveAccountFilter extends OncePerRequestFilter {
    private final UserRepository users;
    private final SecurityContextRepository contexts;
    private final String loginPath;

    ActiveAccountFilter(UserRepository users, SecurityContextRepository contexts, String loginPath) {
        this.users = users;
        this.contexts = contexts;
        this.loginPath = loginPath;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/css/") || path.startsWith("/js/") || path.startsWith("/images/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)
                && users.findByUsername(authentication.getName()).filter(user -> user.isActive()).isEmpty()) {
            var empty = SecurityContextHolder.createEmptyContext();
            SecurityContextHolder.setContext(empty);
            // Clear this login only; customer and admin have independent contexts in one session.
            contexts.saveContext(empty, request, response);
            response.setHeader("Cache-Control", "no-store");
            if (request.getRequestURI().startsWith(request.getContextPath() + "/api/")) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"code\":\"ACCOUNT_INACTIVE\",\"message\":\"Tài khoản không hoạt động. Vui lòng liên hệ quản trị viên.\"}");
            } else {
                response.sendRedirect(request.getContextPath() + loginPath + "?inactive=true");
            }
            return;
        }
        chain.doFilter(request, response);
    }
}
