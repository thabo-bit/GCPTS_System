package com.gcpts.backend.controller;

import com.gcpts.backend.Services.AuditLogService;
import com.gcpts.backend.Services.JwtService;
import com.gcpts.backend.Services.UserService;
import com.gcpts.backend.model.User;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final AuditLogService auditLogService;

    public AuthController(UserService userService,
                          JwtService jwtService,
                          AuditLogService auditLogService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.auditLogService = auditLogService;
    }

    // ─── REGISTER ───
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
            @RequestBody RegisterRequest req,
            HttpServletRequest httpReq
    ) {
        Map<String, Object> res = new HashMap<>();

        if (req.getFullName() == null || req.getEmail() == null ||
            req.getMobile() == null || req.getPassword() == null) {
            res.put("message", "All fields are required.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
        }

        if (userService.isEmailTaken(req.getEmail())) {
            res.put("message", "Email is already registered.");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(res);
        }

        String userType = "admin".equalsIgnoreCase(req.getUserType()) ? "admin" : "user";

        User created = userService.registerUser(
                req.getFullName(),
                req.getEmail(),
                req.getMobile(),
                req.getPassword(),
                userType
        );

        auditLogService.success(
                "USER_REGISTERED",
                "Users",
                created.getEmail(),
                null,
                Map.of(
                        "fullName", created.getFullName(),
                        "email", created.getEmail(),
                        "userType", created.getUserType()
                ),
                false,
                httpReq
        );

        String token = jwtService.generateToken(
                created.getEmail(),
                created.getFullName(),
                created.getUserType()
        );

        res.put("id",       created.getId());          // ⭐ ADDED
        res.put("message",  "Registration successful!");
        res.put("token",    token);
        res.put("email",    created.getEmail());
        res.put("fullName", created.getFullName());
        res.put("userType", created.getUserType());

        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    // ─── LOGIN ───
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody LoginRequest req,
            HttpServletRequest httpReq
    ) {
        Map<String, Object> res = new HashMap<>();

        if (req.getEmail() == null || req.getPassword() == null) {
            res.put("message", "Email and password are required.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res);
        }

        Optional<User> userOpt = userService.authenticate(req.getEmail(), req.getPassword());

        if (userOpt.isEmpty()) {
            auditLogService.failure(
                    "LOGIN_FAILURE",
                    "Users",
                    req.getEmail(),
                    "Invalid credentials",
                    httpReq
            );
            res.put("message", "Invalid email or password.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(res);
        }

        User user = userOpt.get();

        String token = jwtService.generateToken(
                user.getEmail(),
                user.getFullName(),
                user.getUserType()
        );

        boolean isAdmin = "admin".equalsIgnoreCase(user.getUserType());

        auditLogService.success(
                isAdmin ? "ADMIN_LOGIN" : "LOGIN_SUCCESS",
                "Users",
                user.getEmail(),
                null,
                Map.of(
                        "email", user.getEmail(),
                        "userType", user.getUserType()
                ),
                isAdmin,
                httpReq
        );

        res.put("id",       user.getId());             // ⭐ ADDED
        res.put("message",  "Login successful!");
        res.put("token",    token);
        res.put("email",    user.getEmail());
        res.put("fullName", user.getFullName());
        res.put("userType", user.getUserType());

        return ResponseEntity.ok(res);
    }
}

class RegisterRequest {
    private String fullName;
    private String email;
    private String mobile;
    private String password;
    private String userType;

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

class LoginRequest {
    private String email;
    private String password;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}