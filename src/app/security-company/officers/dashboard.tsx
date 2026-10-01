import { api } from "@/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

type Officer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  rank: string;
  status: "active" | "inactive";
  company?: {
    id: string;
    name: string;
  };
};

export default function SecurityOfficerDashboard() {
  const router = useRouter();

  const [officer, setOfficer] = useState<Officer | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadOfficer();
    }, [])
  );

  const loadOfficer = async () => {
    try {
      const token = await AsyncStorage.getItem("officerToken");
      const officerData = await AsyncStorage.getItem("officerData");

      if (!token || !officerData) {
        router.replace(
          "/security-company/officers/officer-login"
        );
        return;
      }

      const parsedOfficer = JSON.parse(officerData);

      setOfficer(parsedOfficer);
    } catch (error) {
      console.error("LOAD OFFICER ERROR:", error);

      await AsyncStorage.removeItem("officerToken");
      await AsyncStorage.removeItem("officerData");

      router.replace(
        "/security-company/officers/officer-login"
      );
    } finally {
      setLoading(false);
    }
  };
  const toggleOfficerStatus = async () => {
    if (!officer || updatingStatus) return;

    const newStatus: Officer["status"] =
      officer.status === "active"
        ? "inactive"
        : "active";

    try {
      setUpdatingStatus(true);

      const token = await AsyncStorage.getItem("officerToken");

      const response = await api.patch(
        "/security-company/officers/status",
        {
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedOfficer = {
        ...officer,
        status: response.data.officer.status,
      };

      setOfficer(updatedOfficer);

      await AsyncStorage.setItem(
        "officerData",
        JSON.stringify(updatedOfficer)
      );
    } catch (error: any) {
      console.error(
        "UPDATE OFFICER STATUS ERROR:",
        error?.response?.data || error.message
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
        "Failed to update your status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleLogout = async () => {
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
            await AsyncStorage.removeItem("officerToken");
            await AsyncStorage.removeItem("officerData");

            router.replace("/");
          },
        },
      ]
    );
  };
  if (loading) {
    return (
      <LinearGradient
        colors={["#021C10", "#06391F", "#0A5B31"]}
        style={styles.loader}
      >
        <ActivityIndicator
          size="large"
          color="#fff"
        />
      </LinearGradient>
    );
  }

  if (!officer) {
    return null;
  }

  return (
    <LinearGradient
      colors={["#021C10", "#06391F", "#0A5B31"]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================== */}
        {/* HEADER */}
        {/* ========================================== */}

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Welcome back
            </Text>

            <Text style={styles.name}>
              {officer.firstName}{" "}
              {officer.lastName}
            </Text>
          </View>


          <View style={styles.statusContainer}>
            <Text
              style={[
                styles.statusText,
                officer.status === "active"
                  ? styles.activeText
                  : styles.inactiveText,
              ]}
            >
              {officer.status === "active"
                ? "Active"
                : "Inactive"}
            </Text>

            {updatingStatus ? (
              <ActivityIndicator
                size="small"
                color="#fff"
              />
            ) : (
              <Switch
                value={officer.status === "active"}
                onValueChange={toggleOfficerStatus}
                disabled={updatingStatus}
                trackColor={{
                  false: "#FF5252",
                  true: "#00C853",
                }}
                thumbColor="#fff"
                ios_backgroundColor="#FF5252"
              />
            )}
          </View>


        </View>

        {/* ========================================== */}
        {/* OFFICER PROFILE CARD */}
        {/* ========================================== */}

        <View style={styles.profileCard}>
          <View style={styles.profileIcon}>
            <Text style={styles.profileEmoji}>
              🛡️
            </Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {officer.firstName}{" "}
              {officer.lastName}
            </Text>

            <Text style={styles.rank}>
              {officer.rank}
            </Text>

            {officer.company && (
              <Text style={styles.company}>
                {officer.company.name}
              </Text>
            )}
          </View>
        </View>

        {/* ========================================== */}
        {/* INCIDENTS */}
        {/* ========================================== */}

        <Text style={styles.sectionTitle}>
          Emergency Response
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.incidentCard,
            pressed && styles.pressed,
          ]}
          onPress={() =>
            router.push(
              "/security-company/officers/officerIncidents"
            )
          }
        >
          <View style={styles.incidentIcon}>
            <Text style={styles.incidentEmoji}>
              🚨
            </Text>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              My Incidents
            </Text>

            <Text style={styles.cardSubtitle}>
              View SOS incidents assigned to you and
              respond to emergencies.
            </Text>
          </View>

          <Text style={styles.arrow}>→</Text>
        </Pressable>

        {/* ========================================== */}
        {/* PROFILE */}
        {/* ========================================== */}

        <Text style={styles.sectionTitle}>
          Account
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Email
            </Text>

            <Text style={styles.infoValue}>
              {officer.email}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Phone
            </Text>

            <Text style={styles.infoValue}>
              {officer.phoneNumber}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Rank
            </Text>

            <Text style={styles.infoValue}>
              {officer.rank}
            </Text>
          </View>

          {officer.company && (
            <>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  Company
                </Text>

                <Text style={styles.infoValue}>
                  {officer.company.name}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* ========================================== */}
        {/* LOGOUT */}
        {/* ========================================== */}

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.pressed,
          ]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>
            Logout
          </Text>
        </Pressable>

        <Text style={styles.footer}>
          Salema • Security Officer Portal
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // ==========================================
  // HEADER
  // ==========================================

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  greeting: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    marginBottom: 4,
  },

  name: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  activeText: {
    color: "#00C853",
  },

  inactiveText: {
    color: "#FF5252",
  },

  statusText: {
    color: "#A5F5C5",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  // ==========================================
  // PROFILE
  // ==========================================

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 32,
  },

  profileIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FFC107",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  profileEmoji: {
    fontSize: 32,
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  rank: {
    color: "#A5F5C5",
    fontSize: 14,
    marginTop: 4,
  },

  company: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginTop: 3,
  },

  // ==========================================
  // SECTION
  // ==========================================

  sectionTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },

  // ==========================================
  // INCIDENT CARD
  // ==========================================

  incidentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,193,7,0.12)",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,193,7,0.4)",
    marginBottom: 30,
  },

  incidentIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFC107",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  incidentEmoji: {
    fontSize: 27,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 5,
  },

  cardSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    lineHeight: 19,
  },

  arrow: {
    color: "#fff",
    fontSize: 27,
    fontWeight: "700",
    marginLeft: 10,
  },

  // ==========================================
  // INFORMATION
  // ==========================================

  infoCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 22,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 30,
  },

  infoRow: {
    minHeight: 55,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  infoLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
  },

  infoValue: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    maxWidth: "65%",
    textAlign: "right",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  // ==========================================
  // LOGOUT
  // ==========================================

  logoutButton: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.85,
  },

  footer: {
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    fontSize: 12,
    marginTop: 25,
  },
});