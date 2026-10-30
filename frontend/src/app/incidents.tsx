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
    if (selectedId) {
      fetchDetail(selectedId);
    } else {
      fetchIncidents();
    }
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
        ) : (
          // =================== VISTA LISTADO ===================
          <IncidentListView
            incidents={incidents}
            loading={loadingList}
            error={errorList}
            isDark={isDark}
            onSelectIncident={handleSelectIncident}
            onRetry={fetchIncidents}
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
}

function IncidentListView({
  incidents,
  loading,
  error,
  isDark,
  onSelectIncident,
  onRetry,
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

      {/* Barra de acciones: Botón Crear Incidencia (solo visual) + Refrescar */}
      <View style={styles.actionsBar}>
        <Pressable
          style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}
          onPress={() => {
            // Botón visual sin funcionalidad por ahora
          }}>
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
          <ThemedText type="default">No hay incidencias registradas en este momento.</ThemedText>
        </ThemedView>
      )}

      {/* Tarjetas de incidencias */}
      {!loading && !error && incidents.length > 0 && (
        <View style={styles.listContainer}>
          {incidents.map((inc) => {
            const statusColors = getStatusBadgeColor(inc.estado, isDark);
            const priorityColors = getPriorityBadgeColor(inc.prioridad, isDark);

            return (
              <Pressable
                key={inc.id}
                style={({ pressed }) => [
                  styles.cardPressable,
                  pressed && styles.pressed,
                ]}
                onPress={() => onSelectIncident(inc.id)}>
                <ThemedView type="backgroundElement" style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.idBadge}>
                      <ThemedText type="smallBold" style={styles.idBadgeText}>
                        #{inc.id}
                      </ThemedText>
                    </View>

                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: statusColors.bg,
                            borderColor: statusColors.border,
                          },
                        ]}>
                        <ThemedText
                          type="smallBold"
                          style={{ color: statusColors.text, fontSize: 12 }}>
                          {inc.estado}
                        </ThemedText>
                      </View>

                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: priorityColors.bg,
                            borderColor: priorityColors.border,
                          },
                        ]}>
                        <ThemedText
                          type="smallBold"
                          style={{ color: priorityColors.text, fontSize: 12 }}>
                          {inc.prioridad}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  <ThemedText type="default" style={styles.reporteTitle}>
                    {inc.reporteCentral}
                  </ThemedText>

                  <View style={styles.cardFooter}>
                    {inc.localizacion ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        📍 {inc.localizacion}
                      </ThemedText>
                    ) : null}

                    {inc.urbanAssetTipo ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        🏙️ Activo: {inc.urbanAssetTipo}
                      </ThemedText>
                    ) : null}
                  </View>

                  <View style={styles.cardCta}>
                    <ThemedText type="linkPrimary" style={styles.ctaText}>
                      Ver detalle de atributos →
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
                Reporte Central:
              </ThemedText>
              <ThemedText type="default" style={styles.attributeValue}>
                {incident.reporteCentral}
              </ThemedText>
            </View>

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

            <View style={styles.attributeRow}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.attributeLabel}>
                Localización:
              </ThemedText>
              <ThemedText type="default" style={styles.attributeValue}>
                {incident.localizacion ? `📍 ${incident.localizacion}` : 'No especificada'}
              </ThemedText>
            </View>

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
                {incident.historial.map((item, idx) => (
                  <View key={item.id ?? idx} style={styles.timelineItem}>
                    <View style={styles.timelineMarker}>
                      <View style={styles.timelineDot} />
                      {idx < (incident.historial?.length ?? 0) - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <ThemedText type="smallBold">
                        {item.transicion}
                      </ThemedText>
                      {item.motivo && (
                        <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 2 }}>
                          Motivo: {item.motivo}
                        </ThemedText>
                      )}
                      <ThemedText type="code" style={{ marginTop: 4, color: '#888' }}>
                        Por: {item.actorNombre || `Actor #${item.actorId}`} • {formatDate(item.instante)}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyHistory}>
                <ThemedText type="small" themeColor="textSecondary">
                  Sin transiciones de estado registradas aún en el sistema.
                </ThemedText>
              </View>
            )}
          </ThemedView>
        </View>
      )}
    </View>
  );
}

// -------------------------------------------------------------
// Helpers de estilos y formateo
// -------------------------------------------------------------
function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Fecha no disponible';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function getStatusBadgeColor(estado: string, isDark: boolean) {
  const norm = (estado || '').toLowerCase();
  if (norm.includes('abiert')) {
    return { bg: isDark ? '#3b2505' : '#fef3c7', text: '#b45309', border: '#f59e0b' };
  }
  if (norm.includes('revis')) {
    return { bg: isDark ? '#0c2847' : '#e0f2fe', text: '#0369a1', border: '#38bdf8' };
  }
  if (norm.includes('resuelt') || norm.includes('cerrad')) {
    return { bg: isDark ? '#06301d' : '#dcfce7', text: '#15803d', border: '#22c55e' };
  }
  return { bg: isDark ? '#262626' : '#f3f4f6', text: '#4b5563', border: '#9ca3af' };
}

function getPriorityBadgeColor(prioridad: string, isDark: boolean) {
  const norm = (prioridad || '').toLowerCase();
  if (norm.includes('alta') || norm.includes('urgente')) {
    return { bg: isDark ? '#3c1414' : '#fee2e2', text: '#b91c1c', border: '#f87171' };
  }
  if (norm.includes('media')) {
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
