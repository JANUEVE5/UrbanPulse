package com.example.urbanpulse.service;

import com.example.urbanpulse.config.SecurityConfig;
import com.example.urbanpulse.entity.AppUser;
import com.example.urbanpulse.entity.Rol;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/** Emisión y validación reales de JWT con la configuración de SecurityConfig. */
class TokenServiceTest {

    private static final String SECRET = "clave-de-tests-de-al-menos-32-bytes-0123456789";

    private final SecurityConfig security = new SecurityConfig(SECRET);
    private final JwtDecoder decoder = security.jwtDecoder();

    private AppUser operator() {
        AppUser user = new AppUser(2, "Lucía Navarro", "lucia@urbanpulse.es", "hash");
        user.setRol(Rol.OPERATOR);
        return user;
    }

    @Test
    @DisplayName("El token lleva el id como sujeto, el rol y caduca según la configuración")
    void issuedTokenContainsClaims() {
        TokenService tokens = new TokenService(security.jwtEncoder(), Duration.ofMinutes(60), Clock.systemUTC());

        TokenService.IssuedToken issued = tokens.issue(operator());
        Jwt jwt = decoder.decode(issued.value());

        assertEquals("2", jwt.getSubject());
        assertEquals("OPERATOR", jwt.getClaimAsString(SecurityConfig.ROLE_CLAIM));
        assertEquals(TokenService.ISSUER, jwt.getClaimAsString("iss"));
        assertEquals(issued.expiresAt(), jwt.getExpiresAt());
    }

    @Test
    @DisplayName("Un token firmado con otra clave se rechaza")
    void tokenWithOtherKeyIsRejected() {
        SecurityConfig other = new SecurityConfig("otra-clave-distinta-tambien-de-32-bytes-xyz");
        String forged = new TokenService(other.jwtEncoder(), Duration.ofMinutes(60), Clock.systemUTC())
                .issue(operator()).value();

        assertThrows(JwtException.class, () -> decoder.decode(forged));
    }

    @Test
    @DisplayName("Un token caducado se rechaza")
    void expiredTokenIsRejected() {
        Clock past = Clock.fixed(Instant.now().minus(Duration.ofHours(3)), ZoneOffset.UTC);
        String expired = new TokenService(security.jwtEncoder(), Duration.ofMinutes(60), past)
                .issue(operator()).value();

        assertThrows(JwtException.class, () -> decoder.decode(expired));
    }

    @Test
    @DisplayName("JWT_SECRET de menos de 32 bytes impide arrancar")
    void shortSecretIsRejected() {
        assertThrows(IllegalStateException.class, () -> new SecurityConfig("corta"));
    }
}
