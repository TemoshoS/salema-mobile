import { api } from "@/config/api";
import { showError, showSuccess } from "@/utils/toast";
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

export default function AddOfficerScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [psiraNumber, setPsiraNumber] = useState("");
  const [rank, setRank] = useState("Security Officer");
  const [password, setPassword] = useState("");

  const createOfficer = async () => {
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phoneNumber ||
      !idNumber ||
      !psiraNumber ||
      !password
    ) {
      showError(
        "Missing Information",
        "Please complete all fields."
      );
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("companyToken");

      await api.post(
        "/security-company/officers",
        {
          firstName,
          lastName,
          email,
          phoneNumber,
          idNumber,
          psiraNumber,
          rank,
          password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showSuccess(
        "Officer Added",
        "Security officer created successfully."
      );

      router.back();
    } catch (error: any) {
      showError(
        "Failed",
        error.response?.data?.message ||
          "Unable to create officer."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#002E15"
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Add Officer
        </Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Enter first name"
        />

        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Enter last name"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="Enter email"
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          placeholder="Enter phone number"
        />

        <Text style={styles.label}>ID Number</Text>
        <TextInput
          style={styles.input}
          value={idNumber}
          onChangeText={setIdNumber}
          keyboardType="number-pad"
          placeholder="Enter ID number"
        />

        <Text style={styles.label}>PSIRA Number</Text>
        <TextInput
          style={styles.input}
          value={psiraNumber}
          onChangeText={setPsiraNumber}
          placeholder="Enter PSIRA number"
        />

        <Text style={styles.label}>Rank</Text>
        <TextInput
          style={styles.input}
          value={rank}
          onChangeText={setRank}
          placeholder="Security Officer"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Enter password"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={createOfficer}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              Create Officer
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF6F3",
  },

  header: {
    backgroundColor: "#002E15",
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  label: {
    fontWeight: "700",
    color: "#002E15",
    marginBottom: 8,
    marginTop: 16,
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 15,
    height: 55,
    fontSize: 16,
  },

  button: {
    marginTop: 35,
    backgroundColor: "#002E15",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});