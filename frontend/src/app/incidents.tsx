import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreateIncidentForm } from '@/components/create-incident-form';
import IncidentMapView from '@/components/IncidentMapView';
import IncidentsMap from '@/components/incidents-map';
import type { MapIncident } from '@/components/incidents-map.types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, FloatingMenuInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useIsWideLayout } from '@/hooks/use-layout';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import {
  getIncidentById,
  getIncidents,
  Incident,
} from '@/services/incidentService';

export default function IncidentsScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ id?: string; vista?: string; crear?: string }>();
  const { status: authStatus } = useAuth();
  const selectedId = searchParams.id ? Number(searchParams.id) : null;
  // Vista principal: mapa por defecto; ?vista=lista muestra el listado
  const showList = searchParams.vista === 'lista';

  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isWide = useIsWideLayout();

  // Estados para la lista
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [errorList, setErrorList] = useState<string | null>(null);

  // Estados para el detalle
  const [incidentDetail, setIncidentDetail] = useState<Incident | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [creatingIncident, setCreatingIncident] = useState(false);
  const [creationSuccess, setCreationSuccess] = useState(false);

  const fetchIncidents = async () => {
    setLoadingList(true);
    setErrorList(null);
    try {
      const data = await getIncidents();
      setIncidents(data);
    } catch (err: any) {
      setErrorList(err.message || 'No se pudieron cargar las incidencias.');
    } finally {
      setLoadingList(false);
    }
  };

  const fetchDetail = async (id: number) => {
    setLoadingDetail(true);
    setErrorDetail(null);
    try {
      const data = await getIncidentById(id);
      setIncidentDetail(data);
    } catch (err: any) {
      setErrorDetail(err.message || `No se pudo obtener el detalle de la incidencia #${id}`);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => {
      if (selectedId) {
        return fetchDetail(selectedId);
      }
      return fetchIncidents();
    });
  }, [selectedId]);

  const handleSelectIncident = (id: number) => {
    router.push({
      pathname: '/incidents',
      params: { id: id.toString() },
    });
  };

  const handleBackToList = () => {
    setIncidentDetail(null);
    setErrorDetail(null);
    // Vuelve a la vista desde la que se abrió (mapa o lista)
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/incidents');
    }
  };

  const toggleView = () => {
    router.setParams({ vista: showList ? undefined : 'lista' });
  };

  // Crear incidencias exige sesión (RF01): sin ella se va al login y, al entrar, se abre el formulario
  const startCreating = () => {
    if (authStatus !== 'signedIn') {
      router.push({ pathname: '/login', params: { destino: 'crear' } });
      return;
    }
    setCreationSuccess(false);
    setCreatingIncident(true);
  };

  // Vuelta del login con ?crear=1: abrir el formulario directamente
  const openCreateFromLogin = searchParams.crear === '1' && authStatus === 'signedIn';
  useEffect(() => {
    if (!openCreateFromLogin) return;
    router.setParams({ crear: undefined });
    void Promise.resolve().then(() => {
      setCreationSuccess(false);
      setCreatingIncident(true);
    });
  }, [openCreateFromLogin, router]);

  const handleIncidentCreated = async () => {
    setCreatingIncident(false);
    setCreationSuccess(true);
    await fetchIncidents();
  };

  // En pantallas estrechas se deja sitio al botón de menú flotante (arriba a la izquierda)
  const contentPlatformStyle = {
    paddingTop: isWide ? Spacing.four : insets.top + FloatingMenuInset,
    paddingBottom: insets.bottom + Spacing.five,
    paddingLeft: insets.left + Spacing.three,
    paddingRight: insets.right + Spacing.three,
  };

  // =================== VISTA MAPA (principal) ===================
  if (!selectedId && !creatingIncident && !showList) {
    const mapIncidents: MapIncident[] = incidents
      .filter((i) => i.latitud != null && i.longitud != null)
      .map((i) => ({
        id: i.id,
        titulo: i.titulo || i.reporteCentral,
        localizacion: i.localizacion,
        estado: i.estado,
        latitud: Number(i.latitud),
        longitud: Number(i.longitud),
      }));

    return (
      <View style={[styles.mapScreen, { backgroundColor: theme.background }]}>
        <IncidentsMap incidents={mapIncidents} onOpenIncident={handleSelectIncident} />

        {(loadingList || errorList || creationSuccess) && (
          <View
            style={[styles.mapBanner, { top: insets.top + (isWide ? Spacing.three : FloatingMenuInset) }]}
            pointerEvents="box-none">
            <ThemedView type="background" style={[styles.mapBannerBox, { borderColor: theme.border }]}>
              {loadingList ? (
                <ThemedText type="small">Cargando incidencias…</ThemedText>
              ) : errorList ? (
                <>
                  <ThemedText type="small" style={styles.errorTitle}>
                    No se pudieron cargar las incidencias.
                  </ThemedText>
                  <Pressable onPress={fetchIncidents} accessibilityRole="button">
                    <ThemedText type="smallBold" style={{ color: theme.primary }}>
                      Reintentar
                    </ThemedText>
                  </Pressable>
                </>
              ) : (
                <ThemedText type="smallBold" style={styles.successText}>
                  Incidencia registrada.
                </ThemedText>
              )}
            </ThemedView>
          </View>
        )}

        <ViewToggle showList={false} onToggle={toggleView} top={insets.top + Spacing.three} />

        <Pressable
          onPress={startCreating}
          accessibilityRole="button"
          accessibilityLabel="Crear incidencia"
          style={({ pressed }) => [
            styles.fab,
            { bottom: insets.bottom + Spacing.four, right: insets.right + Spacing.three },
            pressed && styles.pressed,
          ]}>
          <ThemedText style={styles.fabIcon}>+</ThemedText>
          {isWide && <ThemedText style={styles.fabLabel}>Crear incidencia</ThemedText>}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.mapScreen}>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        <View style={styles.maxContainer}>
          {selectedId ? (
            // =================== VISTA DETALLE ===================
            <IncidentDetailView
              id={selectedId}
              incident={incidentDetail}
              loading={loadingDetail}
              error={errorDetail}
              onBack={handleBackToList}
              onRetry={() => fetchDetail(selectedId)}
            />
          ) : creatingIncident ? (
            <CreateIncidentForm
              onCancel={() => setCreatingIncident(false)}
              onCreated={handleIncidentCreated}
            />
          ) : (
            // =================== VISTA LISTADO ===================
            <IncidentListView
              incidents={incidents}
              loading={loadingList}
              error={errorList}
              onSelectIncident={handleSelectIncident}
              onRetry={fetchIncidents}
              onCreate={startCreating}
              creationSuccess={creationSuccess}
            />
          )}
        </View>
      </ScrollView>
      {showList && !selectedId && !creatingIncident && (
        <ViewToggle showList onToggle={toggleView} top={insets.top + Spacing.three} />
      )}
    </View>
  );
}

