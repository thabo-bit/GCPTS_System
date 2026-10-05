package com.gcpts.backend.controller;

import com.gcpts.backend.model.AuditLog;
import com.gcpts.backend.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    @Autowired
    private AuditLogRepository repository;

    @GetMapping
    public List<AuditLog> getAll(
            @RequestParam(required = false) String entity,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String action
    ) {
        if (entity != null)   return repository.findByEntityOrderByTimestampDesc(entity);
        if (severity != null) return repository.findBySeverityOrderByTimestampDesc(severity);
        if (userName != null) return repository.findByUserNameOrderByTimestampDesc(userName);
        if (action != null)   return repository.findByActionOrderByTimestampDesc(action);
        return repository.findAllByOrderByTimestampDesc();
    }
}