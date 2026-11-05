package com.fastfood.management.service;

import com.fastfood.management.entity.User;
import com.fastfood.management.entity.WalletTransaction;
import com.fastfood.management.repository.UserRepository;
import com.fastfood.management.repository.WalletTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class WalletService {
    private static final BigDecimal MIN_TOP_UP = new BigDecimal("10000");
    private static final BigDecimal MAX_TOP_UP = new BigDecimal("50000000");

    private final UserRepository users;
    private final WalletTransactionRepository transactions;

    public WalletService(UserRepository users, WalletTransactionRepository transactions) {
        this.users = users;
        this.transactions = transactions;
    }

    @Transactional
    public void chargeForOrder(User user, BigDecimal amount, Long orderId) {
        if (user.getWalletBalance().compareTo(amount) < 0) {
            throw new IllegalStateException("Số dư ví không đủ để thanh toán đơn hàng.");
        }

        user.setWalletBalance(user.getWalletBalance().subtract(amount));
        users.save(user);

        WalletTransaction transaction = new WalletTransaction();
        transaction.setUser(user);
        transaction.setAmount(amount);
        transaction.setStatus("SPENT");
        transaction.setTransactionReference("ORDER-" + orderId);
        transaction.setGatewayTransactionNo("ORDER-" + orderId);
        transaction.setPaidAt(LocalDateTime.now());
        transactions.save(transaction);
    }

    @Transactional
    public void refundOrder(User user, BigDecimal amount, Long orderId) {
        String reference = "REFUND-ORDER-" + orderId;
        User lockedUser = users.findByIdForUpdate(user.getId()).orElseThrow();
        if (transactions.existsByTransactionReference(reference)) return;
        lockedUser.setWalletBalance(lockedUser.getWalletBalance().add(amount));
        users.save(lockedUser);

        WalletTransaction transaction = new WalletTransaction();
        transaction.setUser(lockedUser);
        transaction.setAmount(amount);
        transaction.setStatus("REFUNDED");
        transaction.setTransactionReference(reference);
        transaction.setGatewayTransactionNo("ORDER-" + orderId);
        transaction.setPaidAt(LocalDateTime.now());
        transactions.save(transaction);
    }

    @Transactional
    public WalletTransaction createTopUp(String username, BigDecimal amount) {
        if (amount == null || amount.scale() > 0 || amount.compareTo(MIN_TOP_UP) < 0 || amount.compareTo(MAX_TOP_UP) > 0
                || amount.remainder(MIN_TOP_UP).compareTo(BigDecimal.ZERO) != 0) {
            throw new IllegalArgumentException("Số tiền nạp phải là số nguyên từ 10.000 đến 50.000.000 đồng.");
        }
        User user = users.findByUsername(username).orElseThrow();
        WalletTransaction transaction = new WalletTransaction();
        transaction.setUser(user);
        transaction.setAmount(amount);
        transaction.setTransactionReference("WALLET" + UUID.randomUUID().toString().replace("-", "").substring(0, 24));
        return transactions.save(transaction);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> summary(String username) {
        User user = users.findByUsername(username).orElseThrow();
        List<Map<String, Object>> history = transactions.findTop20ByUser_UsernameOrderByCreatedAtDesc(username).stream()
                .map(tx -> Map.<String, Object>of("id", tx.getId(), "amount", tx.getAmount(), "status", tx.getStatus(),
                        "reference", tx.getTransactionReference(), "createdAt", tx.getCreatedAt()))
                .toList();
        return Map.of("balance", user.getWalletBalance(), "transactions", history);
    }

    @Transactional(readOnly = true)
    public boolean isWalletReference(String reference) {
        return reference != null && transactions.existsByTransactionReference(reference);
    }

    @Transactional
    public boolean processVnPayReturn(String reference, String amountInCents, String responseCode,
                                     String transactionStatus, String gatewayTransactionNo) {
        WalletTransaction transaction = transactions.findByReferenceForUpdate(reference).orElse(null);
        if (transaction == null) return false;
        String expectedAmount = transaction.getAmount().movePointRight(2).toBigInteger().toString();
        if (!expectedAmount.equals(amountInCents)) return false;
        if ("SUCCESS".equals(transaction.getStatus())) return true;
        if ("FAILED".equals(transaction.getStatus())) return false;

        boolean success = "00".equals(responseCode) && "00".equals(transactionStatus);
        transaction.setStatus(success ? "SUCCESS" : "FAILED");
        transaction.setResponseCode(responseCode);
        transaction.setGatewayTransactionNo(gatewayTransactionNo);
        if (success) {
            User user = users.findByIdForUpdate(transaction.getUser().getId()).orElseThrow();
            user.setWalletBalance(user.getWalletBalance().add(transaction.getAmount()));
            users.save(user);
            transaction.setPaidAt(LocalDateTime.now());
        }
        transactions.save(transaction);
        return success;
    }
}
