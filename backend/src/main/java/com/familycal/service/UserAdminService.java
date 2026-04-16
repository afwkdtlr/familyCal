package com.familycal.service;

import com.familycal.domain.AppUser;
import com.familycal.repository.AppUserRepository;
import com.familycal.web.dto.CreateUserRequest;
import com.familycal.web.dto.UserSummaryResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserAdminService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public UserAdminService(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserSummaryResponse createUser(CreateUserRequest request) {
        if (appUserRepository.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }
        AppUser user = new AppUser();
        user.setUsername(request.getUsername());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setActive(true);
        AppUser saved = appUserRepository.save(user);
        return toSummary(saved);
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> listUsers() {
        return appUserRepository.findAll().stream().map(this::toSummary).collect(Collectors.toList());
    }

    private UserSummaryResponse toSummary(AppUser user) {
        return new UserSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt()
        );
    }
}
