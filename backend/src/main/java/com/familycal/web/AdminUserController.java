package com.familycal.web;

import com.familycal.service.UserAdminService;
import com.familycal.web.dto.CreateUserRequest;
import com.familycal.web.dto.UserSummaryResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserAdminService userAdminService;

    public AdminUserController(UserAdminService userAdminService) {
        this.userAdminService = userAdminService;
    }

    @PostMapping
    public ResponseEntity<UserSummaryResponse> create(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(userAdminService.createUser(request));
    }

    @GetMapping
    public ResponseEntity<List<UserSummaryResponse>> list() {
        return ResponseEntity.ok(userAdminService.listUsers());
    }
}
