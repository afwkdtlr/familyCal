package com.familycal.web.dto;

import com.familycal.domain.EventVisibility;

import java.time.Instant;

public class EventResponse {

    private Long id;
    private String title;
    private String description;
    private Instant startAt;
    private Instant endAt;
    private EventVisibility visibility;
    private Long targetGroupId;
    private String targetGroupName;
    private String createdByUsername;

    public EventResponse() {
    }

    public EventResponse(
            Long id,
            String title,
            String description,
            Instant startAt,
            Instant endAt,
            EventVisibility visibility,
            Long targetGroupId,
            String targetGroupName,
            String createdByUsername
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.startAt = startAt;
        this.endAt = endAt;
        this.visibility = visibility;
        this.targetGroupId = targetGroupId;
        this.targetGroupName = targetGroupName;
        this.createdByUsername = createdByUsername;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getStartAt() {
        return startAt;
    }

    public void setStartAt(Instant startAt) {
        this.startAt = startAt;
    }

    public Instant getEndAt() {
        return endAt;
    }

    public void setEndAt(Instant endAt) {
        this.endAt = endAt;
    }

    public EventVisibility getVisibility() {
        return visibility;
    }

    public void setVisibility(EventVisibility visibility) {
        this.visibility = visibility;
    }

    public Long getTargetGroupId() {
        return targetGroupId;
    }

    public void setTargetGroupId(Long targetGroupId) {
        this.targetGroupId = targetGroupId;
    }

    public String getTargetGroupName() {
        return targetGroupName;
    }

    public void setTargetGroupName(String targetGroupName) {
        this.targetGroupName = targetGroupName;
    }

    public String getCreatedByUsername() {
        return createdByUsername;
    }

    public void setCreatedByUsername(String createdByUsername) {
        this.createdByUsername = createdByUsername;
    }
}
