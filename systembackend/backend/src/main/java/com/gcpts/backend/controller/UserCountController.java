package com.gcpts.backend.controller;

import com.gcpts.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user-count")
@CrossOrigin(origins = "*")
public class UserCountController {

    @Autowired
    private UserRepository userRepository;

    // ─── GET total user count ───
    @GetMapping
    public Map<String, Object> getUserCount() {
        long total    = userRepository.count();
        long admins   = userRepository.countByUserType("admin");
        long citizens = userRepository.countByUserType("user");

        System.out.println("🔢 /api/user-count — total=" + total +
                           " admins=" + admins + " citizens=" + citizens);

        Map<String, Object> res = new HashMap<>();
        res.put("count", total);          // ← the single number you asked for
        res.put("total", total);
        res.put("admins", admins);
        res.put("citizens", citizens);
        return res;
    }

    // ─── GET just the raw number (plain text) ───
    @GetMapping("/total")
    public long getTotalOnly() {
        long total = userRepository.count();
        System.out.println("🔢 /api/user-count/total — " + total);
        return total;
    }

    // ─── GET just the citizen count (plain text) ───
    @GetMapping("/citizens")
    public long getCitizensOnly() {
        long citizens = userRepository.countByUserType("user");
        System.out.println("🔢 /api/user-count/citizens — " + citizens);
        return citizens;
    }
}