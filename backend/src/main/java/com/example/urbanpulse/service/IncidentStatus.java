package com.example.urbanpulse.service;

public enum IncidentStatus {
    ABIERTA("Abierta"),
    EN_REVISION("En revisión"),
    RESUELTA("Resuelta"),
    CERRADA("Cerrada");

    private final String label;

    IncidentStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public boolean canTransitionTo(IncidentStatus target) {
        return switch (this) {
            case ABIERTA -> target == EN_REVISION;
            case EN_REVISION -> target == RESUELTA;
            case RESUELTA -> target == CERRADA;
            case CERRADA -> false;
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
}
