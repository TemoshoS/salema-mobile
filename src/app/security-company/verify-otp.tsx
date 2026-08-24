import { IMAGES } from "@/constants/assets";
import { showError, showInfo, showSuccess } from "@/utils/toast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../config/api";

export default function SecurityVerifyOtpScreen() {
  const router = useRouter();

  const { email } = useLocalSearchParams<{
    email: string;
  }>();

  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);

  const verifyOtp = async () => {
    if (!otp.trim()) {
      showInfo(
        "OTP Required",
        "Please enter the verification code."
      );
      return;
    }

    if (otp.length !== 6) {
      showError(
        "Invalid OTP",
        "OTP must be 6 digits."
      );
      return;
    }

    try {
      setLoading(true);

      const res = await api.post(
        "/security-company/verify-otp",
        {
          email,
          otp,
        }
      );

     

      await AsyncStorage.setItem(
        "companyToken",
        res.data.token
      );

      await AsyncStorage.setItem(
        "securityCompany",
        JSON.stringify(res.data.company)
      );

      showSuccess(
        "Login Successful",
        "Welcome to your Security Company dashboard."
      );

      router.replace("/security-company/home");

    } catch (error: any) {
      showError(
        "Verification Failed",
        error.response?.data?.message ||
          "Invalid OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      await api.post("/security-company/resend-otp", {
        email,
      });

      showSuccess(
        "OTP Sent",
        "A new verification code has been sent."
      );
    } catch {
      showError(
        "Error",
        "Unable to resend OTP."
      );
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
          Verify OTP
        </Text>

        <Text style={styles.subtitle}>
        Enter the 6-digit verification code sent to your company email address.
        </Text>

        <Text style={styles.email}>
          {email}
        </Text>

        <View style={styles.card}>

          <Text style={styles.label}>
            Verification Code
          </Text>

          <TextInput
            style={styles.otpInput}
            placeholder="000000"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={verifyOtp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              Verify OTP
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={resendOtp}
          >
            <Text style={styles.resendText}>
              Resend Code
            </Text>
          </TouchableOpacity>

        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            Back to Login
          </Text>
        </TouchableOpacity>

      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator
              size="large"
              color="#002E15"
            />

            <Text style={styles.loadingText}>
              Verifying...
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
      marginTop: 10,
      color: "#666",
      textAlign: "center",
      fontSize: 15,
    },
  
    email: {
      textAlign: "center",
      color: "#002E15",
      fontSize: 16,
      fontWeight: "700",
      marginTop: 8,
      marginBottom: 30,
    },
  
    card: {
      backgroundColor: "#fff",
      borderRadius: 20,
      padding: 24,
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
      marginBottom: 12,
    },
  
    otpInput: {
      height: 60,
      borderWidth: 1,
      borderColor: "#DDD",
      borderRadius: 14,
      textAlign: "center",
      fontSize: 24,
      letterSpacing: 12,
      color: "#222",
      backgroundColor: "#fff",
      marginBottom: 25,
    },
  
    button: {
      height: 56,
      backgroundColor: "#002E15",
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
    },
  
    buttonText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "700",
    },
  
    resendButton: {
      marginTop: 18,
      alignSelf: "center",
    },
  
    resendText: {
      color: "#002E15",
      fontSize: 15,
      fontWeight: "700",
    },
  
    backButton: {
      alignSelf: "center",
      marginTop: 30,
    },
  
    backText: {
      color: "#666",
      fontSize: 15,
      fontWeight: "600",
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