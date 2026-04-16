package com.familycal.web;

import com.familycal.service.CalendarEventService;
import com.familycal.service.CurrentUserService;
import com.familycal.web.dto.CreateEventRequest;
import com.familycal.web.dto.EventResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final CalendarEventService calendarEventService;
    private final CurrentUserService currentUserService;

    public EventController(CalendarEventService calendarEventService, CurrentUserService currentUserService) {
        this.calendarEventService = calendarEventService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public ResponseEntity<List<EventResponse>> list(
            @RequestParam("start") String rangeStart,
            @RequestParam("end") String rangeEnd
    ) {
        Instant start = Instant.parse(rangeStart);
        Instant end = Instant.parse(rangeEnd);
        return ResponseEntity.ok(calendarEventService.listVisible(
                currentUserService.requireCurrentUser(),
                start,
                end
        ));
    }

    @PostMapping
    public ResponseEntity<EventResponse> create(@Valid @RequestBody CreateEventRequest request) {
        return ResponseEntity.ok(calendarEventService.create(currentUserService.requireCurrentUser(), request));
    }
}
