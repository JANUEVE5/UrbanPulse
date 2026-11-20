package com.example.urbanpulse.context.resilience;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProviderCircuitBreakerTest {
    @Test
    void opensAfterFailuresAndKeepsProviderCircuitsIndependent() throws Exception {
        ProviderCircuitBreaker breaker = new ProviderCircuitBreaker(2, Duration.ofMinutes(1),
                Clock.fixed(Instant.parse("2026-11-20T12:00:00Z"), ZoneOffset.UTC));
        AtomicInteger attempts = new AtomicInteger();

        assertThrows(IllegalStateException.class, () -> breaker.call("aemet", () -> {
            attempts.incrementAndGet();
            throw new IllegalStateException("offline");
        }));
        assertThrows(IllegalStateException.class, () -> breaker.call("aemet", () -> {
            attempts.incrementAndGet();
            throw new IllegalStateException("offline");
        }));
        assertEquals(ProviderCircuitBreaker.State.OPEN, breaker.getState("aemet"));
        assertEquals(ProviderCircuitBreaker.State.CLOSED, breaker.getState("opendata"));
        assertThrows(ProviderCircuitBreaker.CircuitOpenException.class,
                () -> breaker.call("aemet", () -> attempts.incrementAndGet()));
        assertEquals(2, attempts.get());
    }

    @Test
    void closesAfterSuccessfulHalfOpenProbe() throws Exception {
        AdjustableClock clock = new AdjustableClock(Instant.parse("2026-11-20T12:00:00Z"));
        ProviderCircuitBreaker breaker = new ProviderCircuitBreaker(1, Duration.ofSeconds(5), clock);
        assertThrows(IllegalStateException.class,
                () -> breaker.call("opendata", () -> { throw new IllegalStateException("offline"); }));
        clock.advance(Duration.ofSeconds(6));
        breaker.call("opendata", () -> "available");
        assertEquals(ProviderCircuitBreaker.State.CLOSED, breaker.getState("opendata"));
    }

    private static final class AdjustableClock extends Clock {
        private Instant current;

        private AdjustableClock(Instant current) {
            this.current = current;
        }

        private void advance(Duration duration) {
            current = current.plus(duration);
        }

        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return current;
        }
    }
}
