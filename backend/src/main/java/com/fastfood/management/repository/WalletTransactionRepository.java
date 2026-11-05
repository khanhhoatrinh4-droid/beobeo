package com.fastfood.management.repository;

import com.fastfood.management.entity.WalletTransaction;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from WalletTransaction t where t.transactionReference = :reference")
    Optional<WalletTransaction> findByReferenceForUpdate(@Param("reference") String reference);

    boolean existsByTransactionReference(String reference);
    List<WalletTransaction> findTop20ByUser_UsernameOrderByCreatedAtDesc(String username);
}
