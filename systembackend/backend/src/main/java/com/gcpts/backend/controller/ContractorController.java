package com.gcpts.backend.controller;

import com.gcpts.backend.model.Contractor;
import com.gcpts.backend.model.Project;
import com.gcpts.backend.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contractors")
@CrossOrigin(origins = "*")
public class ContractorController {

    @Autowired
    private ProjectRepository projectRepository;

    @GetMapping
    public List<Contractor> getAllContractors() {
        List<Project> projects = projectRepository.findAll();
        Map<String, ContractorStats> statsMap = new HashMap<>();

        for (Project p : projects) {
            String companyName = p.getContractor();
            if (companyName == null || companyName.trim().isEmpty()) {
                continue;
            }

            statsMap.putIfAbsent(companyName, new ContractorStats());
            ContractorStats stats = statsMap.get(companyName);

            stats.name = companyName;
            stats.manager = p.getProjectManager() != null ? p.getProjectManager() : "Unassigned";
            stats.regNumber = "REG-" + Math.abs(companyName.hashCode() % 90000 + 10000);
            stats.status = "Active";
            
            stats.totalProgress += p.getOverallProgress();
            stats.projectCount++;

            if ("Delayed".equalsIgnoreCase(p.getStatus()) || "Stalled".equalsIgnoreCase(p.getStatus())) {
                stats.issuesCount++;
            }
        }

        List<Contractor> contractors = new ArrayList<>();
        long idCounter = 1L;

        for (ContractorStats stats : statsMap.values()) {
            Contractor c = new Contractor();
            c.setId(idCounter++);
            c.setName(stats.name);
            c.setManager(stats.manager);
            c.setRegNumber(stats.regNumber);
            c.setStatus(stats.status);
            
            int avgPerformance = stats.projectCount > 0 ? stats.totalProgress / stats.projectCount : 0;
            c.setPerformance(avgPerformance);
            c.setOnTime(avgPerformance >= 70 ? "90%" : "60%");
            c.setPenalties(stats.issuesCount);

            contractors.add(c);
        }

        return contractors;
    }

    private static class ContractorStats {
        String name;
        String manager;
        String regNumber;
        String status;
        int totalProgress = 0;
        int projectCount = 0;
        int issuesCount = 0;
    }
}