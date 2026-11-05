package com.fastfood.management.dto;

import com.fastfood.management.enums.PaymentMethod;
import java.util.List;

public record CheckoutRequest(String customerName, String phone, String address,
                              PaymentMethod paymentMethod, List<Item> items) {
    public record Item(Long productId, Integer quantity) { }
}
