import { api } from "@/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Linking,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

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
  const insets = useSafeAreaInsets();

  // ==========================================
  // STATE
  // ==========================================

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalConfirmText, setModalConfirmText] = useState("OK");
  const [modalCancelText, setModalCancelText] = useState("Cancel");
  const [modalShowCancel, setModalShowCancel] = useState(false);
  const [modalOnConfirm, setModalOnConfirm] = useState<
    (() => void) | null
  >(null);

  const showModal = useCallback(
    ({
      title,
      message,
      confirmText = "OK",
      cancelText = "Cancel",
      showCancel = false,
      onConfirm,
    }: {
      title: string;
      message: string;
      confirmText?: string;
      cancelText?: string;
      showCancel?: boolean;
      onConfirm?: () => void;
    }) => {
      setModalTitle(title);
      setModalMessage(message);
      setModalConfirmText(confirmText);
      setModalCancelText(cancelText);
      setModalShowCancel(showCancel);
      setModalOnConfirm(() => onConfirm || null);
      setModalVisible(true);
    },
    []
  );

  const closeModal = () => {
    setModalVisible(false);
    setModalOnConfirm(null);
  };

  const handleModalConfirm = () => {
    const action = modalOnConfirm;

    setModalVisible(false);
    setModalOnConfirm(null);

    action?.();
  };

  const [officerLocation, setOfficerLocation] =
    useState<Location.LocationObjectCoords | null>(null);

  const [navigationStarted, setNavigationStarted] =
    useState(false);

  const [travelMode, setTravelMode] =
    useState<TravelMode>("driving");

  const [routeCoordinates, setRouteCoordinates] =
    useState<
      { latitude: number; longitude: number }[]
    >([]);

  const [distance, setDistance] =
    useState<string | null>(null);

  const [duration, setDuration] =
    useState<string | null>(null);

  const [hasArrived, setHasArrived] =
    useState(false);

  const [activeIncidentId, setActiveIncidentId] =
    useState<string | null>(null);

  const mapRef = useRef<MapView | null>(null);

  const arrivedIncidentRef =
    useRef<string | null>(null);

  const GOOGLE_MAPS_API_KEY =
    "AIzaSyBW2I1gsUDE__pkSV6h4YYmskxnWgR5y-E";

  // ==========================================
  // ACTIVE INCIDENT
  // ==========================================

  const activeIncident = useMemo(() => {
    const unresolved = incidents.filter(
      (incident) =>
        incident.incidentStatus !== "resolved"
    );

    if (unresolved.length === 0) {
      return null;
    }

    /*
     * Priority:
     *
     * 1. Currently active incident
     * 2. New incidents
     * 3. Acknowledged
     * 4. Responding
     * 5. Newest incident
     */

    if (activeIncidentId) {
      const current = unresolved.find(
        (incident) =>
          incident._id === activeIncidentId
      );

      if (current) {
        return current;
      }
    }

    const priority: Record<
      IncidentStatus,
      number
    > = {
      new: 1,
      acknowledged: 2,
      responding: 3,
      resolved: 99,
    };

    return [...unresolved].sort((a, b) => {
      const priorityDifference =
        priority[a.incidentStatus] -
        priority[b.incidentStatus];

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return (
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
      );
    })[0];
  }, [incidents, activeIncidentId]);

  // ==========================================
  // PENDING INCIDENT COUNT
  // ==========================================

  const newIncidentCount = useMemo(() => {
    return incidents.filter(
      (incident) =>
        incident.incidentStatus === "new"
    ).length;
  }, [incidents]);

  // ==========================================
  // DISTANCE CALCULATION
  // ==========================================

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371e3;

    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;

    const Δφ =
      ((lat2 - lat1) * Math.PI) / 180;

    const Δλ =
      ((lon2 - lon1) * Math.PI) / 180;

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

  // ==========================================
  // DECODE GOOGLE POLYLINE
  // ==========================================

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
      let byte: number;

      do {
        byte =
          encoded.charCodeAt(index++) - 63;

        result |=
          (byte & 0x1f) << shift;

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
          encoded.charCodeAt(index++) - 63;

        result |=
          (byte & 0x1f) << shift;

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

  // ==========================================
  // GET ROUTE
  // ==========================================

  const getRoute = useCallback(
    async (
      incident: Incident,
      officer: Location.LocationObjectCoords,
      mode: TravelMode
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

        const response =
          await fetch(url);

        const data =
          await response.json();

        if (
          data.status !== "OK" ||
          !data.routes?.length
        ) {
          console.log(
            "DIRECTIONS ERROR:",
            data
          );

          return;
        }

        const route =
          data.routes[0];

        const leg =
          route.legs[0];

        setDistance(
          leg.distance?.text || null
        );

        setDuration(
          leg.duration?.text || null
        );

        const points =
          decodePolyline(
            route.overview_polyline.points
          );

        setRouteCoordinates(points);
      } catch (error) {
        console.error(
          "GET ROUTE ERROR:",
          error
        );
      }
    },
    []
  );

  // ==========================================
  // LOCATION TRACKING
  // ==========================================

  useEffect(() => {
    let subscription:
      | Location.LocationSubscription
      | null = null;

    const startTracking =
      async () => {
        try {
          const {
            status,
          } =
            await Location.requestForegroundPermissionsAsync();

          if (status !== "granted") {
            showModal({
              title: "Location Permission",
              message:
                "Location permission is required for navigation.",
            });

            return;
          }

          const location =
            await Location.getCurrentPositionAsync(
              {
                accuracy:
                  Location.Accuracy.High,
              }
            );

          setOfficerLocation(
            location.coords
          );

          subscription =
            await Location.watchPositionAsync(
              {
                accuracy:
                  Location.Accuracy.High,
                distanceInterval: 10,
                timeInterval: 5000,
              },
              (location) => {
                setOfficerLocation(
                  location.coords
                );
              }
            );
        } catch (error) {
          console.error(
            "LOCATION ERROR:",
            error
          );
        }
      };

    startTracking();

    return () => {
      subscription?.remove();
    };
  }, []);

  // ==========================================
  // OFFICER TOKEN
  // ==========================================

  const getOfficerToken =
    async () => {
      return await AsyncStorage.getItem(
        "officerToken"
      );
    };

  // ==========================================
  // LOAD INCIDENTS
  // ==========================================

  const loadIncidents =
    useCallback(async () => {
      try {
        const token =
          await getOfficerToken();

        if (!token) {
          showModal({
            title: "Session expired",
            message: "Please login again.",
            confirmText: "Login",
            onConfirm: () =>
              router.replace(
                "/security-company/officers/officer-login"
              ),
          });

          return;
        }

        const response =
          await api.get(
            "/alerts/officer",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const alerts =
          response.data.alerts || [];

        setIncidents(alerts);

        /*
         * If there is no active incident,
         * automatically select the highest
         * priority incident.
         */

        setActiveIncidentId(
          (currentId) => {
            const current =
              alerts.find(
                (incident: Incident) =>
                  incident._id ===
                  currentId &&
                  incident.incidentStatus !==
                  "resolved"
              );

            if (current) {
              return current._id;
            }

            const unresolved =
              alerts
                .filter(
                  (incident: Incident) =>
                    incident.incidentStatus !==
                    "resolved"
                )
                .sort(
                  (
                    a: Incident,
                    b: Incident
                  ) => {
                    const priority: Record<
                      IncidentStatus,
                      number
                    > = {
                      new: 1,
                      acknowledged: 2,
                      responding: 3,
                      resolved: 99,
                    };

                    const difference =
                      priority[
                      a.incidentStatus
                      ] -
                      priority[
                      b.incidentStatus
                      ];

                    if (
                      difference !== 0
                    ) {
                      return difference;
                    }

                    return (
                      new Date(
                        b.createdAt
                      ).getTime() -
                      new Date(
                        a.createdAt
                      ).getTime()
                    );
                  }
                );

            return (
              unresolved[0]?._id ||
              null
            );
          }
        );
      } catch (error: any) {
        console.error(
          "LOAD INCIDENTS ERROR:",
          error?.response?.data ||
          error.message
        );

        if (
          error?.response?.status ===
          401
        ) {
          await AsyncStorage.removeItem(
            "officerToken"
          );

          router.replace(
            "/security-company/officers/officer-login"
          );

          return;
        }

       showModal({
  title: "Error",
  message:
    error?.response?.data?.message ||
    "Failed to load incidents.",
});
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

  const handleRefresh =
    async () => {
      setRefreshing(true);
      await loadIncidents();
    };

  // ==========================================
  // UPDATE STATUS
  // ==========================================

  const updateStatus =
    async (
      alertId: string,
      status: IncidentStatus
    ) => {
      try {
        setUpdatingId(alertId);

        const token =
          await getOfficerToken();

        if (!token) {
          router.replace(
            "/security-company/officers/officer-login"
          );

          return;
        }

        await api.patch(
          `/alerts/${alertId}/status`,
          {
            status,
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        setIncidents(
          (previous) =>
            previous.map(
              (incident) =>
                incident._id ===
                  alertId
                  ? {
                    ...incident,
                    incidentStatus:
                      status,
                  }
                  : incident
            )
        );

        /*
         * If resolved, stop navigation
         * and automatically move to the
         * next incident.
         */

        if (status === "resolved") {
          setNavigationStarted(false);
          setRouteCoordinates([]);
          setDistance(null);
          setDuration(null);
          setHasArrived(false);

          arrivedIncidentRef.current =
            null;

          const nextIncident =
            incidents
              .filter(
                (incident) =>
                  incident._id !==
                  alertId &&
                  incident.incidentStatus !==
                  "resolved"
              )
              .sort(
                (a, b) => {
                  const priority: Record<
                    IncidentStatus,
                    number
                  > = {
                    new: 1,
                    acknowledged: 2,
                    responding: 3,
                    resolved: 99,
                  };

                  return (
                    priority[
                    a.incidentStatus
                    ] -
                    priority[
                    b.incidentStatus
                    ] ||
                    new Date(
                      b.createdAt
                    ).getTime() -
                    new Date(
                      a.createdAt
                    ).getTime()
                  );
                }
              )[0];

          setActiveIncidentId(
            nextIncident?._id ||
            null
          );
        }
      } catch (error: any) {
        console.error(
          "UPDATE STATUS ERROR:",
          error?.response?.data ||
          error.message
        );

       showModal({
  title: "Error",
  message:
    error?.response?.data?.message ||
    "Failed to update incident status.",
});
      } finally {
        setUpdatingId(null);
      }
    };

  // ==========================================
  // CONFIRM STATUS
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

  showModal({
    title: "Update Incident",
    message: `Change incident status to "${labels[status]}"?`,
    confirmText: "Confirm",
    cancelText: "Cancel",
    showCancel: true,
    onConfirm: () =>
      updateStatus(
        incident._id,
        status
      ),
  });
};

  // ==========================================
  // START NAVIGATION
  // ==========================================

  const startNavigation =
    (
      incident: Incident,
      mode: TravelMode
    ) => {
      if (
        incident.latitude === undefined ||
        incident.longitude === undefined
      ) {
       showModal({
  title: "Location unavailable",
  message:
    "The incident location is not available.",
});

        return;
      }

      if (!officerLocation) {
       showModal({
  title: "Location unavailable",
  message:
    "Your current location is not available yet.",
});

        return;
      }

      setHasArrived(false);

      arrivedIncidentRef.current =
        null;

      setActiveIncidentId(
        incident._id
      );

      setTravelMode(mode);

      setNavigationStarted(
        true
      );

      getRoute(
        incident,
        officerLocation,
        mode
      );

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          [
            {
              latitude:
                officerLocation.latitude,
              longitude:
                officerLocation.longitude,
            },
            {
              latitude:
                incident.latitude!,
              longitude:
                incident.longitude!,
            },
          ],
          {
            edgePadding: {
              top: 150,
              right: 50,
              bottom: 400,
              left: 50,
            },
            animated: true,
          }
        );
      }, 300);
    };

  // ==========================================
  // CHANGE TRAVEL MODE
  // ==========================================

  const changeTravelMode =
    (mode: TravelMode) => {
      if (!activeIncident) {
        return;
      }

      setTravelMode(mode);

      if (officerLocation) {
        getRoute(
          activeIncident,
          officerLocation,
          mode
        );
      }
    };

  // ==========================================
  // STOP NAVIGATION
  // ==========================================

  const stopNavigation =
    () => {
      setNavigationStarted(false);

      setRouteCoordinates([]);

      setDistance(null);

      setDuration(null);

      setHasArrived(false);

      arrivedIncidentRef.current =
        null;
    };

  // ==========================================
  // ARRIVAL DETECTION
  // ==========================================

  useEffect(() => {
    if (
      !navigationStarted ||
      !activeIncident ||
      !officerLocation
    ) {
      return;
    }

    if (
      activeIncident.latitude ===
      undefined ||
      activeIncident.longitude ===
      undefined
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
      Math.round(
        distanceToIncident
      ),
      "meters"
    );

    if (
      distanceToIncident <= 50 &&
      arrivedIncidentRef.current !==
      activeIncident._id
    ) {
      arrivedIncidentRef.current =
        activeIncident._id;

      setHasArrived(true);

      setNavigationStarted(
        false
      );

      setRouteCoordinates([]);

      setDistance(null);

      setDuration(null);

      Speech.stop();

      Speech.speak(
        "You have arrived at the emergency incident.",
        {
          language: "en-ZA",
          rate: 0.9,
          pitch: 1,
        }
      );

      if (
        activeIncident.incidentStatus !==
        "responding"
      ) {
        updateStatus(
          activeIncident._id,
          "responding"
        );
      }
    }
  }, [
    officerLocation,
    navigationStarted,
    activeIncident,
  ]);

  // ==========================================
  // CALL USER
  // ==========================================

  const callUser =
    async (
      phone?: string
    ) => {
      if (!phone) {
       showModal({
  title: "Phone unavailable",
  message:
    "The user's phone number is not available.",
});

        return;
      }

      try {
        await Linking.openURL(
          `tel:${phone}`
        );
      } catch {
        showModal({
  title: "Error",
  message: "Unable to make the phone call.",
});
      }
    };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate =
    (date: string) => {
      return new Date(
        date
      ).toLocaleString();
    };

  // ==========================================
  // LOADING
  // ==========================================

  // ==========================================
  // BOTTOM SHEET ACTIONS
  // ==========================================
  const SCREEN_HEIGHT = Dimensions.get("window").height;

  const SHEET_HEIGHT = Math.min(
    SCREEN_HEIGHT * 0.72,
    620
  );

  const SHEET_COLLAPSED = SHEET_HEIGHT - 95;
  const SHEET_EXPANDED = 0;

  const sheetTranslateY = useRef(
    new Animated.Value(SHEET_EXPANDED)
  ).current;

  const sheetStartY = useRef(0);

  const [sheetExpanded, setSheetExpanded] =
    useState(true);

  const animateSheet = useCallback(
    (toValue: number) => {
      Animated.spring(sheetTranslateY, {
        toValue,
        useNativeDriver: true,
        tension: 70,
        friction: 12,
      }).start();

      setSheetExpanded(
        toValue === SHEET_EXPANDED
      );
    },
    [sheetTranslateY, SHEET_EXPANDED]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () =>
          true,

        onMoveShouldSetPanResponder: (
          _,
          gestureState
        ) => {
          return (
            Math.abs(gestureState.dy) > 5
          );
        },

        onPanResponderGrant: () => {
          sheetTranslateY.stopAnimation(
            (value) => {
              sheetStartY.current = value;
            }
          );
        },

        onPanResponderMove: (
          _,
          gestureState
        ) => {
          const nextY =
            sheetStartY.current +
            gestureState.dy;

          const clampedY = Math.max(
            SHEET_EXPANDED,
            Math.min(
              SHEET_COLLAPSED,
              nextY
            )
          );

          sheetTranslateY.setValue(
            clampedY
          );
        },

        onPanResponderRelease: (
          _,
          gestureState
        ) => {
          const currentPosition =
            sheetStartY.current +
            gestureState.dy;

          const midpoint =
            SHEET_COLLAPSED / 2;

          if (
            gestureState.vy < -0.5 ||
            currentPosition < midpoint
          ) {
            animateSheet(
              SHEET_EXPANDED
            );
          } else {
            animateSheet(
              SHEET_COLLAPSED
            );
          }
        },

        onPanResponderTerminate: () => {
          animateSheet(
            sheetExpanded
              ? SHEET_EXPANDED
              : SHEET_COLLAPSED
          );
        },
      }),
    [
      animateSheet,
      sheetExpanded,
      sheetTranslateY,
      SHEET_COLLAPSED,
      SHEET_EXPANDED,
    ]
  );

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#06391F"
          />

          <Text
            style={styles.loadingText}
          >
            Loading incidents...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // NO INCIDENTS
  // ==========================================

  if (!activeIncident) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.emptyScreen}
        >
          <View
            style={styles.emptyIconCircle}
          >
            <Text
              style={styles.emptyIcon}
            >
              🛡️
            </Text>
          </View>

          <Text
            style={styles.emptyTitle}
          >
            No Active Incidents
          </Text>

          <Text
            style={styles.emptyText}
          >
            You currently have no
            incidents assigned to you.
          </Text>

          <Pressable
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Text
              style={styles.refreshButtonText}
            >
              Refresh
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // ACTIVE INCIDENT DATA
  // ==========================================

  const userName =
    activeIncident.userId
      ?.fullName ||
    "Unknown User";

  const phoneNumber =
    activeIncident.userId
      ?.phoneNumber;



  // ==========================================
  // MAIN SCREEN
  // ==========================================

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      {/* ======================================
          FULL SCREEN MAP
      ====================================== */}

      {activeIncident.latitude !==
        undefined &&
        activeIncident.longitude !==
        undefined && (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude:
                activeIncident.latitude,
              longitude:
                activeIncident.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            rotateEnabled
            pitchEnabled
            zoomEnabled
            toolbarEnabled={false}
          >
            {/* OFFICER */}

            {officerLocation && (
              <Marker
                coordinate={{
                  latitude:
                    officerLocation.latitude,
                  longitude:
                    officerLocation.longitude,
                }}
                title="Your Location"
                description="Security Officer"
                pinColor="#06391F"
              />
            )}

            {/* INCIDENT */}

            <Marker
              coordinate={{
                latitude:
                  activeIncident.latitude,
                longitude:
                  activeIncident.longitude,
              }}
              title="Emergency Incident"
              description={userName}
              pinColor="#D32F2F"
            />

            {/* ROUTE */}

            {navigationStarted &&
              routeCoordinates.length >
              0 && (
                <Polyline
                  coordinates={
                    routeCoordinates
                  }
                  strokeWidth={6}
                  strokeColor="#1976D2"
                  lineCap="round"
                  lineJoin="round"
                />
              )}
          </MapView>
        )}

      {/* ======================================
          TOP HEADER
      ====================================== */}

      <View
        style={[
          styles.topHeader,
          {
            top: insets.top + 8,
          },
        ]}
      >
        <Pressable
          style={styles.headerCircle}
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={styles.backText}
          >
            ←
          </Text>
        </Pressable>

        <View
          style={styles.headerTitleContainer}
        >
          <Text
            style={styles.headerTitle}
          >
            Officer Navigation
          </Text>

          <Text
            style={styles.headerSubtitle}
          >
            {newIncidentCount > 0
              ? `${newIncidentCount} new incident${newIncidentCount > 1
                ? "s"
                : ""
              }`
              : "Active incident"}
          </Text>
        </View>

        <Pressable
          style={[
            styles.headerCircle,
            refreshing &&
            styles.headerCircleDisabled,
          ]}
          disabled={refreshing}
          onPress={handleRefresh}
        >
          <Text
            style={styles.refreshIcon}
          >
            ↻
          </Text>
        </Pressable>
      </View>

      {/* ======================================
          NAVIGATION CONTROLS
      ====================================== */}

      {navigationStarted && (
        <View
          style={[
            styles.navigationControls,
            {
              top: insets.top + 82,
            },
          ]}
        >
          <View
            style={
              styles.navigationInfo
            }
          >
            <Text
              style={
                styles.navigationModeTitle
              }
            >
              {travelMode ===
                "driving"
                ? "Driving"
                : "Walking"}
            </Text>

            <Text
              style={
                styles.navigationModeSubtitle
              }
            >
              Navigating to emergency
            </Text>
          </View>

          <View
            style={styles.modeButtons}
          >
            <Pressable
              style={[
                styles.modeButton,
                travelMode ===
                "driving" &&
                styles.modeButtonActive,
              ]}
              onPress={() =>
                changeTravelMode(
                  "driving"
                )
              }
            >
              <Text
                style={
                  styles.modeButtonText
                }
              >
                🚗
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.modeButton,
                travelMode ===
                "walking" &&
                styles.modeButtonActive,
              ]}
              onPress={() =>
                changeTravelMode(
                  "walking"
                )
              }
            >
              <Text
                style={
                  styles.modeButtonText
                }
              >
                🚶
              </Text>
            </Pressable>

            <Pressable
              style={
                styles.stopButton
              }
              onPress={
                stopNavigation
              }
            >
              <Text
                style={
                  styles.stopButtonText
                }
              >
                Stop
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ======================================
          DISTANCE / ETA
      ====================================== 

      {navigationStarted && (
        <View
          style={styles.routeInfo}
        >
          <View
            style={styles.routeItem}
          >
            <Text
              style={
                styles.routeLabel
              }
            >
              DISTANCE
            </Text>

            <Text
              style={
                styles.routeValue
              }
            >
              {distance || "--"}
            </Text>
          </View>

          <View
            style={styles.routeDivider}
          />

          <View
            style={styles.routeItem}
          >
            <Text
              style={
                styles.routeLabel
              }
            >
              ETA
            </Text>

            <Text
              style={
                styles.routeValue
              }
            >
              {duration || "--"}
            </Text>
          </View>
        </View>
      )}
