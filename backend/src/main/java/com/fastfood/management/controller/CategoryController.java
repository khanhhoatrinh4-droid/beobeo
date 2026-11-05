package com.fastfood.management.controller;

import com.fastfood.management.entity.Category;
import com.fastfood.management.repository.CategoryRepository;
import com.fastfood.management.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    private final CategoryRepository categories;
    private final ProductRepository products;
    public CategoryController(CategoryRepository categories, ProductRepository products) { this.categories=categories; this.products=products; }

    @GetMapping public List<Category> active() { return categories.findAll().stream().filter(Category::isActive).toList(); }
    @GetMapping("/admin/all") public List<Category> all() { return categories.findAll(); }

    @PostMapping public Category create(@RequestBody Category input) {
        validate(input); input.setId(null); return categories.save(input);
    }

    @PutMapping("/{id}") public Category update(@PathVariable Long id, @RequestBody Category input) {
        validate(input);
        Category category = categories.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        category.setName(input.getName().trim()); category.setDescription(input.getDescription()); category.setActive(input.isActive());
        return categories.save(category);
    }

    @DeleteMapping("/{id}") public void delete(@PathVariable Long id) {
        if (!categories.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        if (products.existsByCategory_Id(id)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Danh mục đang được sản phẩm sử dụng. Hãy ẩn danh mục thay vì xóa.");
        categories.deleteById(id);
    }

    private void validate(Category input) {
        if (input == null || input.getName() == null || input.getName().isBlank() || input.getName().trim().length() > 100
                || input.getDescription() != null && input.getDescription().length() > 255)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên danh mục từ 1 đến 100 ký tự, mô tả tối đa 255 ký tự.");
    }
}
