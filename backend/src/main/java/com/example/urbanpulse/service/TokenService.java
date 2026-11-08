package com.example.urbanpulse.service;

import com.example.urbanpulse.config.SecurityConfig;
import com.example.urbanpulse.entity.AppUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/** Emite los JWT de UrbanPulse tras un login o registro correctos. */
@Service
public class TokenService {

    public static final String ISSUER = "urbanpulse";

    private final JwtEncoder encoder;
    private final Duration expiration;
    private final Clock clock;

    @Autowired
    public TokenService(JwtEncoder encoder,
                        @Value("${app.jwt.expiration-minutes}") long expirationMinutes) {
        this(encoder, Duration.ofMinutes(expirationMinutes), Clock.systemUTC());
    }

    TokenService(JwtEncoder encoder, Duration expiration, Clock clock) {
        this.encoder = encoder;
        this.expiration = expiration;
        this.clock = clock;
    }

    /** Token emitido junto con su fecha de caducidad. */
    public record IssuedToken(String value, Instant expiresAt) {
    }

    /**
     * Crea un token con el id del usuario como sujeto ({@code sub}) y su rol en la reclamación {@code rol}.
     * No incluye datos sensibles: el token se puede decodificar (no está cifrado, solo firmado).
     */
    public IssuedToken issue(AppUser user) {
        // Los JWT guardan las fechas en segundos
        Instant now = clock.instant().truncatedTo(ChronoUnit.SECONDS);
        Instant expiresAt = now.plus(expiration);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(ISSUER)
                .subject(String.valueOf(user.getId()))
                .issuedAt(now)
                .expiresAt(expiresAt)
                .claim("nombre", user.getNombre())
                .claim(SecurityConfig.ROLE_CLAIM, user.getRol().name())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new IssuedToken(token, expiresAt);
    }
}
