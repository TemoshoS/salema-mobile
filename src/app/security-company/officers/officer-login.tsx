import { api } from "@/config/api";
import { IMAGES } from "@/constants/assets";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SecurityOfficerLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/security-company/officers/login",
        {
          email: email.trim().toLowerCase(),
          password,
        }
      );

      const { token, officer } = response.data;

      // Save officer authentication
      await AsyncStorage.setItem(
        "officerToken",
        token
      );

      await AsyncStorage.setItem(
        "officerData",
        JSON.stringify(officer)
      );

      router.replace(
        "/security-company/officers/dashboard"
      );
    } catch (error: any) {
      console.log(
        "OFFICER LOGIN ERROR:",
        error.response?.data || error.message
      );

      Alert.alert(
        "Login Failed",
        error.response?.data?.message ||
          "Unable to login. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        {/* BACK BUTTON */}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#002E15"
          />

          <Text style={styles.backText}>
            Back
          </Text>
        </TouchableOpacity>

        <View style={styles.content}>

          {/* LOGO */}

          <View style={styles.logoCircle}>
            <Image
              source={IMAGES.logo}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* TITLE */}

          <Text style={styles.title}>
            Security Officer Login
          </Text>

          <Text style={styles.subtitle}>
            Sign in to manage your assigned
            incidents and respond to emergencies.
          </Text>

          {/* LOGIN CARD */}

          <View style={styles.card}>

            {/* EMAIL */}

            <Text style={styles.label}>
              Email Address
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={22}
                color="#666"
              />

              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>

            {/* PASSWORD */}

            <Text style={styles.label}>
              Password
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color="#666"
              />

              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />

              <TouchableOpacity
                onPress={() =>
                  setShowPassword(!showPassword)
                }
                disabled={loading}
              >
                <Ionicons
                  name={
                    showPassword
                      ? "eye-off-outline"
                      : "eye-outline"
                  }
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {/* LOGIN BUTTON */}

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

          </View>

          {/* INFORMATION */}

          

          <Text style={styles.bottomText}>
            Salema • Security Officer Portal
          </Text>

        </View>
      </KeyboardAvoidingView>

      {/* LOADING OVERLAY */}

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator
              size="large"
              color="#002E15"
            />

            <Text style={styles.loadingText}>
              Signing in...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF6F3",
  },

  keyboardView: {
    flex: 1,
  },

  // ==========================================
  // BACK BUTTON
  // ==========================================

  backButton: {
    position: "absolute",
    top: 12,
    left: 20,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },

  backText: {
    marginLeft: 6,
    color: "#002E15",
    fontSize: 15,
    fontWeight: "600",
  },

  // ==========================================
  // CONTENT
  // ==========================================

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  // ==========================================
  // LOGO
  // ==========================================

  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#002E15",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 20,
  },

  logo: {
    width: 90,
    height: 90,
    tintColor: "#fff",
  },

  // ==========================================
  // TITLE
  // ==========================================

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#002E15",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 30,
    textAlign: "center",
    color: "#666",
    fontSize: 15,
    lineHeight: 23,
    paddingHorizontal: 10,
  },

  // ==========================================
  // CARD
  // ==========================================

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,

    elevation: 5,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  // ==========================================
  // INPUTS
  // ==========================================

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
    marginBottom: 8,
    marginTop: 8,
  },

  inputContainer: {
    height: 56,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 18,
    backgroundColor: "#fff",
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#222",
  },

  // ==========================================
  // BUTTON
  // ==========================================

  button: {
    height: 56,
    backgroundColor: "#002E15",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },

  // ==========================================
  // INFO
  // ==========================================

  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F3ED",
    borderRadius: 13,
    padding: 14,
    marginTop: 20,
  },

  infoText: {
    flex: 1,
    marginLeft: 10,
    color: "#35614A",
    fontSize: 13,
    lineHeight: 19,
  },

  // ==========================================
  // FOOTER
  // ==========================================

  bottomText: {
    textAlign: "center",
    marginTop: 25,
    color: "#999",
    fontSize: 13,
  },

  // ==========================================
  // LOADING
  // ==========================================

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingBox: {
    backgroundColor: "#fff",
    paddingHorizontal: 35,
    paddingVertical: 28,
    borderRadius: 18,
    alignItems: "center",

    elevation: 8,

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: "600",
    color: "#002E15",
  },
});