*/}
      {/* ======================================
          ARRIVAL BANNER
      ====================================== */}

      {hasArrived && (
        <View
          style={[
            styles.arrivalBanner,
            {
              top: insets.top + 82,
            },
          ]}
        >
          <View
            style={
              styles.arrivalIconCircle
            }
          >
            <Text
              style={
                styles.arrivalIcon
              }
            >
              ✓
            </Text>
          </View>

          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={
                styles.arrivalTitle
              }
            >
              You have arrived
            </Text>

            <Text
              style={
                styles.arrivalSubtitle
              }
            >
              You are at the emergency
              location.
            </Text>
          </View>
        </View>
      )}

      {/* ======================================
          MODERN INCIDENT COMMAND SHEET
      ====================================== */}

      <Animated.View
        style={[
          styles.bottomSheet,
          {
            height: SHEET_HEIGHT,
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.sheetHandleArea}>
          <View style={styles.dragHandle} />
        </View>

        {/* INCIDENT HERO */}
        <View style={styles.incidentHero}>
          <View style={styles.heroTopRow}>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText}>LIVE INCIDENT</Text>
            </View>

            <View style={styles.heroStatusPill}>
              <Text style={styles.heroStatusText}>
                {activeIncident.incidentStatus.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.heroBottomRow}>
            <View style={styles.heroTitleWrap}>
              <Text style={styles.heroTitle}>Emergency response</Text>
              <Text style={styles.heroTime}>
                {formatDate(activeIncident.createdAt)}
              </Text>
            </View>

            {newIncidentCount > 0 && (
              <View style={styles.queueBadge}>
                <Text style={styles.queueBadgeNumber}>
                  {newIncidentCount}
                </Text>
                <Text style={styles.queueBadgeLabel}>NEW</Text>
              </View>
            )}
          </View>
        </View>

        {/* PERSON CARD */}
        <View style={styles.personCard}>
          <View style={styles.personAvatar}>
            <Text style={styles.personAvatarText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.personDetails}>
            <Text style={styles.eyebrow}>PERSON IN NEED</Text>
            <Text style={styles.personName}>{userName}</Text>

            {phoneNumber && (
              <Text style={styles.personPhone}>{phoneNumber}</Text>
            )}
          </View>

          {phoneNumber && (
            <Pressable
              style={({ pressed }) => [
                styles.callCircle,
                pressed && styles.pressed,
              ]}
              onPress={() => callUser(phoneNumber)}
            >
              <Text style={styles.callCircleText}>☎</Text>
            </Pressable>
          )}
        </View>


        {/* RESPONSE MODE + PRIMARY CTA */}
        {!navigationStarted && !hasArrived && (
          <View style={styles.responseArea}>
            <Text style={styles.sectionEyebrow}>RESPONSE MODE</Text>

            <View style={styles.modeSelector}>
              <Pressable
                style={({ pressed }) => [
                  styles.modeOption,
                  travelMode === "driving" && styles.modeOptionActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => setTravelMode("driving")}
              >
                <Text
                  style={[
                    styles.modeIcon,
                    travelMode === "driving" && styles.modeIconActive,
                  ]}
                >
                  🚗
                </Text>
                <View style={styles.modeTextWrap}>
                  <Text
                    style={[
                      styles.modeTitle,
                      travelMode === "driving" && styles.modeTitleActive,
                    ]}
                  >
                    Driving
                  </Text>
                  <Text style={styles.modeSubtitle}>Fastest route</Text>
                </View>

                <View
                  style={[
                    styles.radio,
                    travelMode === "driving" && styles.radioActive,
                  ]}
                >
                  {travelMode === "driving" && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modeOption,
                  travelMode === "walking" && styles.modeOptionActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => setTravelMode("walking")}
              >
                <Text
                  style={[
                    styles.modeIcon,
                    travelMode === "walking" && styles.modeIconActive,
                  ]}
                >
                  🚶
                </Text>
                <View style={styles.modeTextWrap}>
                  <Text
                    style={[
                      styles.modeTitle,
                      travelMode === "walking" && styles.modeTitleActive,
                    ]}
                  >
                    Walking
                  </Text>
                  <Text style={styles.modeSubtitle}>Pedestrian route</Text>
                </View>

                <View
                  style={[
                    styles.radio,
                    travelMode === "walking" && styles.radioActive,
                  ]}
                >
                  {travelMode === "walking" && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.startResponseButton,
                pressed && styles.primaryPressed,
              ]}
              onPress={() => startNavigation(activeIncident, travelMode)}
            >
              <View style={styles.startButtonIcon}>
                <Text style={styles.startButtonIconText}>→</Text>
              </View>

              <View style={styles.startButtonCopy}>
                <Text style={styles.startResponseTitle}>
                  START RESPONSE
                </Text>
                <Text style={styles.startResponseSubtitle}>
                  Navigate to emergency
                </Text>
              </View>

              <Text style={styles.startResponseArrow}>›</Text>
            </Pressable>
          </View>
        )}

        {/* ACTIVE NAVIGATION */}
        {navigationStarted && (
          <View style={styles.navigationActiveCard}>
            <View style={styles.navigationActiveHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>NAVIGATION ACTIVE</Text>
                <Text style={styles.navigationActiveTitle}>
                  {travelMode === "driving" ? "Driving" : "Walking"} to incident
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.stopCircle,
                  pressed && styles.pressed,
                ]}
                onPress={stopNavigation}
              >
                <Text style={styles.stopCircleText}>×</Text>
              </Pressable>
            </View>


            {/* DISTANCE + ETA */}
            <View style={styles.routeStats}>
              <View style={styles.routeStat}>
                <Text style={styles.routeStatLabel}>DISTANCE</Text>
                <Text style={styles.routeStatValue}>{distance || "--"}</Text>
              </View>

              <View style={styles.routeStatDivider} />

              <View style={styles.routeStat}>
                <Text style={styles.routeStatLabel}>ETA</Text>
                <Text style={styles.routeStatValue}>{duration || "--"}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ARRIVAL */}
        {hasArrived && (
          <View style={styles.arrivedCard}>
            <View style={styles.arrivedIcon}>
              <Text style={styles.arrivedIconText}>✓</Text>
            </View>
            <View style={styles.arrivedCopy}>
              <Text style={styles.arrivedTitle}>You’ve arrived</Text>
              <Text style={styles.arrivedSubtitle}>
                You are at the emergency location.
              </Text>
            </View>
          </View>
        )}

        {/* STATUS TIMELINE */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>INCIDENT STATUS</Text>
              <Text style={styles.statusHeaderTitle}>
                Response progress
              </Text>
            </View>

            {updatingId === activeIncident._id && (
              <ActivityIndicator size="small" color="#0B5D3B" />
            )}
          </View>

          <View style={styles.statusTimeline}>
            {[
              {
                key: "acknowledged" as IncidentStatus,
                title: "Acknowledge",
                short: "ACK",
              },
              {
                key: "responding" as IncidentStatus,
                title: "Responding",
                short: "GO",
              },
              {
                key: "resolved" as IncidentStatus,
                title: "Resolved",
                short: "DONE",
              },
            ].map((item, index) => {
              const order: Record<IncidentStatus, number> = {
                new: 0,
                acknowledged: 1,
                responding: 2,
                resolved: 3,
              };

              const currentOrder = order[activeIncident.incidentStatus];
              const itemOrder = order[item.key];
              const completed = currentOrder >= itemOrder;
              const current = currentOrder === itemOrder;

              return (
                <View key={item.key} style={styles.timelineStep}>
                  <Pressable
                    disabled={updatingId === activeIncident._id}
                    style={({ pressed }) => [
                      styles.timelineNode,
                      completed && styles.timelineNodeCompleted,
                      current && styles.timelineNodeCurrent,
                      pressed && styles.pressed,
                    ]}
                    onPress={() =>
                      confirmStatusChange(activeIncident, item.key)
                    }
                  >
                    <Text
                      style={[
                        styles.timelineNodeText,
                        completed && styles.timelineNodeTextCompleted,
                      ]}
                    >
                      {completed ? "✓" : item.short}
                    </Text>
                  </Pressable>

                  <Text
                    style={[
                      styles.timelineLabel,
                      current && styles.timelineLabelCurrent,
                    ]}
                  >
                    {item.title}
                  </Text>

                  {index < 2 && (
                    <View
                      style={[
                        styles.timelineConnector,
                        currentOrder > itemOrder &&
                        styles.timelineConnectorCompleted,
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* NEXT INCIDENT */}
        {incidents.filter(
          (incident) =>
            incident._id !== activeIncident._id &&
            incident.incidentStatus !== "resolved"
        ).length > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.nextIncidentCard,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                const next = incidents
                  .filter(
                    (incident) =>
                      incident._id !== activeIncident._id &&
                      incident.incidentStatus !== "resolved"
                  )
                  .sort((a, b) => {
                    if (
                      a.incidentStatus === "new" &&
                      b.incidentStatus !== "new"
                    ) {
                      return -1;
                    }

                    if (
                      a.incidentStatus !== "new" &&
                      b.incidentStatus === "new"
                    ) {
                      return 1;
                    }

                    return (
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                    );
                  })[0];

                if (!next) return;

                stopNavigation();
                setActiveIncidentId(next._id);

                if (
                  next.latitude !== undefined &&
                  next.longitude !== undefined
                ) {
                  mapRef.current?.animateToRegion(
                    {
                      latitude: next.latitude,
                      longitude: next.longitude,
                      latitudeDelta: 0.02,
                      longitudeDelta: 0.02,
                    },
                    700
                  );
                }
              }}
            >
              <View style={styles.nextIncidentIcon}>
                <Text style={styles.nextIncidentIconText}>!</Text>
              </View>

              <View style={styles.nextIncidentCopy}>
                <Text style={styles.nextIncidentEyebrow}>
                  QUEUE
                </Text>
                <Text style={styles.nextIncidentTitle}>
                  Another incident is waiting
                </Text>
              </View>

              <Text style={styles.nextIncidentArrow}>›</Text>
            </Pressable>
          )}
      </Animated.View>
      {modalVisible && (
  <View style={styles.modalOverlay}>
    <Pressable
      style={StyleSheet.absoluteFill}
      onPress={
        modalShowCancel
          ? closeModal
          : undefined
      }
    />

    <View style={styles.modalCard}>
      <View style={styles.modalIcon}>
        <Text style={styles.modalIconText}>
          {modalShowCancel ? "?" : "!"}
        </Text>
      </View>

      <Text style={styles.modalTitle}>
        {modalTitle}
      </Text>

      <Text style={styles.modalMessage}>
        {modalMessage}
      </Text>

      <View
        style={[
          styles.modalActions,
          !modalShowCancel &&
            styles.modalActionsSingle,
        ]}
      >
        {modalShowCancel && (
          <Pressable
            style={({ pressed }) => [
              styles.modalCancelButton,
              pressed && styles.pressed,
            ]}
            onPress={closeModal}
          >
            <Text style={styles.modalCancelText}>
              {modalCancelText}
            </Text>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.modalConfirmButton,
            pressed && styles.primaryPressed,
          ]}
          onPress={handleModalConfirm}
        >
          <Text style={styles.modalConfirmText}>
            {modalConfirmText}
          </Text>
        </Pressable>
      </View>
    </View>
  </View>
)}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F6",
  },

  // ==========================================
  // LOADING
  // ==========================================

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F7F6",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#555",
  },

  // ==========================================
  // EMPTY
  // ==========================================

  emptyScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    backgroundColor: "#F5F7F6",
  },

  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E8F5EC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  emptyIcon: {
    fontSize: 42,
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#17201B",
    marginBottom: 8,
  },

  emptyText: {
    textAlign: "center",
    color: "#777",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },

  refreshButton: {
    backgroundColor: "#06391F",
    paddingHorizontal: 30,
    paddingVertical: 13,
    borderRadius: 12,
  },

  refreshButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  // ==========================================
  // TOP HEADER
  // ==========================================

  topHeader: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      "rgba(255,255,255,0.96)",
    borderRadius: 18,
    padding: 10,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  headerCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F1F3F2",
    alignItems: "center",
    justifyContent: "center",
  },

  headerCircleDisabled: {
    opacity: 0.5,
  },

  backText: {
    fontSize: 28,
    color: "#17201B",
    marginTop: -3,
  },

  refreshIcon: {
    fontSize: 25,
    color: "#06391F",
  },

  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#17201B",
  },

  headerSubtitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  // ==========================================
  // NAVIGATION CONTROLS
  // ==========================================

  navigationControls: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 25,
    backgroundColor:
      "rgba(255,255,255,0.98)",
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  navigationInfo: {
    flex: 1,
  },

  navigationModeTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#06391F",
  },

  navigationModeSubtitle: {
    fontSize: 11,
    color: "#777",
    marginTop: 2,
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

  stopButton: {
    backgroundColor: "#D32F2F",
    paddingHorizontal: 13,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  stopButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },

  // ==========================================
  // ROUTE INFO
  // ==========================================

  routeInfo: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 14,
    backgroundColor:
      "rgba(255,255,255,0.96)",
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  routeItem: {
    flex: 1,
    alignItems: "center",
  },

  routeLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#777",
    marginBottom: 2,
  },

  routeValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#06391F",
  },

  routeDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#DDD",
  },

  // ==========================================
  // ARRIVAL
  // ==========================================

  arrivalBanner: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 30,
    backgroundColor: "#06391F",
    borderRadius: 17,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    elevation: 8,
  },

  arrivalIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  arrivalIcon: {
    color: "#06391F",
    fontSize: 24,
    fontWeight: "900",
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

  // ==========================================
  // MODERN INCIDENT COMMAND SHEET
  // ==========================================

  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 25,
    backgroundColor: "#F7F9F8",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingBottom: 18,
    elevation: 24,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: -8 },
  },

  sheetHandleArea: {
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  dragHandle: {
    width: 42,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#C9D1CC",
  },

  incidentHero: {
    backgroundColor: "#0A2F21",
    borderRadius: 24,
    padding: 17,
    marginBottom: 10,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  livePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FF5B5B",
    marginRight: 6,
  },

  livePillText: {
    color: "#EAF6F0",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  heroStatusPill: {
    backgroundColor: "#E7B94E",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  heroStatusText: {
    color: "#26311B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  heroBottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  heroTitleWrap: {
    flex: 1,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  heroTime: {
    color: "rgba(255,255,255,0.60)",
    fontSize: 10,
    marginTop: 5,
  },

  queueBadge: {
    minWidth: 48,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },

  queueBadgeNumber: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
  },

  queueBadgeLabel: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  personCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 13,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: "#E7ECE9",
  },

  personAvatar: {
    width: 49,
    height: 49,
    borderRadius: 17,
    backgroundColor: "#DDEEE5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  personAvatarText: {
    color: "#0A4C32",
    fontSize: 19,
    fontWeight: "900",
  },

  personDetails: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 8,
    fontWeight: "900",
    color: "#84918A",
    letterSpacing: 0.8,
    marginBottom: 3,
  },

  personName: {
    color: "#17231D",
    fontSize: 16,
    fontWeight: "900",
  },

  personPhone: {
    color: "#65726B",
    fontSize: 11,
    marginTop: 3,
  },

  callCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5F3EB",
    alignItems: "center",
    justifyContent: "center",
  },

  callCircleText: {
    color: "#0B5D3B",
    fontSize: 19,
    fontWeight: "900",
  },

  destinationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF5F1",
    borderRadius: 18,
    padding: 12,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: "#DCE8E1",
  },

  destinationIconWrap: {
    width: 39,
    height: 39,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  destinationIcon: {
    color: "#D83B3B",
    fontSize: 16,
  },

  destinationDetails: {
    flex: 1,
  },

  destinationTitle: {
    color: "#24322B",
    fontSize: 13,
    fontWeight: "900",
  },

  destinationSubtext: {
    color: "#748078",
    fontSize: 10,
    marginTop: 2,
  },

  destinationArrow: {
    color: "#0B5D3B",
    fontSize: 25,
    fontWeight: "300",
    marginLeft: 7,
  },

  responseArea: {
    marginBottom: 10,
  },

  sectionEyebrow: {
    color: "#7C8982",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.9,
    marginBottom: 7,
  },

  modeSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 9,
  },

  modeOption: {
    flex: 1,
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#E4EAE6",
  },

  modeOptionActive: {
    backgroundColor: "#E8F4ED",
    borderColor: "#A9CDB8",
  },

  modeIcon: {
    fontSize: 19,
    opacity: 0.65,
  },

  modeIconActive: {
    opacity: 1,
  },

  modeTextWrap: {
    flex: 1,
    marginLeft: 8,
  },

  modeTitle: {
    color: "#3D4A43",
    fontSize: 11,
    fontWeight: "900",
  },

  modeTitleActive: {
    color: "#0B5D3B",
  },

  modeSubtitle: {
    color: "#8A958F",
    fontSize: 8,
    marginTop: 2,
  },

  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#BCC6C0",
    alignItems: "center",
    justifyContent: "center",
  },

  radioActive: {
    borderColor: "#0B5D3B",
  },

  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0B5D3B",
  },

  startResponseButton: {
    minHeight: 63,
    borderRadius: 19,
    backgroundColor: "#0B5D3B",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    elevation: 5,
    shadowColor: "#0B5D3B",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  primaryPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },

  startButtonIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.13)",
    alignItems: "center",
    justifyContent: "center",
  },

  startButtonIconText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },

  startButtonCopy: {
    flex: 1,
    marginLeft: 11,
  },

  startResponseTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  startResponseSubtitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 9,
    marginTop: 3,
  },

  startResponseArrow: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "300",
    marginLeft: 8,
  },

  navigationActiveCard: {
    backgroundColor: "#0B5D3B",
    borderRadius: 20,
    padding: 13,
    marginBottom: 10,
  },

  navigationActiveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  navigationActiveTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  stopCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  stopCircleText: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 25,
    fontWeight: "300",
  },

  routeStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.09)",
    borderRadius: 15,
    paddingVertical: 10,
  },

  routeStat: {
    flex: 1,
    alignItems: "center",
  },

  routeStatLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
    marginBottom: 3,
  },

  routeStatValue: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  routeStatDivider: {
    width: 1,
    height: 25,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  arrivedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A2F21",
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
  },

  arrivedIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  arrivedIconText: {
    color: "#0B5D3B",
    fontSize: 22,
    fontWeight: "900",
  },

  arrivedCopy: {
    flex: 1,
  },

  arrivedTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  arrivedSubtitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 10,
    marginTop: 3,
  },

  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 13,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: "#E7ECE9",
  },

  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  statusHeaderTitle: {
    color: "#25322C",
    fontSize: 14,
    fontWeight: "900",
  },

  statusTimeline: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  timelineStep: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },

  timelineNode: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F4F2",
    borderWidth: 1,
    borderColor: "#DCE3DE",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  timelineNodeCompleted: {
    backgroundColor: "#DDF0E5",
    borderColor: "#B7D8C4",
  },

  timelineNodeCurrent: {
    backgroundColor: "#0B5D3B",
    borderColor: "#0B5D3B",
  },

  timelineNodeText: {
    color: "#89958E",
    fontSize: 7,
    fontWeight: "900",
  },

  timelineNodeTextCompleted: {
    color: "#0B5D3B",
    fontSize: 15,
  },

  timelineLabel: {
    color: "#7C8781",
    fontSize: 8,
    fontWeight: "800",
    marginTop: 6,
    textAlign: "center",
  },

  timelineLabelCurrent: {
    color: "#0B5D3B",
  },

  timelineConnector: {
    position: "absolute",
    top: 16,
    left: "50%",
    right: "-50%",
    height: 2,
    backgroundColor: "#DCE3DE",
    zIndex: 1,
  },

  timelineConnectorCompleted: {
    backgroundColor: "#AFCDBB",
  },

  nextIncidentCard: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E8",
    borderRadius: 17,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: "#F1E2B9",
  },

  nextIncidentIcon: {
    width: 31,
    height: 31,
    borderRadius: 11,
    backgroundColor: "#F4DFA7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  nextIncidentIconText: {
    color: "#6B531C",
    fontSize: 14,
    fontWeight: "900",
  },

  nextIncidentCopy: {
    flex: 1,
  },

  nextIncidentEyebrow: {
    color: "#9B8145",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  nextIncidentTitle: {
    color: "#55461F",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 2,
  },

  nextIncidentArrow: {
    color: "#8C733A",
    fontSize: 24,
    fontWeight: "300",
    marginLeft: 6,
  },

  pressed: {
    opacity: 0.78,
  },
  // ==========================================
// CUSTOM MODAL
// ==========================================

modalOverlay: {
  ...StyleSheet.absoluteFill,
  zIndex: 999,
  backgroundColor: "rgba(0,0,0,0.48)",
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 24,
},

modalCard: {
  width: "100%",
  maxWidth: 390,
  backgroundColor: "#FFFFFF",
  borderRadius: 26,
  padding: 22,
  elevation: 20,
  shadowColor: "#000",
  shadowOpacity: 0.25,
  shadowRadius: 20,
  shadowOffset: {
    width: 0,
    height: 8,
  },
},

modalIcon: {
  width: 48,
  height: 48,
  borderRadius: 16,
  backgroundColor: "#E8F4ED",
  alignItems: "center",
  justifyContent: "center",
  alignSelf: "center",
  marginBottom: 14,
},

modalIconText: {
  color: "#0B5D3B",
  fontSize: 22,
  fontWeight: "900",
},

modalTitle: {
  color: "#17231D",
  fontSize: 19,
  fontWeight: "900",
  textAlign: "center",
  marginBottom: 8,
},

modalMessage: {
  color: "#68746D",
  fontSize: 14,
  lineHeight: 21,
  textAlign: "center",
  marginBottom: 20,
},

modalActions: {
  flexDirection: "row",
  gap: 10,
},

modalActionsSingle: {
  justifyContent: "center",
},

modalCancelButton: {
  flex: 1,
  minHeight: 48,
  borderRadius: 14,
  backgroundColor: "#F1F3F2",
  alignItems: "center",
  justifyContent: "center",
},

modalCancelText: {
  color: "#53615A",
  fontSize: 14,
  fontWeight: "800",
},

modalConfirmButton: {
  flex: 1,
  minHeight: 48,
  borderRadius: 14,
  backgroundColor: "#0B5D3B",
  alignItems: "center",
  justifyContent: "center",
},

modalConfirmText: {
  color: "#FFFFFF",
  fontSize: 14,
  fontWeight: "900",
},

});