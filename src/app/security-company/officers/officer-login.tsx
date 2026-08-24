import { api } from "@/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SecurityOfficerLogin() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert(
                "Missing Information",
                "Please enter your email and password."
            );
            return;
        }

        try {
            setLoading(true);

            const response = await api.post(
                "/security-company/officers/login",
                {
                    email: email.trim().toLowerCase(),
                    password,
                }
            );

            const { token, officer } = response.data;

            // ==========================================
            // SAVE OFFICER AUTHENTICATION
            // ==========================================

            await AsyncStorage.setItem(
                "officerToken",
                token
            );

            await AsyncStorage.setItem(
                "officerData",
                JSON.stringify(officer)
            );

            // ==========================================
            // GO TO OFFICER DASHBOARD
            // ==========================================

            router.replace(
                "/security-officer/dashboard"
            );
        } catch (error: any) {
            console.log(
                "OFFICER LOGIN ERROR:",
                error.response?.data || error.message
            );

            Alert.alert(
                "Login Failed",
                error.response?.data?.message ||
                    "Unable to login. Please check your details."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={
                    Platform.OS === "ios"
                        ? "padding"
                        : undefined
                }
            >
                <View style={styles.content}>

                    {/* Logo / Icon */}

                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>🛡️</Text>
                    </View>

                    {/* Title */}

                    <Text style={styles.title}>
                        Security Officer
                    </Text>

                    <Text style={styles.subtitle}>
                        Sign in to manage your assigned
                        incidents.
                    </Text>

                    {/* Email */}

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>
                            Email Address
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!loading}
                        />
                    </View>

                    {/* Password */}

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>
                            Password
                        </Text>

                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Enter your password"
                                placeholderTextColor="#999"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={
                                    !showPassword
                                }
                                autoCapitalize="none"
                                editable={!loading}
                            />

                            <TouchableOpacity
                                onPress={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
                                }
                            >
                                <Text
                                    style={
                                        styles.showPassword
                                    }
                                >
                                    {showPassword
                                        ? "Hide"
                                        : "Show"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Login */}

                    <TouchableOpacity
                        style={[
                            styles.loginButton,
                            loading &&
                                styles.loginButtonDisabled,
                        ]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator
                                color="#fff"
                            />
                        ) : (
                            <Text
                                style={
                                    styles.loginButtonText
                                }
                            >
                                Sign In
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Information */}

                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            Only active security officers
                            can access the officer portal.
                        </Text>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#EEF6F3",
    },

    keyboardView: {
        flex: 1,
    },

    content: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
    },

    iconContainer: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: "#DDEDE5",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        marginBottom: 20,
    },

    icon: {
        fontSize: 42,
    },

    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#002E15",
        textAlign: "center",
    },

    subtitle: {
        fontSize: 15,
        color: "#777",
        textAlign: "center",
        marginTop: 8,
        marginBottom: 35,
        lineHeight: 22,
    },

    inputContainer: {
        marginBottom: 18,
    },

    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginBottom: 7,
    },

    input: {
        height: 52,
        backgroundColor: "#fff",
        borderRadius: 13,
        paddingHorizontal: 15,
        fontSize: 15,
        color: "#111",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    passwordContainer: {
        height: 52,
        backgroundColor: "#fff",
        borderRadius: 13,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 15,
        paddingRight: 12,
    },

    passwordInput: {
        flex: 1,
        fontSize: 15,
        color: "#111",
    },

    showPassword: {
        color: "#002E15",
        fontSize: 13,
        fontWeight: "700",
    },

    loginButton: {
        height: 54,
        backgroundColor: "#002E15",
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
    },

    loginButtonDisabled: {
        opacity: 0.7,
    },

    loginButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },

    infoBox: {
        backgroundColor: "#E8F3ED",
        borderRadius: 13,
        padding: 14,
        marginTop: 20,
    },

    infoText: {
        color: "#35614A",
        fontSize: 13,
        textAlign: "center",
        lineHeight: 19,
    },
});