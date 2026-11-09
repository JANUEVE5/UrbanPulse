package com.example.urbanpulse.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuración web transversal.
 *
 * <p>CORS se define solo aquí (no con {@code @CrossOrigin} en los controllers). Los orígenes permitidos
 * llegan de la variable de entorno {@code CORS_ALLOWED_ORIGINS} (propiedad {@code app.cors.allowed-origins}),
 * así cada entorno decide qué frontends pueden llamar a la API sin tocar el código.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String[] allowedOrigins;

    public WebConfig(@Value("${app.cors.allowed-origins}") String[] allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*");
    }
}
