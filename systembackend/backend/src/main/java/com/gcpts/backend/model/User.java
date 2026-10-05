package com.gcpts.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String mobile;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String userType = "user"; // "admin" | "user"

    public User() {}

    // 4-arg constructor (kept for backwards compatibility — defaults to "user")
    public User(String fullName, String email, String mobile, String password) {
        this.fullName = fullName;
        this.email = email;
        this.mobile = mobile;
        this.password = password;
        this.userType = "user";
    }

    // 5-arg constructor
    public User(String fullName, String email, String mobile, String password, String userType) {
        this.fullName = fullName;
        this.email = email;
        this.mobile = mobile;
        this.password = password;
        this.userType = userType != null ? userType : "user";
    }

    // ─── Getters & Setters ───
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }
}