package com.gcpts.backend.controller;

import com.gcpts.backend.model.UpcomingProject;
import com.gcpts.backend.repository.UpcomingProjectRepository;
import com.gcpts.backend.Services.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/upcoming-projects")
@CrossOrigin(origins = "*")
public class UpcomingProjectController {

    @Autowired
    private UpcomingProjectRepository repository;

    @Autowired
    private AuditLogService auditLogService;

    // ─────────────────────────────────────────────
    // GET all
    // ─────────────────────────────────────────────
    @GetMapping
    public List<UpcomingProject> getAll() {
        return repository.findAllByOrderByIdDesc();
    }

    // ─────────────────────────────────────────────
    // GET one
    // ─────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<UpcomingProject> getOne(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ─────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> create(
            @RequestPart("project") Map<String, Object> payload,
            @RequestPart(value = "image", required = false) MultipartFile image,
            HttpServletRequest request
    ) {
        try {
            UpcomingProject p = new UpcomingProject();

            p.setTitle(str(payload, "title"));
            p.setCategory(str(payload, "category"));
            p.setDepartment(str(payload, "department"));
            p.setWard(str(payload, "ward"));
            p.setLocation(str(payload, "location"));
            p.setDuration(str(payload, "duration"));
            p.setScheduledStart(str(payload, "scheduledStart"));
            p.setTenderStatus(str(payload, "tenderStatus"));
            p.setDescription(str(payload, "description"));
            p.setCommunityImpact(str(payload, "communityImpact"));
            p.setIssuer(str(payload, "issuer"));
            p.setGovRef(str(payload, "govRef"));
            p.setAllocatingMinistry(str(payload, "allocatingMinistry"));
            p.setNgoPartner(str(payload, "ngoPartner"));
            p.setNgoRole(str(payload, "ngoRole"));
            p.setStageDescription(str(payload, "stageDescription"));

            // NEW: status (falls back to "Waiting for Approval" via @PrePersist)
            String status = str(payload, "status");
            if (status != null && !status.isEmpty()) {
                p.setStatus(status);
            }

            if (payload.get("estimatedBudget") != null) {
                p.setEstimatedBudget(Double.parseDouble(payload.get("estimatedBudget").toString()));
            }
            if (payload.get("currentStage") != null) {
                p.setCurrentStage(Integer.parseInt(payload.get("currentStage").toString()));
            }
            if (payload.get("tags") instanceof List<?> tagList) {
                List<String> tags = new ArrayList<>();
                for (Object t : tagList) tags.add(t.toString());
                p.setTags(tags);
            }

            // Save image
            if (image != null && !image.isEmpty()) {
                String uploadDir = "uploads/";
                File dir = new File(uploadDir);
                if (!dir.exists()) dir.mkdirs();

                String fileName = System.currentTimeMillis() + "_" + image.getOriginalFilename();
                Files.write(Paths.get(uploadDir + fileName), image.getBytes());
                p.setImageUrl("/uploads/" + fileName);
            }

            UpcomingProject saved = repository.save(p);

            // ─── Audit log ───
            Map<String, Object> snapshot = new HashMap<>();
            snapshot.put("title", saved.getTitle());
            snapshot.put("category", saved.getCategory());
            snapshot.put("department", saved.getDepartment());
            snapshot.put("ward", saved.getWard());
            snapshot.put("estimatedBudget", saved.getEstimatedBudget());
            snapshot.put("referenceNumber", saved.getReferenceNumber());
            snapshot.put("issuer", saved.getIssuer());
            snapshot.put("status", saved.getStatus());

            auditLogService.success(
                    "UPCOMING_PROJECT_CREATED",
                    "UpcomingProjects",
                    saved.getTitle(),
                    null,
                    snapshot,
                    false,
                    request
            );

            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            auditLogService.failure(
                    "UPCOMING_PROJECT_CREATED",
                    "UpcomingProjects",
                    str(payload, "title"),
                    e.getMessage(),
                    request
            );
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────
    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestPart("project") Map<String, Object> payload,
            @RequestPart(value = "image", required = false) MultipartFile image,
            HttpServletRequest request
    ) {
        return repository.findById(id).map(existing -> {
            try {
                Map<String, Object> oldSnapshot = new HashMap<>();
                oldSnapshot.put("title", existing.getTitle());
                oldSnapshot.put("category", existing.getCategory());
                oldSnapshot.put("department", existing.getDepartment());
                oldSnapshot.put("estimatedBudget", existing.getEstimatedBudget());
                oldSnapshot.put("tenderStatus", existing.getTenderStatus());
                oldSnapshot.put("communityImpact", existing.getCommunityImpact());
                oldSnapshot.put("status", existing.getStatus());

                existing.setTitle(str(payload, "title"));
                existing.setCategory(str(payload, "category"));
                existing.setDepartment(str(payload, "department"));
                existing.setWard(str(payload, "ward"));
                existing.setLocation(str(payload, "location"));
                existing.setDuration(str(payload, "duration"));
                existing.setScheduledStart(str(payload, "scheduledStart"));
                existing.setTenderStatus(str(payload, "tenderStatus"));
                existing.setDescription(str(payload, "description"));
                existing.setCommunityImpact(str(payload, "communityImpact"));
                existing.setIssuer(str(payload, "issuer"));
                existing.setGovRef(str(payload, "govRef"));
                existing.setAllocatingMinistry(str(payload, "allocatingMinistry"));
                existing.setNgoPartner(str(payload, "ngoPartner"));
                existing.setNgoRole(str(payload, "ngoRole"));
                existing.setStageDescription(str(payload, "stageDescription"));

                // Status update — only if provided
                String newStatus = str(payload, "status");
                if (newStatus != null && !newStatus.isEmpty()) {
                    existing.setStatus(newStatus);
                }

                if (payload.get("estimatedBudget") != null) {
                    existing.setEstimatedBudget(Double.parseDouble(payload.get("estimatedBudget").toString()));
                }
                if (payload.get("currentStage") != null) {
                    existing.setCurrentStage(Integer.parseInt(payload.get("currentStage").toString()));
                }
                if (payload.get("tags") instanceof List<?> tagList) {
                    List<String> tags = new ArrayList<>();
                    for (Object t : tagList) tags.add(t.toString());
                    existing.setTags(tags);
                }

                if (image != null && !image.isEmpty()) {
                    String uploadDir = "uploads/";
                    File dir = new File(uploadDir);
                    if (!dir.exists()) dir.mkdirs();

                    String fileName = System.currentTimeMillis() + "_" + image.getOriginalFilename();
                    Files.write(Paths.get(uploadDir + fileName), image.getBytes());
                    existing.setImageUrl("/uploads/" + fileName);
                }

                UpcomingProject saved = repository.save(existing);

                Map<String, Object> newSnapshot = new HashMap<>();
                newSnapshot.put("title", saved.getTitle());
                newSnapshot.put("category", saved.getCategory());
                newSnapshot.put("department", saved.getDepartment());
                newSnapshot.put("estimatedBudget", saved.getEstimatedBudget());
                newSnapshot.put("tenderStatus", saved.getTenderStatus());
                newSnapshot.put("communityImpact", saved.getCommunityImpact());
                newSnapshot.put("status", saved.getStatus());

                boolean isSensitive =
                        !String.valueOf(oldSnapshot.get("estimatedBudget"))
                                .equals(String.valueOf(newSnapshot.get("estimatedBudget")))
                        || !String.valueOf(oldSnapshot.get("status"))
                                .equals(String.valueOf(newSnapshot.get("status")));

                auditLogService.success(
                        "UPCOMING_PROJECT_UPDATED",
                        "UpcomingProjects",
                        saved.getTitle(),
                        oldSnapshot,
                        newSnapshot,
                        isSensitive,
                        request
                );

                return ResponseEntity.ok(saved);

            } catch (Exception e) {
                auditLogService.failure(
                        "UPCOMING_PROJECT_UPDATED",
                        "UpcomingProjects",
                        "id=" + id,
                        e.getMessage(),
                        request
                );
                return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
            }
        }).orElseGet(() -> {
            auditLogService.failure(
                    "UPCOMING_PROJECT_UPDATED",
                    "UpcomingProjects",
                    "id=" + id,
                    "Not found",
                    request
            );
            return ResponseEntity.notFound().build();
        });
    }

    // ─────────────────────────────────────────────
    // PATCH STATUS — approve / reject / advance
    // ─────────────────────────────────────────────
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            HttpServletRequest request
    ) {
        String newStatus = body.get("status");
        if (newStatus == null || newStatus.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "status is required"));
        }

        return repository.findById(id).map(existing -> {
            String oldStatus = existing.getStatus();
            existing.setStatus(newStatus);
            UpcomingProject saved = repository.save(existing);

            Map<String, Object> oldSnapshot = new HashMap<>();
            oldSnapshot.put("status", oldStatus);

            Map<String, Object> newSnapshot = new HashMap<>();
            newSnapshot.put("status", newStatus);

            auditLogService.success(
                    "UPCOMING_PROJECT_STATUS_CHANGED",
                    "UpcomingProjects",
                    saved.getTitle(),
                    oldSnapshot,
                    newSnapshot,
                    true, // status changes are sensitive
                    request
            );

            return ResponseEntity.ok(saved);
        }).orElseGet(() -> {
            auditLogService.failure(
                    "UPCOMING_PROJECT_STATUS_CHANGED",
                    "UpcomingProjects",
                    "id=" + id,
                    "Not found",
                    request
            );
            return ResponseEntity.notFound().build();
        });
    }

    // ─────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, HttpServletRequest request) {
        return repository.findById(id).map(p -> {
            Map<String, Object> snapshot = new HashMap<>();
            snapshot.put("id", p.getId());
            snapshot.put("title", p.getTitle());
            snapshot.put("department", p.getDepartment());
            snapshot.put("estimatedBudget", p.getEstimatedBudget());
            snapshot.put("referenceNumber", p.getReferenceNumber());
            snapshot.put("status", p.getStatus());

            repository.delete(p);

            auditLogService.success(
                    "UPCOMING_PROJECT_DELETED",
                    "UpcomingProjects",
                    p.getTitle(),
                    snapshot,
                    null,
                    true,
                    request
            );

            return ResponseEntity.ok(Map.of("deleted", id));
        }).orElseGet(() -> {
            auditLogService.failure(
                    "UPCOMING_PROJECT_DELETED",
                    "UpcomingProjects",
                    "id=" + id,
                    "Not found",
                    request
            );
            return ResponseEntity.notFound().build();
        });
    }

    // ─── Helpers ───
    private String str(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v == null ? null : v.toString();
    }
}