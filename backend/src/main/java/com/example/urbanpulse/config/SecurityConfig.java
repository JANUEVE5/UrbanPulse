package com.example.urbanpulse.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

/**
 * Seguridad de la API (RF01, RF02, ADR-009).
 *
 * <p>Cómo funciona:
 * <ol>
 *   <li>El cliente hace login en {@code POST /api/auth/login} y recibe un JWT firmado con {@code JWT_SECRET}.</li>
 *   <li>En cada petición envía {@code Authorization: Bearer <token>}.</li>
 *   <li>Spring Security valida la firma y la caducidad del token (sin sesiones: la API no guarda estado)
 *       y convierte la reclamación {@code rol} en la autoridad {@code ROLE_<rol>}.</li>
 *   <li>Las reglas de abajo (y {@code @PreAuthorize} en los métodos) deciden si se permite la operación:
 *       sin token válido → 401; con token pero sin el rol necesario → 403.</li>
 * </ol>
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    /** Nombre de la reclamación del JWT que lleva el rol del usuario. */
    public static final String ROLE_CLAIM = "rol";

    private static final int MIN_SECRET_BYTES = 32; // HS256 exige al menos 256 bits

    private final SecretKey jwtKey;

    public SecurityConfig(@Value("${app.jwt.secret}") String jwtSecret) {
        byte[] bytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET debe tener al menos " + MIN_SECRET_BYTES + " bytes (256 bits) para HS256.");
        }
        this.jwtKey = new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // API REST con tokens en cabecera: no hay cookies de sesión, así que CSRF no aplica
                .csrf(AbstractHttpConfigurer::disable)
                // Usa la configuración CORS de WebConfig (CORS_ALLOWED_ORIGINS)
                .cors(Customizer.withDefaults())
                // Sin sesiones en el servidor (Twelve-Factor, factor VI)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Peticiones previas de CORS
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Página de error de Spring: si no se permite, cualquier error (400, 409…) llegaría como 401
                        .requestMatchers("/error").permitAll()
                        // Registro y login: públicos
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register").permitAll()
                        // El listado requiere autenticación; el servicio filtra por rol
                        .requestMatchers(HttpMethod.GET, "/api/incidents", "/api/incidents/mine").authenticated()
                        // El detalle sigue siendo público
                        .requestMatchers(HttpMethod.GET, "/api/incidents/**").permitAll()
                        // Gestión de usuarios: solo administración
                        .requestMatchers("/api/users/**").hasRole("ADMIN")
                        // El resto (crear incidencias, /api/auth/me…) exige estar autenticado
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())));
        return http.build();
    }

    /** Contraseñas guardadas con BCrypt (nunca en claro). */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** Firma los JWT que emite la API (HMAC-SHA256 con JWT_SECRET). */
    @Bean
    public JwtEncoder jwtEncoder() {
        return new NimbusJwtEncoder(new ImmutableSecret<>(jwtKey));
    }

    /** Valida la firma y la caducidad de los JWT recibidos. */
    @Bean
    public JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withSecretKey(jwtKey).macAlgorithm(MacAlgorithm.HS256).build();
    }

    /** Convierte la reclamación {@code rol} del token en la autoridad {@code ROLE_<rol>}. */
    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authorities = new JwtGrantedAuthoritiesConverter();
        authorities.setAuthoritiesClaimName(ROLE_CLAIM);
        authorities.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authorities);
        return converter;
    }
}
