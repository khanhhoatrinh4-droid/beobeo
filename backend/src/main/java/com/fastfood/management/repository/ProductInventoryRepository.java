package com.fastfood.management.repository;

import com.fastfood.management.entity.ProductInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ProductInventoryRepository extends JpaRepository<ProductInventory, Long> {
    Optional<ProductInventory> findByProduct_Id(Long productId);
}
