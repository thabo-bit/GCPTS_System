package com.gcpts.backend.model;

import jakarta.persistence.*;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "upcoming_projects")
public class UpcomingProject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, updatable = false)
    private String referenceNumber;

    private String title;
    private String category;        // "Government Project" | "NGO Initiative"
    private String department;
    private String ward;
    private String location;
    private String duration;

    private Double estimatedBudget;
    private String scheduledStart;
    private String tenderStatus;

    @Column(length = 2000)
    private String description;

    private String communityImpact;  // "High Priority" | "Medium Priority" | "Low Priority"

    // NEW: lifecycle status
    // "Waiting for Approval" | "Approved" | "Rejected" | "In Progress" | "Completed"
    private String status;

    // Issuer / Sponsor
    private String issuer;

    // Government-specific
    private String govRef;
    private String allocatingMinistry;

    // NGO-specific
    private String ngoPartner;
    private String ngoRole;
    private Integer currentStage;
    private String stageDescription;

    @ElementCollection
    @CollectionTable(name = "upcoming_project_tags", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "tag")
    private List<String> tags;

    // Image stored on filesystem; filename saved here
    private String imageUrl;

    // ─── Defaults applied before insert ───
    @PrePersist
    public void setDefaults() {
        if (this.referenceNumber == null || this.referenceNumber.isEmpty()) {
            this.referenceNumber = "UP-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }
        if (this.status == null || this.status.isEmpty()) {
            this.status = "Waiting for Approval";
        }
    }

    // ─── Getters & Setters ───
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getWard() { return ward; }
    public void setWard(String ward) { this.ward = ward; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public Double getEstimatedBudget() { return estimatedBudget; }
    public void setEstimatedBudget(Double estimatedBudget) { this.estimatedBudget = estimatedBudget; }

    public String getScheduledStart() { return scheduledStart; }
    public void setScheduledStart(String scheduledStart) { this.scheduledStart = scheduledStart; }

    public String getTenderStatus() { return tenderStatus; }
    public void setTenderStatus(String tenderStatus) { this.tenderStatus = tenderStatus; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCommunityImpact() { return communityImpact; }
    public void setCommunityImpact(String communityImpact) { this.communityImpact = communityImpact; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getIssuer() { return issuer; }
    public void setIssuer(String issuer) { this.issuer = issuer; }

    public String getGovRef() { return govRef; }
    public void setGovRef(String govRef) { this.govRef = govRef; }

    public String getAllocatingMinistry() { return allocatingMinistry; }
    public void setAllocatingMinistry(String allocatingMinistry) { this.allocatingMinistry = allocatingMinistry; }

    public String getNgoPartner() { return ngoPartner; }
    public void setNgoPartner(String ngoPartner) { this.ngoPartner = ngoPartner; }

    public String getNgoRole() { return ngoRole; }
    public void setNgoRole(String ngoRole) { this.ngoRole = ngoRole; }

    public Integer getCurrentStage() { return currentStage; }
    public void setCurrentStage(Integer currentStage) { this.currentStage = currentStage; }

    public String getStageDescription() { return stageDescription; }
    public void setStageDescription(String stageDescription) { this.stageDescription = stageDescription; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}