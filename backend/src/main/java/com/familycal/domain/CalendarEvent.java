package com.familycal.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "CALENDAR_EVENT")
public class CalendarEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "ID")
    private Long id;

    @Column(name = "TITLE", nullable = false, length = 200)
    private String title;

    @Column(name = "DESCRIPTION", length = 2000)
    private String description;

    @Column(name = "START_AT", nullable = false)
    private Instant startAt;

    @Column(name = "END_AT", nullable = false)
    private Instant endAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "VISIBILITY", nullable = false, length = 30)
    private EventVisibility visibility = EventVisibility.ALL_USERS;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "TARGET_GROUP_ID")
    private FamilyGroup targetGroup;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "CREATED_BY_USER_ID", nullable = false)
    private AppUser createdBy;

    @Column(name = "CREATED_AT", nullable = false)
    private Instant createdAt = Instant.now();

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

    public FamilyGroup getTargetGroup() {
        return targetGroup;
    }

    public void setTargetGroup(FamilyGroup targetGroup) {
        this.targetGroup = targetGroup;
    }

    public AppUser getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(AppUser createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
