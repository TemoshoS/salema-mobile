import { IMAGES } from "@/constants/assets";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { api } from "../config/api";

const { width } = Dimensions.get("window");

export default function Header() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(width)).current;

  const openMenu = () => {
    setMenuVisible(true);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
    });
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");

      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("userId");

      closeMenu();

      Alert.alert("Logged out", "You have been logged out successfully");

      router.replace("/");
    } catch (error) {
      Alert.alert("Error", "Logout failed");
    }
  };

  const navigateTo = (route: any) => {
    closeMenu();

    setTimeout(() => {
      router.push(route);
    }, 250);
  };

  useEffect(() => {
    return () => {
      slideAnim.stopAnimation();
    };
  }, []);

  return (
    <>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/")}
          style={styles.left}
        >
          <Image
            source={IMAGES.logo}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={openMenu}
          style={styles.menuButton}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={30} color="black" />
        </TouchableOpacity>
      </View>

      {/* SIDE MENU */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="none"
        onRequestClose={closeMenu}
      >
        <View style={styles.modalContainer}>

          {/* DARK OVERLAY */}
          <TouchableWithoutFeedback onPress={closeMenu}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>

          {/* SLIDING MENU */}
          <Animated.View
            style={[
              styles.sideMenu,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            {/* MENU HEADER */}
            <View style={styles.menuHeader}>




              <TouchableOpacity
                onPress={closeMenu}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={28} color="#002E15" />
              </TouchableOpacity>
            </View>

            {/* DIVIDER */}
            <View style={styles.divider} />

            {/* MENU ITEMS */}
            <View style={styles.menuContent}>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateTo("/profile")}
                activeOpacity={0.7}
              >


                <Text style={styles.menuText}>Profile</Text>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateTo("/chat")}
                activeOpacity={0.7}
              >


                <Text style={styles.menuText}>Chat With Us</Text>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateTo("/missing-person/add")}
                activeOpacity={0.7}
              >


                <Text style={styles.menuText}>
                  Add Missing Person
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateTo("/missing-person")}
                activeOpacity={0.7}
              >


                <Text style={styles.menuText}>Missing People</Text>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateTo("/voice-setting")}
                activeOpacity={0.7}
              >


                <Text style={styles.menuText}>Voice Settings</Text>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateTo("/security-listing")}
                activeOpacity={0.7}
              >


                <Text style={styles.menuText}>Choose Security</Text>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>

               <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateTo("/emergency-recordings")}
                activeOpacity={0.7}
              >


                <Text style={styles.menuText}>Emergency Recordings</Text>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>

            </View>

            {/* BOTTOM SECTION */}
            <View style={styles.bottomSection}>
              <View style={styles.divider} />

              <TouchableOpacity
                onPress={handleLogout}
                style={styles.logoutButton}
                activeOpacity={0.7}
              >


                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>

              <Text style={styles.versionText}>
                Salema • Stay Safe
              </Text>
            </View>
          </Animated.View>
        </View>
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

  logo: {
    width: 50,
    height: 50,
    tintColor: "#fff",
  },

  menuButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
  },

  modalContainer: {
    flex: 1,
    flexDirection: "row",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  sideMenu: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,

    // 50–60% screen width
    width: width * 0.58,

    backgroundColor: "#002E15",

    paddingTop: 50,

    elevation: 10,

    shadowColor: "#000",
    shadowOffset: {
      width: -3,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  menuLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  menuLogo: {
    width: 46,
    height: 46,
    tintColor: "#002E15",
  },

  menuHeaderText: {
    flex: 1,
    marginLeft: 12,
  },

  menuTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },

  menuSubtitle: {
    fontSize: 11,
    color: "#B4E0B7",
    marginTop: 2,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  menuContent: {
    paddingTop: 10,
    paddingHorizontal: 8,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 58,
    paddingHorizontal: 8,
    borderRadius: 12,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: "#B4E0B7",
    justifyContent: "center",
    alignItems: "center",
  },

  menuText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
    marginLeft: 11,
  },

  bottomSection: {
    marginTop: "auto",
    paddingBottom: 20,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
  },

  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 11,
  },

  versionText: {
    textAlign: "center",
    color: "#B4E0B7",
    fontSize: 11,
    marginTop: 5,
  },
});
