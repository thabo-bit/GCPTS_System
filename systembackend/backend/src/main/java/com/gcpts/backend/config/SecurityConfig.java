package com.gcpts.backend.config;

import com.gcpts.backend.Services.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private CorsConfigurationSource corsConfigurationSource;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // ─── Preflight ───
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // ─── Public auth ───
                .requestMatchers("/api/auth/**").permitAll()

                // ─── Public GETs ───
                .requestMatchers(HttpMethod.GET, "/api/projects/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/upcoming-projects/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/contractors/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/issues/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/transactions/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()

                // ─── Public POST: citizens report issues ───
                .requestMatchers(HttpMethod.POST, "/api/issues").permitAll()

                // ─── Admin-only writes: issues ───
                .requestMatchers(HttpMethod.PATCH,  "/api/issues/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/issues/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/issues/**").hasRole("ADMIN")

                // ─── Admin-only writes: projects ───
                .requestMatchers(HttpMethod.POST,   "/api/projects/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/projects/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/projects/**").hasRole("ADMIN")

                // ─── Admin-only writes: upcoming projects ───
                .requestMatchers(HttpMethod.POST,   "/api/upcoming-projects/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/upcoming-projects/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH,  "/api/upcoming-projects/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/upcoming-projects/**").hasRole("ADMIN")

                // ─── Admin-only writes: transactions ───
                .requestMatchers(HttpMethod.POST,   "/api/transactions/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/transactions/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/transactions/**").hasRole("ADMIN")

                // ─── Admin-only: audit logs & user management ───
                .requestMatchers("/api/audit-logs/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST,   "/api/users/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/users/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH,  "/api/users/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasRole("ADMIN")

                // ─── Everything else requires a valid JWT ───
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public OncePerRequestFilter jwtFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(
                    HttpServletRequest request,
                    HttpServletResponse response,
                    FilterChain chain
            ) throws ServletException, IOException {

                String auth = request.getHeader("Authorization");
                if (auth != null && auth.startsWith("Bearer ")) {
                    String token = auth.substring(7);
                    try {
                        if (jwtService.isValid(token)) {
                            var claims = jwtService.parseToken(token);
                            String email = claims.getSubject();
                            String userType = claims.get("userType", String.class);

                            if (userType == null || userType.isBlank()) {
                                userType = "USER";
                            }

                            var authorities = List.of(
                                    new SimpleGrantedAuthority("ROLE_" + userType.toUpperCase())
                            );
                            var authentication = new UsernamePasswordAuthenticationToken(
                                    email, null, authorities
                            );
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        }
                    } catch (Exception e) {
                        System.err.println("⚠️ JWT filter error: " + e.getMessage());
                    }
                }
                chain.doFilter(request, response);
            }
        };
    }
}