package com.familycal.web.dto;

import com.familycal.domain.UserRole;

import java.time.Instant;

public class UserSummaryResponse {

    private Long id;
    private String username;
    private UserRole role;
    private boolean active;
    private Instant createdAt;

    public UserSummaryResponse() {
    }

    public UserSummaryResponse(Long id, String username, UserRole role, boolean active, Instant createdAt) {
        this.id = id;
        this.username = username;
        this.role = role;
        this.active = active;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
