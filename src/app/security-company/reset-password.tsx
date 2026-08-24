import { showError, showSuccess } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../config/api";

export default function SecurityCompanyResetPassword() {
    const router = useRouter();

    const { email } = useLocalSearchParams<{
        email?: string;
    }>();

    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const resetPassword = async () => {
        if (!email) {
            showError(
                "Invalid Request",
                "Email address is missing."
            );
            return;
        }

        if (!otp.trim()) {
            setError("Please enter the OTP sent to your email.");
            return;
        }

        if (otp.trim().length !== 6) {
            setError("OTP must be 6 digits.");
            return;
        }

        if (!password) {
            setError("Please enter your new password.");
            return;
        }

        if (!confirmPassword) {
            setError("Please confirm your new password.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setError(
                "Password must be at least 6 characters."
            );
            return;
        }

        setError("");
        setLoading(true);

        try {
            const res = await api.post(
                "/security-company/reset-password",
                {
                    email: email.trim().toLowerCase(),
                    otp: otp.trim(),
                    password,
                    confirmPassword,
                }
            );

            showSuccess(
                "Password Reset",
                res.data.message
            );

            setTimeout(() => {
                router.replace(
                    "/security-company/login"
                );
            }, 1500);

        } catch (error: any) {
            showError(
                "Reset Password Failed",
                error.response?.data?.message ||
                "Unable to reset your password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>

            {/* Back Button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                disabled={loading}
            >
                <Ionicons
                    name="arrow-back"
                    size={24}
                    color="#002E15"
                />
            </TouchableOpacity>

            {/* Icon */}
            <View style={styles.iconCircle}>
                <Ionicons
                    name="key-outline"
                    size={40}
                    color="#fff"
                />
            </View>

            {/* Title */}
            <Text style={styles.title}>
                Reset Password
            </Text>

            <Text style={styles.subtitle}>
                Enter the OTP sent to your company email
                and create a new password.
            </Text>

            {/* Email */}
            <Text style={styles.emailText}>
                {email}
            </Text>

            {/* OTP */}
            <Text style={styles.label}>
                OTP Code
            </Text>

            <View
                style={[
                    styles.inputContainer,
                    error && styles.inputError,
                ]}
            >
                <Ionicons
                    name="shield-checkmark-outline"
                    size={21}
                    color="#888"
                    style={styles.inputIcon}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor="#aaa"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={(text) => {
                        setOtp(
                            text.replace(/[^0-9]/g, "")
                        );
                        setError("");
                    }}
                />
            </View>

            {/* Password */}
            <Text style={styles.label}>
                New Password
            </Text>

            <View
                style={[
                    styles.inputContainer,
                    error && styles.inputError,
                ]}
            >
                <Ionicons
                    name="lock-closed-outline"
                    size={21}
                    color="#888"
                    style={styles.inputIcon}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Enter new password"
                    placeholderTextColor="#aaa"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                        setPassword(text);
                        setError("");
                    }}
                />

                <TouchableOpacity
                    onPress={() =>
                        setShowPassword(!showPassword)
                    }
                >
                    <Ionicons
                        name={
                            showPassword
                                ? "eye-off-outline"
                                : "eye-outline"
                        }
                        size={22}
                        color="#666"
                    />
                </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <Text style={styles.label}>
                Confirm Password
            </Text>

            <View
                style={[
                    styles.inputContainer,
                    error && styles.inputError,
                ]}
            >
                <Ionicons
                    name="lock-closed-outline"
                    size={21}
                    color="#888"
                    style={styles.inputIcon}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Confirm new password"
                    placeholderTextColor="#aaa"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={(text) => {
                        setConfirmPassword(text);
                        setError("");
                    }}
                />

                <TouchableOpacity
                    onPress={() =>
                        setShowConfirmPassword(
                            !showConfirmPassword
                        )
                    }
                >
                    <Ionicons
                        name={
                            showConfirmPassword
                                ? "eye-off-outline"
                                : "eye-outline"
                        }
                        size={22}
                        color="#666"
                    />
                </TouchableOpacity>
            </View>

            {error ? (
                <Text style={styles.errorText}>
                    {error}
                </Text>
            ) : null}

            {/* Reset Button */}
            <TouchableOpacity
                style={[
                    styles.button,
                    loading && styles.buttonDisabled,
                ]}
                onPress={resetPassword}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>
                        Reset Password
                    </Text>
                )}
            </TouchableOpacity>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#EEF6F3",
    },

    backButton: {
        position: "absolute",
        top: 40,
        left: 20,
        zIndex: 10,
    },

    iconCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: "#002E15",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        marginBottom: 22,
    },

    title: {
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 10,
        color: "#002E15",
        textAlign: "center",
    },

    subtitle: {
        fontSize: 15,
        marginBottom: 10,
        textAlign: "center",
        color: "#555",
        lineHeight: 22,
    },

    emailText: {
        textAlign: "center",
        color: "#002E15",
        fontWeight: "700",
        fontSize: 15,
        marginBottom: 15,
    },

    label: {
        fontSize: 15,
        fontWeight: "600",
        color: "#444",
        marginBottom: 7,
        marginTop: 8,
    },

    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        paddingHorizontal: 10,
        backgroundColor: "#fff",
        marginBottom: 8,
    },

    inputIcon: {
        marginRight: 10,
    },

    input: {
        flex: 1,
        padding: 15,
        fontSize: 16,
        color: "#333",
    },

    inputError: {
        borderColor: "#E53935",
    },

    errorText: {
        color: "#E53935",
        fontSize: 14,
        marginTop: 3,
        marginBottom: 5,
    },

    button: {
        backgroundColor: "#002E15",
        padding: 16,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 18,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: {
            width: 0,
            height: 2,
        },
    },

    buttonDisabled: {
        backgroundColor: "#555",
    },

    buttonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },
});