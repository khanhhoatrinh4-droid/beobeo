package com.fastfood.management;

import org.junit.jupiter.api.Test;
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

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

@SpringBootTest
@AutoConfigureMockMvc
class AdminAuthenticationTests {
    @Autowired
    private MockMvc mockMvc;

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