// -------------------------------------------------------------
// Botón flotante (arriba a la derecha) para cambiar entre mapa y lista
// -------------------------------------------------------------
function ViewToggle({ showList, onToggle, top }: { showList: boolean; onToggle: () => void; top: number }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={showList ? 'Ver el mapa de incidencias' : 'Ver la lista de incidencias'}
      style={({ pressed }) => [
        styles.viewToggle,
        { top, backgroundColor: theme.background, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="smallBold" style={{ color: theme.primary }}>
        {showList ? 'Ver mapa' : 'Ver lista'}
      </ThemedText>
    </Pressable>
  );
}

// -------------------------------------------------------------
// Componente de Listado de Incidencias
// -------------------------------------------------------------
interface ListViewProps {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  onSelectIncident: (id: number) => void;
  onRetry: () => void;
  onCreate: () => void;
  creationSuccess: boolean;
}

function IncidentListView({
  incidents,
  loading,
  error,
  onSelectIncident,
  onRetry,
  onCreate,
  creationSuccess,
}: ListViewProps) {
  return (
    <View style={styles.wrapper}>
      {/* Encabezado */}
      <View style={styles.header}>
        <ThemedText type="subtitle">Listado de Incidencias</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Selecciona una incidencia para consultar sus atributos en detalle.
        </ThemedText>
      </View>

      {creationSuccess ? (
        <ThemedView type="backgroundElement" style={styles.successBox}>
          <ThemedText type="smallBold" style={styles.successText}>
            Incidencia registrada correctamente.
          </ThemedText>
        </ThemedView>
      ) : null}

      <View style={styles.actionsBar}>
        <Pressable
          style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}
          onPress={onCreate}>
          <ThemedText type="smallBold" style={styles.createButtonText}>
            ➕ Crear Incidencia
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}
          onPress={onRetry}
          disabled={loading}>
          <ThemedText type="smallBold" style={styles.refreshButtonText}>
            🔄 Actualizar lista
          </ThemedText>
        </Pressable>
      </View>

      {/* Estado de Carga */}
      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Brand.blue} />
          <ThemedText type="small" style={{ marginTop: Spacing.two }}>
            Cargando incidencias...
          </ThemedText>
        </View>
      )}

      {/* Estado de Error */}
      {!loading && error && (
        <ThemedView type="backgroundElement" style={styles.errorBox}>
          <ThemedText type="default" style={styles.errorTitle}>
            ⚠️ Error de conexión
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.errorText}>
            {error}
          </ThemedText>
          <Pressable style={styles.retryButton} onPress={onRetry}>
            <ThemedText type="smallBold" style={styles.retryButtonText}>
              Reintentar
            </ThemedText>
          </Pressable>
        </ThemedView>
      )}

      {/* Lista vacía */}
      {!loading && !error && incidents.length === 0 && (
        <ThemedView type="backgroundElement" style={styles.emptyBox}>
          <ThemedText type="default">No hay incidencias registradas.</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
            Crea una nueva incidencia con el botón superior.
          </ThemedText>
        </ThemedView>
      )}

      {/* Lista de Tarjetas */}
      {!loading && !error && incidents.length > 0 && (
        <View style={styles.listContainer}>
          {incidents.map((incident) => {
            const statusColors = getStatusBadgeColor(incident.estado);
            const priorityColors = getPriorityBadgeColor(incident.prioridad);

            return (
              <Pressable
                key={incident.id}
                style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]}
                onPress={() => onSelectIncident(incident.id)}>
                <ThemedView type="backgroundElement" style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.idBadge}>
                      <ThemedText type="smallBold" style={styles.idBadgeText}>
                        #{incident.id}
                      </ThemedText>
                    </View>
                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: priorityColors.bg,
                            borderColor: priorityColors.border,
                          },
                        ]}>
                        <ThemedText type="smallBold" style={{ color: priorityColors.text }}>
                          {incident.prioridad}
                        </ThemedText>
                      </View>
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: statusColors.bg,
                            borderColor: statusColors.border,
                          },
                        ]}>
                        <ThemedText type="smallBold" style={{ color: statusColors.text }}>
                          {incident.estado}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  <ThemedText type="default" style={styles.reporteTitle} numberOfLines={2}>
                    {incident.titulo || incident.reporteCentral}
                  </ThemedText>

                  {incident.descripcion && incident.titulo ? (
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                      {incident.descripcion}
                    </ThemedText>
                  ) : null}

                  <View style={styles.cardFooter}>
                    {incident.localizacion ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        📍 {incident.localizacion}
                      </ThemedText>
                    ) : null}
                    {incident.urbanAssetTipo ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        🏛️ {incident.urbanAssetTipo}
                      </ThemedText>
                    ) : null}
                    {incident.createdAt ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        📅 {formatDate(incident.createdAt)}
                      </ThemedText>
                    ) : null}
                  </View>

                  <View style={styles.cardCta}>
                    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.ctaText}>
                      Ver detalle completo →
                    </ThemedText>
                  </View>
                </ThemedView>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

