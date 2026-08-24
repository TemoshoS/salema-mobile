import { IMAGES } from "@/constants/assets";
import { showError, showSuccess } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Animated, Image,
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

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [showOtp, setShowOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.2,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      showError(
        "Please enter your email and password.",
        "Missing Details"
      );
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      // OTP required
      if (res.data.requiresOtp) {
        showSuccess(res.data.message, "OTP Sent");
        setShowOtp(true);
        return;
      }

      // Login completed without OTP
      await AsyncStorage.setItem("token", res.data.token);

      await AsyncStorage.setItem(
        "userId",
        res.data.user.id
      );

      showSuccess(
        "Login successful.",
        "Welcome Back 👋"
      );

      setTimeout(() => {
        router.replace("/home");
      }, 1000);

    } catch (error: any) {
      showError(
        error.response?.data?.message || "Login failed",
        "Login Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {

    if (otp.length !== 6) {
      showError(
        "Please enter the 6-digit verification code.",
        "Invalid OTP"
      );
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/verify-otp", {
        email: email.trim(),
        otp: otp.trim(),
      });


      await AsyncStorage.setItem(
        "token",
        res.data.token
      );

      await AsyncStorage.setItem(
        "userId",
        res.data.user.id
      );

      showSuccess(
        "Login successful.",
        "Welcome Back 👋"
      );
      setTimeout(() => {
        router.replace("/home");
      }, 1000);

    } catch (error: any) {

      const message =
      error.response?.data?.message || "OTP verification failed.";
  
    showError(message, "Verification Failed");
  
    if (message === "OTP expired") {
      setOtp("");
      setShowOtp(false);
    }

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

        <Text style={styles.title}>Welcome Back</Text>

        <Text style={styles.subtitle}>
          Sign in to continue protecting yourself and your loved ones.
        </Text>

        <View style={styles.card}>
          {!showOtp ? (
            <>
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
                  value={email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={setEmail}
                />
              </View>

              <Text style={styles.label}>Password</Text>

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
                  value={password}
                  onChangeText={setPassword}
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
                onPress={() => router.push("/forgot-password")}
                style={{ alignSelf: "flex-end", marginBottom: 20 }}
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
                style={[
                  styles.button,
                  loading && { opacity: 0.6 }
                ]}
                disabled={loading}
                onPress={handleLogin}
              >
                <Text style={styles.buttonText}>
                  Continue
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.otpIcon}>
                <Ionicons
                  name="mail-open-outline"
                  size={40}
                  color="#002E15"
                />
              </View>

              <Text style={styles.otpTitle}>
                OTP Verification
              </Text>

              <Text style={styles.otpSubtitle}>
                We've sent a verification code to
              </Text>

              <Text style={styles.email}>
                {email}
              </Text>

              <Text style={styles.otpLabel}>
                Enter the 6-digit verification code
              </Text>

              <View style={styles.otpWrapper}>
                {[...Array(6)].map((_, index) => {
                  const isActive = otp.length === index;

                  return (
                    <Animated.View
                      key={index}
                      style={[
                        styles.otpDigitContainer,
                        isActive && {
                          borderBottomColor: "#002E15",
                          borderBottomWidth: 3,
                          opacity: blinkAnim,
                        },
                      ]}
                    >
                      <Text style={styles.otpDigit}>
                        {otp[index] || ""}
                      </Text>
                    </Animated.View>
                  );
                })}

                <TextInput
                  value={otp}
                  onChangeText={(text) => {
                    const value = text.replace(/[^0-9]/g, "");
                    if (value.length <= 6) {
                      setOtp(value);
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  style={styles.hiddenOtpInput}
                />
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={verifyOtp}
              >
                <Text style={styles.buttonText}>
                  Verify OTP
                </Text>
              </TouchableOpacity>
            
            </>
          )}
        </View>

        {!showOtp && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?
            </Text>

            <TouchableOpacity
              onPress={() =>
                router.push("/register")
              }
            >
              <Text style={styles.signup}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.bottomText}>
          Your safety starts here.
        </Text>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#002E15" />

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
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },

  label: {
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
    marginTop: 30,
  },

  footerText: {
    color: "#666",
  },

  signup: {
    marginLeft: 5,
    color: "#002E15",
    fontWeight: "700",
  },

  otpIcon: {
    alignItems: "center",
    marginBottom: 15,
  },

  otpTitle: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: "#002E15",
  },

  otpSubtitle: {
    textAlign: "center",
    color: "#666",
    marginTop: 10,
  },

  email: {
    textAlign: "center",
    fontWeight: "700",
    color: "#002E15",
    marginBottom: 25,
    marginTop: 5,
  },

  bottomText: {
    textAlign: "center",
    marginTop: 35,
    color: "#999",
    fontSize: 13,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingBox: {
    backgroundColor: "#fff",
    paddingHorizontal: 30,
    paddingVertical: 25,
    borderRadius: 18,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },

  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: "600",
    color: "#002E15",
  },
  otpLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#002E15",
    textAlign: "center",
    marginBottom: 18,
  },

  otpWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
    position: "relative",
  },

  otpDigitContainer: {
    width: 44,
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#D5D5D5",
  },

  otpDigit: {
    fontSize: 24,
    fontWeight: "700",
    color: "#002E15",
    minHeight: 30,
  },

  hiddenOtpInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0,
  },
});