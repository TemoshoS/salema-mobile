import { api } from "@/config/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BranchesScreen() {
    const router = useRouter();

    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingBranch, setEditingBranch] = useState<any>(null);

    const [branchName, setBranchName] = useState("");
    const [branchCode, setBranchCode] = useState("");
    const [address, setAddress] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [saving, setSaving] = useState(false);

    // ==========================================
    // Load Branches
    // ==========================================

    useFocusEffect(
        useCallback(() => {
            loadBranches();
        }, [])
    );

    const getAuthConfig = async () => {
        const token = await AsyncStorage.getItem(
            "companyToken"
        );

        return {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
    };

    const loadBranches = async () => {
        try {
            const config = await getAuthConfig();

            const response = await api.get(
                "/branches",
                config
            );

            setBranches(response.data.branches || []);
        } catch (error: any) {
            console.log(
                "Failed to load branches:",
                error.response?.data || error.message
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // ==========================================
    // Refresh
    // ==========================================

    const refreshBranches = () => {
        setRefreshing(true);
        loadBranches();
    };

    // ==========================================
    // Reset Form
    // ==========================================

    const resetForm = () => {
        setBranchName("");
        setBranchCode("");
        setAddress("");
        setPhoneNumber("");
        setContactPerson("");
        setEditingBranch(null);
    };

    // ==========================================
    // Open Add Modal
    // ==========================================

    const openAddModal = () => {
        resetForm();
        setModalVisible(true);
    };

    // ==========================================
    // Open Edit Modal
    // ==========================================

    const openEditModal = (branch: any) => {
        setEditingBranch(branch);

        setBranchName(branch.branchName || "");
        setBranchCode(branch.branchCode || "");
        setAddress(branch.address || "");
        setPhoneNumber(branch.phoneNumber || "");
        setContactPerson(branch.contactPerson || "");

        setModalVisible(true);
    };

    // ==========================================
    // Close Modal
    // ==========================================

    const closeModal = () => {
        setModalVisible(false);
        resetForm();
    };

    // ==========================================
    // Save Branch
    // ==========================================

    const saveBranch = async () => {
        if (
            !branchName.trim() ||
            !branchCode.trim() ||
            !address.trim() ||
            !phoneNumber.trim() ||
            !contactPerson.trim()
        ) {
            Alert.alert(
                "Missing Information",
                "Please complete all branch fields."
            );

            return;
        }

        try {
            setSaving(true);

            const config = await getAuthConfig();

            const data = {
                branchName: branchName.trim(),
                branchCode: branchCode.trim(),
                address: address.trim(),
                phoneNumber: phoneNumber.trim(),
                contactPerson: contactPerson.trim(),
            };

            if (editingBranch) {
                await api.patch(
                    `/branches/${editingBranch._id}`,
                    data,
                    config
                );
            } else {
                await api.post(
                    "/branches",
                    data,
                    config
                );
            }

            closeModal();
            loadBranches();
        } catch (error: any) {
            console.log(
                "Failed to save branch:",
                error.response?.data || error.message
            );

            Alert.alert(
                "Error",
                error.response?.data?.message ||
                    "Failed to save branch."
            );
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // Delete Branch
    // ==========================================

    const deleteBranch = (branch: any) => {
        Alert.alert(
            "Delete Branch",
            `Are you sure you want to delete ${branch.branchName}?`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const config =
                                await getAuthConfig();

                            await api.delete(
                                `/branches/${branch._id}`,
                                config
                            );

                            setBranches((prev) =>
                                prev.filter(
                                    (item) =>
                                        item._id !==
                                        branch._id
                                )
                            );
                        } catch (error: any) {
                            console.log(
                                "Failed to delete branch:",
                                error.response?.data ||
                                    error.message
                            );

                            Alert.alert(
                                "Error",
                                error.response?.data?.message ||
                                    "Failed to delete branch."
                            );
                        }
                    },
                },
            ]
        );
    };

    // ==========================================
    // Status Color
    // ==========================================

    const getStatusColor = (status: string) => {
        return status === "active"
            ? "#16A34A"
            : "#DC2626";
    };

    // ==========================================
    // Loading
    // ==========================================

    if (loading) {
        return (
            <SafeAreaView style={styles.loader}>
                <ActivityIndicator
                    size="large"
                    color="#002E15"
                />

                <Text style={styles.loadingText}>
                    Loading branches...
                </Text>
            </SafeAreaView>
        );
    }

    // ==========================================
    // Screen
    // ==========================================

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                backgroundColor="#002E15"
                barStyle="light-content"
            />

            {/* Header */}

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                >
                    <Ionicons
                        name="arrow-back"
                        size={25}
                        color="#fff"
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Branches
                </Text>

                <TouchableOpacity
                    onPress={openAddModal}
                >
                    <Ionicons
                        name="add-circle-outline"
                        size={27}
                        color="#fff"
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={
                    branches.length === 0
                        ? styles.emptyContent
                        : styles.content
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refreshBranches}
                        colors={["#002E15"]}
                    />
                }
            >
                {/* Summary */}

                <View style={styles.summaryCard}>
                    <View>
                        <Text style={styles.summaryLabel}>
                            Total Branches
                        </Text>

                        <Text style={styles.summaryValue}>
                            {branches.length}
                        </Text>
                    </View>

                    <View style={styles.summaryIcon}>
                        <Ionicons
                            name="business"
                            size={28}
                            color="#2563EB"
                        />
                    </View>
                </View>

                {/* Add Button */}

                <TouchableOpacity
                    style={styles.addButton}
                    onPress={openAddModal}
                >
                    <Ionicons
                        name="add"
                        size={21}
                        color="#fff"
                    />

                    <Text style={styles.addButtonText}>
                        Add New Branch
                    </Text>
                </TouchableOpacity>

                {/* Empty */}

                {branches.length === 0 ? (
                    <View style={styles.empty}>
                        <View style={styles.emptyIcon}>
                            <Ionicons
                                name="business-outline"
                                size={55}
                                color="#002E15"
                            />
                        </View>

                        <Text style={styles.emptyTitle}>
                            No Branches Yet
                        </Text>

                        <Text style={styles.emptyText}>
                            Create your first branch to start
                            organizing your security officers.
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.sectionTitle}>
                            Your Branches
                        </Text>

                        {branches.map((branch) => {
                            const statusColor =
                                getStatusColor(branch.status);

                            return (
                                <View
                                    key={branch._id}
                                    style={styles.branchCard}
                                >
                                    {/* Branch Header */}

                                    <View style={styles.cardHeader}>
                                        <View
                                            style={styles.branchIcon}
                                        >
                                            <Ionicons
                                                name="business"
                                                size={25}
                                                color="#fff"
                                            />
                                        </View>

                                        <View
                                            style={styles.headerInfo}
                                        >
                                            <Text
                                                style={
                                                    styles.branchName
                                                }
                                            >
                                                {branch.branchName}
                                            </Text>

                                            <Text
                                                style={
                                                    styles.branchCode
                                                }
                                            >
                                                {branch.branchCode}
                                            </Text>
                                        </View>

                                        <View
                                            style={[
                                                styles.statusBadge,
                                                {
                                                    backgroundColor:
                                                        `${statusColor}18`,
                                                },
                                            ]}
                                        >
                                            <View
                                                style={[
                                                    styles.statusDot,
                                                    {
                                                        backgroundColor:
                                                            statusColor,
                                                    },
                                                ]}
                                            />

                                            <Text
                                                style={[
                                                    styles.statusText,
                                                    {
                                                        color:
                                                            statusColor,
                                                    },
                                                ]}
                                            >
                                                {branch.status}
                                            </Text>
                                        </View>
                                    </View>

                                    <View
                                        style={styles.divider}
                                    />

                                    {/* Address */}

                                    <View style={styles.infoRow}>
                                        <View
                                            style={styles.infoIcon}
                                        >
                                            <Ionicons
                                                name="location-outline"
                                                size={19}
                                                color="#DC2626"
                                            />
                                        </View>

                                        <View
                                            style={styles.infoContent}
                                        >
                                            <Text
                                                style={
                                                    styles.infoLabel
                                                }
                                            >
                                                Address
                                            </Text>

                                            <Text
                                                style={
                                                    styles.infoValue
                                                }
                                            >
                                                {branch.address}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Phone */}

                                    <View style={styles.infoRow}>
                                        <View
                                            style={styles.infoIcon}
                                        >
                                            <Ionicons
                                                name="call-outline"
                                                size={19}
                                                color="#16A34A"
                                            />
                                        </View>

                                        <View
                                            style={styles.infoContent}
                                        >
                                            <Text
                                                style={
                                                    styles.infoLabel
                                                }
                                            >
                                                Contact Number
                                            </Text>

                                            <Text
                                                style={
                                                    styles.infoValue
                                                }
                                            >
                                                {branch.phoneNumber}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Contact Person */}

                                    <View style={styles.infoRow}>
                                        <View
                                            style={styles.infoIcon}
                                        >
                                            <Ionicons
                                                name="person-outline"
                                                size={19}
                                                color="#2563EB"
                                            />
                                        </View>

                                        <View
                                            style={styles.infoContent}
                                        >
                                            <Text
                                                style={
                                                    styles.infoLabel
                                                }
                                            >
                                                Contact Person
                                            </Text>

                                            <Text
                                                style={
                                                    styles.infoValue
                                                }
                                            >
                                                {branch.contactPerson}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Officers */}

                                    <View
                                        style={
                                            styles.officerContainer
                                        }
                                    >
                                        <View>
                                            <Text
                                                style={
                                                    styles.infoLabel
                                                }
                                            >
                                                Assigned Officers
                                            </Text>

                                            <Text
                                                style={
                                                    styles.officerCount
                                                }
                                            >
                                                {branch.officerCount || 0}
                                            </Text>
                                        </View>

                                        <View
                                            style={
                                                styles.officerIcon
                                            }
                                        >
                                            <Ionicons
                                                name="people"
                                                size={25}
                                                color="#0E7490"
                                            />
                                        </View>
                                    </View>

                                    {/* Actions */}

                                    <View
                                        style={styles.actions}
                                    >
                                        <TouchableOpacity
                                            style={
                                                styles.editButton
                                            }
                                            onPress={() =>
                                                openEditModal(
                                                    branch
                                                )
                                            }
                                        >
                                            <Ionicons
                                                name="create-outline"
                                                size={19}
                                                color="#2563EB"
                                            />

                                            <Text
                                                style={
                                                    styles.editText
                                                }
                                            >
                                                Edit
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={
                                                styles.deleteButton
                                            }
                                            onPress={() =>
                                                deleteBranch(
                                                    branch
                                                )
                                            }
                                        >
                                            <Ionicons
                                                name="trash-outline"
                                                size={19}
                                                color="#DC2626"
                                            />

                                            <Text
                                                style={
                                                    styles.deleteText
                                                }
                                            >
                                                Delete
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </>
                )}
            </ScrollView>

            {/* Add / Edit Modal */}

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingBranch
                                    ? "Edit Branch"
                                    : "Add New Branch"}
                            </Text>

                            <TouchableOpacity
                                onPress={closeModal}
                            >
                                <Ionicons
                                    name="close"
                                    size={25}
                                    color="#555"
                                />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                        >
                            <Text style={styles.inputLabel}>
                                Branch Name
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Enter branch name"
                                value={branchName}
                                onChangeText={setBranchName}
                            />

                            <Text style={styles.inputLabel}>
                                Branch Code
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="e.g. TEM001"
                                autoCapitalize="characters"
                                value={branchCode}
                                onChangeText={setBranchCode}
                            />

                            <Text style={styles.inputLabel}>
                                Address
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Enter branch address"
                                value={address}
                                onChangeText={setAddress}
                            />

                            <Text style={styles.inputLabel}>
                                Phone Number
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Enter phone number"
                                keyboardType="phone-pad"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                            />

                            <Text style={styles.inputLabel}>
                                Contact Person
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Enter contact person"
                                value={contactPerson}
                                onChangeText={
                                    setContactPerson
                                }
                            />

                            <TouchableOpacity
                                style={[
                                    styles.saveButton,
                                    saving &&
                                        styles.disabledButton,
                                ]}
                                onPress={saveBranch}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator
                                        color="#fff"
                                    />
                                ) : (
                                    <>
                                        <Ionicons
                                            name="checkmark"
                                            size={21}
                                            color="#fff"
                                        />

                                        <Text
                                            style={
                                                styles.saveButtonText
                                            }
                                        >
                                            {editingBranch
                                                ? "Update Branch"
                                                : "Create Branch"}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#EEF6F3",
    },

    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#EEF6F3",
    },

    loadingText: {
        marginTop: 15,
        color: "#666",
        fontSize: 15,
    },

    header: {
        backgroundColor: "#002E15",
        paddingHorizontal: 20,
        paddingVertical: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    headerTitle: {
        color: "#fff",
        fontSize: 21,
        fontWeight: "700",
    },

    content: {
        padding: 16,
        paddingBottom: 40,
    },

    emptyContent: {
        padding: 16,
        flexGrow: 1,
    },

    summaryCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        marginBottom: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        elevation: 3,
    },

    summaryLabel: {
        color: "#777",
        fontSize: 14,
    },

    summaryValue: {
        color: "#002E15",
        fontSize: 32,
        fontWeight: "700",
        marginTop: 4,
    },

    summaryIcon: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: "#DBEAFE",
        justifyContent: "center",
        alignItems: "center",
    },

    addButton: {
        height: 52,
        borderRadius: 15,
        backgroundColor: "#002E15",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 22,
    },

    addButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
        marginLeft: 7,
    },

    sectionTitle: {
        color: "#002E15",
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 14,
    },

    branchCard: {
        backgroundColor: "#fff",
        borderRadius: 22,
        padding: 18,
        marginBottom: 18,
        elevation: 4,
    },

    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
    },

    branchIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: "#2563EB",
        justifyContent: "center",
        alignItems: "center",
    },

    headerInfo: {
        flex: 1,
        marginLeft: 13,
    },

    branchName: {
        color: "#002E15",
        fontSize: 17,
        fontWeight: "700",
    },

    branchCode: {
        color: "#888",
        fontSize: 12,
        marginTop: 4,
    },

    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 20,
    },

    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        marginRight: 5,
    },

    statusText: {
        fontSize: 12,
        fontWeight: "700",
        textTransform: "capitalize",
    },

    divider: {
        height: 1,
        backgroundColor: "#F0F0F0",
        marginVertical: 17,
    },

    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
    },

    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#F8FAFC",
        justifyContent: "center",
        alignItems: "center",
    },

    infoContent: {
        flex: 1,
        marginLeft: 12,
    },

    infoLabel: {
        color: "#888",
        fontSize: 12,
        fontWeight: "600",
    },

    infoValue: {
        color: "#111827",
        fontSize: 15,
        fontWeight: "600",
        marginTop: 3,
    },

    officerContainer: {
        backgroundColor: "#F8FAFC",
        borderRadius: 15,
        padding: 15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 3,
    },

    officerCount: {
        color: "#002E15",
        fontSize: 22,
        fontWeight: "700",
        marginTop: 3,
    },

    officerIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#E0F2FE",
        justifyContent: "center",
        alignItems: "center",
    },

    actions: {
        flexDirection: "row",
        marginTop: 15,
    },

    editButton: {
        flex: 1,
        height: 48,
        borderRadius: 13,
        backgroundColor: "#EFF6FF",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        marginRight: 8,
    },

    editText: {
        color: "#2563EB",
        fontWeight: "700",
        marginLeft: 6,
    },

    deleteButton: {
        flex: 1,
        height: 48,
        borderRadius: 13,
        backgroundColor: "#FEF2F2",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        marginLeft: 8,
    },

    deleteText: {
        color: "#DC2626",
        fontWeight: "700",
        marginLeft: 6,
    },

    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 70,
        paddingHorizontal: 25,
    },

    emptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#DDEDE5",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },

    emptyTitle: {
        color: "#002E15",
        fontSize: 23,
        fontWeight: "700",
    },

    emptyText: {
        color: "#777",
        fontSize: 15,
        lineHeight: 22,
        textAlign: "center",
        marginTop: 10,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "flex-end",
    },

    modal: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 22,
        maxHeight: "88%",
    },

    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },

    modalTitle: {
        color: "#002E15",
        fontSize: 21,
        fontWeight: "700",
    },

    inputLabel: {
        color: "#374151",
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 7,
        marginTop: 10,
    },

    input: {
        height: 52,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 13,
        paddingHorizontal: 15,
        color: "#111827",
        fontSize: 15,
    },

    saveButton: {
        height: 54,
        backgroundColor: "#002E15",
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        marginTop: 24,
        marginBottom: 20,
    },

    saveButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
        marginLeft: 7,
    },

    disabledButton: {
        opacity: 0.6,
    },
});