// -------------------------------------------------------------
// Coordenadas de la incidencia (RF04): las devuelve la API como latitud/longitud
// -------------------------------------------------------------
function getIncidentCoordinates(incident: Incident): { latitude: number; longitude: number } | null {
  if (incident.latitud == null || incident.longitud == null) return null;
  return { latitude: Number(incident.latitud), longitude: Number(incident.longitud) };
}

// -------------------------------------------------------------
// Componente de Detalle de Incidencia
// -------------------------------------------------------------
interface DetailViewProps {
  id: number;
  incident: Incident | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onRetry: () => void;
}

function IncidentDetailView({
  id,
  incident,
  loading,
  error,
  onBack,
  onRetry,
}: DetailViewProps) {
  const statusColors = incident ? getStatusBadgeColor(incident.estado) : null;
  const priorityColors = incident ? getPriorityBadgeColor(incident.prioridad) : null;
  const coords = incident ? getIncidentCoordinates(incident) : null;

  return (
    <View style={styles.wrapper}>
      {/* Cabecera con botón para volver al listado */}
      <View style={styles.detailHeaderRow}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Volver al listado de incidencias"
          hitSlop={8}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <ThemedText style={styles.backButtonIcon}>←</ThemedText>
        </Pressable>
        <View style={styles.detailHeader}>
          <ThemedText type="subtitle">Detalle de Incidencia #{id}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Consulta de atributos por identificador
          </ThemedText>
        </View>
      </View>

      {/* Estado de carga */}
      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Brand.blue} />
          <ThemedText type="small" style={{ marginTop: Spacing.two }}>
            Obteniendo detalle de la incidencia #{id}...
          </ThemedText>
        </View>
      )}

      {/* Estado de error */}
      {!loading && error && (
        <ThemedView type="backgroundElement" style={styles.errorBox}>
          <ThemedText type="default" style={styles.errorTitle}>
            ⚠️ Error en la consulta
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.errorText}>
            {error}
          </ThemedText>
          <Pressable style={styles.retryButton} onPress={onRetry}>
            <ThemedText type="smallBold" style={styles.retryButtonText}>
              Reintentar consulta
            </ThemedText>
          </Pressable>
        </ThemedView>
      )}

      {/* Detalle de atributos */}
      {!loading && !error && incident && (
        <View style={styles.detailContainer}>
          {/* Tarjeta 1: Información Principal */}
          <ThemedView type="backgroundElement" style={styles.detailCard}>
            <ThemedText type="smallBold" style={styles.cardSectionTitle}>
              📌 INFORMACIÓN GENERAL
            </ThemedText>

            <View style={styles.attributeRow}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.attributeLabel}>
                Identificador (ID):
              </ThemedText>
              <ThemedText type="default" style={styles.attributeValue}>
                #{incident.id}
              </ThemedText>
            </View>

            <View style={styles.attributeRow}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.attributeLabel}>
                Título:
              </ThemedText>
              <ThemedText type="default" style={styles.attributeValue}>
                {incident.titulo || incident.reporteCentral}
              </ThemedText>
            </View>

            <View style={styles.attributeRow}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.attributeLabel}>
                Descripción:
              </ThemedText>
              <ThemedText type="default" style={styles.attributeValue}>
                {incident.descripcion || incident.reporteCentral}
              </ThemedText>
            </View>

            {incident.categoria ? (
              <View style={styles.attributeRow}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.attributeLabel}>
                  Categoría:
                </ThemedText>
                <ThemedText type="default" style={styles.attributeValue}>
                  {incident.categoria}
                </ThemedText>
              </View>
            ) : null}

            <View style={styles.attributeRow}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.attributeLabel}>
                Estado:
              </ThemedText>
              {statusColors && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: statusColors.bg,
                      borderColor: statusColors.border,
                      alignSelf: 'flex-start',
                    },
                  ]}>
                  <ThemedText type="smallBold" style={{ color: statusColors.text }}>
                    {incident.estado}
                  </ThemedText>
                </View>
              )}
            </View>

            <View style={styles.attributeRow}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.attributeLabel}>
                Prioridad:
              </ThemedText>
              {priorityColors && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: priorityColors.bg,
                      borderColor: priorityColors.border,
                      alignSelf: 'flex-start',
                    },
                  ]}>
                  <ThemedText type="smallBold" style={{ color: priorityColors.text }}>
                    {incident.prioridad}
                  </ThemedText>
                </View>
              )}
            </View>
          </ThemedView>

          {/* Tarjeta 2: Ubicación y Activo Urbano */}
          <ThemedView type="backgroundElement" style={styles.detailCard}>
            <ThemedText type="smallBold" style={styles.cardSectionTitle}>
              🏙️ UBICACIÓN Y ACTIVO URBANO
            </ThemedText>

            {/* Dirección escrita (opcional) */}
            {incident.localizacion ? (
              <View style={styles.attributeRow}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.attributeLabel}>
                  Dirección:
                </ThemedText>
                <ThemedText type="default" style={styles.attributeValue}>
                  📍 {incident.localizacion}
                </ThemedText>
              </View>
            ) : null}

            {!coords && (
              <ThemedText type="small" themeColor="textSecondary">
                Esta incidencia no tiene ubicación registrada.
              </ThemedText>
            )}

            {coords && (
              <View style={styles.attributeRow}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.attributeLabel}>
                  Coordenadas geográficas:
                </ThemedText>
                <ThemedText type="small" style={styles.attributeValue}>
                  Latitud: {coords.latitude.toFixed(6)} | Longitud: {coords.longitude.toFixed(6)}
                </ThemedText>
              </View>
            )}

            {/* Mapa de la incidencia con marcador sobre OpenStreetMap (Leaflet / Nativo) */}
            {coords && (
              <View style={styles.detailMapWrapper}>
                <View style={styles.detailMapContainer}>
                  <IncidentMapView
                    key={`detail-map-${incident.id}`}
                    initialRegion={{
                      latitude: coords.latitude,
                      longitude: coords.longitude,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    }}
                    region={{
                      latitude: coords.latitude,
                      longitude: coords.longitude,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    }}
                    selectedCoordinate={coords}
                  />
                </View>
                <ThemedText type="small" themeColor="textSecondary" style={styles.mapHintText}>
                  📍 Ubicación de la incidencia marcada en el mapa
                </ThemedText>
              </View>
            )}

            <View style={styles.attributeRow}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.attributeLabel}>
                Activo Urbano Asociado:
              </ThemedText>
              <ThemedText type="default" style={styles.attributeValue}>
                {incident.urbanAssetTipo
                  ? `${incident.urbanAssetTipo} (ID: ${incident.urbanAssetId})`
                  : 'Ninguno asignado'}
              </ThemedText>
            </View>
          </ThemedView>

          {/* Tarjeta 3: Creador y Registro */}
          <ThemedView type="backgroundElement" style={styles.detailCard}>
            <ThemedText type="smallBold" style={styles.cardSectionTitle}>
              👤 AUTORÍA Y REGISTRO
            </ThemedText>

            <View style={styles.attributeRow}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.attributeLabel}>
                Usuario Creador:
              </ThemedText>
              <ThemedText type="default" style={styles.attributeValue}>
                {incident.nombreCreador || `Usuario ID #${incident.idCreador}`}
                {incident.correoCreador ? ` (${incident.correoCreador})` : ''}
              </ThemedText>
            </View>

            <View style={styles.attributeRow}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.attributeLabel}>
                Fecha de Creación:
              </ThemedText>
              <ThemedText type="default" style={styles.attributeValue}>
                {formatDate(incident.createdAt)}
              </ThemedText>
            </View>
          </ThemedView>

          {/* Tarjeta 4: SEGUIMIENTO E HISTORIAL */}
          <ThemedView type="backgroundElement" style={styles.detailCard}>
            <ThemedText type="smallBold" style={styles.cardSectionTitle}>
              🕒 SEGUIMIENTO E HISTORIAL DE AUDITORÍA
            </ThemedText>

            <View style={styles.historyNotice}>
              <ThemedText type="small" style={styles.historyNoticeText}>
                ℹ️ El seguimiento de estados y el historial de cambios estarán disponibles próximamente.
              </ThemedText>
            </View>

            {incident.historial && incident.historial.length > 0 ? (
              <View style={styles.timelineList}>
                {incident.historial.map((change, index) => (
                  <View key={change.id || index} style={styles.timelineItem}>
                    <View style={styles.timelineMarker}>
                      <View style={styles.timelineDot} />
                      {index < (incident.historial?.length || 0) - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <ThemedText type="smallBold">{change.transicion}</ThemedText>
                      {change.motivo ? (
                        <ThemedText type="small" themeColor="textSecondary">
                          Motivo: {change.motivo}
                        </ThemedText>
                      ) : null}
                      <ThemedText type="small" themeColor="textSecondary">
                        Actor: {change.actorNombre || `Usuario #${change.actorId}`} •{' '}
                        {formatDate(change.instante)}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyHistory}>
                No hay transiciones de estado registradas todavía.
              </ThemedText>
            )}
          </ThemedView>
        </View>
      )}
    </View>
  );
}

