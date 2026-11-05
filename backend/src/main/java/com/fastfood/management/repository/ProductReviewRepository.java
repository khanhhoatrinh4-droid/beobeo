package com.fastfood.management.repository;

import com.fastfood.management.entity.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    List<ProductReview> findByProduct_IdAndStatusOrderByCreatedAtDesc(Long productId, String status);
}
