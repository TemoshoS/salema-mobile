import { api } from "@/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

type IncidentStatus =
  | "new"
  | "acknowledged"
  | "responding"
  | "resolved";

type TravelMode = "driving" | "walking";

interface Incident {
  _id: string;

  userId?: {
    _id: string;
    fullName: string;
    email?: string;
    phoneNumber?: string;
  };

  latitude?: number;
  longitude?: number;
  locationUrl?: string;

  message: string;

  triggerType?: "button" | "shake" | "voice";

  securityCompany?: {
    id: string;
    name: string;
    phone?: string;
  };

  incidentStatus: IncidentStatus;

  createdAt: string;

  assignedOfficer?: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    rank?: string;
    status?: string;
  };
}

export default function OfficerIncidents() {
  const router = useRouter();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const GOOGLE_MAPS_API_KEY =
    "AIzaSyBW2I1gsUDE__pkSV6h4YYmskxnWgR5y-E";

  const [hasArrived, setHasArrived] = useState(false);

  const arrivedIncidentRef = useRef<string | null>(null);

  const mapRefs = useRef<Record<string, MapView | null>>({});
  const [officerLocation, setOfficerLocation] =
    useState<Location.LocationObjectCoords | null>(null);

  const [routeCoordinates, setRouteCoordinates] =
    useState<{ latitude: number; longitude: number }[]>([]);

  const [distance, setDistance] = useState<string | null>(null);

  const [duration, setDuration] = useState<string | null>(null);

  const [navigationStarted, setNavigationStarted] = useState(false);
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);

  const [travelMode, setTravelMode] =
    useState<TravelMode>("driving");


    const calculateDistance = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ) => {
      const R = 6371e3;
    
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
    
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    
      const a =
        Math.sin(Δφ / 2) *
          Math.sin(Δφ / 2) +
        Math.cos(φ1) *
          Math.cos(φ2) *
          Math.sin(Δλ / 2) *
          Math.sin(Δλ / 2);
    
      const c =
        2 *
        Math.atan2(
          Math.sqrt(a),
          Math.sqrt(1 - a)
        );
    
      return R * c;
    };

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Location Permission",
          "Location permission is required to show your position."
        );

        return;
      }

      const location =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      setOfficerLocation(location.coords);

      subscription =
        await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10,
            timeInterval: 5000,
          },
          (location) => {
            setOfficerLocation(location.coords);
          }
        );
    };

    startTracking();

    return () => {
      subscription?.remove();
    };
  }, []);



  //=================================
  // Officer route tracking
  //=================================
  const getRoute = async (
    incident: Incident,
    officer: Location.LocationObjectCoords,
    mode: TravelMode = "driving"
  ) => {
    if (
      incident.latitude === undefined ||
      incident.longitude === undefined
    ) {
      return;
    }

    try {
      const origin =
        `${officer.latitude},${officer.longitude}`;

      const destination =
        `${incident.latitude},${incident.longitude}`;

      const url =
        `https://maps.googleapis.com/maps/api/directions/json` +
        `?origin=${origin}` +
        `&destination=${destination}` +
        `&mode=${mode}` +
        `&key=${GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(url);

      const data = await response.json();

      if (
        data.status !== "OK" ||
        !data.routes?.length
      ) {
        console.log("DIRECTIONS ERROR:", data);
        return;
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      setDistance(
        leg.distance?.text || null
      );

      setDuration(
        leg.duration?.text || null
      );

      const points = decodePolyline(
        route.overview_polyline.points
      );

      setRouteCoordinates(points);

    } catch (error) {
      console.error(
        "GET ROUTE ERROR:",
        error
      );
    }
  };


  const decodePolyline = (
    encoded: string
  ) => {
    const coordinates: {
      latitude: number;
      longitude: number;
    }[] = [];

    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;

      let byte;

      do {
        byte =
          encoded.charCodeAt(index++) -
          63;

        result |=
          (byte & 0x1f) <<
          shift;

        shift += 5;
      } while (byte >= 0x20);

      const deltaLat =
        result & 1
          ? ~(result >> 1)
          : result >> 1;

      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        byte =
          encoded.charCodeAt(index++) -
          63;

        result |=
          (byte & 0x1f) <<
          shift;

        shift += 5;
      } while (byte >= 0x20);

      const deltaLng =
        result & 1
          ? ~(result >> 1)
          : result >> 1;

      lng += deltaLng;

      coordinates.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return coordinates;
  };

  useEffect(() => {
    if (
      !navigationStarted ||
      !activeIncidentId ||
      !officerLocation
    ) {
      return;
    }

    const activeIncident = incidents.find(
      (incident) => incident._id === activeIncidentId
    );

    if (!activeIncident) {
      return;
    }

    getRoute(
      activeIncident,
      officerLocation,
      travelMode
    );

    mapRefs.current[activeIncidentId]?.animateCamera(
      {
        center: {
          latitude: officerLocation.latitude,
          longitude: officerLocation.longitude,
        },
        zoom: 16,
      },
      {
        duration: 800,
      }
    );
  }, [
    officerLocation,
    navigationStarted,
    activeIncidentId,
    incidents,
    travelMode,
  ]);

  // ==========================================
  // GET OFFICER TOKEN
  // ==========================================

  const getOfficerToken = async () => {
    const token = await AsyncStorage.getItem("officerToken");

    return token;
  };

  // ==========================================
  // LOAD INCIDENTS
  // ==========================================

  const loadIncidents = useCallback(async () => {
    try {
      const token = await getOfficerToken();

      if (!token) {
        Alert.alert(
          "Session expired",
          "Please login again.",
          [
            {
              text: "Login",
              onPress: () =>
                router.replace(
                  "/security-company/officers/officer-login"
                ),
            },
          ]
        );

        return;
      }

      const response = await api.get(
        "/alerts/officer",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIncidents(response.data.alerts || []);
    } catch (error: any) {
      console.error(
        "LOAD OFFICER INCIDENTS ERROR:",
        error?.response?.data || error.message
      );

      if (error?.response?.status === 401) {
        await AsyncStorage.removeItem(
          "officerToken"
        );

        router.replace("/security-company/officers/officer-login");

        return;
      }

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
        "Failed to load incidents."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  // ==========================================
  // REFRESH
  // ==========================================

  const handleRefresh = () => {
    setRefreshing(true);
    loadIncidents();
  };

  // ==========================================
  // UPDATE INCIDENT STATUS
  // ==========================================

  const updateStatus = async (
    alertId: string,
    status: IncidentStatus
  ) => {
    try {
      setUpdatingId(alertId);

      const token = await getOfficerToken();

      if (!token) {
        router.replace("/security-company/officers/officer-login");
        return;
      }

      await api.patch(
        `/alerts/${alertId}/status`,
        {
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update UI immediately
      setIncidents((previous) =>
        previous.map((incident) =>
          incident._id === alertId
            ? {
              ...incident,
              incidentStatus: status,
            }
            : incident
        )
      );
    } catch (error: any) {
      console.error(
        "UPDATE INCIDENT STATUS ERROR:",
        error?.response?.data || error.message
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
        "Failed to update incident status."
      );
    } finally {
      setUpdatingId(null);
    }
  };
  useEffect(() => {
    if (
      !navigationStarted ||
      !activeIncidentId ||
      !officerLocation
    ) {
      return;
    }
  
    const activeIncident = incidents.find(
      (incident) =>
        incident._id === activeIncidentId
    );
  
    if (
      !activeIncident ||
      activeIncident.latitude === undefined ||
      activeIncident.longitude === undefined
    ) {
      return;
    }
  
    const distanceToIncident =
      calculateDistance(
        officerLocation.latitude,
        officerLocation.longitude,
        activeIncident.latitude,
        activeIncident.longitude
      );
  
    console.log(
      "DISTANCE TO INCIDENT:",
      Math.round(distanceToIncident),
      "meters"
    );
  
    // Officer has arrived
    if (
      distanceToIncident <= 50 &&
      arrivedIncidentRef.current !== activeIncidentId
    ) {
      arrivedIncidentRef.current =
        activeIncidentId;
  
      setHasArrived(true);
  
      // Stop navigation
      setNavigationStarted(false);
  
      setRouteCoordinates([]);
      setDistance(null);
      setDuration(null);
  
      // Voice announcement
      Speech.stop();
  
      Speech.speak(
        "You have arrived at the emergency incident.",
        {
          language: "en-ZA",
          rate: 0.9,
          pitch: 1.0,
        }
      );
  
      // Update incident status
      if (
        activeIncident.incidentStatus !==
        "responding"
      ) {
        updateStatus(
          activeIncident._id,
          "responding"
        );
      }
  
      Alert.alert(
        "You have arrived",
        "You are now at the emergency incident.",
        [
          {
            text: "OK",
          },
        ]
      );
    }
  }, [
    officerLocation,
    navigationStarted,
    activeIncidentId,
    incidents,
  ]);

  // ==========================================
  // CONFIRM STATUS CHANGE
  // ==========================================

  const confirmStatusChange = (
    incident: Incident,
    status: IncidentStatus
  ) => {
    const labels: Record<IncidentStatus, string> = {
      new: "New",
      acknowledged: "Acknowledged",
      responding: "Responding",
      resolved: "Resolved",
    };

    Alert.alert(
      "Update Incident",
      `Change incident status to "${labels[status]}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: () =>
            updateStatus(incident._id, status),
        },
      ]
    );
  };


  // ==========================================
  // CALL USER
  // ==========================================

  const callUser = async (phone?: string) => {
    if (!phone) {
      Alert.alert(
        "Phone unavailable",
        "The user's phone number is not available."
      );

      return;
    }

    try {
      await Linking.openURL(`tel:${phone}`);
    } catch (error) {
      Alert.alert(
        "Error",
        "Unable to make the phone call."
      );
    }
  };

  // ==========================================
  // STATUS COLOR
  // ==========================================

  const getStatusStyle = (
    status: IncidentStatus
  ) => {
    switch (status) {
      case "new":
        return styles.statusNew;

      case "acknowledged":
        return styles.statusAcknowledged;

      case "responding":
        return styles.statusResponding;

      case "resolved":
        return styles.statusResolved;

      default:
        return styles.statusNew;
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  // ==========================================
  // INCIDENT CARD
  // ==========================================

  const renderIncident = ({
    item,
  }: {
    item: Incident;
  }) => {
    const userName =
      item.userId?.fullName || "Unknown User";

    const phoneNumber =
      item.userId?.phoneNumber;

    const isUpdating =
      updatingId === item._id;

    const startNavigation = (
      incident: Incident,
      mode: TravelMode = "driving"
    ) => {
      if (
        incident.latitude === undefined ||
        incident.longitude === undefined
      ) {
        Alert.alert(
          "Location unavailable",
          "Incident location is not available."
        );

        return;
      }

      if (!officerLocation) {
        Alert.alert(
          "Location unavailable",
          "Your current location is not available yet."
        );

        return;
      }
      setHasArrived(false);
      arrivedIncidentRef.current = null;

      setActiveIncidentId(incident._id);
      setNavigationStarted(true);
      setTravelMode(mode);

      getRoute(
        incident,
        officerLocation,
        mode
      );

      setTimeout(() => {
        mapRefs.current[incident._id]?.fitToCoordinates(
          [
            {
              latitude: officerLocation.latitude,
              longitude: officerLocation.longitude,
            },
            {
              latitude: incident.latitude!,
              longitude: incident.longitude!,
            },
          ],
          {
            edgePadding: {
              top: 100,
              right: 50,
              bottom: 180,
              left: 50,
            },
            animated: true,
          }
        );
      }, 300);
    };

    return (
      <View style={styles.card}>


        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.incidentTitle}>
              🚨 Emergency Incident
            </Text>

            <Text style={styles.date}>
              {formatDate(item.createdAt)}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              getStatusStyle(item.incidentStatus),
            ]}
          >
            <Text style={styles.statusText}>
              {item.incidentStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* USER */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Person in Need
          </Text>

          <Text style={styles.userName}>
            {userName}
          </Text>

          {phoneNumber && (
            <Text style={styles.info}>
              📞 {phoneNumber}
            </Text>
          )}

          {item.userId?.email && (
            <Text style={styles.info}>
              ✉️ {item.userId.email}
            </Text>
          )}
        </View>

        {/* MESSAGE */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Incident
          </Text>

          <Text style={styles.message}>
            {item.message}
          </Text>
        </View>

        {/* LOCATION */}

        {item.latitude !== undefined &&
          item.longitude !== undefined && (
            <View style={styles.mapContainer}>

              {/* =========================
          MAP
      ========================= */}

              <MapView
                key={`map-${item._id}`}
                ref={(ref) => {
                  mapRefs.current[item._id] = ref;
                }}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                  latitude: item.latitude,
                  longitude: item.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={true}
                rotateEnabled={true}
                pitchEnabled={true}
                zoomEnabled={true}
              >

                {/* OFFICER LOCATION */}

                {officerLocation && (
                  <Marker
                    key={`officer-${item._id}`}
                    coordinate={{
                      latitude: officerLocation.latitude,
                      longitude: officerLocation.longitude,
                    }}
                    title="Your Location"
                    description="Security Officer"
                    pinColor="#06391F"
                  />
                )}

                {/* INCIDENT LOCATION */}

                <Marker
                  key={`incident-${item._id}`}
                  coordinate={{
                    latitude: item.latitude,
                    longitude: item.longitude,
                  }}
                  title="Emergency Incident"
                  description={userName}
                  pinColor="#D32F2F"
                />

                {/* ROUTE */}

                {activeIncidentId === item._id &&
                  navigationStarted &&
                  routeCoordinates.length > 0 && (
                    <Polyline
                      coordinates={routeCoordinates}
                      strokeWidth={6}
                     strokeColor="#1976D2"
                      lineCap="round"
                      lineJoin="round"
                    />
                  )}

              </MapView>

              {/* =========================
          NAVIGATION HEADER
          IMPORTANT: OUTSIDE MAPVIEW
      ========================= */}

              {activeIncidentId === item._id &&
                navigationStarted && (
                  <View style={styles.navigationTopBar}>

                    <View style={{ flex: 1 }}>

                      <Text style={styles.navigationTitle}>
                        {travelMode === "driving"
                          ? "🚗 Driving Navigation"
                          : "🚶 Walking Navigation"}
                      </Text>

                      <Text style={styles.navigationSubtitle}>
                        {travelMode === "driving"
                          ? "Driving route to emergency incident"
                          : "Walking route to emergency incident"}
                      </Text>

                    </View>

                    <View style={styles.modeButtons}>

                      {/* DRIVE */}

                      <Pressable
                        style={[
                          styles.modeButton,
                          travelMode === "driving" &&
                          styles.modeButtonActive,
                        ]}
                        onPress={() => {

                          setTravelMode("driving");

                          if (officerLocation) {
                            getRoute(
                              item,
                              officerLocation,
                              "driving"
                            );
                          }

                        }}
                      >
                        <Text style={styles.modeButtonText}>
                          🚗
                        </Text>
                      </Pressable>

                      {/* WALK */}

                      <Pressable
                        style={[
                          styles.modeButton,
                          travelMode === "walking" &&
                          styles.modeButtonActive,
                        ]}
                        onPress={() => {

                          setTravelMode("walking");

                          if (officerLocation) {
                            getRoute(
                              item,
                              officerLocation,
                              "walking"
                            );
                          }

                        }}
                      >
                        <Text style={styles.modeButtonText}>
                          🚶
                        </Text>
                      </Pressable>

                      {/* STOP */}

                      <Pressable
                        style={styles.stopNavigationButton}
                        onPress={() => {

                          setNavigationStarted(false);
                          setActiveIncidentId(null);
                          setRouteCoordinates([]);
                          setDistance(null);
                          setDuration(null);

                        }}
                      >
                        <Text style={styles.stopNavigationText}>
                          Stop
                        </Text>
                      </Pressable>

                    </View>

                  </View>
                )}

              {/* =========================
          DISTANCE / ETA
      ========================= */}

              {activeIncidentId === item._id &&
                navigationStarted && (
                  <View style={styles.routeInfo}>

                    <View style={styles.routeItem}>

                      <Text style={styles.routeLabel}>
                        DISTANCE
                      </Text>

                      <Text style={styles.routeValue}>
                        {distance || "--"}
                      </Text>

                    </View>

                    <View style={styles.routeDivider} />

                    <View style={styles.routeItem}>

                      <Text style={styles.routeLabel}>
                        ETA
                      </Text>

                      <Text style={styles.routeValue}>
                        {duration || "--"}
                      </Text>

                    </View>

                  </View>
                )}

              {/* =========================
          DRIVE / WALK OPTIONS
      ========================= */}

              {activeIncidentId !== item._id && (
                <View style={styles.navigationOptions}>

                  <Pressable
                    style={[
                      styles.navigationOption,
                      styles.drivingOption,
                    ]}
                    onPress={() =>
                      startNavigation(item, "driving")
                    }
                  >
                    <Text style={styles.navigationOptionText}>
                      🚗 Drive
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.navigationOption,
                      styles.walkingOption,
                    ]}
                    onPress={() =>
                      startNavigation(item, "walking")
                    }
                  >
                    <Text style={styles.navigationOptionText}>
                      🚶 Walk
                    </Text>
                  </Pressable>

                </View>
              )}
{hasArrived &&
  activeIncidentId === item._id && (
    <View style={styles.arrivalBanner}>
      <Text style={styles.arrivalIcon}>
        🚨
      </Text>

      <View style={{ flex: 1 }}>
        <Text style={styles.arrivalTitle}>
          You have arrived
        </Text>

        <Text style={styles.arrivalSubtitle}>
          You are at the emergency location.
        </Text>
      </View>
    </View>
  )}
            </View>
          )}


        {/* CALL */}

        {phoneNumber && (
          <Pressable
            style={styles.callButton}
            onPress={() => callUser(phoneNumber)}
          >
            <Text style={styles.callButtonText}>
              📞 Call User
            </Text>
          </Pressable>
        )}

        {/* STATUS ACTIONS */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Update Incident
          </Text>

          <View style={styles.statusActions}>
            <Pressable
              disabled={isUpdating}
              style={[
                styles.actionButton,
                styles.acknowledgeButton,
              ]}
              onPress={() =>
                confirmStatusChange(
                  item,
                  "acknowledged"
                )
              }
            >
              <Text style={styles.actionText}>
                Acknowledge
              </Text>
            </Pressable>

            <Pressable
              disabled={isUpdating}
              style={[
                styles.actionButton,
                styles.respondingButton,
              ]}
              onPress={() =>
                confirmStatusChange(
                  item,
                  "responding"
                )
              }
            >
              <Text style={styles.actionText}>
                Responding
              </Text>
            </Pressable>

            <Pressable
              disabled={isUpdating}
              style={[
                styles.actionButton,
                styles.resolvedButton,
              ]}
              onPress={() =>
                confirmStatusChange(
                  item,
                  "resolved"
                )
              }
            >
              <Text style={styles.actionText}>
                Resolved
              </Text>
            </Pressable>
          </View>

          {isUpdating && (
            <ActivityIndicator
              size="small"
              style={styles.updatingLoader}
            />
          )}
        </View>
      </View>
    );
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#0A5B31"
          />

          <Text style={styles.loadingText}>
            Loading incidents...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // SCREEN
  // ==========================================

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}


      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            My Incidents
          </Text>

          <Text style={styles.headerSubtitle}>
            Incidents assigned to you
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {incidents.length}
          </Text>
        </View>
      </View>

      {/* INCIDENTS */}

      <FlatList
        data={incidents}
        keyExtractor={(item) => item._id}
        renderItem={renderIncident}
        contentContainerStyle={
          incidents.length === 0
            ? styles.emptyContainer
            : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>
              🛡️
            </Text>

            <Text style={styles.emptyTitle}>
              No Incidents Assigned
            </Text>

            <Text style={styles.emptyText}>
              You currently have no incidents assigned
              to you.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F6",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  backButtonText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "600",
    marginTop: -3,
  },

  headerTextContainer: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#555",
    fontSize: 15,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: "#06391F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
    fontSize: 14,
  },

  countBadge: {
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFC107",
    alignItems: "center",
    justifyContent: "center",
  },

  countText: {
    color: "#111",
    fontSize: 17,
    fontWeight: "800",
  },

  list: {
    padding: 16,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7E6",
    elevation: 3,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },

  incidentTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#17201B",
  },

  date: {
    marginTop: 5,
    color: "#777",
    fontSize: 12,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },

  statusNew: {
    backgroundColor: "#FFE5E5",
  },

  statusAcknowledged: {
    backgroundColor: "#FFF1C7",
  },

  statusResponding: {
    backgroundColor: "#DDEBFF",
  },

  statusResolved: {
    backgroundColor: "#DDF6E7",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#222",
  },

  section: {
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#777",
    marginBottom: 7,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#17201B",
  },

  info: {
    marginTop: 5,
    color: "#555",
    fontSize: 14,
  },

  message: {
    color: "#333",
    fontSize: 15,
    lineHeight: 22,
  },
  mapContainer: {
    height: 420,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
  },

  map: {
    flex: 1,
  },
  locationButton: {
    backgroundColor: "#06391F",
    paddingVertical: 14,
    borderRadius: 13,
    alignItems: "center",
    marginBottom: 10,
  },

  locationButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  callButton: {
    backgroundColor: "#E8F5EC",
    paddingVertical: 14,
    borderRadius: 13,
    alignItems: "center",
    marginBottom: 18,
  },

  callButtonText: {
    color: "#0A5B31",
    fontSize: 15,
    fontWeight: "700",
  },

  statusActions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },

  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
  },

  acknowledgeButton: {
    backgroundColor: "#FFF1C7",
  },

  respondingButton: {
    backgroundColor: "#DDEBFF",
  },

  resolvedButton: {
    backgroundColor: "#DDF6E7",
  },

  actionText: {
    color: "#222",
    fontSize: 12,
    fontWeight: "800",
  },

  updatingLoader: {
    marginTop: 12,
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 30,
  },

  empty: {
    alignItems: "center",
  },

  emptyIcon: {
    fontSize: 55,
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#17201B",
    marginBottom: 8,
  },

  emptyText: {
    color: "#777",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },




  mapPin: {
    width: 42,
    height: 50,
    alignItems: "center",
    justifyContent: "flex-start",
  },

  officerPin: {
    width: 38,
    height: 38,
    borderRadius: 20,
    borderBottomRightRadius: 5,
    backgroundColor: "#06391F",
    borderWidth: 3,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "45deg" }],
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  incidentPin: {
    width: 38,
    height: 38,
    borderRadius: 20,
    borderBottomRightRadius: 5,
    backgroundColor: "#D32F2F",
    borderWidth: 3,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "45deg" }],
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  pinIcon: {
    fontSize: 17,
    transform: [{ rotate: "-45deg" }],
  },

  routeInfo: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },

  routeItem: {
    flex: 1,
    alignItems: "center",
  },

  routeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#777",
    marginBottom: 3,
  },

  routeValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#06391F",
  },

  routeDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#D9D9D9",
  },

  navigationButton: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 10,
    backgroundColor: "#06391F",
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
    elevation: 4,
  },

  navigationButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  navigationTopBar: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 5,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  navigationTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#06391F",
  },

  navigationSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#777",
  },

  stopNavigationButton: {
    backgroundColor: "#D32F2F",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },

  stopNavigationText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  navigationOptions: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 10,
    flexDirection: "row",
    gap: 8,
  },

  navigationOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },

  drivingOption: {
    backgroundColor: "#06391F",
  },

  walkingOption: {
    backgroundColor: "#1E6B4C",
  },

  navigationOptionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  modeButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  modeButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F0F2F1",
    alignItems: "center",
    justifyContent: "center",
  },

  modeButtonActive: {
    backgroundColor: "#DDEBFF",
  },

  modeButtonText: {
    fontSize: 18,
  },
  arrivalBanner: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: "#06391F",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    elevation: 6,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },
  
  arrivalIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  
  arrivalTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
  
  arrivalSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 3,
  },
});