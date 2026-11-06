package com.fastfood.management;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import com.fastfood.management.entity.User;
import com.fastfood.management.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

@SpringBootTest
@AutoConfigureMockMvc
class AdminAuthenticationTests {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserRepository users;

    @Autowired
    private PasswordEncoder passwords;

    @BeforeEach
    void accounts() {
        for (String role : List.of("CUSTOMER", "ADMIN")) {
            User user = new User();
            user.setUsername(role.toLowerCase());
            user.setRole(role);
            user.setActive(true);
            user.setPassword(passwords.encode("test-password"));
            when(users.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
        }
        User manager = new User();
        manager.setUsername("manager");
        manager.setRole("ADMIN");
        manager.setActive(true);
        when(users.findByUsername("manager")).thenReturn(Optional.of(manager));
    }

    @Test
    void lockingCustomerInAdminBlocksTheirNextRefreshAndKeepsAdminLogin() throws Exception {
        MockHttpSession session = new MockHttpSession();
        login(session, "/login", "customer", "/");
        login(session, "/admin/login", "admin", "/admin/dashboard");
        User customer = users.findByUsername("customer").orElseThrow();
        var customerId = User.class.getDeclaredField("id");
        customerId.setAccessible(true);
        customerId.set(customer, 42L);
        when(users.findById(42L)).thenReturn(Optional.of(customer));
        when(users.save(customer)).thenReturn(customer);
        var page = mockMvc.perform(get("/admin/dashboard").session(session)).andReturn();
        CsrfToken csrf = (CsrfToken) page.getRequest().getAttribute("_csrf");
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/admin/users/42/status")
                        .session(session).cookie(page.getResponse().getCookie("XSRF-TOKEN"))
                        .param(csrf.getParameterName(), csrf.getToken())
                        .contentType("application/json").content("{\"active\":false}"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/").session(session)).andExpect(redirectedUrl("/login?inactive=true"));
        assertNull(session.getAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY));
        assertIdentity(session, "ADMIN_SECURITY_CONTEXT", "admin");
        mockMvc.perform(get("/login?inactive=true").session(session)).andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Tài khoản không hoạt động")));
        mockMvc.perform(get("/account").session(session)).andExpect(redirectedUrl("/login?required"));
        login(session, "/login", "customer", "/login?inactive=true");
        customer.setActive(true);
        login(session, "/login", "customer", "http://localhost/account?continue");
    }

    @Test
    void lockedCustomerApiIsRejectedAndSessionIsCleared() throws Exception {
        MockHttpSession session = new MockHttpSession();
        login(session, "/login", "customer", "/");
        users.findByUsername("customer").orElseThrow().setActive(false);
        mockMvc.perform(get("/api/account/profile").session(session))
                .andExpect(status().isForbidden())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.code").value("ACCOUNT_INACTIVE"));
        assertNull(session.getAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY));
    }

    @Test
    void lockedAdminCannotKeepUsingDashboardButCustomerSessionSurvives() throws Exception {
        MockHttpSession session = new MockHttpSession();
        login(session, "/login", "customer", "/");
        login(session, "/admin/login", "admin", "/admin/dashboard");
        users.findByUsername("admin").orElseThrow().setActive(false);
        mockMvc.perform(get("/admin/dashboard").session(session)).andExpect(redirectedUrl("/admin/login?inactive=true"));
        assertNull(session.getAttribute("ADMIN_SECURITY_CONTEXT"));
        assertIdentity(session, HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, "customer");
        mockMvc.perform(get("/admin/login?inactive=true").session(session)).andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Tài khoản không hoạt động")));
    }

    @Test
    void deletedAccountCannotContinueUsingItsSession() throws Exception {
        MockHttpSession session = new MockHttpSession();
        login(session, "/login", "customer", "/");
        when(users.findByUsername("customer")).thenReturn(Optional.empty());
        mockMvc.perform(get("/account").session(session)).andExpect(redirectedUrl("/login?inactive=true"));
    }

