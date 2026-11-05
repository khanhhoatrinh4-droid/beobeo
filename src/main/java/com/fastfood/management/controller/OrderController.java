package com.fastfood.management.controller;

import com.fastfood.management.dto.CheckoutRequest;
import com.fastfood.management.entity.Order;
import com.fastfood.management.entity.OrderDetail;
import com.fastfood.management.entity.Product;
import com.fastfood.management.enums.OrderStatus;
import com.fastfood.management.enums.PaymentMethod;
import com.fastfood.management.repository.OrderRepository;
import com.fastfood.management.repository.UserRepository;
import com.fastfood.management.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderRepository orderRepository;
    private final ProductService productService;
    private final UserRepository userRepository;
    private final com.fastfood.management.service.VnPayService vnPayService;

    public OrderController(OrderRepository orderRepository, ProductService productService, UserRepository userRepository,
                           com.fastfood.management.service.VnPayService vnPayService) {
        this.orderRepository = orderRepository;
        this.productService = productService;
        this.userRepository = userRepository;
        this.vnPayService = vnPayService;
    }

    @GetMapping
    public List<Order> findAll() { return orderRepository.findAll(); }

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody CheckoutRequest request, @AuthenticationPrincipal UserDetails principal,
                                    jakarta.servlet.http.HttpServletRequest servletRequest) {
        if (request == null || request.items() == null || request.items().isEmpty()
                || request.customerName() == null || request.customerName().isBlank()
                || request.phone() == null || request.phone().isBlank()
                || request.address() == null || request.address().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập đủ thông tin và chọn món."));
        }
        Order order = new Order();
        var customer = userRepository.findByUsername(principal.getUsername()).orElseThrow();
        order.setCustomer(customer);
        order.setCustomerName(request.customerName().trim());
        order.setCustomerPhone(request.phone().trim());
        order.setShippingAddress(request.address().trim());
        order.setPaymentMethod(request.paymentMethod() == null ? PaymentMethod.CASH : request.paymentMethod());
        order.setOrderDate(LocalDateTime.now());
        BigDecimal total = BigDecimal.ZERO;
        for (CheckoutRequest.Item item : request.items()) {
            if (item.quantity() == null || item.quantity() < 1 || item.quantity() > 99) {
                return ResponseEntity.badRequest().body(Map.of("message", "Số lượng món không hợp lệ."));
            }
            Product product = productService.findById(item.productId()).orElse(null);
            if (product == null || !product.isActive()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Một sản phẩm không còn kinh doanh."));
            }
            OrderDetail detail = new OrderDetail();
            detail.setOrder(order);
            detail.setProduct(product);
            detail.setQuantity(item.quantity());
            detail.setUnitPrice(product.getPrice());
            detail.setSubtotal(product.getPrice().multiply(BigDecimal.valueOf(item.quantity())));
            order.getItems().add(detail);
            total = total.add(detail.getSubtotal());
        }
        order.setTotalAmount(total);
        order.setCustomerName(customer.getFullName());
        order.setCustomerPhone(request.phone().trim());
        if (request.paymentMethod() == PaymentMethod.VNPAY) {
            order.setStatus(OrderStatus.AWAITING_PAYMENT);
            order.setPaymentReference("FASTY" + UUID.randomUUID().toString().replace("-", "").substring(0, 24));
        }
        Order saved = orderRepository.save(order);
        if (saved.getPaymentMethod() == PaymentMethod.VNPAY) {
            return ResponseEntity.ok(Map.of("id", saved.getId(), "status", saved.getStatus(),
                    "totalAmount", saved.getTotalAmount(), "paymentUrl", vnPayService.createPaymentUrl(saved,
                            servletRequest.getRemoteAddr())));
        }
        return ResponseEntity.ok(Map.of("id", saved.getId(), "status", saved.getStatus(), "totalAmount", saved.getTotalAmount()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            OrderStatus status = OrderStatus.valueOf(body.getOrDefault("status", ""));
            return orderRepository.findById(id).map(order -> {
                order.setStatus(status);
                return ResponseEntity.ok(orderRepository.save(order));
            }).orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", "Trạng thái đơn hàng không hợp lệ."));
        }
    }
}
