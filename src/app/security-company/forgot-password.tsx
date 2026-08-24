import { showError, showSuccess } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

export default function SecurityCompanyForgotPassword() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const sendOtp = async () => {
        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const normalizedEmail = email.trim().toLowerCase();

            const res = await api.post(
                "/security-company/forgot-password",
                {
                    email: normalizedEmail,
                }
            );

            showSuccess(
                "OTP Sent",
                res.data.message
            );

            router.push({
                pathname: "/security-company/reset-password",
                params: {
                    email: normalizedEmail,
                },
            });

        } catch (error: any) {
            showError(
                "Forgot Password",
                error.response?.data?.message ||
                "Something went wrong."
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
                    name="lock-closed-outline"
                    size={40}
                    color="#fff"
                />
            </View>

            {/* Title */}
            <Text style={styles.title}>
                Forgot Password
            </Text>

            <Text style={styles.enterEmail}>
                Enter your security company account email
                to receive a password reset OTP.
            </Text>

            {/* Email Input */}
            <View
                style={[
                    styles.inputContainer,
                    error ? styles.inputError : null,
                ]}
            >
                <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#888"
                    style={styles.inputIcon}
                />

                <TextInput
                    placeholder="Company email"
                    placeholderTextColor="#aaa"
                    value={email}
                    onChangeText={(text) => {
                        setEmail(text);
                        setError("");
                    }}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            {error ? (
                <Text style={styles.errorText}>
                    {error}
                </Text>
            ) : null}

            {/* Send OTP */}
            <TouchableOpacity
                style={[
                    styles.button,
                    loading && styles.buttonDisabled,
                ]}
                onPress={sendOtp}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>
                        Send OTP
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

    title: {
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 20,
        color: "#002E15",
        textAlign: "center",
    },

    enterEmail: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: "center",
        color: "#555",
        lineHeight: 23,
    },

    iconCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: "#002E15",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        marginBottom: 25,
    },

    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 10,
        paddingHorizontal: 10,
        backgroundColor: "#fff",
        marginBottom: 10,
    },

    input: {
        flex: 1,
        padding: 15,
        fontSize: 16,
        color: "#333",
    },

    inputIcon: {
        marginRight: 10,
    },

    inputError: {
        borderColor: "#E53935",
    },

    errorText: {
        color: "#E53935",
        fontSize: 14,
        marginBottom: 10,
    },

    button: {
        backgroundColor: "#002E15",
        padding: 16,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
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