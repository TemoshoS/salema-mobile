import { IMAGES } from "@/constants/assets";
import { showError, showInfo, showSuccess } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../config/api";

export default function RegisterScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
    password: "",
    confirmPassword: "",
    role: "client",
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

  const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const phoneRegex =
  /^(?:\+27|0)[6-8][0-9]{8}$/;

// Minimum 8 characters,
// at least one uppercase,
// one lowercase,
// one number,
// one special character
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,}$/;

  const register = async () => {
    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.phoneNumber.trim() ||
      !form.address.trim() ||
      !form.password ||
      !form.confirmPassword
    ) {
      showInfo(
        "Incomplete Form",
        "Please complete all fields."
      );
      return;
    }
  
    if (form.fullName.trim().length < 3) {
      showError(
        "Invalid Name",
        "Please enter your full name."
      );
      return;
    }
  
    if (!emailRegex.test(form.email.trim())) {
      showError(
        "Invalid Email",
        "Please enter a valid email address."
      );
      return;
    }
  
    if (!phoneRegex.test(form.phoneNumber.trim())) {
      showError(
        "Invalid Phone Number",
        "Enter a valid South African phone number."
      );
      return;
    }
  
    if (!passwordRegex.test(form.password)) {
      showError(
        "Weak Password",
        "Password must contain at least 8 characters, an uppercase letter, a lowercase letter, a number and a special character."
      );
      return;
    }
  
    if (form.password !== form.confirmPassword) {
      showError(
        "Password Mismatch",
        "Passwords do not match."
      );
      return;
    }
  
    try {
      setLoading(true);
  
      const res = await api.post("/auth/register", form);
  
      showSuccess(
        "Account Created",
        res.data.message
      );
  
      setTimeout(() => {
        router.replace("/login");
      }, 1500);
    } catch (error: any) {
      showError(
        "Registration Failed",
        error.response?.data?.message ||
          "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoCircle}>
          <Image
            source={IMAGES.logo}
            style={{
              width: 100,
              height: 100,
              tintColor: "#fff",
            }}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Create Account</Text>

        <Text style={styles.subtitle}>
          Join Salema and help protect yourself and your loved ones.
        </Text>

        <View style={styles.card}>

          {/* Full Name */}

          <Text style={styles.label}>Full Name</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={22}
              color="#666"
            />

            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
              value={form.fullName}
              onChangeText={(v) =>
                handleChange("fullName", v)
              }
            />
          </View>

          {/* Email */}

          <Text style={styles.label}>Email Address</Text>

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

          {/* Phone */}

          <Text style={styles.label}>Phone Number</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="call-outline"
              size={22}
              color="#666"
            />

            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={form.phoneNumber}
              onChangeText={(v) =>
                handleChange("phoneNumber", v)
              }
            />
          </View>

          {/* Address */}

          <Text style={styles.label}>Address</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="location-outline"
              size={22}
              color="#666"
            />

            <TextInput
              style={styles.input}
              placeholder="Enter your address"
              placeholderTextColor="#999"
              value={form.address}
              onChangeText={(v) =>
                handleChange("address", v)
              }
            />
          </View>

          {/* Password */}

          <Text style={styles.label}>Password</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={22}
              color="#666"
            />

            <TextInput
              style={styles.input}
              placeholder="Create password"
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

          {/* Confirm Password */}

          <Text style={styles.label}>
            Confirm Password
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={22}
              color="#666"
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#999"
              secureTextEntry={!showConfirmPassword}
              value={form.confirmPassword}
              onChangeText={(v) =>
                handleChange(
                  "confirmPassword",
                  v
                )
              }
            />

            <TouchableOpacity
              onPress={() =>
                setShowConfirmPassword(
                  !showConfirmPassword
                )
              }
            >
              <Ionicons
                name={
                  showConfirmPassword
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={22}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={register}
          >
            <Text style={styles.buttonText}>
              Create Account
            </Text>
          </TouchableOpacity>

        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?
          </Text>

          <TouchableOpacity
            onPress={() =>
              router.replace("/login")
            }
          >
            <Text style={styles.signup}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.bottomText}>
          Your safety starts here.
        </Text>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator
              size="large"
              color="#002E15"
            />

            <Text style={styles.loadingText}>
              Creating your account...
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
    flexGrow: 1,
    justifyContent: "center",
    padding: 25,
    paddingVertical: 40,
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