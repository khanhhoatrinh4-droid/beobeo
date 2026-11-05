package com.fastfood.management.repository;

import com.fastfood.management.entity.CustomerAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CustomerAddressRepository extends JpaRepository<CustomerAddress, Long> {
    List<CustomerAddress> findByCustomer_IdOrderByDefaultAddressDescIdDesc(Long customerId);
}
