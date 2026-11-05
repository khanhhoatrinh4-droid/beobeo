package com.fastfood.management;

import com.fastfood.management.controller.OrderController;
import com.fastfood.management.dto.CheckoutRequest;
import com.fastfood.management.entity.Order;
import com.fastfood.management.entity.Product;
import com.fastfood.management.entity.User;
import com.fastfood.management.enums.PaymentMethod;
import com.fastfood.management.payment.MomoService;
import com.fastfood.management.payment.VnPayService;
import com.fastfood.management.payment.ZaloPayService;
import com.fastfood.management.repository.OrderRepository;
import com.fastfood.management.repository.OrderStatusHistoryRepository;
import com.fastfood.management.repository.PaymentTransactionRepository;
import com.fastfood.management.repository.UserRepository;
import com.fastfood.management.service.ProductService;
import com.fastfood.management.service.WalletService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OrderControllerTest {
    @Test
    void createLinksOrderToAuthenticatedCustomerBeforeSaving() {
        OrderRepository orders = mock(OrderRepository.class);
        ProductService products = mock(ProductService.class);
        UserRepository users = mock(UserRepository.class);
        PaymentTransactionRepository payments = mock(PaymentTransactionRepository.class);
        OrderStatusHistoryRepository history = mock(OrderStatusHistoryRepository.class);
        VnPayService vnPay = mock(VnPayService.class);
        MomoService momo = mock(MomoService.class);
        ZaloPayService zaloPay = mock(ZaloPayService.class);
        WalletService wallet = mock(WalletService.class);
        User customer = new User();
        customer.setUsername("customer-one");
        Product product = new Product();
        product.setName("Burger");
        product.setPrice(new BigDecimal("50000"));
        UserDetails principal = org.springframework.security.core.userdetails.User
                .withUsername("customer-one").password("unused").roles("CUSTOMER").build();
        HttpServletRequest servletRequest = mock(HttpServletRequest.class);

        when(users.findByUsername("customer-one")).thenReturn(Optional.of(customer));
        when(products.findById(7L)).thenReturn(Optional.of(product));
                when(orders.save(any(Order.class))).thenAnswer(invocation -> {
                        Order order = invocation.getArgument(0);
                        var id = Order.class.getDeclaredField("id");
                        id.setAccessible(true);
                        id.set(order, 101L);
                        return order;
                });

        OrderController controller = new OrderController(orders, products, users, payments, history,
                vnPay, momo, zaloPay, wallet);
        CheckoutRequest request = new CheckoutRequest("Nguyen Van A", "0900000000", "1 Main Street",
                PaymentMethod.CASH, List.of(new CheckoutRequest.Item(7L, 2, null)));

        ResponseEntity<?> response = controller.create(request, principal, servletRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals(0, new BigDecimal("100000").compareTo((BigDecimal) body.get("totalAmount")));
        var savedOrder = org.mockito.ArgumentCaptor.forClass(Order.class);
        verify(orders).save(savedOrder.capture());
        assertSame(customer, savedOrder.getValue().getCustomer());
        assertEquals(1, savedOrder.getValue().getItems().size());
        assertEquals(0, new BigDecimal("100000").compareTo(savedOrder.getValue().getTotalAmount()));
    }
}
