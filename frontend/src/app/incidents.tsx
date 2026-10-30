import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreateIncidentForm } from '@/components/create-incident-form';
import IncidentMapView from '@/components/IncidentMapView';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  getIncidentById,
  getIncidents,
  Incident,
} from '@/services/incidentService';

export default function IncidentsScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ id?: string }>();
  const selectedId = searchParams.id ? Number(searchParams.id) : null;

  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isDark = theme.background === '#000000';

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
    router.push('/incidents');
  };

  const handleIncidentCreated = async () => {
    setCreatingIncident(false);
    setCreationSuccess(true);
    await fetchIncidents();
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top + Spacing.two,
      paddingLeft: insets.left + Spacing.two,
      paddingRight: insets.right + Spacing.two,
      paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
    },
    web: {
      paddingTop: Spacing.four,
      paddingBottom: BottomTabInset + Spacing.six,
      paddingHorizontal: Spacing.three,
    },
    default: {
      paddingTop: insets.top + Spacing.two,
      paddingBottom: insets.bottom + BottomTabInset + Spacing.three,
      paddingHorizontal: Spacing.three,
    },
  });

  return (
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
            isDark={isDark}
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
            isDark={isDark}
            onSelectIncident={handleSelectIncident}
            onRetry={fetchIncidents}
            onCreate={() => {
              setCreationSuccess(false);
              setCreatingIncident(true);
            }}
            creationSuccess={creationSuccess}
          />
        )}
      </View>
    </ScrollView>
  );
}

// -------------------------------------------------------------
// Componente de Listado de Incidencias
// -------------------------------------------------------------
interface ListViewProps {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  isDark: boolean;
  onSelectIncident: (id: number) => void;
  onRetry: () => void;
  onCreate: () => void;
  creationSuccess: boolean;
}

