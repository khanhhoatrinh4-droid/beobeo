package com.fastfood.management.controller;

import com.fastfood.management.entity.Product;
import com.fastfood.management.service.ProductService;
import com.fastfood.management.repository.CategoryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService productService;
    private final CategoryRepository categoryRepository;

    public ProductController(ProductService productService, CategoryRepository categoryRepository) {
        this.productService = productService;
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public List<Product> findAll() {
        return productService.findAll().stream().filter(Product::isActive).toList();
    }

    @GetMapping("/admin/all")
    public List<Product> findAllForAdmin() { return productService.findAll(); }

    @GetMapping("/featured")
    public List<Product> featured() {
        return productService.findAll().stream()
                .filter(product -> product.isActive() && product.isFeatured()).toList();
    }

    @GetMapping("/combos")
    public List<Product> combos() {
        return productService.findAll().stream()
                .filter(product -> product.isActive() && product.isComboProduct()).toList();
    }

    @GetMapping("/sale")
    public List<Product> sale() {
        return productService.findAll().stream()
                .filter(product -> product.isActive() && product.getDiscountPercent() != null
                        && product.getDiscountPercent() > 0).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> findById(@PathVariable Long id) {
        return productService.findById(id)
                .filter(Product::isActive)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Product create(@RequestBody Product product) {
        validate(product);
        if (product.getCategory() != null && product.getCategory().getId() != null) {
            product.setCategory(categoryRepository.findById(product.getCategory().getId()).orElse(null));
        } else {
            product.setCategory(null);
        }
        return productService.save(product);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> update(
            @PathVariable Long id,
            @RequestBody Product product) {

        return productService.findById(id)
                .map(existing -> {
                    validate(product);
                    existing.setName(product.getName());
                    existing.setDescription(product.getDescription());
                    existing.setPrice(product.getPrice());
                    existing.setOriginalPrice(product.getOriginalPrice());
                    existing.setDiscountPercent(product.getDiscountPercent());
                    existing.setFeatured(product.isFeatured());
                    existing.setComboProduct(product.isComboProduct());
                    existing.setImageUrl(product.getImageUrl());
                    existing.setPreparationMinutes(product.getPreparationMinutes());
                    existing.setCalories(product.getCalories());
                    existing.setIngredients(product.getIngredients());
                    existing.setActive(product.isActive());
                    existing.setCategory(product.getCategory() == null || product.getCategory().getId() == null
                            ? null : categoryRepository.findById(product.getCategory().getId()).orElse(null));
                    return ResponseEntity.ok(productService.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (productService.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        productService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void validate(Product product) {
        if (product.getName() == null || product.getName().isBlank() || product.getPrice() == null
                || product.getPrice().signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên và giá sản phẩm là bắt buộc.");
        }
    }
}
