package com.example.urbanpulse.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "\"UrbanAsset\"")
public class UrbanAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "tipo", nullable = false, length = 50)
    private String tipo;

    @Column(name = "nombre", length = 200)
    private String nombre;

    @Column(name = "latitud", precision = 9, scale = 6)
    private BigDecimal latitud;

    @Column(name = "longitud", precision = 9, scale = 6)
    private BigDecimal longitud;

    @Column(name = "fuente", length = 100)
    private String fuente;

    @Column(name = "metadatos", columnDefinition = "TEXT")
    private String metadatos;

    public UrbanAsset() {
    }

    public UrbanAsset(String tipo) {
        this.tipo = tipo;
    }

    public UrbanAsset(Integer id, String tipo) {
        this.id = id;
        this.tipo = tipo;
    }

    public UrbanAsset(Integer id, String tipo, String nombre, BigDecimal latitud, BigDecimal longitud, String fuente, String metadatos) {
        this.id = id;
        this.tipo = tipo;
        this.nombre = nombre;
        this.latitud = latitud;
        this.longitud = longitud;
        this.fuente = fuente;
        this.metadatos = metadatos;
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

    public String getMetadatos() {
        return metadatos;
    }

    public void setMetadatos(String metadatos) {
        this.metadatos = metadatos;
    }
}
