package com.gcpts.backend.model;

import jakarta.persistence.*;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, updatable = false)
    private String referenceNumber;

    @PrePersist
    public void generateReferenceNumber() {
        if (this.referenceNumber == null || this.referenceNumber.isEmpty()) {
            this.referenceNumber = "GCPTS-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        }
    }

    private String title;
    private String category;
    private String department;
    
    @Column(length = 1000)
    private String description;
    
    @Column(length = 500)
    private String goals;
    
    @Column(length = 500)
    private String objectives;
    
    private String location;
    private String gpsCoordinates;
    private String projectManager;
    private String contractor;
    private String startDate;
    private String expectedCompletion;
    private int overallProgress;
    private String status;
    private Double budgetAllocated;
    private Double budgetUsed;

    @ElementCollection
    @CollectionTable(name = "project_funding_sources", joinColumns = @JoinColumn(name = "project_id"))
    private List<FundingSource> fundingSources;

    @ElementCollection
    @CollectionTable(name = "project_milestones", joinColumns = @JoinColumn(name = "project_id"))
    private List<Milestone> milestones;

    @ElementCollection
    @CollectionTable(name = "project_blueprints", joinColumns = @JoinColumn(name = "project_id"))
    private List<String> blueprintFileNames;

    @ElementCollection
    @CollectionTable(name = "project_additional_documents", joinColumns = @JoinColumn(name = "project_id"))
    private List<String> additionalDocumentNames;

    // Getters and Setters
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

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getGoals() { return goals; }
    public void setGoals(String goals) { this.goals = goals; }

    public String getObjectives() { return objectives; }
    public void setObjectives(String objectives) { this.objectives = objectives; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getGpsCoordinates() { return gpsCoordinates; }
    public void setGpsCoordinates(String gpsCoordinates) { this.gpsCoordinates = gpsCoordinates; }

    public String getProjectManager() { return projectManager; }
    public void setProjectManager(String projectManager) { this.projectManager = projectManager; }

    public String getContractor() { return contractor; }
    public void setContractor(String contractor) { this.contractor = contractor; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getExpectedCompletion() { return expectedCompletion; }
    public void setExpectedCompletion(String expectedCompletion) { this.expectedCompletion = expectedCompletion; }

    public int getOverallProgress() { return overallProgress; }
    public void setOverallProgress(int overallProgress) { this.overallProgress = overallProgress; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getBudgetAllocated() { return budgetAllocated; }
    public void setBudgetAllocated(Double budgetAllocated) { this.budgetAllocated = budgetAllocated; }

    public Double getBudgetUsed() { return budgetUsed; }
    public void setBudgetUsed(Double budgetUsed) { this.budgetUsed = budgetUsed; }

    public List<FundingSource> getFundingSources() { return fundingSources; }
    public void setFundingSources(List<FundingSource> fundingSources) { this.fundingSources = fundingSources; }

    public List<Milestone> getMilestones() { return milestones; }
    public void setMilestones(List<Milestone> milestones) { this.milestones = milestones; }

    public List<String> getBlueprintFileNames() { return blueprintFileNames; }
    public void setBlueprintFileNames(List<String> blueprintFileNames) { this.blueprintFileNames = blueprintFileNames; }

    public List<String> getAdditionalDocumentNames() { return additionalDocumentNames; }
    public void setAdditionalDocumentNames(List<String> additionalDocumentNames) { this.additionalDocumentNames = additionalDocumentNames; }
}

@Embeddable
class FundingSource {
    private String name;
    private Double amount;
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
}

@Embeddable
class Milestone {
    private String name;
    private String date;
    private String status;
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}