package com.gcpts.backend.Services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gcpts.backend.model.AuditLog;
import com.gcpts.backend.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository repository;

    private final ObjectMapper mapper = new ObjectMapper();

    public void log(
            String action, String severity, String entity, String recordName,
            Object oldValue, Object newValue,
            String status, String failureReason,
            String userName, String userRole, String sessionId,
            boolean isSensitive, HttpServletRequest request
    ) {
        try {
            AuditLog log = new AuditLog();
            log.setAction(action);
            log.setSeverity(severity);
            log.setEntity(entity);
            log.setRecordName(recordName);
            log.setOldValue(toJson(oldValue));
            log.setNewValue(toJson(newValue));
            log.setStatus(status);
            log.setFailureReason(failureReason);
            log.setTimestamp(LocalDateTime.now());
            log.setUserName(userName != null ? userName : "Admin");
            log.setUserRole(userRole != null ? userRole : "Administrator");
            log.setSessionId(sessionId);
            log.setIsSensitive(isSensitive);

            if (request != null) {
                log.setIpAddress(extractIp(request));
                log.setUserAgent(truncate(request.getHeader("User-Agent"), 500));
                log.setEndpoint(request.getRequestURI());
                log.setRequestMethod(request.getMethod());
            }

            repository.save(log);
        } catch (Exception e) {
            System.err.println("⚠️ Audit log failed: " + e.getMessage());
        }
    }

    public void success(String action, String entity, String recordName,
                        Object oldValue, Object newValue, boolean isSensitive,
                        HttpServletRequest request) {
        String severity = isSensitive ? "critical" : "info";
        log(action, severity, entity, recordName, oldValue, newValue,
            "SUCCESS", null, null, null, null, isSensitive, request);
    }

    public void failure(String action, String entity, String recordName,
                        String reason, HttpServletRequest request) {
        log(action, "warning", entity, recordName, null, null,
            "FAILURE", reason, null, null, null, false, request);
    }

    private String toJson(Object o) {
        if (o == null) return null;
        if (o instanceof String) return (String) o;
        try {
            return mapper.writeValueAsString(o);
        } catch (Exception e) {
            return String.valueOf(o);
        }
    }

    private String extractIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}