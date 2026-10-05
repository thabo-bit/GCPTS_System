package com.gcpts.backend.repository;

import com.gcpts.backend.model.Issue;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IssueRepository extends CrudRepository<Issue, Long> {
    List<Issue> findByProjectIdOrderByIdDesc(Long projectId);
}