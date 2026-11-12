package com.example.urbanpulse.service;

public enum IncidentStatus {
    ABIERTA("Abierta"),
    EN_REVISION("En revisión"),
    RESUELTA("Resuelta"),
    CERRADA("Cerrada"),
    RECHAZADA("Rechazada"),
    REABIERTA("Reabierta");

    private final String label;

    IncidentStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public boolean canTransitionTo(IncidentStatus target) {
        return switch (this) {
            case ABIERTA -> target == EN_REVISION || target == RECHAZADA;
            case EN_REVISION -> target == RESUELTA || target == RECHAZADA;
            case RESUELTA, CERRADA -> target == REABIERTA || (this == RESUELTA && target == CERRADA);
            case REABIERTA -> target == EN_REVISION;
            case RECHAZADA -> false;
        };
    }

    public static IncidentStatus fromLabel(String label) {
        for (IncidentStatus status : values()) {
            if (status.label.equals(label)) {
                return status;
            }
        }
        return null;
    }

    public boolean requiresReason() {
        return this == RECHAZADA || this == REABIERTA;
    }
}
