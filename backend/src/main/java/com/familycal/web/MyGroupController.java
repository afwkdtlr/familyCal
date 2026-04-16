package com.familycal.web;

import com.familycal.service.CurrentUserService;
import com.familycal.service.FamilyGroupService;
import com.familycal.web.dto.GroupResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/groups/my")
public class MyGroupController {

    private final CurrentUserService currentUserService;
    private final FamilyGroupService familyGroupService;

    public MyGroupController(CurrentUserService currentUserService, FamilyGroupService familyGroupService) {
        this.currentUserService = currentUserService;
        this.familyGroupService = familyGroupService;
    }

    @GetMapping
    public ResponseEntity<List<GroupResponse>> myGroups() {
        return ResponseEntity.ok(familyGroupService.listGroupsForUser(currentUserService.requireCurrentUser()));
    }
}
