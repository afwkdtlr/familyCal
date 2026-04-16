package com.familycal.service;

import com.familycal.domain.AppUser;
import com.familycal.domain.CalendarEvent;
import com.familycal.domain.EventVisibility;
import com.familycal.domain.FamilyGroup;
import com.familycal.repository.CalendarEventRepository;
import com.familycal.repository.FamilyGroupRepository;
import com.familycal.repository.GroupMemberRepository;
import com.familycal.web.dto.CreateEventRequest;
import com.familycal.web.dto.EventResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CalendarEventService {

    private final CalendarEventRepository calendarEventRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final FamilyGroupRepository familyGroupRepository;

    public CalendarEventService(
            CalendarEventRepository calendarEventRepository,
            GroupMemberRepository groupMemberRepository,
            FamilyGroupRepository familyGroupRepository
    ) {
        this.calendarEventRepository = calendarEventRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.familyGroupRepository = familyGroupRepository;
    }

    @Transactional(readOnly = true)
    public List<EventResponse> listVisible(AppUser viewer, Instant rangeStart, Instant rangeEnd) {
        if (!rangeStart.isBefore(rangeEnd)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid range");
        }
        List<Long> groupIds = groupMemberRepository.findGroupIdsByUserId(viewer.getId());
        List<CalendarEvent> allUsers = calendarEventRepository.findEventsInRangeByVisibility(
                rangeStart,
                rangeEnd,
                EventVisibility.ALL_USERS
        );
        List<CalendarEvent> groupEvents = groupIds.isEmpty()
                ? Collections.emptyList()
                : calendarEventRepository.findGroupRestrictedEventsInRange(
                        rangeStart,
                        rangeEnd,
                        EventVisibility.SPECIFIC_GROUP,
                        groupIds
                );
        Set<Long> seen = new HashSet<>();
        List<CalendarEvent> merged = new ArrayList<>();
        for (CalendarEvent event : allUsers) {
            if (seen.add(event.getId())) {
                merged.add(event);
            }
        }
        for (CalendarEvent event : groupEvents) {
            if (seen.add(event.getId())) {
                merged.add(event);
            }
        }
        merged.sort(Comparator.comparing(CalendarEvent::getStartAt));
        return merged.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public EventResponse create(AppUser creator, CreateEventRequest request) {
        if (!request.getStartAt().isBefore(request.getEndAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startAt must be before endAt");
        }
        CalendarEvent event = new CalendarEvent();
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setStartAt(request.getStartAt());
        event.setEndAt(request.getEndAt());
        event.setVisibility(request.getVisibility());
        event.setCreatedBy(creator);
        if (request.getVisibility() == EventVisibility.SPECIFIC_GROUP) {
            if (request.getTargetGroupId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetGroupId is required");
            }
            FamilyGroup group = familyGroupRepository.findById(request.getTargetGroupId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found"));
            if (!groupMemberRepository.existsByUserIdAndFamilyGroupId(creator.getId(), group.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a member of target group");
            }
            event.setTargetGroup(group);
        } else {
            event.setTargetGroup(null);
        }
        CalendarEvent saved = calendarEventRepository.save(event);
        return toResponse(saved);
    }

    private EventResponse toResponse(CalendarEvent event) {
        Long groupId = event.getTargetGroup() == null ? null : event.getTargetGroup().getId();
        String groupName = event.getTargetGroup() == null ? null : event.getTargetGroup().getName();
        return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getStartAt(),
                event.getEndAt(),
                event.getVisibility(),
                groupId,
                groupName,
                event.getCreatedBy().getUsername()
        );
    }
}
