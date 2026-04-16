package com.familycal.service;

import com.familycal.domain.AppUser;
import com.familycal.repository.AppUserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private final AppUserRepository appUserRepository;

    public CurrentUserService(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    public AppUser requireCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Unauthenticated");
        }
        String username = authentication.getName();
        return appUserRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }
}
