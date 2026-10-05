package com.gcpts.backend.repository;

import com.gcpts.backend.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByProjectIdOrderByDateAsc(Long projectId);
}