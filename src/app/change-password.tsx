
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
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

export default function ChangePassword() {
    const router = useRouter();

    const [showCurrentPassword, setShowCurrentPassword] =
        useState(false);

    const [showNewPassword, setShowNewPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [currentPassword, setCurrentPassword] =
        useState("");

    const [newPassword, setNewPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [loading, setLoading] = useState(false);

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

    const changePassword = async () => {
        const current =
            currentPassword.trim();

        const newPass =
            newPassword.trim();

        const confirm =
            confirmPassword.trim();

        if (!current || !newPass || !confirm) {
            showAlert({
                title: "Missing Information",
                message:
                    "Please complete all password fields before continuing.",
                type: "warning",
                confirmText: "OK",
            });

            return;
        }

        if (newPass.length < 6) {
            showAlert({
                title: "Password Too Short",
                message:
                    "Your new password must contain at least 6 characters.",
                type: "warning",
                confirmText: "OK",
            });

            return;
        }

        if (newPass !== confirm) {
            showAlert({
                title: "Passwords Don't Match",
                message:
                    "Your new password and confirmation password must match.",
                type: "warning",
                confirmText: "OK",
            });

            return;
        }

        if (current === newPass) {
            showAlert({
                title: "Invalid Password",
                message:
                    "Your new password must be different from your current password.",
                type: "warning",
                confirmText: "OK",
            });

            return;
        }

        try {
            setLoading(true);

            const token =
                await AsyncStorage.getItem("token");

            await api.put(
                "/auth/change-password",
                {
                    currentPassword: current,
                    newPassword: newPass,
                    confirmPassword: confirm,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            showAlert({
                title: "Password Changed",
                message:
                    "Your password has been changed successfully.",
                type: "success",
                confirmText: "Done",
                onConfirm: () => router.back(),
            });
        } catch (error: any) {
            console.log(
                "Change password error:",
                error?.response?.data || error
            );

            showAlert({
                title: "Unable to Change Password",
                message:
                    error?.response?.data?.message ||
                    "Something went wrong while changing your password. Please try again.",
                type: "error",
                confirmText: "OK",
            });
        } finally {
            setLoading(false);
        }
    };

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
              
                {/* SECURITY INFO */}
                <View style={styles.securityCard}>
                    <View
                        style={
                            styles.securityIcon
                        }
                    >
                        <Ionicons
                            name="shield-checkmark-outline"
                            size={22}
                            color="#002E15"
                        />
                    </View>

                    <View
                        style={
                            styles.securityContent
                        }
                    >
                        <Text
                            style={
                                styles.securityTitle
                            }
                        >
                            Secure your account
                        </Text>

                        <Text
                            style={
                                styles.securityText
                            }
                        >
                            Choose a strong password
                            that you don't use
                            elsewhere.
                        </Text>
                    </View>
                </View>

                {/* FORM */}
                <View style={styles.formCard}>
                    {/* CURRENT PASSWORD */}
                    <View style={styles.field}>
                        <Text
                            style={styles.label}
                        >
                            Current Password
                        </Text>

                        <View
                            style={
                                styles.inputContainer
                            }
                        >
                            <Ionicons
                                name="lock-closed-outline"
                                size={20}
                                color="#7D857F"
                            />

                            <TextInput
                                placeholder="Enter current password"
                                placeholderTextColor="#A5ACA7"
                                secureTextEntry={
                                    !showCurrentPassword
                                }
                                style={
                                    styles.input
                                }
                                value={
                                    currentPassword
                                }
                                onChangeText={
                                    setCurrentPassword
                                }
                                autoCapitalize="none"
                            />

                            <TouchableOpacity
                                style={
                                    styles.eyeButton
                                }
                                onPress={() =>
                                    setShowCurrentPassword(
                                        !showCurrentPassword
                                    )
                                }
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={
                                        showCurrentPassword
                                            ? "eye-off-outline"
                                            : "eye-outline"
                                    }
                                    size={22}
                                    color="#68716B"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* NEW PASSWORD */}
                    <View style={styles.field}>
                        <Text
                            style={styles.label}
                        >
                            New Password
                        </Text>

                        <View
                            style={
                                styles.inputContainer
                            }
                        >
                            <Ionicons
                                name="key-outline"
                                size={20}
                                color="#7D857F"
                            />

                            <TextInput
                                placeholder="Enter new password"
                                placeholderTextColor="#A5ACA7"
                                secureTextEntry={
                                    !showNewPassword
                                }
                                style={
                                    styles.input
                                }
                                value={
                                    newPassword
                                }
                                onChangeText={
                                    setNewPassword
                                }
                                autoCapitalize="none"
                            />

                            <TouchableOpacity
                                style={
                                    styles.eyeButton
                                }
                                onPress={() =>
                                    setShowNewPassword(
                                        !showNewPassword
                                    )
                                }
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={
                                        showNewPassword
                                            ? "eye-off-outline"
                                            : "eye-outline"
                                    }
                                    size={22}
                                    color="#68716B"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* CONFIRM PASSWORD */}
                    <View
                        style={[
                            styles.field,
                            styles.lastField,
                        ]}
                    >
                        <Text
                            style={styles.label}
                        >
                            Confirm Password
                        </Text>

                        <View
                            style={
                                styles.inputContainer
                            }
                        >
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={20}
                                color="#7D857F"
                            />

                            <TextInput
                                placeholder="Confirm new password"
                                placeholderTextColor="#A5ACA7"
                                secureTextEntry={
                                    !showConfirmPassword
                                }
                                style={
                                    styles.input
                                }
                                value={
                                    confirmPassword
                                }
                                onChangeText={
                                    setConfirmPassword
                                }
                                autoCapitalize="none"
                            />

                            <TouchableOpacity
                                style={
                                    styles.eyeButton
                                }
                                onPress={() =>
                                    setShowConfirmPassword(
                                        !showConfirmPassword
                                    )
                                }
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={
                                        showConfirmPassword
                                            ? "eye-off-outline"
                                            : "eye-outline"
                                    }
                                    size={22}
                                    color="#68716B"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* PASSWORD REQUIREMENTS */}
                <View style={styles.requirements}>
                    <Text
                        style={
                            styles.requirementsTitle
                        }
                    >
                        Password requirements
                    </Text>

                    <View style={styles.requirementRow}>
                        <Ionicons
                            name="checkmark-circle-outline"
                            size={16}
                            color="#6B756E"
                        />

                        <Text
                            style={
                                styles.requirementText
                            }
                        >
                            At least 6 characters
                        </Text>
                    </View>

                    <View style={styles.requirementRow}>
                        <Ionicons
                            name="checkmark-circle-outline"
                            size={16}
                            color="#6B756E"
                        />

                        <Text
                            style={
                                styles.requirementText
                            }
                        >
                            Different from your current
                            password
                        </Text>
                    </View>
                </View>

                {/* BUTTON */}
                <TouchableOpacity
                    style={[
                        styles.button,
                        loading &&
                            styles.buttonDisabled,
                    ]}
                    disabled={loading}
                    onPress={changePassword}
                    activeOpacity={0.8}
                >
                    {loading ? (
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
                                Changing Password...
                            </Text>
                        </>
                    ) : (
                        <>
                            <Ionicons
                                name="lock-closed-outline"
                                size={21}
                                color="#FFFFFF"
                            />

                            <Text
                                style={
                                    styles.buttonText
                                }
                            >
                                Change Password
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.footer}>
                    Your password helps protect your
                    Salema account.
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
        backgroundColor: "#fff",
    },

    content: {
        paddingHorizontal: 18,
        paddingTop: 20,
        paddingBottom: 40,
    },

    pageHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
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

    securityCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EAF4EC",
        borderRadius: 17,
        padding: 14,
        marginBottom: 18,
    },

    securityIcon: {
        width: 43,
        height: 43,
        borderRadius: 13,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
    },

    securityContent: {
        flex: 1,
        marginLeft: 12,
    },

    securityTitle: {
        color: "#002E15",
        fontSize: 14,
        fontWeight: "700",
    },

    securityText: {
        color: "#667069",
        fontSize: 11,
        lineHeight: 17,
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
        height: 54,
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FAFBFA",
        borderWidth: 1,
        borderColor: "#DDE5DF",
        borderRadius: 14,
        paddingLeft: 14,
        paddingRight: 6,
    },

    input: {
        flex: 1,
        height: "100%",
        fontSize: 14,
        color: "#202522",
        paddingHorizontal: 10,
    },

    eyeButton: {
        width: 42,
        height: 42,
        justifyContent: "center",
        alignItems: "center",
    },

    requirements: {
        marginTop: 17,
        paddingHorizontal: 4,
    },

    requirementsTitle: {
        fontSize: 12,
        fontWeight: "700",
        color: "#39413C",
        marginBottom: 8,
    },

    requirementRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
    },

    requirementText: {
        fontSize: 11,
        color: "#7D857F",
        marginLeft: 7,
    },

    button: {
        height: 56,
        borderRadius: 16,
        backgroundColor: "#002E15",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        marginTop: 15,
    },

    buttonDisabled: {
        opacity: 0.7,
    },

    buttonText: {
        color: "#FFFFFF",
        marginLeft: 9,
        fontSize: 15,
        fontWeight: "700",
    },

    footer: {
        textAlign: "center",
        color: "#9AA19C",
        fontSize: 11,
        lineHeight: 17,
        marginTop: 20,
    },
});

