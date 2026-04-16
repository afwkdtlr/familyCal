package com.familycal.web.dto;

import com.familycal.domain.EventVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class CreateEventRequest {

    @NotBlank
    private String title;

    private String description;

    @NotNull
    private Instant startAt;

    @NotNull
    private Instant endAt;

    @NotNull
    private EventVisibility visibility;

    private Long targetGroupId;

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
}
