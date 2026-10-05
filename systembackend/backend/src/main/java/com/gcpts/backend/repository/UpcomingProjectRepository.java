package com.gcpts.backend.repository;

import com.gcpts.backend.model.UpcomingProject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UpcomingProjectRepository extends JpaRepository<UpcomingProject, Long> {
    List<UpcomingProject> findAllByOrderByIdDesc();
}