import { IMAGES } from "@/constants/assets";
import { showError, showInfo } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../config/api";

export default function SecurityCompanyLoginScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (
    key: keyof typeof form,
    value: string
  ) => {
    setForm({
      ...form,
      [key]: value,
    });
  };

  const login = async () => {
    if (
      !form.email.trim() ||
      !form.password
    ) {
      showInfo(
        "Missing Details",
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const res = await api.post(
        "/security-company/login",
        form
      );

      if (res.data.requiresOtp) {
        router.push({
          pathname: "/security-company/verify-otp",
          params: {
            email: form.email,
          },
        });

        return;
      }

   
      // Save company details
      await AsyncStorage.setItem(
        "companyToken",
        res.data.token
      );
      
      await AsyncStorage.setItem(
        "securityCompany",
        JSON.stringify(res.data.company)
      );

      router.replace("/security-company/home");

    } catch (error: any) {
      showError(
        "Login Failed",
        error.response?.data?.message ||
        "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>

        <View style={styles.logoCircle}>
          <Image
            source={IMAGES.logo}
            style={{
              width: 90,
              height: 90,
              tintColor: "#fff",
            }}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>
          Security Company Login
        </Text>

        <Text style={styles.subtitle}>
          Sign in to manage your officers, branches and emergency incidents.
        </Text>

        <View style={styles.card}>

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
              value={form.email}
              onChangeText={(v) =>
                handleChange("email", v)
              }
            />
          </View>

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
              placeholder="Enter password"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              value={form.password}
              onChangeText={(v) =>
                handleChange("password", v)
              }
            />

            <TouchableOpacity
              onPress={() =>
                setShowPassword(!showPassword)
              }
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

          <TouchableOpacity
            onPress={() =>
              router.push("/security-company/forgot-password")
            }
            style={{
              alignSelf: "flex-end",
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                color: "#002E15",
                fontWeight: "600",
              }}
            >
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={login}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              Sign In
            </Text>
          </TouchableOpacity>

        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have a company account?
          </Text>

          <TouchableOpacity
            onPress={() =>
              router.push("/security-company/register")
            }
          >
            <Text style={styles.signup}>
              Register
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.bottomText}>
          Verified PSIRA security companies only.
        </Text>

      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator
              size="large"
              color="#002E15"
            />

            <Text style={styles.loadingText}>
              Signing in to your company account...
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

  content: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
  },

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
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 10,
  },

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

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },

  footerText: {
    fontSize: 15,
    color: "#666",
  },

  signup: {
    marginLeft: 5,
    fontSize: 15,
    color: "#002E15",
    fontWeight: "700",
  },

  bottomText: {
    textAlign: "center",
    marginTop: 35,
    color: "#999",
    fontSize: 13,
  },

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