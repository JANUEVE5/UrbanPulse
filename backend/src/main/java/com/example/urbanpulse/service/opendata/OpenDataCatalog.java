package com.example.urbanpulse.service.opendata;

import com.example.urbanpulse.service.opendata.OpenDataSource.Formato;

import java.util.List;

/**
 * Fuentes de Open Data Málaga (https://datosabiertos.malaga.eu) que se sincronizan como activos urbanos
 * (RF22, ADR-015). Solo se incluyen elementos físicos de la vía pública que pueden sufrir una incidencia.
 *
 * <p>Para añadir una fuente basta con añadir una línea: si es un GeoJSON de puntos en EPSG:4326 con los
 * campos habituales del portal ({@code ID}, {@code NOMBRE}, {@code DESCRIPCION}, {@code DIRECCION}), no
 * hace falta más código. Si una fuente deja de estar disponible, la sincronización la omite y mantiene
 * los datos que ya había (ADR-004).
 */
public final class OpenDataCatalog {

    public static final List<OpenDataSource> FUENTES = List.of(
            // Transporte
            new OpenDataSource("emt-paradas", "PARADA_AUTOBUS", "Parada de autobús EMT",
                    "/recursos/transporte/EMT/EMTLineasYParadas/lineasyparadas.geojson", Formato.EMT_LINEAS),
            new OpenDataSource("paradas-taxi", "PARADA_TAXI", "Parada de taxi",
                    "/recursos/transporte/paradasTaxis/da_transporte_paradasTaxi-4326.geojson", Formato.GEOJSON_PUNTOS),
            new OpenDataSource("aparcamientos-bici", "APARCAMIENTO_BICI", "Aparcamiento de bicicletas",
                    "/recursos/transporte/trafico/da_aparcamientosBici-4326.geojson", Formato.GEOJSON_PUNTOS),
            new OpenDataSource("aparcamientos-moto", "APARCAMIENTO_MOTO", "Aparcamiento de motos",
                    "/recursos/transporte/trafico/da_aparcamientosMoto-4326.geojson", Formato.GEOJSON_PUNTOS),
            new OpenDataSource("aparcamientos-pmr", "APARCAMIENTO_PMR", "Plaza para movilidad reducida",
                    "/recursos/transporte/trafico/da_aparcamientosMovilidadReducida-4326.geojson", Formato.GEOJSON_PUNTOS),
            new OpenDataSource("cargadores-ve", "CARGADOR_VEHICULO_ELECTRICO", "Cargador de vehículo eléctrico",
                    "/recursos/urbanismoEInfraestructura/equipamientos/da_cve-4326.geojson", Formato.GEOJSON_PUNTOS),
            // Tráfico
            new OpenDataSource("semaforos-acusticos", "SEMAFORO", "Semáforo acústico",
                    "/recursos/transporte/trafico/da_semaforosAcusticos-4326.geojson", Formato.GEOJSON_PUNTOS),
            new OpenDataSource("camaras-trafico", "CAMARA_TRAFICO", "Cámara de tráfico",
                    "/recursos/transporte/trafico/da_camarasTrafico-4326.geojson", Formato.GEOJSON_PUNTOS),
            new OpenDataSource("paneles-mensajes", "PANEL_MENSAJES", "Panel de mensajes variables",
                    "/recursos/transporte/trafico/da_panelesMensajesVariables-4326.geojson", Formato.GEOJSON_PUNTOS),
            new OpenDataSource("foto-rojo", "FOTO_ROJO", "Cámara foto-rojo",
                    "/recursos/transporte/trafico/da_transporteFotoRojo-4326.geojson", Formato.GEOJSON_PUNTOS),
            // Seguridad y salud
            new OpenDataSource("desfibriladores", "DESFIBRILADOR", "Desfibrilador",
                    "/dataset/a455c822-e695-4fc4-abc9-b18f50a59a3a/resource/467c375a-8a74-40d7-a765-d5d160e13fe3/download/da_desfibriladores-4326.geojson",
                    Formato.GEOJSON_PUNTOS),
            new OpenDataSource("hidrantes", "HIDRANTE", "Hidrante",
                    "/recursos/urbanismoEInfraestructura/equipamientos/da_hidrantes-4326.geojson", Formato.GEOJSON_PUNTOS),
            new OpenDataSource("fuentes-agua", "FUENTE_AGUA", "Fuente de agua potable",
                    "/recursos/ambiente/fuentesaguapotable/da_medioAmbiente_fuentes-4326.geojson", Formato.GEOJSON_PUNTOS),
            // Residuos
            new OpenDataSource("contenedores-rsu", "CONTENEDOR_RSU", "Contenedor de residuos urbanos",
                    "/recursos/ambiente/limasa/da_rsu-4326.geojson", Formato.GEOJSON_PUNTOS),
            new OpenDataSource("contenedores-envases", "CONTENEDOR_ENVASES", "Contenedor de envases",
                    "/recursos/ambiente/limasa/da_envases-4326.geojson", Formato.GEOJSON_PUNTOS),
            new OpenDataSource("contenedores-papel", "CONTENEDOR_PAPEL", "Contenedor de papel y cartón",
                    "/recursos/ambiente/limasa/da_papelCarton-4326.geojson", Formato.GEOJSON_PUNTOS),
            new OpenDataSource("contenedores-vidrio", "CONTENEDOR_VIDRIO", "Contenedor de vidrio",
                    "/recursos/ambiente/contenedores/da_amb_contenedoresvidrio-4326.geojson", Formato.GEOJSON_PUNTOS),
            new OpenDataSource("contenedores-ropa", "CONTENEDOR_ROPA", "Contenedor de ropa",
                    "/recursos/ambiente/contenedores/da_medioAmbiente_contenedoresRopa-4326.geojson", Formato.GEOJSON_PUNTOS),
            new OpenDataSource("contenedores-aceite", "CONTENEDOR_ACEITE", "Contenedor de aceite",
                    "/recursos/ambiente/contenedores/da_medioAmbiente_contenedoresAceite-4326.geojson", Formato.GEOJSON_PUNTOS),
            new OpenDataSource("contenedores-pilas", "CONTENEDOR_PILAS", "Contenedor de pilas",
                    "/recursos/ambiente/contenedores/da_medioAmbiente_contenedoresPilas-4326.geojson", Formato.GEOJSON_PUNTOS),
            // Ocio y deporte al aire libre
            new OpenDataSource("zonas-musculacion", "ZONA_MUSCULACION", "Zona de musculación",
                    "/recursos/deportes/equipamientos/da_deportesZonasMusculacion-4326.geojson", Formato.GEOJSON_PUNTOS),
            new OpenDataSource("parques-caninos", "PARQUE_CANINO", "Parque canino",
                    "/recursos/ambiente/parquesCaninos/da_parquesCaninos-4326.geojson", Formato.GEOJSON_PUNTOS)
    );

    private OpenDataCatalog() {
    }
}
