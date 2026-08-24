import { IMAGES } from "@/constants/assets";
import { checkAuth } from "@/utils/checkAuth";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;

  const citizenAnim = useRef(new Animated.Value(40)).current;
  const companyAnim = useRef(new Animated.Value(40)).current;
  const officerAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    const init = async () => {
      const logged = await checkAuth();

      if (logged) {
        router.replace("/home");
        return;
      }

      setLoading(false);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),

          Animated.spring(logoScale, {
            toValue: 1,
            friction: 6,
            useNativeDriver: true,
          }),
        ]),

        Animated.stagger(180, [
          Animated.spring(citizenAnim, {
            toValue: 0,
            useNativeDriver: true,
          }),

          Animated.spring(companyAnim, {
            toValue: 0,
            useNativeDriver: true,
          }),

          Animated.spring(officerAnim, {
            toValue: 0,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    };

    init();
  }, []);

  if (loading) {
    return (
      <LinearGradient
        colors={["#032916", "#0A4D2C"]}
        style={styles.loader}
      >
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#021C10", "#06391F", "#0A5B31"]}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* ========================================== */}
        {/* LOGO */}
        {/* ========================================== */}

        <Animated.View
          style={[
            styles.logoWrapper,
            {
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={IMAGES.logo}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* ========================================== */}
        {/* BRAND */}
        {/* ========================================== */}

        <Text style={styles.brand}>Salema</Text>

        <Text style={styles.title}>
          Protecting{"\n"}Communities
        </Text>

        <Text style={styles.subtitle}>
          Fast emergency response for citizens and
          security personnel.
        </Text>

        {/* ========================================== */}
        {/* CITIZEN PORTAL */}
        {/* ========================================== */}

        <Animated.View
          style={{
            width: "100%",
            transform: [{ translateY: citizenAnim }],
          }}
        >
          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push("/login")}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>👤</Text>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>
                Citizen Portal
              </Text>

              <Text style={styles.cardSubtitle}>
                Report incidents, send SOS alerts and
                protect your loved ones.
              </Text>
            </View>

            <Text style={styles.arrow}>→</Text>
          </Pressable>
        </Animated.View>

        {/* ========================================== */}
        {/* SECURITY COMPANY */}
        {/* ========================================== */}

        <Animated.View
          style={{
            width: "100%",
            transform: [{ translateY: companyAnim }],
          }}
        >
          <Pressable
            style={({ pressed }) => [
              styles.companyCard,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              router.push("/security-company/login")
            }
          >
            <View style={styles.companyCircle}>
              <Text style={styles.icon}>🏢</Text>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>
                Security Company
              </Text>

              <Text style={styles.cardSubtitle}>
                Manage incidents, officers, branches and
                emergency responses.
              </Text>
            </View>

            <Text style={styles.arrow}>→</Text>
          </Pressable>
        </Animated.View>

        {/* ========================================== */}
        {/* SECURITY OFFICER */}
        {/* ========================================== */}

        <Animated.View
          style={{
            width: "100%",
            transform: [{ translateY: officerAnim }],
          }}
        >
          <Pressable
            style={({ pressed }) => [
              styles.officerCard,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              router.push(
                "/security-company/officers/officer-login"
              )
            }
          >
            <View style={styles.officerCircle}>
              <Text style={styles.icon}>🛡️</Text>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>
                Security Officer
              </Text>

              <Text style={styles.cardSubtitle}>
                Login to view assigned incidents and
                respond to emergencies.
              </Text>
            </View>

            <Text style={styles.arrow}>→</Text>
          </Pressable>
        </Animated.View>

        {/* ========================================== */}
        {/* FOOTER */}
        {/* ========================================== */}

        <View style={styles.footerContainer}>
          <Text style={styles.footer}>
            Secure • Fast • Trusted
          </Text>
        </View>
      </Animated.View>
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

  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  // ==========================================
  // LOGO
  // ==========================================

  logoWrapper: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#00C853",
    shadowOpacity: 0.35,
    shadowRadius: 25,
    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 15,
  },

  logo: {
    width: 82,
    height: 82,
    tintColor: "#fff",
  },

  // ==========================================
  // TEXT
  // ==========================================

  brand: {
    marginTop: 24,
    color: "#A5F5C5",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  title: {
    marginTop: 12,
    color: "#fff",
    fontSize: 38,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 46,
  },

  subtitle: {
    marginTop: 16,
    color: "rgba(255,255,255,0.75)",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    width: "88%",
    marginBottom: 30,
  },

  // ==========================================
  // COMMON CARD
  // ==========================================

  card: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "rgba(255,255,255,0.10)",

    borderRadius: 26,
    padding: 18,

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",

    marginBottom: 14,
  },

  // ==========================================
  // SECURITY COMPANY
  // ==========================================

  companyCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "rgba(255,255,255,0.10)",

    borderRadius: 26,
    padding: 18,

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",

    marginBottom: 14,
  },

  companyCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,

    backgroundColor: "rgba(255,255,255,0.14)",

    justifyContent: "center",
    alignItems: "center",

    marginRight: 16,
  },

  // ==========================================
  // SECURITY OFFICER
  // ==========================================

  officerCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "rgba(255,193,7,0.12)",

    borderRadius: 26,
    padding: 18,

    borderWidth: 1,
    borderColor: "rgba(255,193,7,0.45)",
  },

  officerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,

    backgroundColor: "#FFC107",

    justifyContent: "center",
    alignItems: "center",

    marginRight: 16,
  },

  // ==========================================
  // CITIZEN ICON
  // ==========================================

  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,

    backgroundColor: "rgba(255,255,255,0.14)",

    justifyContent: "center",
    alignItems: "center",

    marginRight: 16,
  },

  icon: {
    fontSize: 27,
  },

  // ==========================================
  // CARD CONTENT
  // ==========================================

  cardBody: {
    flex: 1,
  },

  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },

  cardSubtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    lineHeight: 19,
  },

  arrow: {
    color: "#fff",
    fontSize: 27,
    fontWeight: "700",
    marginLeft: 10,
  },

  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },

  // ==========================================
  // FOOTER
  // ==========================================

  footerContainer: {
    marginTop: 24,
    alignItems: "center",
  },

  footer: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    letterSpacing: 1,
    fontWeight: "600",
  },
});