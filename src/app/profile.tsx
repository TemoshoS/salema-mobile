import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

export default function Profile() {
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const loadProfile = async () => {
        try {
            setLoading(true);

            const token = await AsyncStorage.getItem("token");

            const res = await api.get("/auth/profile", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setUser(res.data);
        } catch (error: any) {
            console.log(error.response?.data || error);

            Alert.alert("Error", "Failed to load profile.");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [])
    );

    const logout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.removeItem("token");
                        await AsyncStorage.removeItem("userId");

                        router.replace("/login");
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loader}>
                <ActivityIndicator size="large" color="#002E15" />
                <Text style={styles.loading}>Loading Profile...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <Header />

            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.profileCard}>

                    <View style={styles.avatar}>
                        <Ionicons name="person" size={60} color="#fff" />
                    </View>

                    <Text style={styles.name}>{user?.fullName}</Text>

                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>
                            {user?.role.toUpperCase()}
                        </Text>
                    </View>

                </View>

                <View style={styles.card}>

                    <Text style={styles.cardTitle}>
                        Personal Information
                    </Text>

                    <InfoRow
                        icon="mail-outline"
                        label="Email"
                        value={user?.email || ""}
                    />

                    <InfoRow
                        icon="call-outline"
                        label="Phone Number"
                        value={user?.phoneNumber || ""}
                    />

                    <InfoRow
                        icon="location-outline"
                        label="Address"
                        value={user?.address || ""}
                    />

                    <InfoRow
                        icon="calendar-outline"
                        label="Member Since"
                        value={new Date(
                            user?.createdAt || ""
                        ).toDateString()}
                    />

                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push("/edit-profile")}
                >
                    <Ionicons
                        name="create-outline"
                        size={22}
                        color="#fff"
                    />

                    <Text style={styles.buttonText}>
                        Edit Profile
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push("/change-password")}
                >
                    <Ionicons
                        name="lock-closed-outline"
                        size={22}
                        color="#fff"
                    />

                    <Text style={styles.buttonText}>
                        Change Password
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={logout}
                >
                    <Ionicons
                        name="log-out-outline"
                        size={22}
                        color="#fff"
                    />

                    <Text style={styles.buttonText}>
                        Logout
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

function InfoRow({
    icon,
    label,
    value,
}: {
    icon: any;
    label: string;
    value: string;
}) {
    return (
        <View style={styles.row}>
            <Ionicons
                name={icon}
                size={22}
                color="#002E15"
            />

            <View style={{ marginLeft: 15, flex: 1 }}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },

    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    loading: {
        marginTop: 15,
        fontSize: 16,
        color: "#555",
    },

    content: {
        padding: 20,
        paddingBottom: 40,
    },

    profileCard: {
        backgroundColor: "#fff",
        borderRadius: 22,
        alignItems: "center",
        padding: 30,
        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
    },

    avatar: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: "#002E15",
        justifyContent: "center",
        alignItems: "center",
    },

    name: {
        marginTop: 18,
        fontSize: 26,
        fontWeight: "700",
        color: "#1E293B",
    },

    roleBadge: {
        marginTop: 14,
        backgroundColor: "#E8F5E9",
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
    },

    roleText: {
        color: "#2E7D32",
        fontWeight: "700",
    },

    card: {
        backgroundColor: "#fff",
        marginTop: 20,
        borderRadius: 20,
        padding: 20,
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
    },

    cardTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#002E15",
        marginBottom: 18,
    },

    row: {
        flexDirection: "row",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#EFEFEF",
    },

    label: {
        color: "#888",
        fontSize: 13,
    },

    value: {
        fontSize: 16,
        fontWeight: "600",
        color: "#222",
        marginTop: 4,
    },

    button: {
        marginTop: 18,
        height: 55,
        borderRadius: 14,
        backgroundColor: "#002E15",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
    },

    logoutButton: {
        marginTop: 18,
        height: 55,
        borderRadius: 14,
        backgroundColor: "#D32F2F",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
    },

    buttonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
        marginLeft: 10,
    },
});