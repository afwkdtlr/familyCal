package com.familycal.service;

import com.familycal.domain.FamilyGroup;
import com.familycal.domain.GroupMember;
import com.familycal.repository.FamilyGroupRepository;
import com.familycal.repository.GroupMemberRepository;
import com.familycal.repository.AppUserRepository;
import com.familycal.domain.AppUser;
import com.familycal.web.dto.CreateGroupRequest;
import com.familycal.web.dto.GroupResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FamilyGroupService {

    private final FamilyGroupRepository familyGroupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final AppUserRepository appUserRepository;

    public FamilyGroupService(
            FamilyGroupRepository familyGroupRepository,
            GroupMemberRepository groupMemberRepository,
            AppUserRepository appUserRepository
    ) {
        this.familyGroupRepository = familyGroupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.appUserRepository = appUserRepository;
    }

    @Transactional
    public GroupResponse createGroup(CreateGroupRequest request) {
        FamilyGroup group = new FamilyGroup();
        group.setName(request.getName());
        group.setDescription(request.getDescription());
        FamilyGroup saved = familyGroupRepository.save(group);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> listAllGroups() {
        return familyGroupRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> listGroupsForUser(AppUser user) {
        List<Long> ids = groupMemberRepository.findGroupIdsByUserId(user.getId());
        if (ids.isEmpty()) {
            return Collections.emptyList();
        }
        return familyGroupRepository.findAllById(ids).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void addMember(Long groupId, Long userId) {
        FamilyGroup group = familyGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found"));
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (groupMemberRepository.existsByUserIdAndFamilyGroupId(userId, groupId)) {
            return;
        }
        GroupMember member = new GroupMember();
        member.setUser(user);
        member.setFamilyGroup(group);
        groupMemberRepository.save(member);
    }

    @Transactional
    public void removeMember(Long groupId, Long userId) {
        groupMemberRepository.findByUserIdAndFamilyGroupId(userId, groupId)
                .ifPresent(groupMemberRepository::delete);
    }

    private GroupResponse toResponse(FamilyGroup group) {
        return new GroupResponse(group.getId(), group.getName(), group.getDescription(), group.getCreatedAt());
    }
}
