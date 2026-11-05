package com.fastfood.management.repository;

import com.fastfood.management.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUser_UsernameAndProduct_ActiveTrueOrderByIdDesc(String username);
    Optional<Favorite> findByUser_UsernameAndProduct_Id(String username, Long productId);
}