function IncidentListView({
  incidents,
  loading,
  error,
  isDark,
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
          <ActivityIndicator size="large" color="#3c87f7" />
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
            const statusColors = getStatusBadgeColor(incident.estado, isDark);
            const priorityColors = getPriorityBadgeColor(incident.prioridad, isDark);

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
// Función para inferir o parsear coordenadas de la localización
// -------------------------------------------------------------
function parseIncidentCoordinates(locationStr?: string | null): { latitude: number; longitude: number } | null {
  if (!locationStr) return null;

  // 1. Extraer coordenadas numéricas directas "lat, lng"
  const coordMatches = locationStr.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (coordMatches) {
    const lat = parseFloat(coordMatches[1]);
    const lng = parseFloat(coordMatches[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  // 2. Diccionario de ubicaciones de Málaga (para los datos del schema y data.sql)
  const locLower = locationStr.toLowerCase();
  if (locLower.includes('larios')) return { latitude: 36.7202, longitude: -4.4214 };
  if (locLower.includes('huelin') || locLower.includes('echeverr')) return { latitude: 36.7024, longitude: -4.4375 };
  if (locLower.includes('pasteur') || locLower.includes('teatinos')) return { latitude: 36.7165, longitude: -4.4721 };
  if (locLower.includes('plutarco')) return { latitude: 36.7185, longitude: -4.4690 };
  if (locLower.includes('mesonero')) return { latitude: 36.7178, longitude: -4.4710 };
  if (locLower.includes('picasso') || locLower.includes('malagueta')) return { latitude: 36.7207, longitude: -4.3985 };
  if (locLower.includes('melilla')) return { latitude: 36.7170, longitude: -4.4080 };
  if (locLower.includes('merced')) return { latitude: 36.7235, longitude: -4.4178 };
  if (locLower.includes('hilera') || locLower.includes('cruz de humilladero')) return { latitude: 36.7180, longitude: -4.4295 };
  if (locLower.includes('carlos haya')) return { latitude: 36.7240, longitude: -4.4450 };
  if (locLower.includes('especer')) return { latitude: 36.7212, longitude: -4.4225 };
  if (locLower.includes('parque') && locLower.includes('paseo')) return { latitude: 36.7188, longitude: -4.4165 };
  if (locLower.includes('carreter')) return { latitude: 36.7242, longitude: -4.4230 };
  if (locLower.includes('parque del oeste') || locLower.includes('realenga')) return { latitude: 36.6965, longitude: -4.4445 };
  if (locLower.includes('antonio banderas')) return { latitude: 36.6980, longitude: -4.4360 };
  if (locLower.includes('alameda')) return { latitude: 36.7175, longitude: -4.4228 };
  if (locLower.includes('cervantes') || locLower.includes('puerta oscura')) return { latitude: 36.7215, longitude: -4.4140 };
  if (locLower.includes('salitre') || locLower.includes('cuarteles') || locLower.includes('perchel')) {
    if (locLower.includes('cuarteles')) return { latitude: 36.7135, longitude: -4.4270 };
    return { latitude: 36.7125, longitude: -4.4285 };
  }
  if (locLower.includes('elcano') || locLower.includes('el palo')) return { latitude: 36.7200, longitude: -4.3640 };

  return { latitude: 36.721274, longitude: -4.421399 };
}

// -------------------------------------------------------------
// Componente de Detalle de Incidencia
// -------------------------------------------------------------
interface DetailViewProps {
  id: number;
  incident: Incident | null;
  loading: boolean;
  error: string | null;
  isDark: boolean;
  onBack: () => void;
  onRetry: () => void;
}

function IncidentDetailView({
  id,
  incident,
  loading,
  error,
  isDark,
  onBack,
  onRetry,
}: DetailViewProps) {
  const statusColors = incident ? getStatusBadgeColor(incident.estado, isDark) : null;
  const priorityColors = incident ? getPriorityBadgeColor(incident.prioridad, isDark) : null;
  const coords = incident ? parseIncidentCoordinates(incident.localizacion) : null;

  return (
    <View style={styles.wrapper}>
      {/* Botón Volver */}
      <Pressable style={({ pressed }) => [styles.backButton, pressed && styles.pressed]} onPress={onBack}>
        <ThemedText type="linkPrimary" style={styles.backButtonText}>
          ← Volver al listado de incidencias
        </ThemedText>
      </Pressable>

      {/* Título de la vista */}
      <View style={styles.detailHeader}>
        <ThemedText type="subtitle">Detalle de Incidencia #{id}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Consulta de atributos por identificador
        </ThemedText>
      </View>

      {/* Estado de carga */}
      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3c87f7" />
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

            {/* Localización escrita */}
            <View style={styles.attributeRow}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.attributeLabel}>
                Localización escrita:
              </ThemedText>
              <ThemedText type="default" style={styles.attributeValue}>
                {incident.localizacion ? `📍 ${incident.localizacion}` : 'No especificada'}
              </ThemedText>
            </View>

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

function getStatusBadgeColor(status: string, isDark: boolean) {
  const norm = status?.toLowerCase() || '';
  if (norm.includes('resuelt') || norm.includes('cerrad')) {
    return { bg: isDark ? '#143022' : '#dcfce7', text: '#15803d', border: '#4ade80' };
  }
  if (norm.includes('revis') || norm.includes('proceso') || norm.includes('curso')) {
    return { bg: isDark ? '#1e293b' : '#e0f2fe', text: '#0284c7', border: '#38bdf8' };
  }
  return { bg: isDark ? '#3b1d1d' : '#fee2e2', text: '#dc2626', border: '#f87171' };
}

function getPriorityBadgeColor(priority: string, isDark: boolean) {
  const norm = priority?.toLowerCase() || '';
  if (norm.includes('alt') || norm.includes('urgente')) {
    return { bg: isDark ? '#3b1d1d' : '#fee2e2', text: '#dc2626', border: '#f87171' };
  }
  if (norm.includes('med')) {
    return { bg: isDark ? '#35290a' : '#fef9c3', text: '#a16207', border: '#facc15' };
  }
  return { bg: isDark ? '#143022' : '#dcfce7', text: '#15803d', border: '#4ade80' };
}

const styles = StyleSheet.create({
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
    backgroundColor: '#16a34a',
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
    backgroundColor: '#3c87f7',
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
    backgroundColor: '#3c87f7',
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
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  detailHeader: {
    gap: Spacing.half,
    paddingHorizontal: Spacing.two,
    marginBottom: Spacing.two,
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
    color: '#3c87f7',
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
    backgroundColor: 'rgba(60, 135, 247, 0.1)',
    borderColor: '#3c87f7',
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
    backgroundColor: '#3c87f7',
    marginTop: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#3c87f7',
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
