import { IMAGES } from "@/constants/assets";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SecurityCompanyHomeScreen() {
  const router = useRouter();

  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    const data = await AsyncStorage.getItem("securityCompany");

    if (data) {
      setCompany(JSON.parse(data));
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([
      "companyToken",
      "securityCompany",
    ]);
  
    router.replace("/");
  };
  const cards = [
    {
      title: "Officers",
      icon: "people",
      color: "#0E7490",
      route: "/security-company/officers",
    },
    {
      title: "Branches",
      icon: "business",
      color: "#2563EB",
      route: "/security-company/branches",
    },
    {
      title: "Assignments",
      icon: "git-network",
      color: "#16A34A",
      route: "/security-company/assignments",
    },
    {
      title: "Incidents",
      icon: "warning",
      color: "#DC2626",
      route: "/security-company/incidents",
    },
    {
      title: "Reports",
      icon: "document-text",
      color: "#7C3AED",
      route: "/security-company/reports",
    },
    {
      title: "Profile",
      icon: "person-circle",
      color: "#EA580C",
      route: "/security-company/profile",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
  <View style={styles.headerLeft}>
    <Image
      source={IMAGES.logo}
      style={styles.logo}
      resizeMode="contain"
    />

    <View>
      <Text style={styles.welcome}>
        Welcome
      </Text>

      <Text style={styles.companyName}>
        {company?.companyName || "Security Company"}
      </Text>
    </View>
  </View>

  <TouchableOpacity onPress={logout}>
    <Ionicons
      name="log-out-outline"
      size={28}
      color="#fff"
    />
  </TouchableOpacity>
</View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
  <Text style={styles.summaryTitle}>
    Company Dashboard
  </Text>

  <Text style={styles.summaryText}>
    Register and manage security officers, organize branches,
    assign officers to branches, monitor incidents, and
    oversee your company's operations from one place.
  </Text>
</View>

        <View style={styles.grid}>
          {cards.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.card}
              onPress={() =>
                router.push(item.route as any)
              }
            >
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: item.color,
                  },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  color="#fff"
                  size={28}
                />
              </View>

              <Text style={styles.cardTitle}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
    padding: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  logo: {
    width: 60,
    height: 60,
    tintColor: "#fff",
    marginRight: 15,
  },

  welcome: {
    color: "#B8E6C8",
    fontSize: 14,
  },

  companyName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },

  summaryTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#002E15",
  },

  summaryText: {
    marginTop: 10,
    color: "#666",
    lineHeight: 22,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 22,
    alignItems: "center",
    marginBottom: 16,
    elevation: 3,
  },

  iconCircle: {
    width: 65,
    height: 65,
    borderRadius: 33,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    textAlign: "center",
  },
});