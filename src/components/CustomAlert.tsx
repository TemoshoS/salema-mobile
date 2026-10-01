import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type CustomAlertProps = {
    visible: boolean;
    title: string;
    message: string;
    type?: "error" | "warning" | "success" | "info";
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

export default function CustomAlert({
    visible,
    title,
    message,
    type = "info",
    confirmText = "OK",
    cancelText = "Cancel",
    showCancel = false,
    onConfirm,
    onCancel,
}: CustomAlertProps) {
    const getIcon = () => {
        switch (type) {
            case "error":
                return "alert-circle-outline";
            case "warning":
                return "warning-outline";
            case "success":
                return "checkmark-circle-outline";
            default:
                return "information-circle-outline";
        }
    };

    const getIconColor = () => {
        switch (type) {
            case "error":
                return "#D32F2F";
            case "warning":
                return "#C88719";
            case "success":
                return "#2E7D32";
            default:
                return "#002E15";
        }
    };

    const getIconBackground = () => {
        switch (type) {
            case "error":
                return "#FFF1F1";
            case "warning":
                return "#FFF7E8";
            case "success":
                return "#EAF4EC";
            default:
                return "#EAF4EC";
        }
    };

    const iconColor = getIconColor();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>

                    {/* CLOSE */}
                    <Pressable
                        style={styles.closeButton}
                        onPress={onCancel}
                        hitSlop={10}
                    >
                        <Ionicons
                            name="close"
                            size={22}
                            color="#7B827D"
                        />
                    </Pressable>

                    {/* ICON */}
                    <View
                        style={[
                            styles.iconContainer,
                            {
                                backgroundColor:
                                    getIconBackground(),
                            },
                        ]}
                    >
                        <Ionicons
                            name={getIcon() as any}
                            size={32}
                            color={iconColor}
                        />
                    </View>

                    {/* TITLE */}
                    <Text style={styles.title}>
                        {title}
                    </Text>

                    {/* MESSAGE */}
                    <Text style={styles.message}>
                        {message}
                    </Text>

                    {/* ACTIONS */}
                    <View style={styles.actions}>

                        {showCancel && (
                            <Pressable
                                style={styles.cancelButton}
                                onPress={onCancel}
                            >
                                <Text style={styles.cancelText}>
                                    {cancelText}
                                </Text>
                            </Pressable>
                        )}

                        <Pressable
                            style={[
                                styles.confirmButton,
                                !showCancel &&
                                    styles.fullConfirmButton,
                                type === "error" &&
                                    styles.errorConfirmButton,
                            ]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.confirmText}>
                                {confirmText}
                            </Text>
                        </Pressable>

                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.48)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },

    modal: {
        width: "100%",
        maxWidth: 390,
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        paddingHorizontal: 22,
        paddingTop: 28,
        paddingBottom: 22,
        alignItems: "center",
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },

    closeButton: {
        position: "absolute",
        top: 14,
        right: 14,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#F5F7F6",
        justifyContent: "center",
        alignItems: "center",
    },

    iconContainer: {
        width: 68,
        height: 68,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 17,
    },

    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#002E15",
        textAlign: "center",
    },

    message: {
        fontSize: 14,
        lineHeight: 21,
        color: "#707772",
        textAlign: "center",
        marginTop: 8,
        paddingHorizontal: 8,
    },

    actions: {
        width: "100%",
        flexDirection: "row",
        gap: 10,
        marginTop: 24,
    },

    cancelButton: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        backgroundColor: "#F3F5F4",
        justifyContent: "center",
        alignItems: "center",
    },

    cancelText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#59615C",
    },

    confirmButton: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        backgroundColor: "#002E15",
        justifyContent: "center",
        alignItems: "center",
    },

    fullConfirmButton: {
        flex: 1,
    },

    errorConfirmButton: {
        backgroundColor: "#D32F2F",
    },

    confirmText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#FFFFFF",
    },
});

