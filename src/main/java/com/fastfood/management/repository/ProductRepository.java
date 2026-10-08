package com.fastfood.management.repository;

import com.fastfood.management.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByActiveTrue();
    List<Product> findByNameContainingIgnoreCase(String keyword);
}
