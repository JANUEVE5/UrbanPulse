import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
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
  IncidentPriority,
  addIncidentComment,
  updateIncidentPriority,
  updateIncidentStatus,
} from '@/services/incidentService';

export default function IncidentsScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ id?: string; vista?: string; crear?: string }>();
  const { status: authStatus, user } = useAuth();
  const selectedId = searchParams.id ? Number(searchParams.id) : null;
  // Vista principal: mapa por defecto; ?vista=lista muestra el listado
  const showList = searchParams.vista === 'lista';

  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const isWide = useIsWideLayout();

  // Estados para la lista
  const [incidentList, setIncidentList] = useState<{ userId: number; incidents: Incident[] } | null>(null);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [listError, setListError] = useState<{ userId: number; message: string } | null>(null);
  const listRequestId = useRef(0);
  const incidents =
    incidentList && incidentList.userId === user?.id ? incidentList.incidents : [];
  const errorList =
    authStatus === 'signedOut'
      ? 'Inicia sesión para consultar tus incidencias.'
      : listError && listError.userId === user?.id
        ? listError.message
        : null;
  const isLoadingList = authStatus === 'loading' || (authStatus === 'signedIn' && loadingList);

  // Estados para el detalle
  const [incidentDetail, setIncidentDetail] = useState<Incident | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [creatingIncident, setCreatingIncident] = useState(false);
  const [creationSuccess, setCreationSuccess] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  const fetchIncidents = useCallback(async () => {
    if (authStatus !== 'signedIn' || user === null) return;
    const requestId = ++listRequestId.current;
    setLoadingList(true);
    setListError(null);
    try {
      const data = await getIncidents();
      if (requestId === listRequestId.current) {
        setIncidentList({ userId: user.id, incidents: data });
      }
    } catch (err: any) {
      if (requestId === listRequestId.current) {
        setListError({
          userId: user.id,
          message: err.message || 'No se pudieron cargar las incidencias.',
        });
      }
    } finally {
      if (requestId === listRequestId.current) setLoadingList(false);
    }
  }, [authStatus, user]);

  const fetchDetail = useCallback(async (id: number) => {
    setLoadingDetail(true);
    setErrorDetail(null);
    setStatusError(null);
    try {
      const data = await getIncidentById(id);
      setIncidentDetail(data);
    } catch (err: any) {
      setErrorDetail(err.message || `No se pudo obtener el detalle de la incidencia #${id}`);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === 'loading') return;
    if (authStatus === 'signedOut') {
      listRequestId.current += 1;
      return;
    }
    void Promise.resolve().then(() => {
      if (selectedId) {
        return fetchDetail(selectedId);
      }
      return fetchIncidents();
    });
  }, [selectedId, authStatus, fetchDetail, fetchIncidents]);

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

  const handleStatusTransition = async (id: number, estado: string, motivo: string) => {
    setUpdatingStatus(true);
    setStatusError(null);
    try {
      setIncidentDetail(await updateIncidentStatus(id, {
        estado,
        ...(motivo.trim() ? { motivo: motivo.trim() } : {}),
      }));
    } catch (err: unknown) {
      setStatusError(err instanceof Error ? err.message : 'No se pudo actualizar el estado.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePriorityChange = async (id: number, prioridad: IncidentPriority) => {
    setUpdatingPriority(true);
    setStatusError(null);
    try {
      setIncidentDetail(await updateIncidentPriority(id, { prioridad }));
    } catch (err: unknown) {
      setStatusError(err instanceof Error ? err.message : 'No se pudo actualizar la prioridad.');
    } finally {
      setUpdatingPriority(false);
    }
  };

  const handleAddComment = async (id: number, contenido: string): Promise<boolean> => {
    setPostingComment(true);
    setStatusError(null);
    try {
      setIncidentDetail(await addIncidentComment(id, contenido));
      return true;
    } catch (err: unknown) {
      setStatusError(err instanceof Error ? err.message : 'No se pudo añadir el comentario.');
      return false;
    } finally {
      setPostingComment(false);
    }
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

        {(isLoadingList || errorList || creationSuccess) && (
          <View
            style={[styles.mapBanner, { top: insets.top + (isWide ? Spacing.three : FloatingMenuInset) }]}
            pointerEvents="box-none">
            <ThemedView type="background" style={[styles.mapBannerBox, { borderColor: theme.border }]}>
              {isLoadingList ? (
                <ThemedText type="small">Cargando incidencias…</ThemedText>
              ) : errorList ? (
                <>
                  <ThemedText type="small" style={styles.errorTitle}>
                    {authStatus === 'signedOut'
                      ? 'Inicia sesión para consultar tus incidencias.'
                      : 'No se pudieron cargar las incidencias.'}
                  </ThemedText>
                  {authStatus !== 'signedOut' && (
                    <Pressable onPress={fetchIncidents} accessibilityRole="button">
                      <ThemedText type="smallBold" style={{ color: theme.primary }}>
                        Reintentar
                      </ThemedText>
                    </Pressable>
                  )}
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
              onTransition={(estado, motivo) => handleStatusTransition(selectedId, estado, motivo)}
              onPriorityChange={(prioridad) => handlePriorityChange(selectedId, prioridad)}
              onAddComment={(contenido) => handleAddComment(selectedId, contenido)}
              updatingStatus={updatingStatus}
              updatingPriority={updatingPriority}
              postingComment={postingComment}
              statusError={statusError}
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
              loading={isLoadingList}
              error={errorList}
              onSelectIncident={handleSelectIncident}
              onRetry={fetchIncidents}
              onCreate={startCreating}
              creationSuccess={creationSuccess}
              signedOut={authStatus === 'signedOut'}
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
  signedOut: boolean;
}

function IncidentListView({
  incidents,
  loading,
  error,
  onSelectIncident,
  onRetry,
  onCreate,
  creationSuccess,
  signedOut,
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
            {signedOut ? 'Inicia sesión' : '⚠️ Error de conexión'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.errorText}>
            {error}
          </ThemedText>
          {!signedOut && (
            <Pressable style={styles.retryButton} onPress={onRetry}>
              <ThemedText type="smallBold" style={styles.retryButtonText}>
                Reintentar
              </ThemedText>
            </Pressable>
          )}
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
  onTransition: (estado: string, motivo: string) => void;
  onPriorityChange: (prioridad: IncidentPriority) => void;
  onAddComment: (contenido: string) => Promise<boolean>;
  updatingStatus: boolean;
  updatingPriority: boolean;
  postingComment: boolean;
  statusError: string | null;
}

function IncidentDetailView({
  id,
  incident,
  loading,
  error,
  onBack,
  onRetry,
  onTransition,
  onPriorityChange,
  onAddComment,
  updatingStatus,
  updatingPriority,
  postingComment,
  statusError,
}: DetailViewProps) {
  const theme = useTheme();
  const { user } = useAuth();
  const canManageStatus = user !== null && ['OPERATOR', 'TECHNICIAN', 'ADMIN'].includes(user.rol);
  const canManagePriority = user !== null && ['OPERATOR', 'ADMIN'].includes(user.rol);
  const [motivo, setMotivo] = useState('');
  const [commentText, setCommentText] = useState('');
  const statusColors = incident ? getStatusBadgeColor(incident.estado) : null;
  const priorityColors = incident ? getPriorityBadgeColor(incident.prioridad) : null;
  const nextStatuses = incident ? getNextIncidentStatuses(incident.estado) : [];
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
              {canManagePriority ? <View style={styles.priorityOptions}>
                {(['Baja', 'Media', 'Alta'] as const).map((priority) => (
                  <Pressable
                    key={priority}
                    accessibilityRole="button"
                    accessibilityState={{ selected: incident.prioridad === priority }}
                    disabled={updatingPriority}
                    onPress={() => onPriorityChange(priority)}
                    style={({ pressed }) => [
                      styles.priorityOption,
                      incident.prioridad === priority && styles.priorityOptionSelected,
                      pressed && styles.pressed,
                      updatingPriority && styles.disabledButton,
                    ]}>
                    <ThemedText
                      type="smallBold"
                      style={incident.prioridad === priority ? styles.priorityOptionSelectedText : undefined}>
                      {priority}
                    </ThemedText>
                  </Pressable>
                ))}
              </View> : null}
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

            {canManageStatus && nextStatuses.length > 0 ? (
              <View style={styles.transitionControls}>
                <ThemedText type="smallBold">Cambiar estado</ThemedText>
                <TextInput
                  accessibilityLabel="Motivo del cambio de estado; obligatorio para rechazar o reabrir"
                  value={motivo}
                  onChangeText={setMotivo}
                  placeholder="Motivo (obligatorio para rechazar o reabrir)"
                  placeholderTextColor={theme.textSecondary}
                  maxLength={400}
                  style={[
                    styles.transitionInput,
                    { color: theme.text, borderColor: theme.backgroundSelected },
                  ]}
                />
                <View style={styles.transitionActions}>
                  {nextStatuses.map((nextStatus) => {
                    const reasonRequired = ['Rechazada', 'Reabierta'].includes(nextStatus);
                    const canSubmit = !reasonRequired || motivo.trim().length > 0;
                    const actionLabel = nextStatus === 'Rechazada'
                      ? 'Rechazar incidencia'
                      : nextStatus === 'Reabierta'
                        ? 'Reabrir incidencia'
                        : `Marcar como ${nextStatus}`;
                    return (
                    <Pressable
                      key={nextStatus}
                      accessibilityRole="button"
                      disabled={updatingStatus || !canSubmit}
                      onPress={() => onTransition(nextStatus, motivo)}
                      style={({ pressed }) => [
                        styles.transitionButton,
                        pressed && styles.pressed,
                        (updatingStatus || !canSubmit) && styles.disabledButton,
                      ]}>
                      {updatingStatus ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <ThemedText type="smallBold" style={styles.transitionButtonText}>
                          {actionLabel}
                        </ThemedText>
                      )}
                    </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : canManageStatus ? (
              <ThemedText type="small" themeColor="textSecondary">
                La incidencia está en su estado final.
              </ThemedText>
            ) : null}

            {statusError ? (
              <ThemedView style={styles.statusErrorBox}>
                <ThemedText type="small" style={styles.statusErrorText}>
                  {statusError}
                </ThemedText>
              </ThemedView>
            ) : null}

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

          <ThemedView type="backgroundElement" style={styles.detailCard}>
            <ThemedText type="smallBold" style={styles.cardSectionTitle}>
              💬 COMENTARIOS
            </ThemedText>
            {user ? (
              <>
                <TextInput
                  accessibilityLabel="Nuevo comentario"
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Escribe un comentario..."
                  placeholderTextColor={theme.textSecondary}
                  maxLength={400}
                  multiline
                  textAlignVertical="top"
                  style={[
                    styles.transitionInput,
                    styles.commentInput,
                    { color: theme.text, borderColor: theme.backgroundSelected },
                  ]}
                />
                <View style={styles.commentSubmitRow}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {commentText.length}/400
                  </ThemedText>
                  <Pressable
                    accessibilityRole="button"
                    disabled={postingComment || !commentText.trim()}
                    onPress={() => {
                      void onAddComment(commentText).then((added) => {
                        if (added) setCommentText('');
                      });
                    }}
                    style={({ pressed }) => [
                      styles.transitionButton,
                      pressed && styles.pressed,
                      (postingComment || !commentText.trim()) && styles.disabledButton,
                    ]}>
                    {postingComment ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <ThemedText type="smallBold" style={styles.transitionButtonText}>
                        Añadir comentario
                      </ThemedText>
                    )}
                  </Pressable>
                </View>
              </>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                Inicia sesión para añadir un comentario.
              </ThemedText>
            )}
            {incident.comentarios && incident.comentarios.length > 0 ? (
              <View style={styles.commentsList}>
                {incident.comentarios.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <ThemedText type="small">{comment.contenido}</ThemedText>
                    <ThemedText type="code" style={styles.commentMetadata}>
                      Por: {comment.actorNombre || `Usuario #${comment.actorId}`} • {formatDate(comment.createdAt)}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                Todavía no hay comentarios en esta incidencia.
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
  if (norm.includes('rechaz')) {
    return { bg: '#fee2e2', text: '#b91c1c', border: '#f87171' };
  }
  if (norm.includes('reabiert')) {
    return { bg: '#fef3c7', text: '#b45309', border: '#fbbf24' };
  }
  if (norm.includes('resuelt') || norm.includes('cerrad')) {
    return { bg: '#dcfce7', text: '#15803d', border: '#4ade80' };
  }
  if (norm.includes('revis') || norm.includes('proceso') || norm.includes('curso')) {
    return { bg: '#e0f2fe', text: '#0284c7', border: '#38bdf8' };
  }
  return { bg: '#fee2e2', text: '#dc2626', border: '#f87171' };
}

function getNextIncidentStatuses(estado: string): string[] {
  switch (estado) {
    case 'Abierta':
      return ['En revisión'];
    case 'En revisión':
      return ['Resuelta', 'Rechazada'];
    case 'Resuelta':
      return ['Cerrada', 'Reabierta'];
    case 'Cerrada':
      return ['Reabierta'];
    case 'Reabierta':
      return ['En revisión'];
    default:
      return [];
  }
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
  transitionControls: {
    gap: Spacing.two,
  },
  transitionInput: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
    backgroundColor: 'transparent',
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
  commentInput: {
    minHeight: 88,
  },
  commentSubmitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  commentsList: {
    gap: Spacing.two,
  },
  commentItem: {
    padding: Spacing.three,
    gap: Spacing.one,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(60, 135, 247, 0.08)',
  },
  commentMetadata: {
    color: '#888',
  },
  transitionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  transitionButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#3c87f7',
  },
  transitionButtonText: {
    color: '#ffffff',
  },
  disabledButton: {
    opacity: 0.6,
  },
  priorityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  priorityOption: {
    minHeight: 38,
    minWidth: 76,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    borderWidth: 1,
    borderColor: '#9ca3af',
    borderRadius: Spacing.two,
  },
  priorityOptionSelected: {
    backgroundColor: '#3c87f7',
    borderColor: '#3c87f7',
  },
  priorityOptionSelectedText: {
    color: '#ffffff',
  },
  statusErrorBox: {
    padding: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: '#fee2e2',
  },
  statusErrorText: {
    color: '#b91c1c',
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
