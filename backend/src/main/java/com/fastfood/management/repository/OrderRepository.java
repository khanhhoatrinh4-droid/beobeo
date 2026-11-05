package com.fastfood.management.repository;

import com.fastfood.management.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByPaymentReference(String paymentReference);
    List<Order> findByCustomer_UsernameOrderByOrderDateDesc(String username);
    Page<Order> findByCustomer_Username(String username, Pageable pageable);
    boolean existsByItems_Product_Id(Long productId);
}
