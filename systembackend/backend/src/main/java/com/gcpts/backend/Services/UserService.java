package com.gcpts.backend.Services;

import com.gcpts.backend.model.User;
import com.gcpts.backend.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public boolean isEmailTaken(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    /** 5-arg version used by the JWT-enabled AuthController. */
    public User registerUser(String fullName, String email, String mobile,
                             String rawPassword, String userType) {
        String hashedPassword = passwordEncoder.encode(rawPassword);
        User newUser = new User(fullName, email, mobile, hashedPassword, userType);
        return userRepository.save(newUser);
    }

    /** 4-arg version kept for backwards compatibility. */
    public User registerUser(String fullName, String email, String mobile,
                             String rawPassword) {
        return registerUser(fullName, email, mobile, rawPassword, "user");
    }

    /** Returns the User if credentials match, otherwise empty. */
    public Optional<User> authenticate(String email, String rawPassword) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) return Optional.empty();
        User user = userOpt.get();
        if (passwordEncoder.matches(rawPassword, user.getPassword())) {
            return Optional.of(user);
        }
        return Optional.empty();
    }

    /** Legacy boolean helper kept for old code paths. */
    public boolean authenticateUser(String email, String rawPassword) {
        return authenticate(email, rawPassword).isPresent();
    }
}