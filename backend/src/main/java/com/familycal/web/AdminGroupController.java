package com.familycal.web;

import com.familycal.service.FamilyGroupService;
import com.familycal.web.dto.CreateGroupRequest;
import com.familycal.web.dto.GroupResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/groups")
public class AdminGroupController {

    private final FamilyGroupService familyGroupService;

    public AdminGroupController(FamilyGroupService familyGroupService) {
        this.familyGroupService = familyGroupService;
    }

    @PostMapping
    public ResponseEntity<GroupResponse> create(@Valid @RequestBody CreateGroupRequest request) {
        return ResponseEntity.ok(familyGroupService.createGroup(request));
    }

    @GetMapping
    public ResponseEntity<List<GroupResponse>> list() {
        return ResponseEntity.ok(familyGroupService.listAllGroups());
    }

    @PostMapping("/{groupId}/members/{userId}")
    public ResponseEntity<Void> addMember(@PathVariable Long groupId, @PathVariable Long userId) {
        familyGroupService.addMember(groupId, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long groupId, @PathVariable Long userId) {
        familyGroupService.removeMember(groupId, userId);
        return ResponseEntity.noContent().build();
    }
}