// -------------------------------------------------------------
// Funciones de Ayuda de Estilos
// -------------------------------------------------------------
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'Fecha no disponible';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateStr;
  }
}

function getStatusBadgeColor(status: string) {
  const norm = status?.toLowerCase() || '';
  if (norm.includes('resuelt') || norm.includes('cerrad')) {
    return { bg: '#dcfce7', text: '#15803d', border: '#4ade80' };
  }
  if (norm.includes('revis') || norm.includes('proceso') || norm.includes('curso')) {
    return { bg: '#e0f2fe', text: '#0284c7', border: '#38bdf8' };
  }
  return { bg: '#fee2e2', text: '#dc2626', border: '#f87171' };
}

function getPriorityBadgeColor(priority: string) {
  const norm = priority?.toLowerCase() || '';
  if (norm.includes('alt') || norm.includes('urgente')) {
    return { bg: '#fee2e2', text: '#dc2626', border: '#f87171' };
  }
  if (norm.includes('med')) {
    return { bg: '#fef9c3', text: '#a16207', border: '#facc15' };
  }
  return { bg: '#dcfce7', text: '#15803d', border: '#4ade80' };
}

const styles = StyleSheet.create({
  mapScreen: {
    flex: 1,
  },
  mapBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  mapBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  viewToggle: {
    position: 'absolute',
    right: Spacing.three,
    height: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  fab: {
    position: 'absolute',
    minWidth: 56,
    height: 56,
    borderRadius: 28,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Brand.orange,
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  fabIcon: {
    color: Brand.white,
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '500',
  },
  fabLabel: {
    color: Brand.white,
    fontSize: 15,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    flexDirection: 'column',
  },
  maxContainer: {
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  wrapper: {
    width: '100%',
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    flexWrap: 'wrap',
  },
  createButton: {
    backgroundColor: Brand.orange,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
  },
  refreshButton: {
    backgroundColor: Brand.blue,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#ffffff',
  },
  centerContainer: {
    padding: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    gap: Spacing.two,
    marginHorizontal: Spacing.two,
  },
  errorTitle: {
    color: '#ef4444',
    fontWeight: '700',
  },
  errorText: {
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    backgroundColor: '#ef4444',
    borderRadius: Spacing.two,
  },
  retryButtonText: {
    color: '#ffffff',
  },
  emptyBox: {
    padding: Spacing.six,
    borderRadius: Spacing.three,
    alignItems: 'center',
    marginHorizontal: Spacing.two,
  },
  successBox: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    marginHorizontal: Spacing.two,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  successText: {
    color: '#15803d',
  },
  listContainer: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  cardPressable: {
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.75,
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idBadge: {
    backgroundColor: Brand.blue,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.two,
  },
  idBadgeText: {
    color: '#ffffff',
    fontSize: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.five,
  },
  reporteTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: Spacing.half,
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  cardCta: {
    marginTop: Spacing.two,
    alignItems: 'flex-end',
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.two,
    marginBottom: Spacing.two,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonIcon: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
  },
  detailHeader: {
    flex: 1,
    gap: Spacing.half,
  },
  detailContainer: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.two,
  },
  detailCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  cardSectionTitle: {
    letterSpacing: 0.8,
    color: Brand.blue,
    marginBottom: Spacing.one,
  },
  attributeRow: {
    gap: 4,
  },
  attributeLabel: {
    fontSize: 13,
  },
  attributeValue: {
    fontSize: 16,
    lineHeight: 22,
  },
  detailMapWrapper: {
    marginVertical: Spacing.two,
    gap: Spacing.one,
  },
  detailMapContainer: {
    height: 240,
    borderRadius: Spacing.two,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  mapHintText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  historyNotice: {
    backgroundColor: 'rgba(16, 79, 133, 0.1)',
    borderColor: Brand.blue,
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  historyNoticeText: {
    lineHeight: 18,
  },
  timelineList: {
    marginTop: Spacing.two,
    gap: Spacing.three,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  timelineMarker: {
    alignItems: 'center',
    width: 16,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Brand.blue,
    marginTop: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: Brand.blue,
    opacity: 0.4,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: Spacing.two,
  },
  emptyHistory: {
    paddingVertical: Spacing.two,
  },
});
