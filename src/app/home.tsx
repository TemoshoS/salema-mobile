import AlertButton from "@/components/AlertButton";
import useShake from "@/hooks/useShake";
import useVoiceEmergency from "@/hooks/useVoiceEmergency";
import { showError, showInfo, showSuccess } from "@/utils/toast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import {
    CameraView,
    useCameraPermissions,
    useMicrophonePermissions,
} from "expo-camera";
import axios from "axios";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    Vibration,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import { api } from "../config/api";
import { IMAGES } from "../constants/assets";

type Country = {
    name: string;
    code: string;
    flag: string;
};

const COUNTRIES: Country[] = [
    { name: "Afghanistan", code: "+93", flag: "🇦🇫" },
    { name: "Albania", code: "+355", flag: "🇦🇱" },
    { name: "Algeria", code: "+213", flag: "🇩🇿" },
    { name: "Andorra", code: "+376", flag: "🇦🇩" },
    { name: "Angola", code: "+244", flag: "🇦🇴" },
    { name: "Argentina", code: "+54", flag: "🇦🇷" },
    { name: "Armenia", code: "+374", flag: "🇦🇲" },
    { name: "Australia", code: "+61", flag: "🇦🇺" },
    { name: "Austria", code: "+43", flag: "🇦🇹" },
    { name: "Azerbaijan", code: "+994", flag: "🇦🇿" },
    { name: "Bahamas", code: "+1", flag: "🇧🇸" },
    { name: "Bahrain", code: "+973", flag: "🇧🇭" },
    { name: "Bangladesh", code: "+880", flag: "🇧🇩" },
    { name: "Barbados", code: "+1", flag: "🇧🇧" },
    { name: "Belarus", code: "+375", flag: "🇧🇾" },
    { name: "Belgium", code: "+32", flag: "🇧🇪" },
    { name: "Belize", code: "+501", flag: "🇧🇿" },
    { name: "Benin", code: "+229", flag: "🇧🇯" },
    { name: "Bolivia", code: "+591", flag: "🇧🇴" },
    { name: "Bosnia and Herzegovina", code: "+387", flag: "🇧🇦" },
    { name: "Botswana", code: "+267", flag: "🇧🇼" },
    { name: "Brazil", code: "+55", flag: "🇧🇷" },
    { name: "Brunei", code: "+673", flag: "🇧🇳" },
    { name: "Bulgaria", code: "+359", flag: "🇧🇬" },
    { name: "Burkina Faso", code: "+226", flag: "🇧🇫" },
    { name: "Burundi", code: "+257", flag: "🇧🇮" },
    { name: "Cambodia", code: "+855", flag: "🇰🇭" },
    { name: "Cameroon", code: "+237", flag: "🇨🇲" },
    { name: "Canada", code: "+1", flag: "🇨🇦" },
    { name: "Cape Verde", code: "+238", flag: "🇨🇻" },
    { name: "Central African Republic", code: "+236", flag: "🇨🇫" },
    { name: "Chad", code: "+235", flag: "🇹🇩" },
    { name: "Chile", code: "+56", flag: "🇨🇱" },
    { name: "China", code: "+86", flag: "🇨🇳" },
    { name: "Colombia", code: "+57", flag: "🇨🇴" },
    { name: "Comoros", code: "+269", flag: "🇰🇲" },
    { name: "Congo", code: "+242", flag: "🇨🇬" },
    { name: "Costa Rica", code: "+506", flag: "🇨🇷" },
    { name: "Croatia", code: "+385", flag: "🇭🇷" },
    { name: "Cuba", code: "+53", flag: "🇨🇺" },
    { name: "Cyprus", code: "+357", flag: "🇨🇾" },
    { name: "Czech Republic", code: "+420", flag: "🇨🇿" },
    { name: "Denmark", code: "+45", flag: "🇩🇰" },
    { name: "Djibouti", code: "+253", flag: "🇩🇯" },
    { name: "Dominica", code: "+1", flag: "🇩🇲" },
    { name: "Dominican Republic", code: "+1", flag: "🇩🇴" },
    { name: "Ecuador", code: "+593", flag: "🇪🇨" },
    { name: "Egypt", code: "+20", flag: "🇪🇬" },
    { name: "El Salvador", code: "+503", flag: "🇸🇻" },
    { name: "Estonia", code: "+372", flag: "🇪🇪" },
    { name: "Eswatini", code: "+268", flag: "🇸🇿" },
    { name: "Ethiopia", code: "+251", flag: "🇪🇹" },
    { name: "Fiji", code: "+679", flag: "🇫🇯" },
    { name: "Finland", code: "+358", flag: "🇫🇮" },
    { name: "France", code: "+33", flag: "🇫🇷" },
    { name: "Gabon", code: "+241", flag: "🇬🇦" },
    { name: "Gambia", code: "+220", flag: "🇬🇲" },
    { name: "Georgia", code: "+995", flag: "🇬🇪" },
    { name: "Germany", code: "+49", flag: "🇩🇪" },
    { name: "Ghana", code: "+233", flag: "🇬🇭" },
    { name: "Greece", code: "+30", flag: "🇬🇷" },
    { name: "Grenada", code: "+1", flag: "🇬🇩" },
    { name: "Guatemala", code: "+502", flag: "🇬🇹" },
    { name: "Guinea", code: "+224", flag: "🇬🇳" },
    { name: "Guyana", code: "+592", flag: "🇬🇾" },
    { name: "Haiti", code: "+509", flag: "🇭🇹" },
    { name: "Honduras", code: "+504", flag: "🇭🇳" },
    { name: "Hong Kong", code: "+852", flag: "🇭🇰" },
    { name: "Hungary", code: "+36", flag: "🇭🇺" },
    { name: "Iceland", code: "+354", flag: "🇮🇸" },
    { name: "India", code: "+91", flag: "🇮🇳" },
    { name: "Indonesia", code: "+62", flag: "🇮🇩" },
    { name: "Iran", code: "+98", flag: "🇮🇷" },
    { name: "Iraq", code: "+964", flag: "🇮🇶" },
    { name: "Ireland", code: "+353", flag: "🇮🇪" },
    { name: "Israel", code: "+972", flag: "🇮🇱" },
    { name: "Italy", code: "+39", flag: "🇮🇹" },
    { name: "Jamaica", code: "+1", flag: "🇯🇲" },
    { name: "Japan", code: "+81", flag: "🇯🇵" },
    { name: "Jordan", code: "+962", flag: "🇯🇴" },
    { name: "Kazakhstan", code: "+7", flag: "🇰🇿" },
    { name: "Kenya", code: "+254", flag: "🇰🇪" },
    { name: "Kuwait", code: "+965", flag: "🇰🇼" },
    { name: "Kyrgyzstan", code: "+996", flag: "🇰🇬" },
    { name: "Laos", code: "+856", flag: "🇱🇦" },
    { name: "Latvia", code: "+371", flag: "🇱🇻" },
    { name: "Lebanon", code: "+961", flag: "🇱🇧" },
    { name: "Lesotho", code: "+266", flag: "🇱🇸" },
    { name: "Liberia", code: "+231", flag: "🇱🇷" },
    { name: "Libya", code: "+218", flag: "🇱🇾" },
    { name: "Liechtenstein", code: "+423", flag: "🇱🇮" },
    { name: "Lithuania", code: "+370", flag: "🇱🇹" },
    { name: "Luxembourg", code: "+352", flag: "🇱🇺" },
    { name: "Madagascar", code: "+261", flag: "🇲🇬" },
    { name: "Malawi", code: "+265", flag: "🇲🇼" },
    { name: "Malaysia", code: "+60", flag: "🇲🇾" },
    { name: "Maldives", code: "+960", flag: "🇲🇻" },
    { name: "Mali", code: "+223", flag: "🇲🇱" },
    { name: "Malta", code: "+356", flag: "🇲🇹" },
    { name: "Mauritius", code: "+230", flag: "🇲🇺" },
    { name: "Mexico", code: "+52", flag: "🇲🇽" },
    { name: "Moldova", code: "+373", flag: "🇲🇩" },
    { name: "Monaco", code: "+377", flag: "🇲🇨" },
    { name: "Mongolia", code: "+976", flag: "🇲🇳" },
    { name: "Montenegro", code: "+382", flag: "🇲🇪" },
    { name: "Morocco", code: "+212", flag: "🇲🇦" },
    { name: "Mozambique", code: "+258", flag: "🇲🇿" },
    { name: "Myanmar", code: "+95", flag: "🇲🇲" },
    { name: "Namibia", code: "+264", flag: "🇳🇦" },
    { name: "Nepal", code: "+977", flag: "🇳🇵" },
    { name: "Netherlands", code: "+31", flag: "🇳🇱" },
    { name: "New Zealand", code: "+64", flag: "🇳🇿" },
    { name: "Nicaragua", code: "+505", flag: "🇳🇮" },
    { name: "Niger", code: "+227", flag: "🇳🇪" },
    { name: "Nigeria", code: "+234", flag: "🇳🇬" },
    { name: "North Macedonia", code: "+389", flag: "🇲🇰" },
    { name: "Norway", code: "+47", flag: "🇳🇴" },
    { name: "Oman", code: "+968", flag: "🇴🇲" },
    { name: "Pakistan", code: "+92", flag: "🇵🇰" },
    { name: "Panama", code: "+507", flag: "🇵🇦" },
    { name: "Papua New Guinea", code: "+675", flag: "🇵🇬" },
    { name: "Paraguay", code: "+595", flag: "🇵🇾" },
    { name: "Peru", code: "+51", flag: "🇵🇪" },
    { name: "Philippines", code: "+63", flag: "🇵🇭" },
    { name: "Poland", code: "+48", flag: "🇵🇱" },
    { name: "Portugal", code: "+351", flag: "🇵🇹" },
    { name: "Qatar", code: "+974", flag: "🇶🇦" },
    { name: "Romania", code: "+40", flag: "🇷🇴" },
    { name: "Russia", code: "+7", flag: "🇷🇺" },
    { name: "Rwanda", code: "+250", flag: "🇷🇼" },
    { name: "Saudi Arabia", code: "+966", flag: "🇸🇦" },
    { name: "Senegal", code: "+221", flag: "🇸🇳" },
    { name: "Serbia", code: "+381", flag: "🇷🇸" },
    { name: "Seychelles", code: "+248", flag: "🇸🇨" },
    { name: "Sierra Leone", code: "+232", flag: "🇸🇱" },
    { name: "Singapore", code: "+65", flag: "🇸🇬" },
    { name: "Slovakia", code: "+421", flag: "🇸🇰" },
    { name: "Slovenia", code: "+386", flag: "🇸🇮" },
    { name: "Somalia", code: "+252", flag: "🇸🇴" },
    { name: "South Africa", code: "+27", flag: "🇿🇦" },
    { name: "South Korea", code: "+82", flag: "🇰🇷" },
    { name: "South Sudan", code: "+211", flag: "🇸🇸" },
    { name: "Spain", code: "+34", flag: "🇪🇸" },
    { name: "Sri Lanka", code: "+94", flag: "🇱🇰" },
    { name: "Sudan", code: "+249", flag: "🇸🇩" },
    { name: "Suriname", code: "+597", flag: "🇸🇷" },
    { name: "Sweden", code: "+46", flag: "🇸🇪" },
    { name: "Switzerland", code: "+41", flag: "🇨🇭" },
    { name: "Syria", code: "+963", flag: "🇸🇾" },
    { name: "Taiwan", code: "+886", flag: "🇹🇼" },
    { name: "Tanzania", code: "+255", flag: "🇹🇿" },
    { name: "Thailand", code: "+66", flag: "🇹🇭" },
    { name: "Togo", code: "+228", flag: "🇹🇬" },
    { name: "Trinidad and Tobago", code: "+1", flag: "🇹🇹" },
    { name: "Tunisia", code: "+216", flag: "🇹🇳" },
    { name: "Turkey", code: "+90", flag: "🇹🇷" },
    { name: "Uganda", code: "+256", flag: "🇺🇬" },
    { name: "Ukraine", code: "+380", flag: "🇺🇦" },
    { name: "United Arab Emirates", code: "+971", flag: "🇦🇪" },
    { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
    { name: "United States", code: "+1", flag: "🇺🇸" },
    { name: "Uruguay", code: "+598", flag: "🇺🇾" },
    { name: "Uzbekistan", code: "+998", flag: "🇺🇿" },
    { name: "Venezuela", code: "+58", flag: "🇻🇪" },
    { name: "Vietnam", code: "+84", flag: "🇻🇳" },
    { name: "Yemen", code: "+967", flag: "🇾🇪" },
    { name: "Zambia", code: "+260", flag: "🇿🇲" },
    { name: "Zimbabwe", code: "+263", flag: "🇿🇼" },
];

export default function Home() {
    const sendingSOSRef = useRef(false);

    const cameraRef = useRef<CameraView | null>(null);
    const recordingPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);
    const activeAlertIdsRef = useRef<Set<string>>(new Set());
    const pendingRecordingAlertIdRef = useRef<string | null>(null);
    const recordingAlertIdRef = useRef<string | null>(null);
    const shouldStartRecordingRef = useRef(false);
    const recordingStoppingRef = useRef(false);
    const recordingStopReasonRef =
        useRef<
            "user" |
            "officer_resolved" |
            "technical" |
            null
        >(null);

    const [cameraPermission, requestCameraPermission] =
        useCameraPermissions();

    const [microphonePermission, requestMicrophonePermission] =
        useMicrophonePermissions();
    const [cameraReady, setCameraReady] = useState(false);
    const [isRecordingEmergency, setIsRecordingEmergency] = useState(false);
    const [recordingAlertId, setRecordingAlertId] =
        useState<string | null>(null);
    const recordingStartTimeRef = useRef<number | null>(null);
    const [recordingDuration, setRecordingDuration] = useState(0);

    const [contacts, setContacts] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [countryPickerVisible, setCountryPickerVisible] = useState(false);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [relationship, setRelationship] = useState("");

    const [countryCode, setCountryCode] = useState<Country>(COUNTRIES.find(
        (country) => country.code === "+27"
    ) || COUNTRIES[0]);

    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editRelationship, setEditRelationship] = useState("");

    const [editCountryCode, setEditCountryCode] = useState<Country>(
        COUNTRIES.find((country) => country.code === "+27") || COUNTRIES[0]
    );

    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [voiceCommands, setVoiceCommands] = useState<string[]>([]);

    const [selectedContact, setSelectedContact] = useState<any>(null);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [editCountryPickerVisible, setEditCountryPickerVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    const [loadingAdd, setLoadingAdd] = useState(false);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [loadingList, setLoadingList] = useState(false);
    const [sendingSOS, setSendingSOS] = useState(false);

    const [iconState, setIconState] = useState<
        "inactive" | "activating" | "active"
    >("inactive");

    // Request camera and microphone permissions for emergency recording    

    const requestEmergencyCameraPermissions = useCallback(async () => {
        try {
            let hasCameraPermission =
                cameraPermission?.granted === true;

            let hasMicrophonePermission =
                microphonePermission?.granted === true;

            if (!hasCameraPermission) {
                const cameraResult =
                    await requestCameraPermission();

                hasCameraPermission = cameraResult.granted;
            }

            if (!hasCameraPermission) {
                console.warn("📷 Camera permission denied");
                return false;
            }

            if (!hasMicrophonePermission) {
                const microphoneResult =
                    await requestMicrophonePermission();

                hasMicrophonePermission =
                    microphoneResult.granted;
            }

            if (!hasMicrophonePermission) {
                console.warn("🎤 Microphone permission denied");
                return false;
            }

            return true;
        } catch (error) {
            console.error(
                "📷 Camera permission error:",
                error
            );

            return false;
        }
    }, [
        cameraPermission,
        microphonePermission,
        requestCameraPermission,
        requestMicrophonePermission,
    ]);

    const uploadEmergencyRecording = useCallback(
        async (
            videoUri: string,
            alertId: string,
            stopReason:
                | "user"
                | "officer_resolved"
                | "technical"
        ) => {
            try {
                console.log(
                    "📤 Uploading emergency recording..."
                );

                console.log("📤 Alert ID:", alertId);
                console.log("📤 Stop reason:", stopReason);
                console.log("📤 Video URI:", videoUri);

                const formData = new FormData();

                formData.append(
                    "video",
                    {
                        uri: videoUri,
                        name: `emergency-${alertId}.mp4`,
                        type: "video/mp4",
                    } as any
                );

                formData.append(
                    "stopReason",
                    stopReason
                );

                const response = await api.post(
                    `/alerts/${alertId}/recording`,
                    formData,
                    {
                        headers: {
                            "Content-Type":
                                "multipart/form-data",
                        },
                    }
                );

                console.log(
                    "✅ Emergency recording uploaded:",
                    response.data
                );

                return true;

            } catch (error) {
                console.error(
                    "❌ Emergency recording upload failed:",
                    error
                );

                if (axios.isAxiosError(error)) {
                    console.error(
                        "❌ Upload response:",
                        error.response?.data
                    );
                }

                return false;
            }
        },
        []
    );

    const startEmergencyRecording = useCallback(async () => {
        if (!cameraRef.current) {
            console.warn(
                "📷 Camera ref is not ready"
            );
            return;
        }

        if (isRecordingEmergency) {
            console.log(
                "📷 Emergency recording already active"
            );
            return;
        }

        if (recordingPromiseRef.current) {
            console.log(
                "📷 Recording already starting"
            );
            return;
        }

        const alertId =
            pendingRecordingAlertIdRef.current;

        if (!alertId) {
            console.warn(
                "📷 No alert ID available for recording"
            );
            return;
        }

        try {
            recordingStoppingRef.current = false;

            recordingStopReasonRef.current = null;

            setIsRecordingEmergency(true);

            recordingAlertIdRef.current = alertId;
            setRecordingAlertId(alertId);
            pendingRecordingAlertIdRef.current = null;

            console.log(
                "📷 Starting emergency recording for alert:",
                alertId
            );

            recordingStartTimeRef.current = Date.now();
            setRecordingDuration(0);


            const recordingPromise =
                cameraRef.current.recordAsync();

            recordingPromiseRef.current =
                recordingPromise;

            const video =
                await recordingPromise;

            recordingPromiseRef.current = null;

            if (video?.uri) {
                console.log(
                    "📹 Emergency video recorded:",
                    video.uri
                );

                console.log(
                    "📹 Alert ID:",
                    alertId
                );

                // Determine why recording stopped.
                const stopReason =
                    recordingStopReasonRef.current ||
                    "technical";

                console.log(
                    "📹 Recording stop reason:",
                    stopReason
                );

                // Upload the recorded video.
                await uploadEmergencyRecording(
                    video.uri,
                    alertId,
                    stopReason
                );
            }

        } catch (error) {
            console.error(
                "📷 Emergency recording error:",
                error
            );

            recordingPromiseRef.current = null;

            // If recording failed unexpectedly,
            // keep the incident active and record
            // the failure reason as technical.
            recordingStopReasonRef.current =
                "technical";

        } finally {
            setIsRecordingEmergency(false);

            recordingStartTimeRef.current = null;
            setRecordingDuration(0);

            recordingAlertIdRef.current = null;
            setRecordingAlertId(null);

            recordingStoppingRef.current = false;

            recordingStopReasonRef.current = null;
        }


    }, [
        isRecordingEmergency,
        uploadEmergencyRecording,
    ]);

    useEffect(() => {
        if (!isRecordingEmergency) {
            return;
        }

        const interval = setInterval(() => {
            if (recordingStartTimeRef.current) {
                const elapsed = Math.floor(
                    (Date.now() - recordingStartTimeRef.current) / 1000
                );

                setRecordingDuration(elapsed);
            }
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [isRecordingEmergency]);

    const stopEmergencyRecording = useCallback(
        (
            reason:
                | "user"
                | "officer_resolved"
        ) => {
            if (!cameraRef.current) {
                return;
            }

            if (!recordingPromiseRef.current) {
                return;
            }

            if (recordingStoppingRef.current) {
                return;
            }

            try {
                recordingStoppingRef.current = true;

                recordingStopReasonRef.current = reason;

                console.log(
                    "📷 Stopping emergency recording:",
                    reason
                );

                // Stop the camera immediately.
                cameraRef.current.stopRecording();

                // IMPORTANT:
                // Hide the recording UI immediately.
                // Do not wait for the video upload to finish.
                setIsRecordingEmergency(false);

                recordingStartTimeRef.current = null;
                setRecordingDuration(0);

                if (reason === "user") {
                    console.log(
                        "📷 Recording stopped manually. SOS remains active."
                    );
                }

                if (reason === "officer_resolved") {
                    console.log(
                        "📷 Recording stopped because officer resolved SOS."
                    );
                }

            } catch (error) {
                console.error(
                    "📷 Failed to stop recording:",
                    error
                );

                recordingStopReasonRef.current =
                    "technical";

                recordingStoppingRef.current = false;
            }
        },
        []
    );


    useEffect(() => {
        requestEmergencyCameraPermissions();
    }, [requestEmergencyCameraPermissions]);

    useEffect(() => {
        if (
            !cameraReady ||
            !shouldStartRecordingRef.current ||
            !pendingRecordingAlertIdRef.current
        ) {
            return;
        }

        shouldStartRecordingRef.current = false;

        startEmergencyRecording();
    }, [
        cameraReady,
        startEmergencyRecording,
    ]);

    useEffect(() => {
        console.log("📡 Starting SOS status monitoring for active alerts");

        const interval = setInterval(async () => {
            const alertIds = Array.from(activeAlertIdsRef.current);

            if (alertIds.length === 0) {
                return;
            }

            await Promise.all(
                alertIds.map(async (alertId) => {
                    try {
                        const response = await api.get(
                            `/alerts/${alertId}`
                        );

                        const alert = response.data?.alert;

                        console.log(
                            "📡 SOS status:",
                            alertId,
                            alert?.incidentStatus
                        );

                        if (alert?.incidentStatus === "resolved") {
                            console.log(
                                "🚨 Officer resolved SOS:",
                                alertId
                            );

                            activeAlertIdsRef.current.delete(alertId);

                            if (pendingRecordingAlertIdRef.current === alertId) {
                                pendingRecordingAlertIdRef.current = null;
                                shouldStartRecordingRef.current = false;
                            }

                            if (recordingAlertIdRef.current === alertId) {
                                stopEmergencyRecording(
                                    "officer_resolved"
                                );
                            }
                        }
                    } catch (error) {
                        console.log(
                            "📡 SOS status check failed:",
                            alertId,
                            error
                        );
                    }
                })
            );
        }, 5000);

        return () => {
            clearInterval(interval);
        };
    }, [stopEmergencyRecording]);

    // Function to send SOS alert


    const sendSOS = useCallback(async () => {
        // Prevent multiple SOS requests at the same time
        if (sendingSOSRef.current) {
            console.log("🚨 SOS already being sent...");
            return;
        }

        try {
            sendingSOSRef.current = true;
            setSendingSOS(true);
            setIconState("activating");

            console.log("🚨 Sending SOS...");

            // --------------------------------------------------
            // 1. GET USER ID
            // --------------------------------------------------
            const userId = await AsyncStorage.getItem("userId");

            if (!userId) {
                showError(
                    "User Not Found",
                    "Please log in again."
                );

                setIconState("inactive");
                return;
            }

            // --------------------------------------------------
            // 2. GET SELECTED SECURITY COMPANY
            // --------------------------------------------------
            const securityCompanyId =
                await AsyncStorage.getItem(
                    "selectedSecurityCompanyId"
                );

            console.log(
                "🛡️ Selected Security Company:",
                securityCompanyId
            );

            // --------------------------------------------------
            // 3. REQUEST LOCATION PERMISSION
            // --------------------------------------------------
            const { status } =
                await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                showInfo(
                    "Location Permission",
                    "Please allow location access to send an SOS."
                );

                setIconState("inactive");
                return;
            }

            // --------------------------------------------------
            // 4. GET CURRENT LOCATION
            // --------------------------------------------------
            const location =
                await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });

            const latitude = location.coords.latitude;
            const longitude = location.coords.longitude;

            console.log("📍 SOS Location:", {
                latitude,
                longitude,
            });

            // --------------------------------------------------
            // 5. VIBRATE
            // --------------------------------------------------
            Vibration.vibrate([300, 200, 300]);

            // --------------------------------------------------
            // 6. CREATE SOS ALERT
            // --------------------------------------------------
            const response = await api.post(
                "/alerts/send",
                {
                    userId,
                    latitude,
                    longitude,
                    ...(securityCompanyId
                        ? { securityCompanyId }
                        : {}),
                }
            );

            console.log(
                "🚨 SOS response:",
                response.data
            );

            // --------------------------------------------------
            // 7. GET ALERT ID
            // --------------------------------------------------
            const alertId =
                response.data?.alertId;

            if (!alertId) {
                throw new Error(
                    "SOS was created but no alert ID was returned."
                );
            }

            // --------------------------------------------------
            // 8. SAVE ACTIVE ALERT ID
            // --------------------------------------------------
            // Multiple alerts may remain active at the same time.
            activeAlertIdsRef.current.add(alertId);

            console.log(
                "🚨 SOS alert created:",
                alertId
            );

            // --------------------------------------------------
            // 9. CAMERA + MICROPHONE PERMISSIONS
            //
            // Camera recording is optional.
            // Failure here MUST NOT cancel the SOS.
            // --------------------------------------------------
            let cameraReadyForRecording = false;

            try {
                cameraReadyForRecording =
                    await requestEmergencyCameraPermissions();
            } catch (cameraPermissionError) {
                console.error(
                    "📷 Camera permission error:",
                    cameraPermissionError
                );

                cameraReadyForRecording = false;
            }

            // --------------------------------------------------
            // 10. START EMERGENCY RECORDING
            // --------------------------------------------------
            if (cameraReadyForRecording) {
                console.log(
                    "📷 Camera and microphone permissions available."
                );

                // Voice recognition also uses the microphone.
                // Disable voice SOS before video recording starts.
                setVoiceEnabled(false);

                // The camera can only record one video at a time.
                // If another alert is already being recorded, keep
                // this new alert active but do not start a second recording.
                if (
                    !recordingPromiseRef.current &&
                    !isRecordingEmergency &&
                    !pendingRecordingAlertIdRef.current &&
                    !recordingAlertIdRef.current
                ) {
                    pendingRecordingAlertIdRef.current = alertId;
                    shouldStartRecordingRef.current = true;
                } else {
                    shouldStartRecordingRef.current = false;
                    console.log(
                        "📷 Another emergency recording is already active. New SOS remains active without starting a second recording."
                    );
                }

                console.log(
                    "📷 Emergency recording requested"
                );

                // Camera may already be mounted and ready.
                if (cameraReady && shouldStartRecordingRef.current) {
                    shouldStartRecordingRef.current = false;

                    // Do NOT await this.
                    // recordAsync() remains pending until recording stops.
                    void startEmergencyRecording();
                } else {
                    console.log(
                        "📷 Camera is not ready yet. Recording will start when camera becomes ready."
                    );
                }
            } else {
                console.log(
                    "📷 Emergency recording unavailable."
                );

                console.log(
                    "🚨 SOS will continue without video recording."
                );
            }

            // --------------------------------------------------
            // 11. SOS SUCCESS
            // --------------------------------------------------
            console.log(
                "🚨 SOS alert created successfully"
            );

            setIconState("active");
            showSuccess(
                "SOS Activated",
                cameraReadyForRecording
                    ? recordingAlertIdRef.current === alertId
                        ? "Emergency alert sent and recording started."
                        : "Emergency alert sent. Another emergency recording is already active."
                    : "Emergency alert sent successfully."
            );

            // Return the SOS icon to inactive after 10 seconds.
            setTimeout(() => {
                setIconState("inactive");
            }, 10000);

        } catch (error: any) {
            console.error(
                "🚨 SOS Error:",
                error
            );

            // Only clear the active alert if the SOS itself failed.
            // If an alert was already successfully created,
            // we must NOT destroy its active state because a
            // later camera operation failed.
            setIconState("inactive");

            // Axios error
            if (axios.isAxiosError(error)) {
                showError(
                    "SOS Failed",
                    error.response?.data?.message ||
                    "Unable to send SOS."
                );
            } else {
                showError(
                    "SOS Failed",
                    error?.message ||
                    "Unable to send SOS."
                );
            }

        } finally {
            sendingSOSRef.current = false;
            setSendingSOS(false);
        }
    }, [
        cameraReady,
        isRecordingEmergency,
        requestEmergencyCameraPermissions,
        startEmergencyRecording,

    ]);



    const {
        isListening,
        startListening,
        stopListening,
    } = useVoiceEmergency(sendSOS, {
        commands: voiceCommands,
    });

    useEffect(() => {
        if (voiceEnabled) {
            startListening();
        } else {
            stopListening();
        }

        return () => {
            stopListening();
        };
    }, [voiceEnabled, startListening, stopListening]);

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        try {
            setLoadingList(true);

            const userId = await AsyncStorage.getItem("userId");
            const res = await api.get(`/contacts/user/${userId}`);

            setContacts(res.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoadingList(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            const loadVoiceSettings = async () => {
                const saved =
                    await AsyncStorage.getItem("VOICE_EMERGENCY_PHRASES");

                const enabled =
                    (await AsyncStorage.getItem(
                        "VOICE_EMERGENCY_ENABLED"
                    )) === "true";

                const commands = saved
                    ? JSON.parse(saved)
                    : ["salema help"];

                setVoiceCommands(commands);
                setVoiceEnabled(enabled);
            };

            loadVoiceSettings();
        }, [])
    );

    useShake(() => {
        if (!sendingSOS) {
            sendSOS();
        }
    });

    const resetAddContactForm = () => {
        setName("");
        setPhone("");
        setRelationship("");

        setCountryCode(
            COUNTRIES.find(
                (country) => country.code === "+27"
            ) || COUNTRIES[0]
        );
    };

    const closeAddModal = () => {
        setModalVisible(false);
        setCountryPickerVisible(false);
        resetAddContactForm();
    };

    const formatPhoneNumber = (
        selectedCode: string,
        phoneNumber: string
    ) => {
        const cleanedPhone = phoneNumber.replace(
            /[\s\-().]/g,
            ""
        );

        if (!cleanedPhone) {
            return "";
        }

        if (cleanedPhone.startsWith("+")) {
            return cleanedPhone;
        }

        return `${selectedCode}${cleanedPhone}`;
    };

    const addContact = async () => {
        if (!name.trim()) {
            showError(
                "Missing Name",
                "Please enter the contact's name."
            );
            return;
        }

        if (!phone.trim()) {
            showError(
                "Missing Phone Number",
                "Please enter a phone number."
            );
            return;
        }

        if (!relationship.trim()) {
            showError(
                "Missing Relationship",
                "Please enter the relationship."
            );
            return;
        }

        try {
            setLoadingAdd(true);

            const userId = await AsyncStorage.getItem("userId");

            const fullPhoneNumber = formatPhoneNumber(
                countryCode.code,
                phone
            );

            console.log(
                "📱 Trusted contact phone:",
                fullPhoneNumber
            );

            await api.post("/contacts/add", {
                userId,
                name: name.trim(),
                phone: fullPhoneNumber,
                relationship: relationship.trim(),
            });

            showSuccess(
                "Contact Added",
                "Trusted contact saved successfully."
            );

            closeAddModal();

            loadContacts();

        } catch (error) {
            if (axios.isAxiosError(error)) {
                showError(
                    "Add Contact Failed",
                    error.response?.data?.message ||
                    "Unable to add contact."
                );
            } else {
                showError(
                    "Add Contact Failed",
                    "Something went wrong."
                );
            }

            console.log(error);
        } finally {
            setLoadingAdd(false);
        }
    };

    const deleteContact = async (id: string) => {
        try {
            setLoadingDelete(true);

            await api.delete(`/contacts/${id}`);

            showSuccess(
                "Contact Deleted",
                "Trusted contact removed successfully."
            );

            setViewModalVisible(false);

            loadContacts();

        } catch (error) {
            if (axios.isAxiosError(error)) {
                showError(
                    "Delete Failed",
                    error.response?.data?.message ||
                    "Unable to delete contact."
                );
            } else {
                showError(
                    "Delete Failed",
                    "Something went wrong."
                );
            }

            console.log(error);
        } finally {
            setLoadingDelete(false);
        }
    };

    const confirmDelete = () => {
        if (!selectedContact) {
            return;
        }

        setDeleteModalVisible(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedContact) {
            return;
        }

        setDeleteModalVisible(false);

        await deleteContact(selectedContact._id);
    };
    const detectCountryFromPhone = (
        fullPhone: string
    ): Country => {
        const cleaned = fullPhone.replace(
            /[\s\-().]/g,
            ""
        );

        if (!cleaned.startsWith("+")) {
            return countryCode;
        }

        const matches = COUNTRIES.filter(
            (country) =>
                cleaned.startsWith(country.code)
        ).sort(
            (a, b) =>
                b.code.length - a.code.length
        );

        return matches[0] || countryCode;
    };

    const removeCountryCode = (
        fullPhone: string,
        selectedCode: string
    ) => {
        const cleaned = fullPhone.replace(
            /[\s\-().]/g,
            ""
        );

        if (cleaned.startsWith(selectedCode)) {
            return cleaned.substring(
                selectedCode.length
            );
        }

        return cleaned;
    };

    const updateContact = async () => {
        if (!selectedContact) {
            return;
        }

        if (!editName.trim()) {
            showError(
                "Missing Name",
                "Please enter the contact's name."
            );
            return;
        }

        if (!editPhone.trim()) {
            showError(
                "Missing Phone Number",
                "Please enter a phone number."
            );
            return;
        }

        if (!editRelationship.trim()) {
            showError(
                "Missing Relationship",
                "Please enter the relationship."
            );
            return;
        }

        try {
            setLoadingUpdate(true);

            const fullPhoneNumber =
                formatPhoneNumber(
                    editCountryCode.code,
                    editPhone
                );

            await api.put(
                `/contacts/${selectedContact._id}`,
                {
                    name: editName.trim(),
                    phone: fullPhoneNumber,
                    relationship: editRelationship.trim(),
                }
            );

            showSuccess(
                "Contact Updated",
                "Trusted contact updated successfully."
            );

            setViewModalVisible(false);

            loadContacts();

        } catch (error) {
            if (axios.isAxiosError(error)) {
                showError(
                    "Update Contact Failed",
                    error.response?.data?.message ||
                    "Unable to update contact."
                );
            } else {
                showError(
                    "Update Contact Failed",
                    "Something went wrong."
                );
            }

            console.log(error);
        } finally {
            setLoadingUpdate(false);
        }
    };

    const openContactDetails = (item: any) => {
        const detectedCountry =
            detectCountryFromPhone(item.phone);

        setSelectedContact(item);
        setEditName(item.name);
        setEditPhone(
            removeCountryCode(
                item.phone,
                detectedCountry.code
            )
        );
        setEditCountryCode(detectedCountry);
        setEditRelationship(item.relationship);
        setViewModalVisible(true);
    };

    const Loader = () => (
        <View style={styles.loader}>
            <ActivityIndicator
                size="large"
                color="#002E15"
            />
        </View>
    );

    const CountryPicker = ({
        visible,
        onClose,
        onSelect,
        selectedCountry,
    }: {
        visible: boolean;
        onClose: () => void;
        onSelect: (country: Country) => void;
        selectedCountry: Country;
    }) => (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.countryModalContainer}>
                <View style={styles.countryModalBox}>

                    <View style={styles.countryHeader}>
                        <View>
                            <Text style={styles.countryModalTitle}>
                                Select Country
                            </Text>

                            <Text style={styles.countryModalSubtitle}>
                                Choose the phone country code
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.closeIconButton}
                            onPress={onClose}
                        >
                            <Ionicons
                                name="close"
                                size={24}
                                color="#002E15"
                            />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={COUNTRIES}
                        keyExtractor={(item, index) =>
                            `${item.name}-${item.code}-${index}`
                        }
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.countryItem,
                                    selectedCountry.name === item.name &&
                                        selectedCountry.code === item.code
                                        ? styles.countryItemSelected
                                        : null,
                                ]}
                                onPress={() => {
                                    onSelect(item);
                                    onClose();
                                }}
                            >
                                <Text style={styles.countryFlag}>
                                    {item.flag}
                                </Text>

                                <View style={styles.countryInfo}>
                                    <Text style={styles.countryName}>
                                        {item.name}
                                    </Text>

                                    <Text style={styles.countryCode}>
                                        {item.code}
                                    </Text>
                                </View>

                                {selectedCountry.name === item.name &&
                                    selectedCountry.code === item.code && (
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={22}
                                            color="#002E15"
                                        />
                                    )}
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );
    const formatRecordingTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${String(minutes).padStart(2, "0")}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
    };
    return (
        <SafeAreaView style={styles.container}>
            {cameraPermission?.granted && (
                <CameraView
                    ref={cameraRef}
                    style={styles.emergencyCamera}
                    facing="back"
                    mode="video"
                    mute={false}
                    onCameraReady={() => {
                        console.log("📷 Emergency camera ready");
                        setCameraReady(true);
                    }}
                    onMountError={(error) => {
                        console.error(
                            "📷 Emergency camera mount error:",
                            error
                        );

                        setCameraReady(false);
                    }}
                />
            )}
            <Header />

            {sendingSOS && <Loader />}
            {isRecordingEmergency && (
                <View style={styles.recordingBanner}>
                    <View style={styles.recordingStatus}>
                        <View style={styles.recordingDot} />

                        <Text style={styles.recordingText}>
                            Recording
                        </Text>

                        <Text style={styles.recordingTimer}>
                            {formatRecordingTime(recordingDuration)}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.stopRecordingButton}
                        onPress={() =>
                            stopEmergencyRecording("user")
                        }
                    >
                        <Ionicons
                            name="stop"
                            size={14}
                            color="white"
                        />

                        <Text style={styles.stopRecordingText}>
                            Stop
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
            <ScrollView
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>

                    <Image
                        source={IMAGES.no}
                        style={{
                            width: 150,
                            height: 150,
                        }}
                    />

                    <Text style={styles.message}>
                        Your safety just a shake away
                    </Text>

                    <Image
                        source={
                            iconState === "inactive"
                                ? IMAGES.inactive
                                : iconState === "activating"
                                    ? IMAGES.activating
                                    : IMAGES.mainIcon
                        }
                        style={styles.salemaIcon}
                    />

                    <Text style={styles.heading}>
                        "Shake to Alert"
                    </Text>

                    <Text style={styles.message}>
                        In an emergency, every second counts.
                    </Text>

                    <Image
                        source={IMAGES.undraw}
                        style={styles.salemaUndraw}
                    />


                    <AlertButton
                        onPress={sendSOS}
                        loading={sendingSOS}
                    />

                    {/* TRUSTED CONTACTS */}
                    <View style={styles.card}>

                        <Text style={styles.cardTitle}>
                            Trusted Contacts
                        </Text>

                        <FlatList
                            data={contacts}
                            keyExtractor={(item) => item._id}
                            numColumns={3}
                            scrollEnabled={false}
                            style={{
                                width: "100%",
                            }}
                            contentContainerStyle={{
                                paddingVertical: 10,
                            }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.contactItem}
                                    onPress={() =>
                                        openContactDetails(item)
                                    }
                                >
                                    <Text
                                        style={styles.contactName}
                                    >
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />

                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() =>
                                setModalVisible(true)
                            }
                        >
                            <Ionicons
                                name="person-add-outline"
                                size={18}
                                color="#002E15"
                            />

                            <Text style={styles.addButtonText}>
                                Add Contact
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* ADD TRUSTED CONTACT MODAL */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={closeAddModal}
            >
                <View style={styles.modalContainer}>

                    <View style={styles.modalBox}>

                        {/* HEADER */}
                        <View style={styles.modalHeader}>

                            <View>
                                <Text style={styles.modalTitle}>
                                    Add Trusted Contact
                                </Text>

                                <Text style={styles.modalSubtitle}>
                                    Someone you trust in an emergency
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.closeIconButton}
                                onPress={closeAddModal}
                            >
                                <Ionicons
                                    name="close"
                                    size={24}
                                    color="#002E15"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* NAME */}
                        <Text style={styles.fieldLabel}>
                            Contact Name
                        </Text>

                        <View style={styles.inputContainer}>
                            <Ionicons
                                name="person-outline"
                                size={20}
                                color="#777"
                            />

                            <TextInput
                                placeholder="Enter contact name"
                                placeholderTextColor="#999"
                                value={name}
                                onChangeText={setName}
                                style={styles.inputText}
                            />
                        </View>

                        {/* PHONE */}
                        <Text style={styles.fieldLabel}>
                            Phone Number
                        </Text>

                        <View style={styles.phoneRow}>

                            <TouchableOpacity
                                style={styles.countrySelector}
                                onPress={() =>
                                    setCountryPickerVisible(true)
                                }
                            >
                                <Text style={styles.countrySelectorFlag}>
                                    {countryCode.flag}
                                </Text>

                                <Text style={styles.countrySelectorCode}>
                                    {countryCode.code}
                                </Text>

                                <Ionicons
                                    name="chevron-down"
                                    size={16}
                                    color="#555"
                                />
                            </TouchableOpacity>

                            <View
                                style={[
                                    styles.inputContainer,
                                    styles.phoneInputContainer,
                                ]}
                            >
                                <Ionicons
                                    name="call-outline"
                                    size={20}
                                    color="#777"
                                />

                                <TextInput
                                    placeholder="Enter phone number"
                                    placeholderTextColor="#999"
                                    value={phone}
                                    onChangeText={setPhone}
                                    style={styles.inputText}
                                    keyboardType="phone-pad"
                                />
                            </View>

                        </View>

                        <Text style={styles.helperText}>
                            Select the country code and enter the number without the country code.
                        </Text>

                        {/* RELATIONSHIP */}
                        <Text style={styles.fieldLabel}>
                            Relationship
                        </Text>

                        <View style={styles.inputContainer}>
                            <Ionicons
                                name="people-outline"
                                size={20}
                                color="#777"
                            />

                            <TextInput
                                placeholder="e.g. Mother, Father, Friend"
                                placeholderTextColor="#999"
                                value={relationship}
                                onChangeText={setRelationship}
                                style={styles.inputText}
                            />
                        </View>

                        {/* SAVE */}
                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                loadingAdd &&
                                styles.disabledButton,
                            ]}
                            onPress={addContact}
                            disabled={loadingAdd}
                        >
                            {loadingAdd ? (
                                <ActivityIndicator
                                    color="white"
                                />
                            ) : (
                                <>
                                    <Ionicons
                                        name="checkmark-circle-outline"
                                        size={20}
                                        color="white"
                                    />

                                    <Text style={styles.saveButtonText}>
                                        Save Contact
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>

            {/* COUNTRY PICKER */}
            <CountryPicker
                visible={countryPickerVisible}
                onClose={() =>
                    setCountryPickerVisible(false)
                }
                selectedCountry={countryCode}
                onSelect={(country) =>
                    setCountryCode(country)
                }
            />

            {/* CONTACT DETAILS / EDIT MODAL */}
            <Modal
                visible={viewModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() =>
                    setViewModalVisible(false)
                }
            >
                <View style={styles.modalContainer}>

                    <View style={styles.modalBox}>

                        {/* HEADER */}
                        <View style={styles.modalHeader}>

                            <View>
                                <Text style={styles.modalTitle}>
                                    Contact Details
                                </Text>

                                <Text style={styles.modalSubtitle}>
                                    Update or remove this trusted contact
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.closeIconButton}
                                onPress={() =>
                                    setViewModalVisible(false)
                                }
                            >
                                <Ionicons
                                    name="close"
                                    size={24}
                                    color="#002E15"
                                />
                            </TouchableOpacity>
                        </View>

                        {selectedContact && (
                            <>
                                {/* NAME */}
                                <Text style={styles.fieldLabel}>
                                    Contact Name
                                </Text>

                                <View style={styles.inputContainer}>
                                    <Ionicons
                                        name="person-outline"
                                        size={20}
                                        color="#777"
                                    />

                                    <TextInput
                                        placeholder="Enter contact name"
                                        placeholderTextColor="#999"
                                        value={editName}
                                        onChangeText={setEditName}
                                        style={styles.inputText}
                                    />
                                </View>

                                {/* PHONE */}
                                <Text style={styles.fieldLabel}>
                                    Phone Number
                                </Text>

                                <View style={styles.phoneRow}>

                                    <TouchableOpacity
                                        style={styles.countrySelector}
                                        onPress={() =>
                                            setEditCountryPickerVisible(true)
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.countrySelectorFlag
                                            }
                                        >
                                            {editCountryCode.flag}
                                        </Text>

                                        <Text
                                            style={
                                                styles.countrySelectorCode
                                            }
                                        >
                                            {editCountryCode.code}
                                        </Text>

                                        <Ionicons
                                            name="chevron-down"
                                            size={16}
                                            color="#555"
                                        />
                                    </TouchableOpacity>

                                    <View
                                        style={[
                                            styles.inputContainer,
                                            styles.phoneInputContainer,
                                        ]}
                                    >
                                        <Ionicons
                                            name="call-outline"
                                            size={20}
                                            color="#777"
                                        />

                                        <TextInput
                                            placeholder="Enter phone number"
                                            placeholderTextColor="#999"
                                            value={editPhone}
                                            onChangeText={setEditPhone}
                                            style={styles.inputText}
                                            keyboardType="phone-pad"
                                        />
                                    </View>

                                </View>

                                <Text style={styles.helperText}>
                                    Select the country code and enter the number without the country code.
                                </Text>

                                {/* RELATIONSHIP */}
                                <Text style={styles.fieldLabel}>
                                    Relationship
                                </Text>

                                <View style={styles.inputContainer}>
                                    <Ionicons
                                        name="people-outline"
                                        size={20}
                                        color="#777"
                                    />

                                    <TextInput
                                        placeholder="e.g. Mother, Father, Friend"
                                        placeholderTextColor="#999"
                                        value={editRelationship}
                                        onChangeText={
                                            setEditRelationship
                                        }
                                        style={styles.inputText}
                                    />
                                </View>

                                {/* UPDATE */}
                                <TouchableOpacity
                                    style={[
                                        styles.saveButton,
                                        loadingUpdate &&
                                        styles.disabledButton,
                                    ]}
                                    onPress={updateContact}
                                    disabled={loadingUpdate}
                                >
                                    {loadingUpdate ? (
                                        <ActivityIndicator
                                            color="white"
                                        />
                                    ) : (
                                        <>
                                            <Ionicons
                                                name="save-outline"
                                                size={20}
                                                color="white"
                                            />

                                            <Text
                                                style={
                                                    styles.saveButtonText
                                                }
                                            >
                                                Update Contact
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                {/* DELETE */}
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={confirmDelete}
                                    disabled={loadingDelete}
                                >
                                    {loadingDelete ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <>
                                            <Ionicons
                                                name="trash-outline"
                                                size={20}
                                                color="white"
                                            />

                                            <Text style={styles.saveButtonText}>
                                                Delete Contact
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}

                    </View>
                </View>
            </Modal>

            {/* DELETE CONFIRMATION MODAL */}
            <Modal
                visible={deleteModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    if (!loadingDelete) {
                        setDeleteModalVisible(false);
                    }
                }}
            >
                <View style={styles.deleteModalOverlay}>
                    <View style={styles.deleteModalBox}>

                        {/* ICON */}
                        <View style={styles.deleteIconContainer}>
                            <Ionicons
                                name="trash-outline"
                                size={30}
                                color="#D32F2F"
                            />
                        </View>

                        {/* TITLE */}
                        <Text style={styles.deleteModalTitle}>
                            Delete Trusted Contact?
                        </Text>

                        {/* MESSAGE */}
                        <Text style={styles.deleteModalMessage}>
                            Are you sure you want to remove{" "}
                            <Text style={styles.deleteContactName}>
                                {selectedContact?.name || "this contact"}
                            </Text>{" "}
                            from your trusted contacts?
                        </Text>

                        {/* BUTTONS */}
                        <View style={styles.deleteModalActions}>

                            <TouchableOpacity
                                style={styles.cancelDeleteButton}
                                onPress={() => setDeleteModalVisible(false)}
                                disabled={loadingDelete}
                            >
                                <Text style={styles.cancelDeleteText}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.confirmDeleteButton,
                                    loadingDelete && styles.disabledButton,
                                ]}
                                onPress={handleConfirmDelete}
                                disabled={loadingDelete}
                            >
                                {loadingDelete ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="trash-outline"
                                            size={18}
                                            color="white"
                                        />

                                        <Text style={styles.confirmDeleteText}>
                                            Delete Contact
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                        </View>
                    </View>
                </View>
            </Modal>

            {/* EDIT COUNTRY PICKER */}
            <CountryPicker
                visible={editCountryPickerVisible}
                onClose={() =>
                    setEditCountryPickerVisible(false)
                }
                selectedCountry={editCountryCode}
                onSelect={(country) =>
                    setEditCountryCode(country)
                }
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
    },
    emergencyCamera: {
        position: "absolute",
        width: 1,
        height: 1,
        opacity: 0,
    },

    recordingBanner: {
        position: "absolute",
        top: 65,
        alignSelf: "center",
        zIndex: 1000,
        backgroundColor: "#D32F2F",
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        minWidth: 190,
        maxWidth: 210,
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },

    recordingStatus: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },

    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "white",
        marginRight: 6,
    },

    recordingText: {
        color: "white",
        fontSize: 12,
        fontWeight: "600",
    },

    recordingTimer: {
        color: "white",
        fontSize: 12,
        fontWeight: "700",
        marginLeft: 6,
        fontVariant: ["tabular-nums"],
    },

    stopRecordingButton: {
        backgroundColor: "#002E15",
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
    },

    stopRecordingText: {
        color: "white",
        fontSize: 11,
        fontWeight: "600",
    },


    content: {
        flex: 1,
        alignItems: "center",
        paddingHorizontal: 16,
    },

    salemaIcon: {
        width: 80,
        height: 80,
        marginVertical: 30,
    },

    salemaUndraw: {
        width: 200,
        height: 200,
        marginTop: 10,
    },

    heading: {
        fontSize: 24,
        fontWeight: "bold",
        color: "black",
        textAlign: "center",
    },

    message: {
        fontSize: 16,
        color: "#555",
        textAlign: "center",
        marginVertical: 10,
    },

    card: {
        width: "100%",
        marginTop: 10,
        padding: 15,
        backgroundColor: "#002E15",
        borderRadius: 20,
    },

    cardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "white",
        textAlign: "center",
    },

    contactItem: {
        flexBasis: "30%",
        flexGrow: 1,
        paddingVertical: 10,
        margin: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },

    contactName: {
        fontWeight: "bold",
        color: "#fff",
    },

    contactPhone: {
        color: "#fff",
    },

    emptyText: {
        color: "white",
        textAlign: "center",
        marginTop: 10,
    },

    addButton: {
        marginTop: 10,
        backgroundColor: "#b4e0b7",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
    },

    addButtonText: {
        color: "#002E15",
        fontWeight: "600",
    },

    /* MAIN MODAL */

    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "center",
        padding: 20,
    },

    modalBox: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 22,
        width: "100%",
        maxHeight: "90%",
    },

    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 20,
    },

    modalTitle: {
        fontSize: 21,
        fontWeight: "700",
        color: "#002E15",
    },

    modalSubtitle: {
        fontSize: 13,
        color: "#777",
        marginTop: 4,
        maxWidth: 250,
    },

    closeIconButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#f1f4f1",
        alignItems: "center",
        justifyContent: "center",
    },

    fieldLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginTop: 5,
        marginBottom: 7,
    },

    inputContainer: {
        minHeight: 50,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 13,
        backgroundColor: "#fafafa",
    },

    inputText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: "#222",
        paddingVertical: 10,
    },

    phoneRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    countrySelector: {
        minHeight: 50,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 12,
        backgroundColor: "#fafafa",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
    },

    countrySelectorFlag: {
        fontSize: 21,
    },

    countrySelectorCode: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
    },

    phoneInputContainer: {
        flex: 1,
    },

    helperText: {
        fontSize: 11,
        color: "#888",
        marginTop: 6,
        marginBottom: 12,
    },

    saveButton: {
        backgroundColor: "#002E15",
        minHeight: 52,
        marginTop: 18,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
    },

    saveButtonText: {
        color: "white",
        fontSize: 15,
        fontWeight: "600",
    },

    deleteButton: {
        backgroundColor: "#D32F2F",
        minHeight: 52,
        marginTop: 10,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
    },

    disabledButton: {
        opacity: 0.6,
    },


    deleteModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },

    deleteModalBox: {
        width: "100%",
        backgroundColor: "white",
        borderRadius: 22,
        padding: 24,
        alignItems: "center",
    },

    deleteIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#FDECEC",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },

    deleteModalTitle: {
        fontSize: 21,
        fontWeight: "700",
        color: "#002E15",
        textAlign: "center",
    },

    deleteModalMessage: {
        fontSize: 14,
        lineHeight: 21,
        color: "#666",
        textAlign: "center",
        marginTop: 10,
        marginBottom: 24,
    },

    deleteContactName: {
        fontWeight: "700",
        color: "#333",
    },

    deleteModalActions: {
        width: "100%",
        flexDirection: "row",
        gap: 10,
    },

    cancelDeleteButton: {
        flex: 1,
        minHeight: 50,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#ddd",
        backgroundColor: "#f7f7f7",
        alignItems: "center",
        justifyContent: "center",
    },

    cancelDeleteText: {
        color: "#333",
        fontSize: 15,
        fontWeight: "600",
    },

    confirmDeleteButton: {
        flex: 1,
        minHeight: 50,
        borderRadius: 12,
        backgroundColor: "#D32F2F",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 7,
    },

    confirmDeleteText: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
    },

    /* COUNTRY PICKER */

    countryModalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "flex-end",
    },

    countryModalBox: {
        backgroundColor: "white",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 18,
        height: "82%",
    },

    countryHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },

    countryModalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#002E15",
    },

    countryModalSubtitle: {
        fontSize: 13,
        color: "#777",
        marginTop: 3,
    },

    countryItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 13,
        paddingHorizontal: 10,
        borderRadius: 12,
        marginBottom: 4,
    },

    countryItemSelected: {
        backgroundColor: "#eef6ef",
    },

    countryFlag: {
        fontSize: 25,
        width: 42,
    },

    countryInfo: {
        flex: 1,
    },

    countryName: {
        fontSize: 15,
        fontWeight: "500",
        color: "#222",
    },

    countryCode: {
        fontSize: 13,
        color: "#777",
        marginTop: 2,
    },

    loader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
    },
    downloadEvidenceButton: {
        backgroundColor: "#002E15",
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },

    downloadEvidenceText: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
    },
});