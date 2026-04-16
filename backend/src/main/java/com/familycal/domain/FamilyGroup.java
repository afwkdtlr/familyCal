package com.familycal.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "FAMILY_GROUP")
public class FamilyGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "ID")
    private Long id;

    @Column(name = "NAME", nullable = false, length = 120)
    private String name;

    @Column(name = "DESCRIPTION", length = 500)
    private String description;

    @Column(name = "CREATED_AT", nullable = false)
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "familyGroup", fetch = FetchType.LAZY)
    private List<GroupMember> members = new ArrayList<>();

    @OneToMany(mappedBy = "targetGroup", fetch = FetchType.LAZY)
    private List<CalendarEvent> restrictedEvents = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public List<GroupMember> getMembers() {
        return members;
    }

    public void setMembers(List<GroupMember> members) {
        this.members = members;
    }

    public List<CalendarEvent> getRestrictedEvents() {
        return restrictedEvents;
    }

    public void setRestrictedEvents(List<CalendarEvent> restrictedEvents) {
        this.restrictedEvents = restrictedEvents;
    }
}
