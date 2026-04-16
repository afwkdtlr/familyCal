package com.familycal.repository;

import com.familycal.domain.CalendarEvent;
import com.familycal.domain.EventVisibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    @Query(
            "select e from CalendarEvent e "
                    + "where e.startAt < :rangeEnd and e.endAt > :rangeStart "
                    + "and e.visibility = :visibility"
    )
    List<CalendarEvent> findEventsInRangeByVisibility(
            @Param("rangeStart") Instant rangeStart,
            @Param("rangeEnd") Instant rangeEnd,
            @Param("visibility") EventVisibility visibility
    );

    @Query(
            "select e from CalendarEvent e "
                    + "where e.startAt < :rangeEnd and e.endAt > :rangeStart "
                    + "and e.visibility = :visibility "
                    + "and e.targetGroup is not null "
                    + "and e.targetGroup.id in :groupIds"
    )
    List<CalendarEvent> findGroupRestrictedEventsInRange(
            @Param("rangeStart") Instant rangeStart,
            @Param("rangeEnd") Instant rangeEnd,
            @Param("visibility") EventVisibility visibility,
            @Param("groupIds") List<Long> groupIds
    );
}
