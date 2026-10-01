import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "../config/api";
import { showError, showSuccess } from "../utils/toast";

type EmergencyRecording = {
    alertId?: string;

    incidentStatus?: string;

    latitude?: number;
    longitude?: number;

    locationUrl?: string;

    createdAt?: string;

    original?: {
        videoUrl?: string;
        fileName?: string;
        fileSize?: number;
    };

    watermarked?: {
        videoUrl?: string;
        fileName?: string;
        fileSize?: number;
        sha256?: string;
    };

    recordingStartedAt?: string;
    recordingEndedAt?: string;

    stopReason?:
    | "user"
    | "officer_resolved"
    | "technical";

    timezone?: string;
};

export default function EmergencyRecordings() {
    const router = useRouter();

    const [recordings, setRecordings] = useState<EmergencyRecording[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    /**
     * Get the recording URL regardless of whether the backend
     * returns a direct recording object or wraps it inside
     * emergencyRecording.
     */
    const getVideoUrl = (
        recording: EmergencyRecording
    ): string | null => {
        return (
            recording.watermarked?.videoUrl ||
            recording.original?.videoUrl ||
            null
        );
    };

    /**
     * Get the alert/case ID.
     */
    const getAlertId = (
        recording: EmergencyRecording
    ): string => {
        return recording.alertId || "Unknown";
    };
    /**
     * Get the recording date.
     */
    const getRecordingDate = (
        recording: EmergencyRecording
    ): string | null => {
        return (
            recording.recordingStartedAt ||
            recording.recordingEndedAt ||
            recording.createdAt ||
            null
        );
    };
    /**
     * Format date and time for South Africa.
     */
    const formatDateTime = (
        dateValue: string | null
    ) => {
        if (!dateValue) {
            return "Date unavailable";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "Date unavailable";
        }

        return date.toLocaleString("en-ZA", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Africa/Johannesburg",
        });
    };

    /**
     * Format the recording stop reason.
     */
    const formatStopReason = (
        recording: EmergencyRecording
    ) => {
        switch (recording.stopReason) {
            case "user":
                return "Stopped manually";

            case "officer_resolved":
                return "Stopped after SOS was resolved";

            case "technical":
                return "Technical stop";

            default:
                return "Emergency recording";
        }
    };
    /**
     * Load all emergency recordings belonging
     * to the currently logged-in user.
     */
    const loadRecordings = useCallback(async () => {
        try {
            setLoading(true);

            const userId =
                await AsyncStorage.getItem("userId");

            if (!userId) {
                showError(
                    "User Not Found",
                    "Please log in again."
                );

                return;
            }

            console.log(
                "📹 Loading emergency recordings for:",
                userId
            );

            const response = await api.get(
                `/alerts/user/${userId}/recordings`
            );

            console.log(
                "📹 Emergency recordings response:",
                response.data
            );

            const loadedRecordings =
                Array.isArray(response.data?.recordings)
                    ? response.data.recordings
                    : [];

            /**
             * Prefer the watermarked evidence video.
             * If watermarking failed, the original video
             * is still available.
             */
            const validRecordings =
                loadedRecordings.filter(
                    (recording: EmergencyRecording) =>
                        !!getVideoUrl(recording)
                );

            setRecordings(validRecordings);

        } catch (error: any) {
            console.error(
                "❌ Failed to load emergency recordings:",
                error
            );

            if (error?.response) {
                console.error(
                    "❌ Server response:",
                    error.response.data
                );
            }

            showError(
                "Unable to Load Recordings",
                "Could not retrieve your emergency recordings."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Reload recordings whenever the screen
     * becomes active.
     */
    useFocusEffect(
        useCallback(() => {
            loadRecordings();
        }, [loadRecordings])
    );

    /**
     * Download one emergency recording.
     */
    const downloadRecording = async (
        recording: EmergencyRecording
    ) => {
        const videoUrl = getVideoUrl(recording);

        if (!videoUrl) {
            showError(
                "Download Failed",
                "No video is available for this recording."
            );

            return;
        }

        const recordingId = getAlertId(recording);

        try {
            setDownloadingId(recordingId);

            console.log(
                "📥 Downloading emergency recording:",
                videoUrl
            );

            const timestamp = Date.now();

            const fileName =
                `Salema-Emergency-${recordingId}-${timestamp}.mp4`;

            const destination =
                new File(
                    Paths.cache,
                    fileName
                );

            const downloadedFile =
                await File.downloadFileAsync(
                    videoUrl,
                    destination
                );

            console.log(
                "✅ Recording downloaded:",
                downloadedFile.uri
            );

            /**
             * Open the Android/iOS share sheet so
             * the user can save/send the video.
             */
            const sharingAvailable =
                await Sharing.isAvailableAsync();

            if (sharingAvailable) {
                await Sharing.shareAsync(
                    downloadedFile.uri,
                    {
                        mimeType: "video/mp4",
                        dialogTitle:
                            "Save Emergency Recording",
                    }
                );
            } else {
                showSuccess(
                    "Download Complete",
                    "Emergency recording downloaded successfully."
                );
            }

        } catch (error: any) {
            console.error(
                "❌ Emergency recording download failed:",
                error
            );

            showError(
                "Download Failed",
                "Unable to download the emergency recording."
            );
        } finally {
            setDownloadingId(null);
        }
    };

    /**
     * Confirm before downloading evidence.
     */
    const confirmDownload = (
        recording: EmergencyRecording
    ) => {
        Alert.alert(
            "Download Emergency Recording",
            "Do you want to download this emergency recording?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Download",
                    onPress: () =>
                        downloadRecording(recording),
                },
            ]
        );
    };

    /**
     * Render one recording.
     */
    const renderRecording = ({
        item,
    }: {
        item: EmergencyRecording;
    }) => {
        const alertId = getAlertId(item);

        const videoUrl = getVideoUrl(item);

        const isDownloading =
            downloadingId === alertId;

        return (
            <View style={styles.recordingCard}>

                {/* VIDEO ICON */}
                <View style={styles.videoIconContainer}>
                    <Ionicons
                        name="videocam"
                        size={28}
                        color="white"
                    />
                </View>

                {/* RECORDING INFORMATION */}
                <View style={styles.recordingInfo}>

                    <Text style={styles.recordingTitle}>
                        Emergency Recording
                    </Text>

                    <View style={styles.infoRow}>
                        <Ionicons
                            name="location-outline"
                            size={15}
                            color="#777"
                        />

                        <Text style={styles.infoText}>
                            GPS emergency recording
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons
                            name="calendar-outline"
                            size={15}
                            color="#777"
                        />

                        <Text style={styles.infoText}>
                            {formatDateTime(
                                getRecordingDate(item)
                            )}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons
                            name="information-circle-outline"
                            size={15}
                            color="#777"
                        />

                        <Text
                            style={styles.infoText}
                            numberOfLines={1}
                        >
                            Case: {alertId}
                        </Text>
                    </View>

                    <Text style={styles.stopReason}>
                        {formatStopReason(item)}
                    </Text>

                </View>

                {/* DOWNLOAD */}
                <TouchableOpacity
                    style={[
                        styles.downloadButton,
                        isDownloading &&
                        styles.downloadButtonDisabled,
                    ]}
                    onPress={() =>
                        confirmDownload(item)
                    }
                    disabled={
                        isDownloading ||
                        !videoUrl
                    }
                >
                    {isDownloading ? (
                        <ActivityIndicator
                            size="small"
                            color="white"
                        />
                    ) : (
                        <Ionicons
                            name="download-outline"
                            size={21}
                            color="white"
                        />
                    )}
                </TouchableOpacity>

            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>

            {/* HEADER */}
            <View style={styles.header}>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color="#002E15"
                    />
                </TouchableOpacity>

                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>
                        Emergency Recordings
                    </Text>

                    <Text style={styles.headerSubtitle}>
                        Your emergency video evidence
                    </Text>
                </View>

            </View>

            {/* CONTENT */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator
                        size="large"
                        color="#002E15"
                    />

                    <Text style={styles.loadingText}>
                        Loading recordings...
                    </Text>
                </View>
            ) : recordings.length === 0 ? (
                <View style={styles.emptyContainer}>

                    <View style={styles.emptyIcon}>
                        <Ionicons
                            name="videocam-outline"
                            size={42}
                            color="#002E15"
                        />
                    </View>

                    <Text style={styles.emptyTitle}>
                        No Emergency Recordings
                    </Text>

                    <Text style={styles.emptyMessage}>
                        Emergency recordings will appear
                        here after an SOS incident has
                        been recorded.
                    </Text>

                    <TouchableOpacity
                        style={styles.backHomeButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={18}
                            color="white"
                        />

                        <Text style={styles.backHomeText}>
                            Back
                        </Text>
                    </TouchableOpacity>

                </View>
            ) : (
                <FlatList
                    data={recordings}
                    keyExtractor={(item, index) =>
                        `${getAlertId(item)}-${index}`
                    }
                    renderItem={renderRecording}
                    contentContainerStyle={
                        styles.listContent
                    }
                    showsVerticalScrollIndicator={false}
                    refreshing={loading}
                    onRefresh={loadRecordings}
                    ListHeaderComponent={
                        <View style={styles.listHeader}>

                            <View
                                style={
                                    styles.securityNotice
                                }
                            >
                                <Ionicons
                                    name="shield-checkmark-outline"
                                    size={22}
                                    color="#002E15"
                                />

                                <View
                                    style={
                                        styles.securityNoticeText
                                    }
                                >
                                    <Text
                                        style={
                                            styles.securityNoticeTitle
                                        }
                                    >
                                        Emergency Evidence
                                    </Text>

                                    <Text
                                        style={
                                            styles.securityNoticeMessage
                                        }
                                    >
                                        These recordings are
                                        associated with your
                                        SOS incidents.
                                    </Text>
                                </View>

                            </View>

                            <Text
                                style={styles.recordingCount}
                            >
                                {recordings.length}{" "}
                                {recordings.length === 1
                                    ? "recording"
                                    : "recordings"}
                            </Text>

                        </View>
                    }
                />
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F7F8F7",
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 15,
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#EEF4EF",
        alignItems: "center",
        justifyContent: "center",
    },

    headerTextContainer: {
        marginLeft: 12,
        flex: 1,
    },

    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#002E15",
    },

    headerSubtitle: {
        fontSize: 13,
        color: "#777",
        marginTop: 2,
    },

    listContent: {
        padding: 16,
        paddingBottom: 30,
    },

    listHeader: {
        marginBottom: 12,
    },

    securityNotice: {
        backgroundColor: "#EAF3EB",
        borderRadius: 14,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
    },

    securityNoticeText: {
        flex: 1,
        marginLeft: 10,
    },

    securityNoticeTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#002E15",
    },

    securityNoticeMessage: {
        fontSize: 12,
        color: "#666",
        marginTop: 3,
        lineHeight: 17,
    },

    recordingCount: {
        fontSize: 13,
        fontWeight: "600",
        color: "#666",
        marginTop: 15,
        marginBottom: 4,
    },

    recordingCard: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 5,

        elevation: 2,
    },

    videoIconContainer: {
        width: 54,
        height: 54,
        borderRadius: 14,
        backgroundColor: "#002E15",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },

    recordingInfo: {
        flex: 1,
        minWidth: 0,
    },

    recordingTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#222",
        marginBottom: 7,
    },

    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },

    infoText: {
        flex: 1,
        marginLeft: 5,
        fontSize: 12,
        color: "#666",
    },

    stopReason: {
        fontSize: 11,
        color: "#888",
        marginTop: 6,
    },

    downloadButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "#002E15",
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 10,
    },

    downloadButtonDisabled: {
        opacity: 0.6,
    },

    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 30,
    },

    loadingText: {
        marginTop: 12,
        color: "#666",
        fontSize: 14,
    },

    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 35,
    },

    emptyIcon: {
        width: 86,
        height: 86,
        borderRadius: 43,
        backgroundColor: "#EAF3EB",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },

    emptyTitle: {
        fontSize: 21,
        fontWeight: "700",
        color: "#002E15",
        textAlign: "center",
    },

    emptyMessage: {
        fontSize: 14,
        lineHeight: 21,
        color: "#777",
        textAlign: "center",
        marginTop: 10,
        marginBottom: 25,
    },

    backHomeButton: {
        backgroundColor: "#002E15",
        minHeight: 48,
        paddingHorizontal: 22,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
    },

    backHomeText: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
    },
});

