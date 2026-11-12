package com.example.urbanpulse.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class UpdateIncidentPriorityRequest {

    @NotBlank
    @Pattern(regexp = "Baja|Media|Alta")
    private String prioridad;

    public String getPrioridad() {
        return prioridad;
    }

    public void setPrioridad(String prioridad) {
        this.prioridad = prioridad;
    }
}
