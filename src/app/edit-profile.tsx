import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../components/Header";
import { api } from "../config/api";

export default function EditProfile() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await api.get("/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setFullName(res.data.fullName);
      setPhoneNumber(res.data.phoneNumber);
      setAddress(res.data.address);
    } catch (error) {
      Alert.alert("Error", "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!fullName || !phoneNumber || !address) {
      Alert.alert("Validation", "Please fill in all fields.");
      return;
    }

    try {
      setSaving(true);

      const token = await AsyncStorage.getItem("token");

      await api.put(
        "/auth/profile",
        {
          fullName,
          phoneNumber,
          address,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert("Success", "Profile updated successfully.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color="#002E15" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Edit Profile</Text>

        <Text style={styles.label}>Full Name</Text>

        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>Phone Number</Text>

        <TextInput
          style={styles.input}
          value={phoneNumber}
          keyboardType="phone-pad"
          onChangeText={setPhoneNumber}
        />

        <Text style={styles.label}>Address</Text>

        <TextInput
          style={[styles.input, { height: 100 }]}
          multiline
          value={address}
          onChangeText={setAddress}
        />

        <TouchableOpacity
          style={styles.button}
          disabled={saving}
          onPress={updateProfile}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name="save-outline"
                size={22}
                color="#fff"
              />

              <Text style={styles.buttonText}>
                Save Changes
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  content: {
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#002E15",
    marginBottom: 25,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 20,
    fontSize: 16,
  },

  button: {
    backgroundColor: "#002E15",
    height: 55,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 10,
  },
});