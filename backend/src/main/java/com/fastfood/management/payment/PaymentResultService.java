package com.fastfood.management.payment;

import com.fastfood.management.entity.Order;
import com.fastfood.management.entity.OrderStatusHistory;
import com.fastfood.management.entity.PaymentTransaction;
import com.fastfood.management.enums.OrderStatus;
import com.fastfood.management.repository.OrderRepository;
import com.fastfood.management.repository.OrderStatusHistoryRepository;
import com.fastfood.management.repository.PaymentTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class PaymentResultService {
    private final OrderRepository orders;
    private final PaymentTransactionRepository payments;
    private final OrderStatusHistoryRepository history;

    public PaymentResultService(OrderRepository orders, PaymentTransactionRepository payments,
                                OrderStatusHistoryRepository history) {
        this.orders = orders;
        this.payments = payments;
        this.history = history;
    }

    @Transactional
    public boolean complete(String reference, String gatewayId, String responseCode, boolean success, String provider) {
        return complete(reference, gatewayId, responseCode, success, provider, null);
    }

    @Transactional
    public boolean complete(String reference, String gatewayId, String responseCode, boolean success, String provider,
                            java.math.BigDecimal expectedAmount) {
        Order order = orders.findByPaymentReference(reference).orElse(null);
        if (order == null) return false;
        PaymentTransaction payment = payments.findByTransactionReference(reference).orElse(null);
        if (payment == null || !payment.getProvider().equals(provider)
                || expectedAmount != null && payment.getAmount().compareTo(expectedAmount) != 0) return false;
        if (payment.getStatus().equals("SUCCESS")) return order.isPaid();
        if (payment.getStatus().equals("FAILED") && success) return false;
        if (gatewayId != null) payment.setGatewayTransactionNo(gatewayId);
        payment.setResponseCode(responseCode);
        payment.setStatus(success ? "SUCCESS" : "FAILED");
        if (success) payment.setPaidAt(LocalDateTime.now());
        payments.save(payment);
        if (order.isPaid()) return true;
        OrderStatus next = success ? OrderStatus.CONFIRMED : OrderStatus.CANCELLED;
        OrderStatusHistory entry = new OrderStatusHistory();
        entry.setOrder(order);
        entry.setPreviousStatus(order.getStatus().name());
        entry.setNewStatus(next.name());
        entry.setNote("Cập nhật từ callback " + provider);
        history.save(entry);
        order.setStatus(next);
        order.setPaid(success);
        orders.save(order);
        return success;
    }

    @Transactional(readOnly = true)
    public java.util.Optional<Order> findOrder(String reference, String provider) {
        return orders.findByPaymentReference(reference)
                .filter(order -> payments.findByTransactionReference(reference)
                        .filter(payment -> payment.getProvider().equals(provider)).isPresent());
    }

    @Transactional
    public void setGatewayOrderReference(String paymentReference, String provider, String gatewayOrderReference) {
        payments.findByTransactionReference(paymentReference).filter(payment -> payment.getProvider().equals(provider))
                .ifPresent(payment -> { payment.setGatewayOrderReference(gatewayOrderReference); payments.save(payment); });
    }

    @Transactional(readOnly = true)
    public java.util.Optional<PaymentTransaction> findPaymentByOrderAndProvider(Long orderId, String provider) {
        return payments.findByOrder_IdAndProvider(orderId, provider);
    }
}