    @Test
    void realLoginsKeepBothIdentitiesAndLogoutIndependently() throws Exception {
        MockHttpSession session = new MockHttpSession();
        login(session, "/login", "customer", "/");
        assertIdentity(session, HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, "customer");
        mockMvc.perform(get("/admin").session(session))
                .andExpect(redirectedUrl("/admin/login?required"));

        login(session, "/admin/login", "admin", "/admin/dashboard");
        assertIdentity(session, "ADMIN_SECURITY_CONTEXT", "admin");
        assertIdentity(session, HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, "customer");
        mockMvc.perform(get("/admin").session(session))
                .andExpect(redirectedUrl("/admin/dashboard"));

        submit(session, "/admin/dashboard", "/admin/logout")
                .andExpect(redirectedUrl("/admin/login?logout"));
        assertNull(session.getAttribute("ADMIN_SECURITY_CONTEXT"));
        assertIdentity(session, HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, "customer");

        login(session, "/admin/login", "admin", "/admin/dashboard");
        submit(session, "/login", "/logout").andExpect(redirectedUrl("/?logout"));
        assertNull(session.getAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY));
        assertIdentity(session, "ADMIN_SECURITY_CONTEXT", "admin");
        mockMvc.perform(get("/admin/dashboard").session(session)).andExpect(status().isOk());
    }

    @Test
    void customerCredentialsCannotAuthenticateAsAdmin() throws Exception {
        MockHttpSession session = new MockHttpSession();
        login(session, "/login", "customer", "/");
        login(session, "/admin/login", "customer", "/admin/login?error");
        assertNull(session.getAttribute("ADMIN_SECURITY_CONTEXT"));
        assertIdentity(session, HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, "customer");
        mockMvc.perform(get("/api/admin/stats").session(session)).andExpect(status().isUnauthorized());
    }

    @Test
    void storefrontLoginWithAdminAccountDoesNotGrantAdminSession() throws Exception {
        MockHttpSession session = new MockHttpSession();
        mockMvc.perform(get("/admin").session(session)).andExpect(redirectedUrl("/admin/login?required"));
        login(session, "/login", "admin", "/");
        assertNull(session.getAttribute("ADMIN_SECURITY_CONTEXT"));
        mockMvc.perform(get("/admin").session(session)).andExpect(redirectedUrl("/admin/login?required"));
    }

    private void login(MockHttpSession session, String path, String username, String destination) throws Exception {
        var page = mockMvc.perform(get(path).session(session)).andExpect(status().isOk()).andReturn();
        CsrfToken csrf = (CsrfToken) page.getRequest().getAttribute("_csrf");
        mockMvc.perform(post(path).session(session)
                        .cookie(page.getResponse().getCookie("XSRF-TOKEN"))
                        .param(csrf.getParameterName(), csrf.getToken())
                        .param("username", username).param("password", "test-password"))
                .andExpect(redirectedUrl(destination));
    }

    private org.springframework.test.web.servlet.ResultActions submit(
            MockHttpSession session, String pagePath, String action) throws Exception {
        var page = mockMvc.perform(get(pagePath).session(session)).andReturn();
        CsrfToken csrf = (CsrfToken) page.getRequest().getAttribute("_csrf");
        return mockMvc.perform(post(action).session(session)
                .cookie(page.getResponse().getCookie("XSRF-TOKEN"))
                .param(csrf.getParameterName(), csrf.getToken()));
    }

    private void assertIdentity(MockHttpSession session, String key, String username) {
        SecurityContext context = (SecurityContext) session.getAttribute(key);
        assertEquals(username, context.getAuthentication().getName());
    }

    @Test
    void customerSessionIsRedirectedToAdminLogin() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                contextFor("customer", "ROLE_CUSTOMER"));

        mockMvc.perform(get("/admin").session(session))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/admin/login?required"));
    }

    @Test
    void adminContextOpensDashboardWithoutReplacingCustomerContext() throws Exception {
        MockHttpSession session = new MockHttpSession();
        SecurityContext customerContext = contextFor("customer", "ROLE_CUSTOMER");
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, customerContext);
        session.setAttribute("ADMIN_SECURITY_CONTEXT", contextFor("manager", "ROLE_ADMIN"));

        mockMvc.perform(get("/admin/dashboard").session(session))
                .andExpect(status().isOk())
                .andExpect(view().name("admin"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("manager")));

        assertSame(customerContext,
                session.getAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY));
    }

        @Test
        void adminCanOpenPersonalAccountPage() throws Exception {
                MockHttpSession session = new MockHttpSession();
                session.setAttribute("ADMIN_SECURITY_CONTEXT", contextFor("manager", "ROLE_ADMIN"));

                mockMvc.perform(get("/admin/profile").session(session))
                                .andExpect(status().isOk())
                        .andExpect(view().name("admin-profile"));
        }

    @Test
    void adminLoginPageIsAvailableAlongsideCustomerSession() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                contextFor("customer", "ROLE_CUSTOMER"));

        mockMvc.perform(get("/admin/login").session(session))
                .andExpect(status().isOk())
                .andExpect(view().name("admin-login"));
    }

    @Test
    void adminLogoutKeepsCustomerContextInSession() throws Exception {
        MockHttpSession session = new MockHttpSession();
        SecurityContext customerContext = contextFor("customer", "ROLE_CUSTOMER");
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, customerContext);
        session.setAttribute("ADMIN_SECURITY_CONTEXT", contextFor("manager", "ROLE_ADMIN"));

        var dashboard = mockMvc.perform(get("/admin/dashboard").session(session))
                .andExpect(status().isOk())
                .andReturn();
        CsrfToken csrf = (CsrfToken) dashboard.getRequest().getAttribute("_csrf");

        mockMvc.perform(post("/admin/logout")
                        .session(session)
                        .cookie(dashboard.getResponse().getCookie("XSRF-TOKEN"))
                        .header(csrf.getHeaderName(), csrf.getToken()))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/admin/login?logout"));

        assertSame(customerContext,
                session.getAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY));
        org.junit.jupiter.api.Assertions.assertNull(session.getAttribute("ADMIN_SECURITY_CONTEXT"));
    }

    private static SecurityContext contextFor(String username, String role) {
        SecurityContext context = new SecurityContextImpl();
        context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                username, "n/a", List.of(new SimpleGrantedAuthority(role))));
        return context;
    }
}
