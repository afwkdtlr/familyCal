package com.familycal.bootstrap;

import com.familycal.config.FamilyCalProperties;
import com.familycal.domain.AppUser;
import com.familycal.domain.UserRole;
import com.familycal.repository.AppUserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrapRunner implements ApplicationRunner {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final FamilyCalProperties familyCalProperties;

    public AdminBootstrapRunner(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            FamilyCalProperties familyCalProperties
    ) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.familyCalProperties = familyCalProperties;
    }

    @Override
    public void run(ApplicationArguments args) {
        upsertUser(
                familyCalProperties.getBootstrap().getAdminUsername(),
                familyCalProperties.getBootstrap().getAdminPassword(),
                UserRole.ADMIN
        );
        upsertUser("guest", "1234", UserRole.USER);
    }

    private void upsertUser(String username, String rawPassword, UserRole role) {
        AppUser user = appUserRepository.findByUsername(username).orElseGet(AppUser::new);
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setActive(true);
        appUserRepository.save(user);
    }
}
