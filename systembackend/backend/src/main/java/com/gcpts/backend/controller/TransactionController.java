package com.gcpts.backend.controller;

import com.gcpts.backend.model.Transaction;
import com.gcpts.backend.repository.ProjectRepository;
import com.gcpts.backend.repository.TransactionRepository;
import com.gcpts.backend.Services.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransactionRepository repository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private AuditLogService auditLogService;

    // ⭐ Recalculate the parent project's budget_used from its transaction ledger
    private void syncProjectBudgetUsed(Long projectId) {
        if (projectId == null) return;
        try {
            List<Transaction> projectTransactions = repository.findByProjectIdOrderByDateAsc(projectId);

            double totalSpent = projectTransactions.stream()
                    .filter(t -> "expense".equalsIgnoreCase(t.getType()))
                    .filter(t -> "completed".equalsIgnoreCase(t.getStatus()))
                    .mapToDouble(t -> t.getAmount() != null ? t.getAmount() : 0)
                    .sum();

            projectRepository.findById(projectId).ifPresent(p -> {
                p.setBudgetUsed(totalSpent);
                projectRepository.save(p);
            });
        } catch (Exception e) {
            System.err.println("⚠️ Failed to sync project budget_used: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────
    // GET by project
    // ─────────────────────────────────────────────
    @GetMapping
    public List<Transaction> getByProject(@RequestParam Long projectId) {
        return repository.findByProjectIdOrderByDateAsc(projectId);
    }

    // ─────────────────────────────────────────────
    // GET one
    // ─────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<Transaction> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ─────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody Transaction tx,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            HttpServletRequest request
    ) {
        try {
            tx.setId(null);
            tx.setCreatedBy(userName != null ? userName : "Admin");

            Transaction saved = repository.save(tx);

            syncProjectBudgetUsed(saved.getProjectId());

            Map<String, Object> snapshot = new HashMap<>();
            snapshot.put("projectId", saved.getProjectId());
            snapshot.put("description", saved.getDescription());
            snapshot.put("category", saved.getCategory());
            snapshot.put("reference", saved.getReference());
            snapshot.put("amount", saved.getAmount());
            snapshot.put("type", saved.getType());
            snapshot.put("status", saved.getStatus());
            snapshot.put("date", saved.getDate());

            auditLogService.log(
                    "TRANSACTION_CREATED", "info", "Transactions",
                    saved.getDescription(), null, snapshot,
                    "SUCCESS", null,
                    userName, "Administrator", null,
                    false, request
            );

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            auditLogService.failure(
                    "TRANSACTION_CREATED", "Transactions",
                    tx.getDescription(), e.getMessage(), request
            );
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody Transaction updated,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            HttpServletRequest request
    ) {
        return repository.findById(id).map(existing -> {
            try {
                Map<String, Object> oldSnapshot = new HashMap<>();
                oldSnapshot.put("description", existing.getDescription());
                oldSnapshot.put("amount", existing.getAmount());
                oldSnapshot.put("category", existing.getCategory());
                oldSnapshot.put("status", existing.getStatus());
                oldSnapshot.put("type", existing.getType());
                oldSnapshot.put("date", existing.getDate());

                existing.setDate(updated.getDate());
                existing.setDescription(updated.getDescription());
                existing.setCategory(updated.getCategory());
                existing.setReference(updated.getReference());
                existing.setStatus(updated.getStatus());
                existing.setType(updated.getType());
                existing.setAmount(updated.getAmount());
                existing.setUpdatedBy(userName != null ? userName : "Admin");

                Transaction saved = repository.save(existing);

                syncProjectBudgetUsed(saved.getProjectId());

                Map<String, Object> newSnapshot = new HashMap<>();
                newSnapshot.put("description", saved.getDescription());
                newSnapshot.put("amount", saved.getAmount());
                newSnapshot.put("category", saved.getCategory());
                newSnapshot.put("status", saved.getStatus());
                newSnapshot.put("type", saved.getType());
                newSnapshot.put("date", saved.getDate());

                boolean isSensitive =
                        !String.valueOf(oldSnapshot.get("amount"))
                                .equals(String.valueOf(newSnapshot.get("amount")))
                        || !String.valueOf(oldSnapshot.get("status"))
                                .equals(String.valueOf(newSnapshot.get("status")))
                        || !String.valueOf(oldSnapshot.get("type"))
                                .equals(String.valueOf(newSnapshot.get("type")));

                auditLogService.log(
                        "TRANSACTION_UPDATED",
                        isSensitive ? "critical" : "info",
                        "Transactions",
                        saved.getDescription(),
                        oldSnapshot, newSnapshot,
                        "SUCCESS", null,
                        userName, "Administrator", null,
                        isSensitive, request
                );

                return ResponseEntity.ok(saved);
            } catch (Exception e) {
                auditLogService.failure(
                        "TRANSACTION_UPDATED", "Transactions",
                        "id=" + id, e.getMessage(), request
                );
                return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
            }
        }).orElseGet(() -> {
            auditLogService.failure(
                    "TRANSACTION_UPDATED", "Transactions",
                    "id=" + id, "Transaction not found", request
            );
            return ResponseEntity.notFound().build();
        });
    }

    // ─────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            HttpServletRequest request
    ) {
        return repository.findById(id).map(tx -> {
            Long projectId = tx.getProjectId();

            Map<String, Object> snapshot = new HashMap<>();
            snapshot.put("id", tx.getId());
            snapshot.put("description", tx.getDescription());
            snapshot.put("amount", tx.getAmount());
            snapshot.put("category", tx.getCategory());
            snapshot.put("type", tx.getType());
            snapshot.put("status", tx.getStatus());
            snapshot.put("projectId", tx.getProjectId());

            repository.delete(tx);

            syncProjectBudgetUsed(projectId);

            auditLogService.log(
                    "TRANSACTION_DELETED", "critical", "Transactions",
                    tx.getDescription(), snapshot, null,
                    "SUCCESS", null,
                    userName, "Administrator", null,
                    true, request
            );

            return ResponseEntity.ok(Map.of("deleted", id));
        }).orElseGet(() -> {
            auditLogService.failure(
                    "TRANSACTION_DELETED", "Transactions",
                    "id=" + id, "Transaction not found", request
            );
            return ResponseEntity.notFound().build();
        });
    }
}