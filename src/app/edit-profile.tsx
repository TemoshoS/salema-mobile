import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomAlert from "../components/CustomAlert";
import Header from "../components/Header";
import { api } from "../config/api";

type AlertType =
    | "error"
    | "warning"
    | "success"
    | "info";

export default function EditProfile() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [fullName, setFullName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [address, setAddress] = useState("");

    // Custom Alert
    const [alertVisible, setAlertVisible] =
        useState(false);
    const [alertTitle, setAlertTitle] =
        useState("");
    const [alertMessage, setAlertMessage] =
        useState("");
    const [alertType, setAlertType] =
        useState<AlertType>("info");
    const [alertConfirmText, setAlertConfirmText] =
        useState("OK");
    const [alertShowCancel, setAlertShowCancel] =
        useState(false);

    const [alertConfirmAction, setAlertConfirmAction] =
        useState<() => void>(() => {});

    useEffect(() => {
        loadProfile();
    }, []);

    const showAlert = ({
        title,
        message,
        type = "info",
        confirmText = "OK",
        showCancel = false,
        onConfirm,
    }: {
        title: string;
        message: string;
        type?: AlertType;
        confirmText?: string;
        showCancel?: boolean;
        onConfirm?: () => void;
    }) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertType(type);
        setAlertConfirmText(confirmText);
        setAlertShowCancel(showCancel);

        setAlertConfirmAction(() => () => {
            setAlertVisible(false);
            onConfirm?.();
        });

        setAlertVisible(true);
    };

    const closeAlert = () => {
        setAlertVisible(false);
    };

    const loadProfile = async () => {
        try {
            const token =
                await AsyncStorage.getItem("token");

            const res = await api.get(
                "/auth/profile",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setFullName(res.data.fullName || "");
            setPhoneNumber(
                res.data.phoneNumber || ""
            );
            setAddress(res.data.address || "");
        } catch (error) {
            console.log("Load profile error:", error);

            showAlert({
                title: "Unable to load profile",
                message:
                    "We couldn't load your profile details. Please try again.",
                type: "error",
                confirmText: "Try Again",
                onConfirm: loadProfile,
            });
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async () => {
        const trimmedFullName =
            fullName.trim();
        const trimmedPhoneNumber =
            phoneNumber.trim();
        const trimmedAddress =
            address.trim();

        if (
            !trimmedFullName ||
            !trimmedPhoneNumber ||
            !trimmedAddress
        ) {
            showAlert({
                title: "Missing Information",
                message:
                    "Please fill in all fields before saving your profile.",
                type: "warning",
                confirmText: "OK",
            });

            return;
        }

        try {
            setSaving(true);

            const token =
                await AsyncStorage.getItem("token");

            await api.put(
                "/auth/profile",
                {
                    fullName: trimmedFullName,
                    phoneNumber:
                        trimmedPhoneNumber,
                    address: trimmedAddress,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            showAlert({
                title: "Profile Updated",
                message:
                    "Your profile has been updated successfully.",
                type: "success",
                confirmText: "Done",
                onConfirm: () => router.back(),
            });
        } catch (error: any) {
            console.log(
                "Update profile error:",
                error?.response?.data || error
            );

            showAlert({
                title: "Update Failed",
                message:
                    error?.response?.data?.message ||
                    "We couldn't update your profile. Please try again.",
                type: "error",
                confirmText: "OK",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loader}>
                <StatusBar barStyle="dark-content" />

                <View style={styles.loaderIcon}>
                    <Ionicons
                        name="person-outline"
                        size={30}
                        color="#002E15"
                    />
                </View>

                <ActivityIndicator
                    size="small"
                    color="#002E15"
                    style={styles.loaderSpinner}
                />

                <Text style={styles.loadingText}>
                    Loading your profile...
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="#FFFFFF"
            />

            <Header />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={
                    styles.content
                }
                keyboardShouldPersistTaps="handled"
            >
                {/* HEADER */}
                <View style={styles.pageHeader}>
                    <View
                        style={
                            styles.pageHeaderIcon
                        }
                    >
                        <Ionicons
                            name="person-outline"
                            size={24}
                            color="#002E15"
                        />
                    </View>

                    <View>
                        <Text
                            style={styles.title}
                        >
                            Edit Profile
                        </Text>

                        <Text
                            style={
                                styles.subtitle
                            }
                        >
                            Update your personal
                            information
                        </Text>
                    </View>
                </View>

                {/* FORM */}
                <View style={styles.formCard}>
                    {/* FULL NAME */}
                    <View style={styles.field}>
                        <Text
                            style={styles.label}
                        >
                            Full Name
                        </Text>

                        <View
                            style={
                                styles.inputContainer
                            }
                        >
                            <Ionicons
                                name="person-outline"
                                size={20}
                                color="#7D857F"
                            />

                            <TextInput
                                style={
                                    styles.input
                                }
                                value={fullName}
                                onChangeText={
                                    setFullName
                                }
                                placeholder="Enter your full name"
                                placeholderTextColor="#A5ACA7"
                                autoCapitalize="words"
                                returnKeyType="next"
                            />
                        </View>
                    </View>

                    {/* PHONE */}
                    <View style={styles.field}>
                        <Text
                            style={styles.label}
                        >
                            Phone Number
                        </Text>

                        <View
                            style={
                                styles.inputContainer
                            }
                        >
                            <Ionicons
                                name="call-outline"
                                size={20}
                                color="#7D857F"
                            />

                            <TextInput
                                style={
                                    styles.input
                                }
                                value={
                                    phoneNumber
                                }
                                keyboardType="phone-pad"
                                onChangeText={
                                    setPhoneNumber
                                }
                                placeholder="Enter your phone number"
                                placeholderTextColor="#A5ACA7"
                            />
                        </View>
                    </View>

                    {/* ADDRESS */}
                    <View
                        style={[
                            styles.field,
                            styles.lastField,
                        ]}
                    >
                        <Text
                            style={styles.label}
                        >
                            Address
                        </Text>

                        <View
                            style={[
                                styles.inputContainer,
                                styles.addressContainer,
                            ]}
                        >
                            <Ionicons
                                name="location-outline"
                                size={20}
                                color="#7D857F"
                                style={
                                    styles.addressIcon
                                }
                            />

                            <TextInput
                                style={[
                                    styles.input,
                                    styles.addressInput,
                                ]}
                                multiline
                                textAlignVertical="top"
                                value={address}
                                onChangeText={
                                    setAddress
                                }
                                placeholder="Enter your address"
                                placeholderTextColor="#A5ACA7"
                            />
                        </View>
                    </View>
                </View>

                {/* SAVE */}
                <TouchableOpacity
                    style={[
                        styles.button,
                        saving &&
                            styles.buttonDisabled,
                    ]}
                    disabled={saving}
                    onPress={updateProfile}
                    activeOpacity={0.8}
                >
                    {saving ? (
                        <>
                            <ActivityIndicator
                                color="#FFFFFF"
                                size="small"
                            />

                            <Text
                                style={
                                    styles.buttonText
                                }
                            >
                                Saving...
                            </Text>
                        </>
                    ) : (
                        <>
                            <Ionicons
                                name="save-outline"
                                size={21}
                                color="#FFFFFF"
                            />

                            <Text
                                style={
                                    styles.buttonText
                                }
                            >
                                Save Changes
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* FOOTER */}
                <Text style={styles.footer}>
                    Keep your Salema account
                    information up to date.
                </Text>
            </ScrollView>

            {/* CUSTOM ALERT */}
            <CustomAlert
                visible={alertVisible}
                title={alertTitle}
                message={alertMessage}
                type={alertType}
                confirmText={alertConfirmText}
                showCancel={alertShowCancel}
                onConfirm={alertConfirmAction}
                onCancel={closeAlert}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7F6",
    },

    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F7F6",
    },

    loaderIcon: {
        width: 68,
        height: 68,
        borderRadius: 22,
        backgroundColor: "#EAF4EC",
        justifyContent: "center",
        alignItems: "center",
    },

    loaderSpinner: {
        marginTop: 18,
    },

    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: "#777F79",
    },

    content: {
        paddingHorizontal: 18,
        paddingTop: 20,
        paddingBottom: 40,
    },

    pageHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 22,
    },

    pageHeaderIcon: {
        width: 48,
        height: 48,
        borderRadius: 15,
        backgroundColor: "#EAF4EC",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 13,
    },

    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#002E15",
    },

    subtitle: {
        fontSize: 12,
        color: "#8A8F8B",
        marginTop: 3,
    },

    formCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 17,
        borderWidth: 1,
        borderColor: "#E7EBE8",
    },

    field: {
        marginBottom: 20,
    },

    lastField: {
        marginBottom: 0,
    },

    label: {
        fontSize: 12,
        fontWeight: "700",
        color: "#39413C",
        marginBottom: 8,
    },

    inputContainer: {
        minHeight: 52,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#DDE5DF",
        backgroundColor: "#FAFBFA",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
    },

    addressContainer: {
        alignItems: "flex-start",
        minHeight: 110,
        paddingTop: 14,
    },

    addressIcon: {
        marginTop: 2,
    },

    input: {
        flex: 1,
        fontSize: 14,
        color: "#202522",
        marginLeft: 10,
        paddingVertical: 0,
    },

    addressInput: {
        minHeight: 82,
        paddingTop: 0,
    },

    button: {
        height: 56,
        borderRadius: 16,
        backgroundColor: "#002E15",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        marginTop: 18,
    },

    buttonDisabled: {
        opacity: 0.7,
    },

    buttonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 15,
        marginLeft: 9,
    },

    footer: {
        textAlign: "center",
        color: "#9AA19C",
        fontSize: 11,
        marginTop: 20,
        lineHeight: 17,
    },
});

