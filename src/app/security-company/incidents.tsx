import { api } from "@/config/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

export default function IncidentsScreen() {
    const router = useRouter();

    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // ==========================================
    // Officers
    // ==========================================

    const [officers, setOfficers] = useState<any[]>([]);
    const [assigningAlertId, setAssigningAlertId] =
        useState<string | null>(null);
    const [selectedOfficer, setSelectedOfficer] =
        useState<any | null>(null);
    const [showOfficerModal, setShowOfficerModal] =
        useState(false);

    // ==========================================
    // Load data when screen focuses
    // ==========================================

    useFocusEffect(
        useCallback(() => {
            loadIncidents();
            loadOfficers();
        }, [])
    );

    // ==========================================
    // Load Officers
    // ==========================================

    const loadOfficers = async () => {
        try {
            const token =
                await AsyncStorage.getItem("companyToken");

            const response = await api.get(
                "/security-company/officers",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setOfficers(response.data || []);
        } catch (error: any) {
            console.log(
                "Failed to load officers:",
                error.response?.data || error.message
            );
        }
    };

    // ==========================================
    // Load Incidents
    // ==========================================

    const loadIncidents = async () => {
        try {
            const token =
                await AsyncStorage.getItem("companyToken");

            const response = await api.get(
                "/alerts/security-company",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setAlerts(response.data.alerts || []);
        } catch (error: any) {
            console.log(
                "Failed to load incidents:",
                error.response?.data || error.message
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // ==========================================
    // Refresh
    // ==========================================

    const refreshIncidents = () => {
        setRefreshing(true);
        loadIncidents();
        loadOfficers();
    };

    // ==========================================
    // Assign Officer
    // ==========================================

    const assignOfficer = async (
        alertId: string,
        officerId: string
    ) => {
        try {
            const token =
                await AsyncStorage.getItem("companyToken");

            await api.patch(
                `/alerts/${alertId}/assign-officer`,
                {
                    officerId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const officer = officers.find(
                (item) => item._id === officerId
            );

            setAlerts((prevAlerts) =>
                prevAlerts.map((alert) =>
                    alert._id === alertId
                        ? {
                              ...alert,
                              assignedOfficer: officer,
                              incidentStatus:
                                  "acknowledged",
                          }
                        : alert
                )
            );

            setShowOfficerModal(false);
            setSelectedOfficer(null);
            setAssigningAlertId(null);
        } catch (error: any) {
            console.log(
                "Failed to assign officer:",
                error.response?.data || error.message
            );

            Alert.alert(
                "Assignment Failed",
                error.response?.data?.message ||
                    "Could not assign officer."
            );
        }
    };

    // ==========================================
    // Update Incident Status
    // ==========================================

    const updateIncidentStatus = async (
        alertId: string,
        status: string
    ) => {
        try {
            const token =
                await AsyncStorage.getItem("companyToken");

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

            setAlerts((prevAlerts) =>
                prevAlerts.map((alert) =>
                    alert._id === alertId
                        ? {
                              ...alert,
                              incidentStatus: status,
                          }
                        : alert
                )
            );
        } catch (error: any) {
            console.log(
                "Failed to update incident status:",
                error.response?.data || error.message
            );

            Alert.alert(
                "Status Update Failed",
                error.response?.data?.message ||
                    "Could not update incident status."
            );
        }
    };

    // ==========================================
    // Get Next Status
    // ==========================================

    const getNextStatus = (status: string) => {
        switch (status) {
            case "new":
                return "acknowledged";

            case "acknowledged":
                return "responding";

            case "responding":
                return "resolved";

            case "resolved":
                return "resolved";

            default:
                return "new";
        }
    };

    // ==========================================
    // Status Label
    // ==========================================

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "new":
                return "New";

            case "acknowledged":
                return "Acknowledged";

            case "responding":
                return "Responding";

            case "resolved":
                return "Resolved";

            default:
                return "New";
        }
    };

    // ==========================================
    // Alert Status Color
    // ==========================================

    const getStatusColor = (status: string) => {
        switch (status) {
            case "sent":
                return "#16A34A";

            case "partial":
                return "#EA580C";

            case "failed":
                return "#DC2626";

            default:
                return "#CA8A04";
        }
    };

    // ==========================================
    // Incident Status Color
    // ==========================================

    const getIncidentStatusColor = (
        status: string
    ) => {
        switch (status) {
            case "new":
                return "#2563EB";

            case "acknowledged":
                return "#CA8A04";

            case "responding":
                return "#EA580C";

            case "resolved":
                return "#16A34A";

            default:
                return "#2563EB";
        }
    };

    // ==========================================
    // Trigger Icon
    // ==========================================

    const getTriggerIcon = (
        triggerType: string
    ) => {
        switch (triggerType) {
            case "shake":
                return "phone-portrait-outline";

            case "voice":
                return "mic-outline";

            default:
                return "alert-circle-outline";
        }
    };

    // ==========================================
    // Open Location
    // ==========================================

    const openLocation = (alert: any) => {
        if (alert.locationUrl) {
            Linking.openURL(alert.locationUrl);
            return;
        }

        if (
            alert.latitude !== undefined &&
            alert.longitude !== undefined
        ) {
            const url =
                `https://www.google.com/maps?q=` +
                `${alert.latitude},${alert.longitude}`;

            Linking.openURL(url);
        }
    };

    // ==========================================
    // Call User
    // ==========================================

    const callUser = (phone: string) => {
        if (!phone) return;

        Linking.openURL(`tel:${phone}`);
    };

    // ==========================================
    // Date
    // ==========================================

    const formatDate = (date: string) => {
        if (!date) return "Unknown date";

        return new Date(date).toLocaleString(
            "en-ZA",
            {
                dateStyle: "medium",
                timeStyle: "short",
            }
        );
    };

    // ==========================================
    // Loading
    // ==========================================

    if (loading) {
        return (
            <SafeAreaView style={styles.loader}>
                <ActivityIndicator
                    size="large"
                    color="#002E15"
                />

                <Text style={styles.loadingText}>
                    Loading incidents...
                </Text>
            </SafeAreaView>
        );
    }

    // ==========================================
    // Screen
    // ==========================================

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                backgroundColor="#002E15"
                barStyle="light-content"
            />

            {/* ========================================== */}
            {/* Header */}
            {/* ========================================== */}

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                >
                    <Ionicons
                        name="arrow-back"
                        size={25}
                        color="#fff"
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Incidents
                </Text>

                <TouchableOpacity
                    onPress={refreshIncidents}
                    disabled={refreshing}
                >
                    <Ionicons
                        name="refresh"
                        size={25}
                        color="#fff"
                    />
                </TouchableOpacity>
            </View>

            {/* ========================================== */}
            {/* Content */}
            {/* ========================================== */}

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refreshIncidents}
                        colors={["#002E15"]}
                    />
                }
                contentContainerStyle={
                    alerts.length === 0
                        ? styles.emptyContent
                        : styles.content
                }
            >
                {/* ========================================== */}
                {/* Summary */}
                {/* ========================================== */}

                <View style={styles.summaryCard}>
                    <View>
                        <Text style={styles.summaryLabel}>
                            Total Incidents
                        </Text>

                        <Text style={styles.summaryValue}>
                            {alerts.length}
                        </Text>
                    </View>

                    <View style={styles.summaryIcon}>
                        <Ionicons
                            name="warning"
                            size={28}
                            color="#DC2626"
                        />
                    </View>
                </View>

                {/* ========================================== */}
                {/* Empty State */}
                {/* ========================================== */}

                {alerts.length === 0 ? (
                    <View style={styles.empty}>
                        <View style={styles.emptyIcon}>
                            <Ionicons
                                name="shield-checkmark-outline"
                                size={55}
                                color="#002E15"
                            />
                        </View>

                        <Text style={styles.emptyTitle}>
                            No Incidents
                        </Text>

                        <Text style={styles.emptyText}>
                            SOS alerts sent to your security
                            company will appear here.
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.sectionTitle}>
                            Recent Incidents
                        </Text>

                        {/* ========================================== */}
                        {/* Incidents */}
                        {/* ========================================== */}

                        {alerts.map((alert) => {
                            const user = alert.userId;

                            const statusColor =
                                getStatusColor(
                                    alert.status
                                );

                            const incidentStatus =
                                alert.incidentStatus ||
                                "new";

                            const incidentStatusColor =
                                getIncidentStatusColor(
                                    incidentStatus
                                );

                            return (
                                <View
                                    key={alert._id}
                                    style={
                                        styles.incidentCard
                                    }
                                >
                                    {/* ========================================== */}
                                    {/* Incident Header */}
                                    {/* ========================================== */}

                                    <View
                                        style={
                                            styles.cardHeader
                                        }
                                    >
                                        <View
                                            style={
                                                styles.alertIcon
                                            }
                                        >
                                            <Ionicons
                                                name="warning"
                                                size={25}
                                                color="#fff"
                                            />
                                        </View>

                                        <View
                                            style={
                                                styles.headerInfo
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.alertTitle
                                                }
                                            >
                                                Emergency Alert
                                            </Text>

                                            <Text
                                                style={
                                                    styles.date
                                                }
                                            >
                                                {formatDate(
                                                    alert.createdAt
                                                )}
                                            </Text>
                                        </View>

                                        <View
                                            style={[
                                                styles.statusBadge,
                                                {
                                                    backgroundColor:
                                                        `${statusColor}18`,
                                                },
                                            ]}
                                        >
                                            <View
                                                style={[
                                                    styles.statusDot,
                                                    {
                                                        backgroundColor:
                                                            statusColor,
                                                    },
                                                ]}
                                            />

                                            <Text
                                                style={[
                                                    styles.statusText,
                                                    {
                                                        color:
                                                            statusColor,
                                                    },
                                                ]}
                                            >
                                                {alert.status}
                                            </Text>
                                        </View>
                                    </View>

                                    <View
                                        style={
                                            styles.divider
                                        }
                                    />

                                    {/* ========================================== */}
                                    {/* User */}
                                    {/* ========================================== */}

                                    <View
                                        style={
                                            styles.infoRow
                                        }
                                    >
                                        <View
                                            style={
                                                styles.infoIcon
                                            }
                                        >
                                            <Ionicons
                                                name="person-outline"
                                                size={20}
                                                color="#2563EB"
                                            />
                                        </View>

                                        <View
                                            style={
                                                styles.infoContent
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.infoLabel
                                                }
                                            >
                                                User
                                            </Text>

                                            <Text
                                                style={
                                                    styles.infoValue
                                                }
                                            >
                                                {user?.fullName ||
                                                    "Unknown User"}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* ========================================== */}
                                    {/* Phone */}
                                    {/* ========================================== */}

                                    <View
                                        style={
                                            styles.infoRow
                                        }
                                    >
                                        <View
                                            style={
                                                styles.infoIcon
                                            }
                                        >
                                            <Ionicons
                                                name="call-outline"
                                                size={20}
                                                color="#16A34A"
                                            />
                                        </View>

                                        <View
                                            style={
                                                styles.infoContent
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.infoLabel
                                                }
                                            >
                                                Phone Number
                                            </Text>

                                            <Text
                                                style={
                                                    styles.infoValue
                                                }
                                            >
                                                {user?.phoneNumber ||
                                                    "Not available"}
                                            </Text>
                                        </View>

                                        {user?.phoneNumber && (
                                            <TouchableOpacity
                                                style={
                                                    styles.callButton
                                                }
                                                onPress={() =>
                                                    callUser(
                                                        user.phoneNumber
                                                    )
                                                }
                                            >
                                                <Ionicons
                                                    name="call"
                                                    size={18}
                                                    color="#fff"
                                                />
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {/* ========================================== */}
                                    {/* Trigger */}
                                    {/* ========================================== */}

                                    <View
                                        style={
                                            styles.infoRow
                                        }
                                    >
                                        <View
                                            style={
                                                styles.infoIcon
                                            }
                                        >
                                            <Ionicons
                                                name={getTriggerIcon(
                                                    alert.triggerType
                                                )}
                                                size={20}
                                                color="#7C3AED"
                                            />
                                        </View>

                                        <View
                                            style={
                                                styles.infoContent
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.infoLabel
                                                }
                                            >
                                                Trigger
                                            </Text>

                                            <Text
                                                style={
                                                    styles.infoValue
                                                }
                                            >
                                                {alert.triggerType
                                                    ? alert.triggerType
                                                          .charAt(
                                                              0
                                                          )
                                                          .toUpperCase() +
                                                      alert.triggerType.slice(
                                                          1
                                                      )
                                                    : "Button"}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* ========================================== */}
                                    {/* Message */}
                                    {/* ========================================== */}

                                    <View
                                        style={
                                            styles.messageContainer
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.infoLabel
                                            }
                                        >
                                            Alert Message
                                        </Text>

                                        <Text
                                            style={
                                                styles.message
                                            }
                                        >
                                            {alert.message ||
                                                "Emergency alert"}
                                        </Text>
                                    </View>

                                    {/* ========================================== */}
                                    {/* Assigned Officer */}
                                    {/* ========================================== */}

                                    {alert.assignedOfficer && (
                                        <View
                                            style={
                                                styles.assignedOfficerContainer
                                            }
                                        >
                                            <View
                                                style={
                                                    styles.assignedOfficerIcon
                                                }
                                            >
                                                <Ionicons
                                                    name="shield-checkmark"
                                                    size={21}
                                                    color="#16A34A"
                                                />
                                            </View>

                                            <View
                                                style={
                                                    styles.assignedOfficerInfo
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.infoLabel
                                                    }
                                                >
                                                    Assigned Officer
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.infoValue
                                                    }
                                                >
                                                    {
                                                        alert
                                                            .assignedOfficer
                                                            .firstName
                                                    }{" "}
                                                    {
                                                        alert
                                                            .assignedOfficer
                                                            .lastName
                                                    }
                                                </Text>

                                                {alert
                                                    .assignedOfficer
                                                    .phoneNumber && (
                                                    <Text
                                                        style={
                                                            styles.assignedOfficerPhone
                                                        }
                                                    >
                                                        {
                                                            alert
                                                                .assignedOfficer
                                                                .phoneNumber
                                                        }
                                                    </Text>
                                                )}
                                            </View>

                                            {alert
                                                .assignedOfficer
                                                .phoneNumber && (
                                                <TouchableOpacity
                                                    style={
                                                        styles.callButton
                                                    }
                                                    onPress={() =>
                                                        callUser(
                                                            alert
                                                                .assignedOfficer
                                                                .phoneNumber
                                                        )
                                                    }
                                                >
                                                    <Ionicons
                                                        name="call"
                                                        size={18}
                                                        color="#fff"
                                                    />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}

                                    {/* ========================================== */}
                                    {/* Assign Officer */}
                                    {/* ========================================== */}

                                    {incidentStatus ===
                                        "new" && (
                                        <TouchableOpacity
                                            style={
                                                styles.assignOfficerButton
                                            }
                                            onPress={() => {
                                                setAssigningAlertId(
                                                    alert._id
                                                );
                                                setSelectedOfficer(
                                                    null
                                                );
                                                setShowOfficerModal(
                                                    true
                                                );
                                            }}
                                        >
                                            <Ionicons
                                                name="person-add-outline"
                                                size={20}
                                                color="#fff"
                                            />

                                            <Text
                                                style={
                                                    styles.assignOfficerText
                                                }
                                            >
                                                Assign Officer
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                    {/* ========================================== */}
                                    {/* Incident Status */}
                                    {/* ========================================== */}

                                    <View
                                        style={
                                            styles.incidentStatusContainer
                                        }
                                    >
                                        <View>
                                            <Text
                                                style={
                                                    styles.infoLabel
                                                }
                                            >
                                                Incident Status
                                            </Text>

                                            <Text
                                                style={[
                                                    styles.incidentStatusText,
                                                    {
                                                        color:
                                                            incidentStatusColor,
                                                    },
                                                ]}
                                            >
                                                {getStatusLabel(
                                                    incidentStatus
                                                )}
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            style={[
                                                styles.statusUpdateButton,
                                                {
                                                    backgroundColor:
                                                        incidentStatus ===
                                                        "resolved"
                                                            ? "#9CA3AF"
                                                            : "#002E15",
                                                },
                                            ]}
                                            disabled={
                                                incidentStatus ===
                                                "resolved"
                                            }
                                            onPress={() =>
                                                updateIncidentStatus(
                                                    alert._id,
                                                    getNextStatus(
                                                        incidentStatus
                                                    )
                                                )
                                            }
                                        >
                                            <Ionicons
                                                name="sync-outline"
                                                size={18}
                                                color="#fff"
                                            />

                                            <Text
                                                style={
                                                    styles.statusUpdateText
                                                }
                                            >
                                                {incidentStatus ===
                                                "resolved"
                                                    ? "Resolved"
                                                    : "Update Status"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* ========================================== */}
                                    {/* Location */}
                                    {/* ========================================== */}

                                    {alert.latitude !=
                                        null &&
                                        alert.longitude !=
                                            null &&
                                        !isNaN(
                                            Number(
                                                alert.latitude
                                            )
                                        ) &&
                                        !isNaN(
                                            Number(
                                                alert.longitude
                                            )
                                        ) && (
                                            <View
                                                style={
                                                    styles.mapContainer
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.mapTitle
                                                    }
                                                >
                                                    User Location
                                                </Text>

                                                <MapView
                                                    style={
                                                        styles.map
                                                    }
                                                    initialRegion={{
                                                        latitude:
                                                            Number(
                                                                alert.latitude
                                                            ),
                                                        longitude:
                                                            Number(
                                                                alert.longitude
                                                            ),
                                                        latitudeDelta: 0.01,
                                                        longitudeDelta: 0.01,
                                                    }}
                                                    scrollEnabled={
                                                        false
                                                    }
                                                    zoomEnabled={
                                                        false
                                                    }
                                                    rotateEnabled={
                                                        false
                                                    }
                                                >
                                                    <Marker
                                                        coordinate={{
                                                            latitude:
                                                                Number(
                                                                    alert.latitude
                                                                ),
                                                            longitude:
                                                                Number(
                                                                    alert.longitude
                                                                ),
                                                        }}
                                                        title={
                                                            user?.fullName ||
                                                            "Emergency User"
                                                        }
                                                        description="SOS alert location"
                                                    />
                                                </MapView>

                                                <TouchableOpacity
                                                    style={
                                                        styles.locationButton
                                                    }
                                                    onPress={() =>
                                                        openLocation(
                                                            alert
                                                        )
                                                    }
                                                >
                                                    <Ionicons
                                                        name="navigate"
                                                        size={20}
                                                        color="#fff"
                                                    />

                                                    <Text
                                                        style={
                                                            styles.locationText
                                                        }
                                                    >
                                                        Open in Google Maps
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                </View>
                            );
                        })}
                    </>
                )}
            </ScrollView>

            {/* ========================================== */}
            {/* Assign Officer Modal */}
            {/* ========================================== */}

            {showOfficerModal && (
                <View
                    style={styles.modalOverlay}
                >
                    <View
                        style={
                            styles.modalContainer
                        }
                    >
                        {/* Modal Header */}

                        <View
                            style={
                                styles.modalHeader
                            }
                        >
                            <Text
                                style={
                                    styles.modalTitle
                                }
                            >
                                Assign Officer
                            </Text>

                            <TouchableOpacity
                                onPress={() => {
                                    setShowOfficerModal(
                                        false
                                    );
                                    setSelectedOfficer(
                                        null
                                    );
                                    setAssigningAlertId(
                                        null
                                    );
                                }}
                            >
                                <Ionicons
                                    name="close"
                                    size={25}
                                    color="#333"
                                />
                            </TouchableOpacity>
                        </View>

                        <Text
                            style={
                                styles.modalSubtitle
                            }
                        >
                            Select an available officer
                            from your company.
                        </Text>

                        {/* Officer List */}

                        <ScrollView
                            showsVerticalScrollIndicator={
                                false
                            }
                            style={
                                styles.officerList
                            }
                        >
                            {officers
                                .filter(
                                    (officer) =>
                                        officer.status ===
                                        "active"
                                )
                                .map(
                                    (
                                        officer
                                    ) => (
                                        <TouchableOpacity
                                            key={
                                                officer._id
                                            }
                                            style={
                                                styles.officerOption
                                            }
                                            onPress={() =>
                                                setSelectedOfficer(
                                                    officer
                                                )
                                            }
                                        >
                                            <View
                                                style={
                                                    styles.officerAvatar
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.officerAvatarText
                                                    }
                                                >
                                                    {officer.firstName?.charAt(
                                                        0
                                                    )}
                                                    {officer.lastName?.charAt(
                                                        0
                                                    )}
                                                </Text>
                                            </View>

                                            <View
                                                style={
                                                    styles.officerOptionInfo
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.officerOptionName
                                                    }
                                                >
                                                    {
                                                        officer.firstName
                                                    }{" "}
                                                    {
                                                        officer.lastName
                                                    }
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.officerOptionRank
                                                    }
                                                >
                                                    {
                                                        officer.rank
                                                    }
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.officerOptionPhone
                                                    }
                                                >
                                                    {officer.phoneNumber ||
                                                        "No phone number"}
                                                </Text>
                                            </View>

                                            <Ionicons
                                                name={
                                                    selectedOfficer?._id ===
                                                    officer._id
                                                        ? "radio-button-on"
                                                        : "radio-button-off"
                                                }
                                                size={
                                                    24
                                                }
                                                color={
                                                    selectedOfficer?._id ===
                                                    officer._id
                                                        ? "#002E15"
                                                        : "#999"
                                                }
                                            />
                                        </TouchableOpacity>
                                    )
                                )}
                        </ScrollView>

                        {/* No Officers */}

                        {officers.filter(
                            (officer) =>
                                officer.status ===
                                "active"
                        ).length === 0 && (
                            <View
                                style={
                                    styles.noOfficers
                                }
                            >
                                <Ionicons
                                    name="people-outline"
                                    size={45}
                                    color="#999"
                                />

                                <Text
                                    style={
                                        styles.noOfficersText
                                    }
                                >
                                    No active officers
                                    available.
                                </Text>
                            </View>
                        )}

                        {/* Confirm */}

                        <TouchableOpacity
                            style={[
                                styles.confirmAssignButton,
                                !selectedOfficer &&
                                    styles.confirmAssignDisabled,
                            ]}
                            disabled={
                                !selectedOfficer
                            }
                            onPress={() => {
                                if (
                                    assigningAlertId &&
                                    selectedOfficer
                                ) {
                                    assignOfficer(
                                        assigningAlertId,
                                        selectedOfficer._id
                                    );
                                }
                            }}
                        >
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={21}
                                color="#fff"
                            />

                            <Text
                                style={
                                    styles.confirmAssignText
                                }
                            >
                                Assign Officer
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

// ======================================================
// Styles
// ======================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#EEF6F3",
    },

    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#EEF6F3",
    },

    loadingText: {
        marginTop: 15,
        color: "#666",
        fontSize: 15,
    },

    header: {
        backgroundColor: "#002E15",
        paddingHorizontal: 20,
        paddingVertical: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        elevation: 6,
    },

    headerTitle: {
        color: "#fff",
        fontSize: 21,
        fontWeight: "700",
    },

    content: {
        padding: 16,
        paddingBottom: 40,
    },

    emptyContent: {
        padding: 16,
        flexGrow: 1,
    },

    summaryCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        marginBottom: 22,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.07,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 4,
        },
    },

    summaryLabel: {
        color: "#777",
        fontSize: 14,
    },

    summaryValue: {
        color: "#002E15",
        fontSize: 32,
        fontWeight: "700",
        marginTop: 4,
    },

    summaryIcon: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: "#FEE2E2",
        justifyContent: "center",
        alignItems: "center",
    },

    sectionTitle: {
        color: "#002E15",
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 14,
    },

    incidentCard: {
        backgroundColor: "#fff",
        borderRadius: 22,
        padding: 18,
        marginBottom: 18,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 4,
        },
    },

    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
    },

    alertIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: "#DC2626",
        justifyContent: "center",
        alignItems: "center",
    },

    headerInfo: {
        flex: 1,
        marginLeft: 13,
    },

    alertTitle: {
        color: "#002E15",
        fontSize: 17,
        fontWeight: "700",
    },

    date: {
        color: "#888",
        fontSize: 12,
        marginTop: 4,
    },

    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 20,
    },

    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        marginRight: 5,
    },

    statusText: {
        fontSize: 12,
        fontWeight: "700",
        textTransform: "capitalize",
    },

    divider: {
        height: 1,
        backgroundColor: "#F0F0F0",
        marginVertical: 17,
    },

    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 17,
    },

    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#F8FAFC",
        justifyContent: "center",
        alignItems: "center",
    },

    infoContent: {
        flex: 1,
        marginLeft: 12,
    },

    infoLabel: {
        color: "#888",
        fontSize: 12,
        fontWeight: "600",
    },

    infoValue: {
        color: "#111827",
        fontSize: 15,
        fontWeight: "700",
        marginTop: 3,
    },

    callButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#16A34A",
        justifyContent: "center",
        alignItems: "center",
    },

    messageContainer: {
        backgroundColor: "#F8FAFC",
        borderRadius: 15,
        padding: 15,
        marginTop: 2,
        marginBottom: 15,
    },

    message: {
        color: "#333",
        fontSize: 14,
        lineHeight: 21,
        marginTop: 6,
    },

    // ==========================================
    // Incident Status
    // ==========================================

    incidentStatusContainer: {
        backgroundColor: "#F8FAFC",
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    incidentStatusText: {
        fontSize: 15,
        fontWeight: "700",
        marginTop: 4,
    },

    statusUpdateButton: {
        height: 42,
        paddingHorizontal: 14,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },

    statusUpdateText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "700",
        marginLeft: 6,
    },

    // ==========================================
    // Location
    // ==========================================

    mapContainer: {
        marginTop: 5,
        marginBottom: 15,
    },

    mapTitle: {
        color: "#002E15",
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 10,
    },

    map: {
        width: "100%",
        height: 220,
        borderRadius: 16,
        overflow: "hidden",
    },

    locationButton: {
        height: 50,
        backgroundColor: "#002E15",
        borderRadius: 14,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
    },

    locationText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
        marginLeft: 8,
    },

    // ==========================================
    // Empty
    // ==========================================

    empty: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 25,
        paddingTop: 80,
    },

    emptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#DDEDE5",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },

    emptyTitle: {
        color: "#002E15",
        fontSize: 24,
        fontWeight: "700",
    },

    emptyText: {
        color: "#777",
        fontSize: 15,
        lineHeight: 22,
        textAlign: "center",
        marginTop: 10,
        maxWidth: 320,
    },

    // ==========================================
    // Assign Officer
    // ==========================================

    assignOfficerButton: {
        height: 48,
        backgroundColor: "#002E15",
        borderRadius: 13,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 15,
    },

    assignOfficerText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700",
        marginLeft: 7,
    },

    // ==========================================
    // Assigned Officer
    // ==========================================

    assignedOfficerContainer: {
        backgroundColor: "#F0FDF4",
        borderRadius: 15,
        padding: 14,
        marginBottom: 15,
        flexDirection: "row",
        alignItems: "center",
    },

    assignedOfficerIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: "#DCFCE7",
        justifyContent: "center",
        alignItems: "center",
    },

    assignedOfficerInfo: {
        flex: 1,
        marginLeft: 12,
    },

    assignedOfficerPhone: {
        color: "#777",
        fontSize: 13,
        marginTop: 3,
    },

    // ==========================================
    // Modal
    // ==========================================

    modalOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },

    modalContainer: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 20,
        maxHeight: "85%",
    },

    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    modalTitle: {
        color: "#002E15",
        fontSize: 22,
        fontWeight: "700",
    },

    modalSubtitle: {
        color: "#777",
        fontSize: 14,
        marginTop: 6,
        marginBottom: 15,
    },

    officerList: {
        marginBottom: 15,
    },

    officerOption: {
        backgroundColor: "#F8FAFC",
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
    },

    officerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#002E15",
        justifyContent: "center",
        alignItems: "center",
    },

    officerAvatarText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "700",
    },

    officerOptionInfo: {
        flex: 1,
        marginLeft: 12,
    },

    officerOptionName: {
        color: "#002E15",
        fontSize: 16,
        fontWeight: "700",
    },

    officerOptionRank: {
        color: "#0F766E",
        fontSize: 13,
        fontWeight: "600",
        marginTop: 2,
    },

    officerOptionPhone: {
        color: "#777",
        fontSize: 12,
        marginTop: 3,
    },

    noOfficers: {
        alignItems: "center",
        paddingVertical: 25,
    },

    noOfficersText: {
        color: "#777",
        marginTop: 8,
    },

    confirmAssignButton: {
        height: 52,
        borderRadius: 14,
        backgroundColor: "#002E15",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },

    confirmAssignDisabled: {
        backgroundColor: "#9CA3AF",
    },

    confirmAssignText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
        marginLeft: 7,
    },
});