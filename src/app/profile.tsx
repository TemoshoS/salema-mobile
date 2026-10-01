
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomAlert from "../components/CustomAlert";
import Header from "../components/Header";
import { api } from "../config/api";

interface User {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    address: string;
    role: string;
    createdAt: string;
}

type AlertType = "error" | "warning" | "success" | "info";

export default function Profile() {
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState("");
    const [alertMessage, setAlertMessage] = useState("");
    const [alertType, setAlertType] =
        useState<AlertType>("info");
    const [alertConfirmText, setAlertConfirmText] =
        useState("OK");
    const [alertShowCancel, setAlertShowCancel] =
        useState(false);
    const [alertConfirmAction, setAlertConfirmAction] =
        useState<() => void>(() => {});

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
            setLoading(true);

            const token =
                await AsyncStorage.getItem("token");

            const res = await api.get("/auth/profile", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setUser(res.data);
        } catch (error: any) {
            console.log(
                error?.response?.data || error
            );

            showAlert({
                title: "Unable to load profile",
                message:
                    "We couldn't load your profile. Please try again.",
                type: "error",
                confirmText: "Try Again",
                onConfirm: loadProfile,
            });
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [])
    );

    const logout = () => {
        showAlert({
            title: "Logout",
            message:
                "Are you sure you want to sign out of your Salema account?",
            type: "warning",
            confirmText: "Logout",
            showCancel: true,
            onConfirm: async () => {
                try {
                    await api.post("/auth/logout");
                } catch (error) {
                    console.log(
                        "Logout API error:",
                        error
                    );
                }

                await AsyncStorage.removeItem("token");
                await AsyncStorage.removeItem("userId");

                router.replace("/login");
            },
        });
    };

    const formatMemberSince = (date: string) => {
        if (!date) return "—";

        const parsedDate = new Date(date);

        if (isNaN(parsedDate.getTime())) {
            return "—";
        }

        return parsedDate.toLocaleDateString(
            "en-ZA",
            {
                day: "numeric",
                month: "long",
                year: "numeric",
            }
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loader}>
                <StatusBar barStyle="dark-content" />

                <View style={styles.loaderIcon}>
                    <Ionicons
                        name="person-outline"
                        size={32}
                        color="#002E15"
                    />
                </View>

                <ActivityIndicator
                    size="small"
                    color="#002E15"
                    style={{ marginTop: 18 }}
                />

                <Text style={styles.loading}>
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
                contentContainerStyle={styles.content}
            >
                {/* PROFILE HERO */}
                <View style={styles.profileHero}>
                    <View style={styles.heroTop}>
                        <View style={styles.avatar}>
                            <Ionicons
                                name="person"
                                size={52}
                                color="#002E15"
                            />
                        </View>
                    </View>

                    <View style={styles.profileDetails}>
                        <Text style={styles.name}>
                            {user?.fullName || "User"}
                        </Text>

                        <View style={styles.roleBadge}>
                            <View
                                style={styles.statusDot}
                            />

                            <Text
                                style={styles.roleText}
                            >
                                {user?.role
                                    ? user.role.toUpperCase()
                                    : "USER"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* PERSONAL INFORMATION */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        Personal Information
                    </Text>

                    <Text
                        style={styles.sectionSubtitle}
                    >
                        Your account details
                    </Text>
                </View>

                <View style={styles.infoCard}>
                    <InfoRow
                        icon="mail-outline"
                        label="Email"
                        value={user?.email || "—"}
                    />

                    <InfoRow
                        icon="call-outline"
                        label="Phone Number"
                        value={
                            user?.phoneNumber || "—"
                        }
                    />

                    <InfoRow
                        icon="location-outline"
                        label="Address"
                        value={
                            user?.address || "—"
                        }
                    />

                    <InfoRow
                        icon="calendar-outline"
                        label="Member Since"
                        value={formatMemberSince(
                            user?.createdAt || ""
                        )}
                        last
                    />
                </View>

                {/* ACCOUNT */}
                <View
                    style={[
                        styles.sectionHeader,
                        styles.accountHeader,
                    ]}
                >
                    <Text style={styles.sectionTitle}>
                        Account
                    </Text>

                    <Text
                        style={styles.sectionSubtitle}
                    >
                        Manage your account
                    </Text>
                </View>

                {/* EDIT PROFILE */}
                <TouchableOpacity
                    style={styles.primaryAction}
                    onPress={() =>
                        router.push("/edit-profile")
                    }
                    activeOpacity={0.8}
                >
                    <View
                        style={
                            styles.actionIconPrimary
                        }
                    >
                        <Ionicons
                            name="create-outline"
                            size={22}
                            color="#FFFFFF"
                        />
                    </View>

                    <View style={styles.actionContent}>
                        <Text
                            style={
                                styles.primaryActionTitle
                            }
                        >
                            Edit Profile
                        </Text>

                        <Text
                            style={
                                styles.primaryActionSubtitle
                            }
                        >
                            Update your personal
                            information
                        </Text>
                    </View>

                    <Ionicons
                        name="chevron-forward"
                        size={21}
                        color="#B4E0B7"
                    />
                </TouchableOpacity>

                {/* CHANGE PASSWORD */}
                <TouchableOpacity
                    style={styles.secondaryAction}
                    onPress={() =>
                        router.push("/change-password")
                    }
                    activeOpacity={0.8}
                >
                    <View
                        style={
                            styles.actionIconSecondary
                        }
                    >
                        <Ionicons
                            name="lock-closed-outline"
                            size={22}
                            color="#002E15"
                        />
                    </View>

                    <View style={styles.actionContent}>
                        <Text
                            style={
                                styles.secondaryActionTitle
                            }
                        >
                            Change Password
                        </Text>

                        <Text
                            style={
                                styles.secondaryActionSubtitle
                            }
                        >
                            Keep your account secure
                        </Text>
                    </View>

                    <Ionicons
                        name="chevron-forward"
                        size={21}
                        color="#002E15"
                    />
                </TouchableOpacity>

                {/* LOGOUT */}
                <TouchableOpacity
                    style={styles.logoutAction}
                    onPress={logout}
                    activeOpacity={0.8}
                >
                    <View style={styles.logoutIcon}>
                        <Ionicons
                            name="log-out-outline"
                            size={22}
                            color="#D32F2F"
                        />
                    </View>

                    <View style={styles.actionContent}>
                        <Text
                            style={styles.logoutTitle}
                        >
                            Logout
                        </Text>

                        <Text
                            style={styles.logoutSubtitle}
                        >
                            Sign out of your Salema
                            account
                        </Text>
                    </View>

                    <Ionicons
                        name="chevron-forward"
                        size={21}
                        color="#D32F2F"
                    />
                </TouchableOpacity>

                <Text style={styles.footer}>
                    Salema • Your safety matters
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

function InfoRow({
    icon,
    label,
    value,
    last = false,
}: {
    icon: any;
    label: string;
    value: string;
    last?: boolean;
}) {
    return (
        <View
            style={[
                styles.infoRow,
                last && styles.lastInfoRow,
            ]}
        >
            <View style={styles.infoIcon}>
                <Ionicons
                    name={icon}
                    size={21}
                    color="#002E15"
                />
            </View>

            <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>
                    {label}
                </Text>

                <Text
                    style={styles.infoValue}
                    numberOfLines={3}
                >
                    {value}
                </Text>
            </View>
        </View>
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
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#E7F2E9",
        justifyContent: "center",
        alignItems: "center",
    },

    loading: {
        marginTop: 10,
        fontSize: 14,
        color: "#666",
    },

    content: {
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 35,
    },

    profileHero: {
        backgroundColor: "#002E15",
        borderRadius: 24,
        overflow: "hidden",
        marginBottom: 25,
    },

    heroTop: {
        height: 85,
        backgroundColor: "#002E15",
        alignItems: "center",
        justifyContent: "flex-end",
    },

    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#B4E0B7",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 5,
        borderColor: "#FFFFFF",
        marginBottom: -50,
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },

    profileDetails: {
        backgroundColor: "#002E15",
        alignItems: "center",
        paddingTop: 60,
        paddingBottom: 22,
    },

    name: {
        fontSize: 24,
        fontWeight: "700",
        color: "#FFFFFF",
        textAlign: "center",
    },

    roleBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor:
            "rgba(180,224,183,0.18)",
        paddingHorizontal: 13,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 10,
    },

    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: "#B4E0B7",
        marginRight: 7,
    },

    roleText: {
        color: "#B4E0B7",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.6,
    },

    sectionHeader: {
        marginBottom: 11,
        paddingHorizontal: 3,
    },

    accountHeader: {
        marginTop: 26,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#002E15",
    },

    sectionSubtitle: {
        fontSize: 12,
        color: "#8A8F8B",
        marginTop: 3,
    },

    infoCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: "#E7EBE8",
    },

    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#EEF1EF",
    },

    lastInfoRow: {
        borderBottomWidth: 0,
    },

    infoIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: "#EAF4EC",
        justifyContent: "center",
        alignItems: "center",
    },

    infoContent: {
        flex: 1,
        marginLeft: 13,
    },

    infoLabel: {
        fontSize: 11,
        color: "#8A8F8B",
        fontWeight: "500",
        marginBottom: 3,
    },

    infoValue: {
        fontSize: 14,
        color: "#202522",
        fontWeight: "600",
        lineHeight: 20,
    },

    primaryAction: {
        minHeight: 72,
        backgroundColor: "#002E15",
        borderRadius: 17,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 11,
    },

    actionIconPrimary: {
        width: 43,
        height: 43,
        borderRadius: 12,
        backgroundColor:
            "rgba(180,224,183,0.18)",
        justifyContent: "center",
        alignItems: "center",
    },

    actionContent: {
        flex: 1,
        marginHorizontal: 13,
    },

    primaryActionTitle: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },

    primaryActionSubtitle: {
        color: "#B4E0B7",
        fontSize: 11,
        marginTop: 3,
    },

    secondaryAction: {
        minHeight: 72,
        backgroundColor: "#FFFFFF",
        borderRadius: 17,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 11,
        borderWidth: 1,
        borderColor: "#DDE5DF",
    },

    actionIconSecondary: {
        width: 43,
        height: 43,
        borderRadius: 12,
        backgroundColor: "#EAF4EC",
        justifyContent: "center",
        alignItems: "center",
    },

    secondaryActionTitle: {
        color: "#002E15",
        fontSize: 15,
        fontWeight: "700",
    },

    secondaryActionSubtitle: {
        color: "#8A8F8B",
        fontSize: 11,
        marginTop: 3,
    },

    logoutAction: {
        minHeight: 72,
        backgroundColor: "#FFFFFF",
        borderRadius: 17,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#F0DADA",
    },

    logoutIcon: {
        width: 43,
        height: 43,
        borderRadius: 12,
        backgroundColor: "#FFF1F1",
        justifyContent: "center",
        alignItems: "center",
    },

    logoutTitle: {
        color: "#D32F2F",
        fontSize: 15,
        fontWeight: "700",
    },

    logoutSubtitle: {
        color: "#999",
        fontSize: 11,
        marginTop: 3,
    },

    footer: {
        textAlign: "center",
        color: "#9AA19C",
        fontSize: 11,
        marginTop: 25,
    },
});

