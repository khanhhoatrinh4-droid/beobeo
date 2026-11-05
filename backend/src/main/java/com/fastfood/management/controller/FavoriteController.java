package com.fastfood.management.controller;

import com.fastfood.management.entity.Favorite;
import com.fastfood.management.repository.FavoriteRepository;
import com.fastfood.management.repository.ProductRepository;
import com.fastfood.management.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/account/favorites")
public class FavoriteController {
    private final FavoriteRepository favorites;
    private final ProductRepository products;
    private final UserRepository users;

    public FavoriteController(FavoriteRepository favorites, ProductRepository products, UserRepository users) {
        this.favorites = favorites;
        this.products = products;
        this.users = users;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<com.fastfood.management.entity.Product> list(@AuthenticationPrincipal UserDetails principal) {
        return favorites.findByUser_UsernameAndProduct_ActiveTrueOrderByIdDesc(principal.getUsername()).stream()
                .map(Favorite::getProduct).toList();
    }

    @PostMapping("/{productId}")
    @Transactional
    public void add(@PathVariable Long productId, @AuthenticationPrincipal UserDetails principal) {
        if (favorites.findByUser_UsernameAndProduct_Id(principal.getUsername(), productId).isPresent()) return;
        var product = products.findById(productId).filter(p -> p.isActive())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm đang bán."));
        Favorite favorite = new Favorite();
        favorite.setUser(users.findByUsername(principal.getUsername()).orElseThrow());
        favorite.setProduct(product);
        favorites.save(favorite);
    }

    @DeleteMapping("/{productId}")
    @Transactional
    public void remove(@PathVariable Long productId, @AuthenticationPrincipal UserDetails principal) {
        favorites.findByUser_UsernameAndProduct_Id(principal.getUsername(), productId).ifPresent(favorites::delete);
    }
}
