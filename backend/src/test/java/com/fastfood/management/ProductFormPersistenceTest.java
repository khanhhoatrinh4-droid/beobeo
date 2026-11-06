package com.fastfood.management;

import com.fastfood.management.controller.ProductController;
import com.fastfood.management.entity.Product;
import com.fastfood.management.repository.ProductRepository;
import com.fastfood.management.service.impl.ProductServiceImpl;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// Use the application's MySQL schema; each test rolls back its product changes.
@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=none")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({ProductController.class, ProductServiceImpl.class})
class ProductFormPersistenceTest {
    @Autowired ProductController controller;
    @Autowired ProductRepository products;
    MockMvc mvc;

    @BeforeEach
    void setup() { mvc = MockMvcBuilders.standaloneSetup(controller).build(); }

    @Test
    void createsProductWithBlankOptionalNumericFields() throws Exception {
        mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content("""
                {"id":"","name":"Product form regression","price":25000,
                 "originalPrice":null,"discountPercent":null,"preparationMinutes":null,
                 "calories":null,"category":null,"active":true}
                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.discountPercent").value(0))
                .andExpect(jsonPath("$.preparationMinutes").value(15));
        products.flush();
    }

    @Test
    void updatesProductWhenDiscountAndPreparationAreCleared() throws Exception {
        Product product = new Product();
        product.setName("Product update regression");
        product.setPrice(new BigDecimal("25000"));
        product.setDiscountPercent(10);
        product.setPreparationMinutes(20);
        products.saveAndFlush(product);
        mvc.perform(put("/api/products/" + product.getId()).contentType(MediaType.APPLICATION_JSON).content("""
                {"name":"Product update regression","price":25000,
                 "discountPercent":null,"preparationMinutes":null,"active":true}
                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.discountPercent").value(0))
                .andExpect(jsonPath("$.preparationMinutes").value(15));
        products.flush();
        assertEquals(0, products.findById(product.getId()).orElseThrow().getDiscountPercent());
    }

    @Test
    void rejectsInvalidDiscountInsteadOfDefaultingIt() throws Exception {
        mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content("""
                {"name":"Invalid discount","price":25000,"discountPercent":101}
                """))
                .andExpect(status().isBadRequest());
    }
}
