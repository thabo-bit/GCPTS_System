package com.gcpts.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "contractors")
public class Contractor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String manager;
    private String regNumber;
    private String status;
    private int performance;
    private String onTime;
    private int penalties;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getManager() { return manager; }
    public void setManager(String manager) { this.manager = manager; }

    public String getRegNumber() { return regNumber; }
    public void setRegNumber(String regNumber) { this.regNumber = regNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getPerformance() { return performance; }
    public void setPerformance(int performance) { this.performance = performance; }

    public String getOnTime() { return onTime; }
    public void setOnTime(String onTime) { this.onTime = onTime; }

    public int getPenalties() { return penalties; }
    public void setPenalties(int penalties) { this.penalties = penalties; }
}