import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import { api } from "../../config/api.js";

export default function SecurityScreen() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingCompany, setPendingCompany] = useState<any>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  useEffect(() => {
    loadCompanies();
    loadSelectedCompany();
  }, []);

  const loadCompanies = async () => {
    try {
      const res = await api.get("/security-companies");
      setCompanies(res.data);
    } catch (err) {
      Alert.alert("Error", "Failed to load security companies");
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedCompany = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");

      if (!userId) return;

      const res = await api.get(`/user-security-companies/user/${userId}`);

      if (res.data) {
        setSelectedCompany(res.data.companyId._id);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const chooseCompany = (company: any) => {
    if (selectedCompany === company._id) {
      showMessage("This is already your preferred security company.", "success");
      return;
    }

    if (selectedCompany) {
      setPendingCompany(company);
      setConfirmVisible(true);
      return;
    }

    saveCompany(company);
  };

  const saveCompany = async (company: any) => {
    try {
      const userId = await AsyncStorage.getItem("userId");

      if (!userId) return;

      await api.post("/user-security-companies/add", {
        userId,
        companyId: company._id,
      });

      await loadSelectedCompany();

      showMessage(`${company.name} is now your security company.`, "success");
    } catch (error: any) {
      showMessage(error.response?.data?.message || "Failed to save company.", "error");
    }
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#002E15" />
        <Text style={styles.loadingText}>Loading security companies...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      {/* Message Feedback */}
      {message ? (
        <View
          style={[
            styles.messageContainer,
            messageType === "success" ? styles.success : styles.error,
          ]}
        >
          <Ionicons
            name={messageType === "success" ? "checkmark-circle" : "alert-circle"}
            size={20}
            color={messageType === "success" ? "#00C853" : "#E53935"}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}

      <Text style={styles.title}>Choose Your Preferred Security Company</Text>

      {/* Company List */}
      <FlatList
        data={companies}
        keyExtractor={(item: any) => item._id}
        renderItem={({ item }: any) => (
          <TouchableOpacity
            style={[
              styles.card,
              selectedCompany === item._id && styles.selectedCard,
            ]}
            onPress={() => chooseCompany(item)}
          >
            <Text style={styles.companyName}>{item.name}</Text>

            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color="#555" />
              <Text style={styles.text}>{item.phone}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={16} color="#555" />
              <Text style={styles.text}>{item.email}</Text>
            </View>

            <Text style={styles.text}>
              {item.city}, {item.province}
            </Text>

            <Text style={styles.description}>{item.description}</Text>

            {selectedCompany === item._id && (
              <Text style={styles.selectedText}>✓ Selected</Text>
            )}
          </TouchableOpacity>
        )}
      />

      {/* Confirmation Modal */}
      <Modal transparent visible={confirmVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Security Company</Text>

            <Text style={styles.modalText}>
              Do you want to change your preferred security company to{" "}
              <Text style={{ fontWeight: "700" }}>{pendingCompany?.name}</Text>?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setConfirmVisible(false);
                  setPendingCompany(null);
                }}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  setConfirmVisible(false);
                  saveCompany(pendingCompany);
                }}
              >
                <Text style={{ color: "#fff" }}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8F7",
    padding: 15,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    color: "#002E15",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  selectedCard: {
    borderWidth: 2,
    borderColor: "#00C853",
  },

  companyName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#002E15",
    marginBottom: 8,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  text: {
    marginLeft: 8,
    color: "#555",
  },

  description: {
    marginTop: 10,
    color: "#777",
  },

  selectedText: {
    marginTop: 12,
    color: "#00C853",
    fontWeight: "700",
  },

  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 15,
    padding: 12,
    borderRadius: 12,
  },

  success: {
    backgroundColor: "#DCFCE7",
  },

  error: {
    backgroundColor: "#FEE2E2",
  },

  messageText: {
    textAlign: "center",
    fontWeight: "600",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  modalCard: {
    width: "88%",
    borderRadius: 24,
    padding: 24,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    elevation: 12,
    shadowColor: "#002E15",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#002E15",
  },

  modalText: {
    marginTop: 15,
    color: "#555",
    lineHeight: 22,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 25,
  },

  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  confirmButton: {
    backgroundColor: "#002E15",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
});