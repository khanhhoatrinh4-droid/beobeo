package com.fastfood.management.controller;

import com.fastfood.management.entity.Product;
import com.fastfood.management.service.ProductService;
import com.fastfood.management.repository.CategoryRepository;
import com.fastfood.management.repository.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Comparator;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService productService;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;

    public ProductController(ProductService productService, CategoryRepository categoryRepository, OrderRepository orderRepository) {
        this.productService = productService;
        this.categoryRepository = categoryRepository;
        this.orderRepository = orderRepository;
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

    @GetMapping("/new")
    public List<Product> newest() {
        return productService.findAll().stream()
                .filter(Product::isActive)
                .sorted(Comparator.comparing(Product::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(6)
                .toList();
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
        Product product = productService.findById(id).orElseThrow();
        if (orderRepository.existsByItems_Product_Id(id)) {
            product.setActive(false);
            productService.save(product);
        } else {
            productService.deleteById(id);
        }
        return ResponseEntity.noContent().build();
    }

    private void validate(Product product) {
        if (product != null) {
            if (product.getDiscountPercent() == null) product.setDiscountPercent(0);
            if (product.getPreparationMinutes() == null) product.setPreparationMinutes(15);
        }
        if (product == null || product.getName() == null || product.getName().isBlank() || product.getName().trim().length() > 150
                || product.getPrice() == null || product.getPrice().signum() <= 0
                || product.getDescription() != null && product.getDescription().length() > 2000
                || product.getImageUrl() != null && product.getImageUrl().length() > 1000
                || product.getIngredients() != null && product.getIngredients().length() > 1000
                || product.getPreparationMinutes() != null && (product.getPreparationMinutes() < 1 || product.getPreparationMinutes() > 240)
                || product.getCalories() != null && product.getCalories() < 0
                || product.getDiscountPercent() != null && (product.getDiscountPercent() < 0 || product.getDiscountPercent() > 100)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin sản phẩm không hợp lệ. Kiểm tra tên, giá, mô tả, ảnh, thời gian chế biến, calories và giảm giá.");
        }
    }
}
