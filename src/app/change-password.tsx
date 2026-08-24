import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../components/Header";
import { api } from "../config/api";

export default function ChangePassword() {
  const router = useRouter();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);

  const changePassword = async () => {
    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      Alert.alert(
        "Validation",
        "Please complete all fields."
      );
      return;
    }

    try {
      setLoading(true);

      const token =
        await AsyncStorage.getItem("token");

      await api.put(
        "/auth/change-password",
        {
          currentPassword,
          newPassword,
          confirmPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert(
        "Success",
        "Password changed successfully.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Unable to change password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Header />

      <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.label}>Current Password</Text>

<View style={styles.inputContainer}>
  <TextInput
    placeholder="Current Password"
    secureTextEntry={!showCurrentPassword}
    style={styles.input}
    value={currentPassword}
    onChangeText={setCurrentPassword}
  />

  <TouchableOpacity
    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
  >
    <Ionicons
      name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
      size={24}
      color="#666"
    />
  </TouchableOpacity>
</View>

<Text style={styles.label}>New Password</Text>

<View style={styles.inputContainer}>
  <TextInput
    placeholder="New Password"
    secureTextEntry={!showNewPassword}
    style={styles.input}
    value={newPassword}
    onChangeText={setNewPassword}
  />

  <TouchableOpacity
    onPress={() => setShowNewPassword(!showNewPassword)}
  >
    <Ionicons
      name={showNewPassword ? "eye-off-outline" : "eye-outline"}
      size={24}
      color="#666"
    />
  </TouchableOpacity>
</View>

<Text style={styles.label}>Confirm Password</Text>

<View style={styles.inputContainer}>
  <TextInput
    placeholder="Confirm New Password"
    secureTextEntry={!showConfirmPassword}
    style={styles.input}
    value={confirmPassword}
    onChangeText={setConfirmPassword}
  />

  <TouchableOpacity
    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
  >
    <Ionicons
      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
      size={24}
      color="#666"
    />
  </TouchableOpacity>
</View>
        <TouchableOpacity
          style={styles.button}
          disabled={loading}
          onPress={changePassword}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color="#fff"
              />
              <Text style={styles.buttonText}>
                Change Password
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
    color: "#333",
    marginBottom: 8,
  },
  
  inputContainer: {
    width: "100%",
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingLeft: 15,
    paddingRight: 12,
    marginBottom: 20,
  },
  
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#222",
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  
  eyeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
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
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "700",
  },
});