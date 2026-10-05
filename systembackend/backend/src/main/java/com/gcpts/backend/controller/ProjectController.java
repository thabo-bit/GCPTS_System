package com.gcpts.backend.controller;

import com.gcpts.backend.model.Project;
import com.gcpts.backend.repository.ProjectRepository;
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
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private AuditLogService auditLogService;

    // ─────────────────────────────────────────────
    // GET all
    // ─────────────────────────────────────────────
    @GetMapping
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    // ─────────────────────────────────────────────
    // GET one
    // ─────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(@PathVariable Long id) {
        return projectRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ─────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> createProject(
            @RequestPart("project") Project project,
            @RequestPart(value = "blueprints", required = false) List<MultipartFile> blueprints,
            @RequestPart(value = "additionalDocuments", required = false) List<MultipartFile> additionalDocuments,
            HttpServletRequest request
    ) {
        try {
            String uploadDir = "uploads/";
            File directory = new File(uploadDir);
            if (!directory.exists()) directory.mkdirs();

            List<String> uploadedBlueprints = new ArrayList<>();
            if (blueprints != null) {
                for (MultipartFile file : blueprints) {
                    if (file.isEmpty()) continue;
                    String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                    Files.write(Paths.get(uploadDir + fileName), file.getBytes());
                    uploadedBlueprints.add(fileName);
                }
            }
            project.setBlueprintFileNames(uploadedBlueprints);

            List<String> uploadedDocs = new ArrayList<>();
            if (additionalDocuments != null) {
                for (MultipartFile file : additionalDocuments) {
                    if (file.isEmpty()) continue;
                    String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                    Files.write(Paths.get(uploadDir + fileName), file.getBytes());
                    uploadedDocs.add(fileName);
                }
            }
            project.setAdditionalDocumentNames(uploadedDocs);

            Project saved = projectRepository.save(project);

            Map<String, Object> snapshot = new HashMap<>();
            snapshot.put("title", saved.getTitle());
            snapshot.put("department", saved.getDepartment());
            snapshot.put("location", saved.getLocation());
            snapshot.put("status", saved.getStatus());
            snapshot.put("budgetAllocated", saved.getBudgetAllocated());
            snapshot.put("overallProgress", saved.getOverallProgress());
            snapshot.put("referenceNumber", saved.getReferenceNumber());

            auditLogService.success(
                    "PROJECT_CREATED",
                    "Projects",
                    saved.getTitle(),
                    null,
                    snapshot,
                    false,
                    request
            );

            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            auditLogService.failure(
                    "PROJECT_CREATED",
                    "Projects",
                    project != null ? project.getTitle() : "unknown",
                    e.getMessage(),
                    request
            );
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────
    // UPDATE (multipart)
    // ─────────────────────────────────────────────
    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public ResponseEntity<?> updateProject(
            @PathVariable Long id,
            @RequestPart("project") Project updated,
            @RequestPart(value = "blueprints", required = false) List<MultipartFile> blueprints,
            @RequestPart(value = "additionalDocuments", required = false) List<MultipartFile> additionalDocuments,
            HttpServletRequest request
    ) {
        return projectRepository.findById(id).map(existing -> {
            try {
                Map<String, Object> oldSnapshot = new HashMap<>();
                oldSnapshot.put("title", existing.getTitle());
                oldSnapshot.put("status", existing.getStatus());
                oldSnapshot.put("budgetAllocated", existing.getBudgetAllocated());
                oldSnapshot.put("budgetUsed", existing.getBudgetUsed());
                oldSnapshot.put("overallProgress", existing.getOverallProgress());
                oldSnapshot.put("department", existing.getDepartment());
                oldSnapshot.put("location", existing.getLocation());

                existing.setTitle(updated.getTitle());
                existing.setCategory(updated.getCategory());
                existing.setDepartment(updated.getDepartment());
                existing.setDescription(updated.getDescription());
                existing.setGoals(updated.getGoals());
                existing.setObjectives(updated.getObjectives());
                existing.setLocation(updated.getLocation());
                existing.setGpsCoordinates(updated.getGpsCoordinates());
                existing.setProjectManager(updated.getProjectManager());
                existing.setContractor(updated.getContractor());
                existing.setStartDate(updated.getStartDate());
                existing.setExpectedCompletion(updated.getExpectedCompletion());
                existing.setOverallProgress(updated.getOverallProgress());
                existing.setStatus(updated.getStatus());
                existing.setBudgetAllocated(updated.getBudgetAllocated());
                existing.setBudgetUsed(updated.getBudgetUsed());

                if (updated.getFundingSources() != null)
                    existing.setFundingSources(updated.getFundingSources());
                if (updated.getMilestones() != null)
                    existing.setMilestones(updated.getMilestones());

                String uploadDir = "uploads/";
                File dir = new File(uploadDir);
                if (!dir.exists()) dir.mkdirs();

                if (blueprints != null && !blueprints.isEmpty()) {
                    List<String> names = existing.getBlueprintFileNames() != null
                            ? new ArrayList<>(existing.getBlueprintFileNames())
                            : new ArrayList<>();
                    for (MultipartFile file : blueprints) {
                        if (file.isEmpty()) continue;
                        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                        Files.write(Paths.get(uploadDir + fileName), file.getBytes());
                        names.add(fileName);
                    }
                    existing.setBlueprintFileNames(names);
                }

                if (additionalDocuments != null && !additionalDocuments.isEmpty()) {
                    List<String> names = existing.getAdditionalDocumentNames() != null
                            ? new ArrayList<>(existing.getAdditionalDocumentNames())
                            : new ArrayList<>();
                    for (MultipartFile file : additionalDocuments) {
                        if (file.isEmpty()) continue;
                        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                        Files.write(Paths.get(uploadDir + fileName), file.getBytes());
                        names.add(fileName);
                    }
                    existing.setAdditionalDocumentNames(names);
                }

                Project saved = projectRepository.save(existing);

                Map<String, Object> newSnapshot = new HashMap<>();
                newSnapshot.put("title", saved.getTitle());
                newSnapshot.put("status", saved.getStatus());
                newSnapshot.put("budgetAllocated", saved.getBudgetAllocated());
                newSnapshot.put("budgetUsed", saved.getBudgetUsed());
                newSnapshot.put("overallProgress", saved.getOverallProgress());
                newSnapshot.put("department", saved.getDepartment());
                newSnapshot.put("location", saved.getLocation());

                boolean isSensitive =
                        !String.valueOf(oldSnapshot.get("budgetAllocated"))
                                .equals(String.valueOf(newSnapshot.get("budgetAllocated")));

                auditLogService.success(
                        "PROJECT_UPDATED",
                        "Projects",
                        saved.getTitle(),
                        oldSnapshot,
                        newSnapshot,
                        isSensitive,
                        request
                );

                return ResponseEntity.ok(saved);

            } catch (Exception e) {
                auditLogService.failure(
                        "PROJECT_UPDATED",
                        "Projects",
                        "id=" + id,
                        e.getMessage(),
                        request
                );
                return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
            }
        }).orElseGet(() -> {
            auditLogService.failure(
                    "PROJECT_UPDATED",
                    "Projects",
                    "id=" + id,
                    "Project not found",
                    request
            );
            return ResponseEntity.notFound().build();
        });
    }

    // ─────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable Long id, HttpServletRequest request) {
        return projectRepository.findById(id).map(p -> {
            Map<String, Object> snapshot = new HashMap<>();
            snapshot.put("id", p.getId());
            snapshot.put("title", p.getTitle());
            snapshot.put("department", p.getDepartment());
            snapshot.put("location", p.getLocation());
            snapshot.put("budgetAllocated", p.getBudgetAllocated());
            snapshot.put("referenceNumber", p.getReferenceNumber());

            projectRepository.delete(p);

            auditLogService.success(
                    "PROJECT_DELETED",
                    "Projects",
                    p.getTitle(),
                    snapshot,
                    null,
                    true,
                    request
            );

            return ResponseEntity.ok(Map.of("deleted", id));
        }).orElseGet(() -> {
            auditLogService.failure(
                    "PROJECT_DELETED",
                    "Projects",
                    "id=" + id,
                    "Project not found",
                    request
            );
            return ResponseEntity.notFound().build();
        });
    }
}