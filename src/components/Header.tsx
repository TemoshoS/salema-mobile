import { IMAGES } from "@/constants/assets";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { api } from "../config/api";

export default function Header() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");

      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("userId");

      Alert.alert("Logged out", "You have been logged out successfully");

      router.replace("/");
    } catch (error) {
      Alert.alert("Error", "Logout failed");
    }
  };

  const navigateTo = (route: any) => {
    setMenuVisible(false);
    router.push(route);
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>router.push("/")} style={styles.left}>
          <Image
            source={IMAGES.logo}
            style={{
              width: 50,
              height: 50,
              tintColor: "#fff",
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={{ flexDirection: "row", alignItems: "center" }}>


          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={28} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu */}
      <Modal
        transparent
        animationType="fade"
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menu}>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigateTo("/profile")}
                >
                  <Ionicons name="person-outline" size={22} color="#002E15" />
                  <Text style={styles.menuText}>Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigateTo("/chat")}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={22}
                    color="#002E15"
                  />
                  <Text style={styles.menuText}>Chat With Us</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigateTo("/missing-person/add")}
                >
                  <Ionicons
                    name="person-add-outline"
                    size={22}
                    color="#002E15"
                  />
                  <Text style={styles.menuText}>Add Missing Person</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigateTo("/missing-person")}
                >
                  <Ionicons
                    name="people-outline"
                    size={22}
                    color="#002E15"
                  />
                  <Text style={styles.menuText}>Missing People</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigateTo("/voice-setting")}
                >
                  <Ionicons
                    name="people-outline"
                    size={22}
                    color="#002E15"
                  />
                  <Text style={styles.menuText}>Voice Settings</Text>
                </TouchableOpacity>

               

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => navigateTo("/security-listing")}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={22}
                    color="#002E15"
                  />
                  <Text style={styles.menuText}>Choose Security</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleLogout}
                  style={styles.menuItem}
                >
                  <Ionicons name="log-out-outline" size={22} color="#002E15" />
                  <Text style={styles.menuText}>Logout</Text>
                </TouchableOpacity>

              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
  },
  left: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#002E15",
    justifyContent: "center",
    alignItems: "center",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "flex-end",
  },

  menu: {
    width: 250,
    backgroundColor: "#fff",
    marginTop: 60,
    marginRight: 10,
    borderRadius: 10,
    elevation: 5,
    paddingVertical: 10,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 14,
  },

  menuText: {
    fontSize: 16,
    marginLeft: 15,
    color: "#333",
  },
});