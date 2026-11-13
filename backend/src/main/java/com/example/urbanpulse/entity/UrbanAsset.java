package com.example.urbanpulse.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Elemento urbano con ubicación (parada de autobús, desfibrilador, contenedor…) al que se puede asociar
 * una incidencia (RF22). Los activos se sincronizan desde Open Data Málaga (ADR-015); la API solo los lee.
 */
@Entity
@Table(name = "\"UrbanAsset\"")
public class UrbanAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    /** Código del tipo de activo, por ejemplo {@code PARADA_AUTOBUS} o {@code DESFIBRILADOR}. */
    @Column(name = "tipo", nullable = false, length = 50)
    private String tipo;

    @Column(name = "nombre", length = 200)
    private String nombre;

    @Column(name = "descripcion", length = 400)
    private String descripcion;

    @Column(name = "direccion", length = 200)
    private String direccion;

    @Column(name = "latitud", nullable = false, precision = 9, scale = 6)
    private BigDecimal latitud;

    @Column(name = "longitud", nullable = false, precision = 9, scale = 6)
    private BigDecimal longitud;

    /** Código de la fuente de Open Data de la que procede (por ejemplo {@code emt-paradas}). */
    @Column(name = "fuente", nullable = false, length = 50)
    private String fuente;

    /** Identificador del activo en su fuente: junto con {@code fuente} lo identifica de forma única. */
    @Column(name = "id_externo", nullable = false, length = 100)
    private String idExterno;

    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn;

    public UrbanAsset() {
    }

    public UrbanAsset(Integer id, String tipo) {
        this.id = id;
        this.tipo = tipo;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public BigDecimal getLatitud() {
        return latitud;
    }

    public void setLatitud(BigDecimal latitud) {
        this.latitud = latitud;
    }

    public BigDecimal getLongitud() {
        return longitud;
    }

    public void setLongitud(BigDecimal longitud) {
        this.longitud = longitud;
    }

    public String getFuente() {
        return fuente;
    }

    public void setFuente(String fuente) {
        this.fuente = fuente;
    }

    public String getIdExterno() {
        return idExterno;
    }

    public void setIdExterno(String idExterno) {
        this.idExterno = idExterno;
    }

    public LocalDateTime getActualizadoEn() {
        return actualizadoEn;
    }

    public void setActualizadoEn(LocalDateTime actualizadoEn) {
        this.actualizadoEn = actualizadoEn;
    }
}
