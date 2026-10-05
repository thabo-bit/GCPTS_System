package com.gcpts.backend.repository;

import com.gcpts.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // ─── Lookup by unique email (used for login) ───
    Optional<User> findByEmail(String email);

    // ─── Boolean check (used for registration validation) ───
    boolean existsByEmail(String email);

    // ─── Counts (used by /api/users/stats) ───
    long countByUserType(String userType);
}