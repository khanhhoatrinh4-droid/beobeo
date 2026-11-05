package com.fastfood.management.repository;

import com.fastfood.management.entity.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {
    List<InventoryMovement> findByProduct_IdOrderByCreatedAtDesc(Long productId);
}
