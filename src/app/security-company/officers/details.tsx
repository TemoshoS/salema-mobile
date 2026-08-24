import { api } from "@/config/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OfficerDetailsScreen() {
  const router = useRouter();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [officer, setOfficer] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOfficer();
  }, []);

  const loadOfficer = async () => {
    try {
      const token = await AsyncStorage.getItem(
        "companyToken"
      );

      const res = await api.get(
        `/security-company/officers/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOfficer(res.data);
    } catch (err) {
      console.log(err);

      Alert.alert(
        "Error",
        "Unable to load officer details."
      );

      router.back();
    } finally {
      setLoading(false);
    }
  };

  const deleteOfficer = () => {
    Alert.alert(
      "Delete Officer",
      "Are you sure you want to permanently delete this officer?",
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
              const token =
                await AsyncStorage.getItem(
                  "companyToken"
                );

              await api.delete(
                `/security-company/officers/${id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              Alert.alert(
                "Success",
                "Officer deleted successfully."
              );

              router.back();
            } catch (err) {
              Alert.alert(
                "Error",
                "Failed to delete officer."
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator
          size="large"
          color="#002E15"
        />

        <Text
          style={{
            marginTop: 15,
            color: "#666",
            fontSize: 16,
          }}
        >
          Loading officer...
        </Text>
      </SafeAreaView>
    );
  }

  if (!officer) {
    return (
      <SafeAreaView style={styles.loader}>
        <Text>Officer not found.</Text>
      </SafeAreaView>
    );
  }

  const initials = `${officer.firstName?.charAt(0) ?? ""}${
    officer.lastName?.charAt(0) ?? ""
  }`.toUpperCase();
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#002E15"
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Officer Details
        </Text>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname:
                "/security-company/officers/edit",
              params: { id },
            })
          }
        >
          <Ionicons
            name="create-outline"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Profile Card */}

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {initials}
            </Text>
          </View>

          <Text style={styles.name}>
            {officer.firstName}{" "}
            {officer.lastName}
          </Text>

          <Text style={styles.rank}>
            {officer.rank}
          </Text>

        
       
        </View>

        {/* Information */}

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>
            Personal Information
          </Text>

          <View style={styles.infoRow}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#2563EB"
            />

            <View style={styles.infoContent}>
              <Text style={styles.label}>
                Email Address
              </Text>

              <Text style={styles.value}>
                {officer.email}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="call-outline"
              size={20}
              color="#16A34A"
            />

            <View style={styles.infoContent}>
              <Text style={styles.label}>
                Phone Number
              </Text>

              <Text style={styles.value}>
                {officer.phoneNumber}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="card-outline"
              size={20}
              color="#EA580C"
            />

            <View style={styles.infoContent}>
              <Text style={styles.label}>
                ID Number
              </Text>

              <Text style={styles.value}>
                {officer.idNumber}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#7C3AED"
            />

            <View style={styles.infoContent}>
              <Text style={styles.label}>
                PSIRA Number
              </Text>

              <Text style={styles.value}>
                {officer.psiraNumber}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="ribbon-outline"
              size={20}
              color="#0F766E"
            />

            <View style={styles.infoContent}>
              <Text style={styles.label}>
                Rank
              </Text>

              <Text style={styles.value}>
                {officer.rank}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color="#DC2626"
            />

            <View style={styles.infoContent}>
              <Text style={styles.label}>
                Created
              </Text>

              <Text style={styles.value}>
                {new Date(
                  officer.createdAt
                ).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

     

     
      
      </ScrollView>
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
  
    header: {
      backgroundColor: "#002E15",
      paddingHorizontal: 20,
      paddingVertical: 18,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      elevation: 6,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 3,
      },
    },
  
    headerTitle: {
      color: "#fff",
      fontSize: 21,
      fontWeight: "700",
    },
  
    content: {
      padding: 20,
      paddingBottom: 40,
    },
  
    profileCard: {
      backgroundColor: "#fff",
      borderRadius: 24,
      padding: 28,
      alignItems: "center",
      marginBottom: 20,
      elevation: 5,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: {
        width: 0,
        height: 5,
      },
    },
  
    avatar: {
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: "#002E15",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 18,
    },
  
    avatarText: {
      color: "#fff",
      fontSize: 36,
      fontWeight: "700",
    },
  
    name: {
      fontSize: 25,
      fontWeight: "700",
      color: "#002E15",
      textAlign: "center",
    },
  
    rank: {
      fontSize: 16,
      color: "#0F766E",
      fontWeight: "600",
      marginTop: 6,
    },
  
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 30,
      marginTop: 18,
    },
  
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 8,
    },
  
    statusText: {
      fontSize: 14,
      fontWeight: "700",
      textTransform: "capitalize",
    },
  
    infoCard: {
      backgroundColor: "#fff",
      borderRadius: 22,
      padding: 22,
      marginBottom: 22,
      elevation: 4,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 4,
      },
    },
  
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#002E15",
      marginBottom: 20,
    },
  
    infoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 22,
    },
  
    infoContent: {
      flex: 1,
      marginLeft: 15,
      borderBottomWidth: 1,
      borderBottomColor: "#F1F5F9",
      paddingBottom: 14,
    },
  
    label: {
      color: "#888",
      fontSize: 13,
      fontWeight: "600",
    },
  
    value: {
      color: "#111827",
      fontSize: 16,
      fontWeight: "700",
      marginTop: 5,
    },
  
    editButton: {
      backgroundColor: "#002E15",
      height: 56,
      borderRadius: 16,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 15,
      elevation: 3,
    },
  
    editButtonText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "700",
      marginLeft: 10,
    },
  
    deleteButton: {
      backgroundColor: "#DC2626",
      height: 56,
      borderRadius: 16,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      elevation: 3,
    },
  
    deleteButtonText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "700",
      marginLeft: 10,
    },
  });