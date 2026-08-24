import { showError, showSuccess } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator, Animated, Easing, StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { api } from "../config/api";

export default function ResetPassword() {
    const router = useRouter();
    const { email } = useLocalSearchParams();

    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({
        otp: "",
        password: "",
        confirmPassword: "",
    });

    const blinkAnim = useRef(new Animated.Value(1)).current;

useEffect(() => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(blinkAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(blinkAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ])
  ).start();
}, []);

    const validatePassword = (password: string) => {
        const strongPasswordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return strongPasswordRegex.test(password);
    };

    const validateInputs = () => {
        const newErrors: any = {};
        if (!otp) newErrors.otp = "OTP is required.";
        if (!password) {
            newErrors.password = "Password is required.";
        } else if (!validatePassword(password)) {
            newErrors.password =
                "Password must be at least 8 characters long, include uppercase, lowercase, a number, and a special character.";
        }
        if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const resetPassword = async () => {
        if (!validateInputs()) return;

        setLoading(true);
        try {
            const res = await api.post("/auth/reset-password", {
                email,
                otp,
                password,
                confirmPassword,
            });

            showSuccess(res.data.message);
            router.replace("/login");
        } catch (error: any) {
            showError(error.response?.data?.message || "Reset failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#002E15" />
            </TouchableOpacity>

            {/* Title */}
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.enterNew}>
    Enter the 6-digit verification code sent to your email, then create your new password.
</Text>

<Text style={styles.otpLabel}>
    Verification Code
</Text>

        {/* OTP Input */}
<View style={styles.otpWrapper}>
  {[...Array(6)].map((_, index) => (
 <View
 key={index}
 style={styles.otpDigitContainer}
>
 <Text style={styles.otpDigit}>
   {otp[index] || ""}
 </Text>

 <Animated.View
   style={[
     styles.underline,
     index === otp.length && otp.length < 6
       ? {
           backgroundColor: "#002E15",
           opacity: blinkAnim,
         }
       : index < otp.length
       ? {
           backgroundColor: "#002E15",
         }
       : {
           backgroundColor: "#D6D6D6",
         },
   ]}
 />
</View>
  ))}

  <TextInput
    value={otp}
    onChangeText={(text) => {
      const value = text.replace(/[^0-9]/g, ""); // Allow only numbers
      if (value.length <= 6) {
        setOtp(value);
        setErrors((prev) => ({ ...prev, otp: "" }));
      }
    }}
    keyboardType="number-pad"
    maxLength={6}
    style={styles.hiddenOtpInput}
    autoFocus
  />
</View>
{errors.otp ? <Text style={styles.errorText}>{errors.otp}</Text> : null}
{errors.otp ? <Text style={styles.errorText}>{errors.otp}</Text> : null}
            {errors.otp ? <Text style={styles.errorText}>{errors.otp}</Text> : null}

            {/* New Password Input */}
            <View
                style={[
                    styles.inputContainer,
                    errors.password ? styles.inputError : null,
                ]}
            >
                <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#888"
                    style={styles.inputIcon}
                />

                <TextInput
                    placeholder="New Password"
                    value={password}
                    onChangeText={(text) => {
                        setPassword(text);
                        setErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    secureTextEntry={!showPassword}
                    style={styles.input}
                />

                <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                >
                    <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color="#666"
                    />
                </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

            {/* Confirm Password Input */}
            <View
                style={[
                    styles.inputContainer,
                    errors.confirmPassword ? styles.inputError : null,
                ]}
            >
                <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#888"
                    style={styles.inputIcon}
                />

                <TextInput
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={(text) => {
                        setConfirmPassword(text);
                        setErrors((prev) => ({
                            ...prev,
                            confirmPassword: "",
                        }));
                    }}
                    secureTextEntry={!showConfirmPassword}
                    style={styles.input}
                />

                <TouchableOpacity
                    onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
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
            {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            ) : null}

            {/* Reset Password Button */}
            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={resetPassword}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Reset Password</Text>
                )}
            </TouchableOpacity>
        </View>
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
        color: "#002E15",
        textAlign: "center",
        marginBottom: 20,
    },
    enterNew: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    otpLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#002E15",
        marginBottom: 15,
    },
    otpWrapper: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 15,
        position: "relative",
    },
    
    otpDigitContainer: {
        width: 45,
        height: 60,
        alignItems: "center",
        justifyContent: "flex-end",
      },
    activeOtpDigit: {
        borderBottomColor: "#002E15", // Highlight the active digit
    },
    
    otpDigit: {
        fontSize: 28,
        fontWeight: "700",
        color: "#002E15",
        marginBottom: 10,
      },
      underline: {
        width: "100%",
        height: 3,
        borderRadius: 2,
      },
    
    hiddenOtpInput: {
        position: "absolute",
        width: "100%",
        height: "100%",
        opacity: 0, // Hide the actual input field
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
        shadowOffset: { width: 0, height: 2 },
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