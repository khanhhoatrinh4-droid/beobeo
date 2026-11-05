package com.fastfood.management.repository;

import com.fastfood.management.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    boolean existsByCategory_Id(Long categoryId);
    List<Product> findByActiveTrue();
    List<Product> findByActiveTrueAndFeaturedTrue();
    List<Product> findByActiveTrueAndComboProductTrue();
    List<Product> findByActiveTrueAndDiscountPercentGreaterThan(Integer discountPercent);
    List<Product> findByNameContainingIgnoreCase(String keyword);
}
