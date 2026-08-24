import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import ImageViewing from "react-native-image-viewing";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import { api } from "../../config/api";

interface Person {
    photo?: string;
    fullName: string;
    status: "Missing" | "Found";
    age: number;
    gender: string;
    lastSeenLocation: string;
    lastSeenDate: string;
    description: string;
    contactName: string;
    contactNumber?: string;
}

export default function MissingPersonDetails() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [person, setPerson] = useState<Person | null>(null);
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (id) {
            loadPerson();
        }
    }, [id]);

    const loadPerson = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/missing-person/${id}`);
            setPerson(res.data);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Unable to load missing person details.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const refreshPerson = async () => {
        setRefreshing(true);
        await loadPerson();
    };

    const callReporter = () => {
        if (!person?.contactNumber) {
            Alert.alert("Unavailable", "Reporter phone number not available.");
            return;
        }
        Linking.openURL(`tel:${person.contactNumber}`);
    };

    const markAsFound = async () => {
        Alert.alert(
            "Confirm",
            "Mark this person as found?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Yes",
                    onPress: async () => {
                        try {
                            setUpdating(true);

                            console.log("Updating:", id);

                            const res = await api.patch(
                                `/missing-person/${id}/found`
                            );

                            console.log("Success:", res.data);

                            Alert.alert(
                                "Success",
                                "Person marked as found."
                            );

                            await loadPerson();
                        } catch (error: any) {
                            console.log(
                                "ERROR:",
                                error.response?.status
                            );

                            console.log(
                                "DATA:",
                                error.response?.data
                            );

                            Alert.alert(
                                "Error",
                                error.response?.data?.message ||
                                error.message
                            );
                        } finally {
                            setUpdating(false);
                        }
                    },
                },
            ]
        );
    };

    const deletePerson = () => {
        Alert.alert(
            "Delete Missing Person",
            "Are you sure you want to permanently delete this record?",
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
                            setUpdating(true);

                            await api.delete(`/missing-person/${id}`);

                            Alert.alert(
                                "Deleted",
                                "Missing person record deleted successfully.",
                                [
                                    {
                                        text: "OK",
                                        onPress: () => {
                                            router.replace("/missing-person"); // Navigate back and refresh the list
                                        },
                                    },
                                ]
                            );
                        } catch (error: any) {
                            console.error(error);

                            Alert.alert(
                                "Error",
                                error.response?.data?.message ||
                                "Failed to delete missing person."
                            );
                        } finally {
                            setUpdating(false);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loader}>
                <ActivityIndicator size="large" color="#002E15" />
                <Text style={styles.loadingText}>Loading...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#F5F7FA" barStyle="dark-content" />
            <Header />
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
                <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        {person?.photo ? (
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => setVisible(true)}
                            >
                                <Image
                                    source={{ uri: person?.photo }}
                                    style={styles.avatar}
                                />

                                <View style={styles.zoomIcon}>
                                    <Ionicons
                                        name="expand-outline"
                                        size={20}
                                        color="#fff"
                                    />
                                </View>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={60} color="#ffffff" />
                            </View>
                        )}
                    </View>
                    <Text style={styles.name}>{person?.fullName}</Text>
                    <View
  style={[
    styles.statusBadge,
    {
      backgroundColor:
        person?.status === "Missing"
          ? "#FFE8E8"
          : "#E8F8EE",
    },
  ]}
>
  <Ionicons
    name={
      person?.status === "Missing"
        ? "warning"
        : "checkmark-circle"
    }
    size={18}
    color={
      person?.status === "Missing"
        ? "#E53935"
        : "#2E7D32"
    }
  />

  <Text
    style={[
      styles.statusText,
      {
        color:
          person?.status === "Missing"
            ? "#E53935"
            : "#2E7D32",
      },
    ]}
  >
    {person?.status}
  </Text>
</View>
                </View>

                {/* Personal Information */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Personal Information</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={22} color="#002E15" />
                        <View style={styles.infoContent}>
                            <Text style={styles.label}>Age</Text>
                            <Text style={styles.value}>{person?.age} Years</Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={22} color="#002E15" />
                        <View style={styles.infoContent}>
                            <Text style={styles.label}>Gender</Text>
                            <Text style={styles.value}>{person?.gender}</Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={22} color="#002E15" />
                        <View style={styles.infoContent}>
                            <Text style={styles.label}>Last Seen Location</Text>
                            <Text style={styles.value}>{person?.lastSeenLocation}</Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={22} color="#002E15" />
                        <View style={styles.infoContent}>
                            <Text style={styles.label}>Last Seen Date</Text>
                            <Text style={styles.value}>
                                {new Date(person?.lastSeenDate || "").toDateString()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Description */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Description</Text>
                    <Text style={styles.description}>{person?.description}</Text>
                </View>

                {/* Reporter */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Reporter Information</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="person-circle-outline" size={22} color="#002E15" />
                        <View style={styles.infoContent}>
                            <Text style={styles.label}>Reporter</Text>
                            <Text style={styles.value}>{person?.contactName}</Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={22} color="#002E15" />
                        <View style={styles.infoContent}>
                            <Text style={styles.label}>Phone Number</Text>
                            <Text style={styles.value}>{person?.contactNumber}</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.callButton} onPress={callReporter}>
                    <Ionicons name="call" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Call Reporter</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={refreshPerson}
                    disabled={refreshing}
                >
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <Text style={styles.buttonText}>
                        {refreshing ? "Refreshing..." : "Refresh Details"}
                    </Text>
                </TouchableOpacity>

                {person?.status === "Missing" && (
                    <TouchableOpacity
                        style={styles.foundButton}
                        onPress={markAsFound}
                        disabled={updating}
                    >
                        {updating ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                                <Text style={styles.buttonText}>Mark As Found</Text>
                            </>
                        )}
                    </TouchableOpacity>


                )}
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={deletePerson}
                    disabled={updating}
                >
                    {updating ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons
                                name="trash-outline"
                                size={22}
                                color="#fff"
                            />

                            <Text style={styles.buttonText}>
                                Delete Record
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
            <ImageViewing
      images={[
        {
          uri: person?.photo || "",
        },
      ]}
      imageIndex={0}
      visible={visible}
      onRequestClose={() => setVisible(false)}
    />
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4F7FB",
    },

    content: {
        padding: 18,
        paddingBottom: 40,
    },

    /* Loading */

    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: "#666",
        fontWeight: "600",
    },

    /* Empty */

    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 30,
    },

    emptyTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#222",
        marginTop: 15,
    },

    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        lineHeight: 24,
    },

    backButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#002E15",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        margin: 16,
        alignSelf: "flex-start", // Align the button to the left
    },

    backButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
    },
    /* Profile */

    profileCard: {
        backgroundColor: "#fff",
        borderRadius: 22,
        alignItems: "center",
        paddingVertical: 28,
        paddingHorizontal: 20,

        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 5,
        },

        elevation: 6,
    },

    avatarContainer:{
        width:"100%",
        marginBottom:18,
    },

    avatar: {
        width: "100%",
        height: 240,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "gray",
    },
    zoomIcon: {
        position: "absolute",
        bottom: 12,
        right: 12,
        backgroundColor: "rgba(0,0,0,0.6)",
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarPlaceholder: {
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: "#002E15",
        justifyContent: "center",
        alignItems: "center",
    },

    name: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1E293B",
        textAlign: "center",
    },

    statusBadge: {
        marginTop: 15,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 25,
        paddingHorizontal: 18,
        paddingVertical: 8,
    },

    statusText: {
        color: "#fff",
        fontWeight: "700",
        marginLeft: 8,
        fontSize: 15,
    },

    /* Cards */

    card: {
        backgroundColor: "#fff",
        borderRadius: 18,
        marginTop: 18,
        padding: 18,

        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 4,
        },

        elevation: 5,
    },

    cardTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#002E15",
        marginBottom: 16,
    },

    infoRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F1F1",
    },

    infoContent: {
        flex: 1,
        marginLeft: 15,
    },

    label: {
        fontSize: 13,
        color: "#888",
        marginBottom: 4,
        fontWeight: "600",
    },

    value: {
        fontSize: 16,
        color: "#222",
        lineHeight: 24,
        fontWeight: "600",
    },

    description: {
        fontSize: 16,
        color: "#555",
        lineHeight: 28,
    },

    /* Buttons */

    callButton: {
        marginTop: 25,
        backgroundColor: "#1976D2",
        borderRadius: 14,
        height: 56,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",

        shadowColor: "#1976D2",
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 5,
        },

        elevation: 5,
    },

    refreshButton: {
        marginTop: 15,
        backgroundColor: "#002E15",
        borderRadius: 14,
        height: 56,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",

        shadowColor: "#002E15",
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 5,
        },

        elevation: 5,
    },

    foundButton: {
        marginTop: 15,
        backgroundColor: "#E53935",
        borderRadius: 14,
        height: 56,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",

        shadowColor: "#E53935",
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 5,
        },

        elevation: 5,
    },
    deleteButton: {
        marginTop: 15,
        backgroundColor: "#D32F2F",
        borderRadius: 14,
        height: 56,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",

        shadowColor: "#D32F2F",
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 5,
        },

        elevation: 5,
    },

    buttonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 17,
        marginLeft: 10,
    },
});