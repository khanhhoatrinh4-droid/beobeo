package com.fastfood.management.repository;

import com.fastfood.management.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByPaymentReference(String paymentReference);
}
