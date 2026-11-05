package com.fastfood.management.repository;

import com.fastfood.management.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findByTransactionReference(String transactionReference);
    Optional<PaymentTransaction> findByOrder_IdAndProvider(Long orderId, String provider);
    List<PaymentTransaction> findByOrder_IdOrderByCreatedAtDesc(Long orderId);
}
