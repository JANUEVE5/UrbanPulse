package com.example.urbanpulse.context.resilience;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.Callable;

@Component
public class ProviderCircuitBreaker {
    public enum State {
        CLOSED, OPEN, HALF_OPEN
    }

    private final int threshold;
    private final Duration waitDuration;
    private final Clock clock;
    private final ConcurrentMap<String, Circuit> circuits = new ConcurrentHashMap<>();

    @Autowired
    public ProviderCircuitBreaker(
            @Value("${app.resilience.circuit-breaker.failure-threshold:3}") int threshold,
            @Value("${app.resilience.circuit-breaker.wait-duration-seconds:60}") long waitSeconds) {
        this(threshold, Duration.ofSeconds(waitSeconds), Clock.systemUTC());
    }

    ProviderCircuitBreaker(int threshold, Duration waitDuration, Clock clock) {
        if (threshold < 1 || waitDuration.isNegative() || waitDuration.isZero()) {
            throw new IllegalArgumentException("La configuración del circuit breaker debe ser positiva");
        }
        this.threshold = threshold;
        this.waitDuration = waitDuration;
        this.clock = clock;
    }

    public <T> T call(String provider, Callable<T> operation) throws Exception {
        Circuit circuit = circuits.computeIfAbsent(provider, ignored -> new Circuit());
        synchronized (circuit) {
            if (circuit.state == State.OPEN) {
                if (clock.instant().isBefore(circuit.openedAt.plus(waitDuration))) {
                    throw new CircuitOpenException();
                }
                circuit.state = State.HALF_OPEN;
            }
            try {
                T result = operation.call();
                circuit.failures = 0;
                circuit.openedAt = null;
                circuit.state = State.CLOSED;
                return result;
            } catch (Exception exception) {
                circuit.failures++;
                if (circuit.state == State.HALF_OPEN || circuit.failures >= threshold) {
                    circuit.state = State.OPEN;
                    circuit.openedAt = clock.instant();
                }
                throw exception;
            }
        }
    }

    public State getState(String provider) {
        Circuit circuit = circuits.get(provider);
        if (circuit == null) {
            return State.CLOSED;
        }
        synchronized (circuit) {
            if (circuit.state == State.OPEN && !clock.instant().isBefore(circuit.openedAt.plus(waitDuration))) {
                return State.HALF_OPEN;
            }
            return circuit.state;
        }
    }

    private static final class Circuit {
        private int failures;
        private Instant openedAt;
        private State state = State.CLOSED;
    }

    public static final class CircuitOpenException extends Exception {
        private static final long serialVersionUID = 1L;

        private CircuitOpenException() {
            super("El circuit breaker del proveedor está abierto");
        }
    }
}
