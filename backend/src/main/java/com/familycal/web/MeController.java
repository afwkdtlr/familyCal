package com.familycal.web;

import com.familycal.domain.AppUser;
import com.familycal.service.CurrentUserService;
import com.familycal.web.dto.UserSummaryResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class MeController {

    private final CurrentUserService currentUserService;

    public MeController(CurrentUserService currentUserService) {
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public ResponseEntity<UserSummaryResponse> me() {
        AppUser user = currentUserService.requireCurrentUser();
        return ResponseEntity.ok(new UserSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt()
        ));
    }
}
