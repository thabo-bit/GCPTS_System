package com.gcpts.backend.repository;

import com.gcpts.backend.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findAllByOrderByTimestampDesc();
    List<AuditLog> findByEntityOrderByTimestampDesc(String entity);
    List<AuditLog> findBySeverityOrderByTimestampDesc(String severity);
    List<AuditLog> findByUserNameOrderByTimestampDesc(String userName);   
    List<AuditLog> findByActionOrderByTimestampDesc(String action);      
}