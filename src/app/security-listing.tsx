
import Header from "@/components/Header";
import CustomAlert from "@/components/CustomAlert";
import { api } from "@/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SecurityCompany {
  _id: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  psiraCompanyNumber?: string;
  registrationNumber?: string;
  address?: string;
  contactPerson?: string;
  role: string;
}

type AlertType = "error" | "warning" | "success" | "info";

// =====================================================
// COMPANY CARD
// =====================================================

interface CompanyCardProps {
  item: SecurityCompany;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}

function CompanyCard({
  item,
  isSelected,
  onPress,
  index,
}: CompanyCardProps) {
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const radioScale = useRef(
    new Animated.Value(isSelected ? 1 : 0)
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 420,
        delay: index * 80,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),

      Animated.spring(cardScale, {
        toValue: 1,
        delay: index * 80,
        friction: 7,
        tension: 55,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.spring(radioScale, {
      toValue: isSelected ? 1 : 0,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [isSelected]);

  const handlePressIn = () => {
    Animated.spring(cardScale, {
      toValue: 0.975,
      friction: 7,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(cardScale, {
      toValue: 1,
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const initial =
    item.companyName?.charAt(0)?.toUpperCase() || "S";

  return (
    <Animated.View
      style={{
        opacity: cardOpacity,
        transform: [{ scale: cardScale }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardWrapper}
      >
        <View
          style={[
            styles.companyCard,
            isSelected && styles.selectedCard,
          ]}
        >
          {/* Selected accent */}
          {isSelected && (
            <View style={styles.selectedAccent} />
          )}

          {/* Company Logo */}
          <View
            style={[
              styles.companyIcon,
              isSelected && styles.companyIconSelected,
            ]}
          >
            <Text
              style={[
                styles.companyIconText,
                isSelected && styles.companyIconTextSelected,
              ]}
            >
              {initial}
            </Text>
          </View>

          {/* Company Content */}
          <View style={styles.companyInfo}>
            <View style={styles.companyNameRow}>
              <Text
                style={styles.companyName}
                numberOfLines={1}
              >
                {item.companyName}
              </Text>

              {isSelected && (
                <View style={styles.selectedBadge}>
                  <Ionicons
                    name="checkmark"
                    size={10}
                    color="#002E15"
                  />

                  <Text style={styles.selectedBadgeText}>
                    SELECTED
                  </Text>
                </View>
              )}
            </View>

            {item.contactPerson && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="person-outline"
                  size={13}
                  color="#8A8A8A"
                />

                <Text
                  style={styles.detail}
                  numberOfLines={1}
                >
                  {item.contactPerson}
                </Text>
              </View>
            )}

            {item.phoneNumber && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="call-outline"
                  size={13}
                  color="#8A8A8A"
                />

                <Text style={styles.detail}>
                  {item.phoneNumber}
                </Text>
              </View>
            )}

            {item.address && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color="#8A8A8A"
                />

                <Text
                  style={styles.address}
                  numberOfLines={1}
                >
                  {item.address}
                </Text>
              </View>
            )}
          </View>

          {/* Radio */}
          <View
            style={[
              styles.radio,
              isSelected && styles.radioSelected,
            ]}
          >
            <Animated.View
              style={[
                styles.radioDot,
                {
                  opacity: radioScale,
                  transform: [{ scale: radioScale }],
                },
              ]}
            >
              <Ionicons
                name="checkmark"
                size={12}
                color="#fff"
              />
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// =====================================================
// MAIN SCREEN
// =====================================================

export default function SecurityListing() {
  const [companies, setCompanies] = useState<
    SecurityCompany[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [selectedCompany, setSelectedCompany] =
    useState<SecurityCompany | null>(null);

  const [error, setError] = useState("");

  // =====================================================
  // CUSTOM ALERT
  // =====================================================

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as AlertType,
    confirmText: "OK",
    cancelText: "Cancel",
    showCancel: false,
    onConfirm: () => {},
  });

  const bottomAnimation = useRef(
    new Animated.Value(0)
  ).current;

  // =====================================================
  // SHOW ALERT
  // =====================================================

  const showAlert = ({
    title,
    message,
    type = "info",
    confirmText = "OK",
    cancelText = "Cancel",
    showCancel = false,
    onConfirm,
  }: {
    title: string;
    message: string;
    type?: AlertType;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    onConfirm?: () => void;
  }) => {
    setAlert({
      visible: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      showCancel,
      onConfirm: onConfirm || (() => {}),
    });
  };

  const closeAlert = () => {
    setAlert((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  // =====================================================
  // FETCH COMPANIES
  // =====================================================

  const fetchSecurityCompanies = async () => {
    try {
      setError("");

      const response = await api.get(
        "/security-company/all"
      );

      const companyList =
        response.data?.companies || [];

      setCompanies(companyList);

      const selectedId =
        await AsyncStorage.getItem(
          "selectedSecurityCompanyId"
        );

      if (selectedId) {
        const savedCompany = companyList.find(
          (company: SecurityCompany) =>
            company._id === selectedId
        );

        setSelectedCompany(savedCompany || null);
      } else {
        setSelectedCompany(null);
      }
    } catch (error: any) {
      console.log(
        "Get security companies error:",
        error?.response?.data || error?.message
      );

      setError(
        error?.response?.data?.message ||
          "Unable to load security companies."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =====================================================
  // LOAD SCREEN
  // =====================================================

  useFocusEffect(
    useCallback(() => {
      fetchSecurityCompanies();
    }, [])
  );

  // =====================================================
  // BOTTOM ANIMATION
  // =====================================================

  useEffect(() => {
    Animated.spring(bottomAnimation, {
      toValue: selectedCompany ? 1 : 0,
      friction: 8,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [selectedCompany]);

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSecurityCompanies();
  };

  // =====================================================
  // SELECT COMPANY
  // =====================================================

  const handleSelectCompany = async (
    company: SecurityCompany
  ) => {
    try {
      if (selectedCompany?._id === company._id) {
        setSelectedCompany(null);

        await AsyncStorage.multiRemove([
          "selectedSecurityCompanyId",
          "selectedSecurityCompanyName",
          "selectedSecurityCompanyPhone",
        ]);

        return;
      }

      setSelectedCompany(company);
    } catch (error) {
      console.log("Selection error:", error);

      showAlert({
        title: "Selection Failed",
        message:
          "We could not update your security company selection.",
        type: "error",
      });
    }
  };

  // =====================================================
  // CONFIRM SELECTION
  // =====================================================

  const handleConfirmSelection = async () => {
    if (!selectedCompany) return;

    try {
      await AsyncStorage.multiSet([
        [
          "selectedSecurityCompanyId",
          selectedCompany._id,
        ],
        [
          "selectedSecurityCompanyName",
          selectedCompany.companyName,
        ],
        [
          "selectedSecurityCompanyPhone",
          selectedCompany.phoneNumber,
        ],
      ]);

      showAlert({
        title: "Security Company Selected",
        message: `${selectedCompany.companyName} will receive your emergency alerts when you need assistance.`,
        type: "success",
        confirmText: "Done",
      });
    } catch (error) {
      console.log(
        "Error saving security company:",
        error
      );

      showAlert({
        title: "Something Went Wrong",
        message:
          "We could not save your security company selection. Please try again.",
        type: "error",
        confirmText: "Try Again",
      });
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />

        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={27}
              color="#002E15"
            />
          </View>

          <ActivityIndicator
            size="small"
            color="#002E15"
          />

          <Text style={styles.loadingText}>
            Finding security companies...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // SCREEN
  // =====================================================

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      {/* Background decoration */}
      <View
        pointerEvents="none"
        style={styles.backgroundCircleTop}
      />

      <View
        pointerEvents="none"
        style={styles.backgroundCircleBottom}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.heroIcon}>
          <Ionicons
            name="shield-checkmark"
            size={25}
            color="#002E15"
          />
        </View>

        <View style={styles.heroText}>
          <Text style={styles.eyebrow}>
            EMERGENCY SUPPORT
          </Text>

          <Text style={styles.title}>
            Your Security Company
          </Text>

          <Text style={styles.subtitle}>
            Choose who should receive your emergency
            alerts when you need help.
          </Text>
        </View>
      </View>


      {/* Section Header */}
      {companies.length > 0 && (
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Available Companies
            </Text>

            <Text style={styles.sectionSubtitle}>
              {companies.length}{" "}
              {companies.length === 1
                ? "company"
                : "companies"}{" "}
              available
            </Text>
          </View>

          <View style={styles.secureBadge}>
            <Ionicons
              name="lock-closed-outline"
              size={12}
              color="#666"
            />

            <Text style={styles.secureText}>
              Secure
            </Text>
          </View>
        </View>
      )}

      {/* Error */}
      {error ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons
              name="cloud-offline-outline"
              size={25}
              color="#9B1C1C"
            />
          </View>

          <Text style={styles.errorTitle}>
            Unable to load companies
          </Text>

          <Text style={styles.errorText}>
            {error}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchSecurityCompanies}
            activeOpacity={0.85}
          >
            <Ionicons
              name="refresh"
              size={16}
              color="#fff"
            />

            <Text style={styles.retryText}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      ) : companies.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <Ionicons
                name="shield-outline"
                size={35}
                color="#777"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No Companies Available
            </Text>

            <Text style={styles.emptyText}>
              There are currently no security companies
              available in your area.
            </Text>

            <TouchableOpacity
              style={styles.emptyRefreshButton}
              onPress={handleRefresh}
            >
              <Ionicons
                name="refresh"
                size={16}
                color="#002E15"
              />

              <Text style={styles.emptyRefreshText}>
                Refresh
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          {/* Company List */}
          <FlatList
            data={companies}
            keyExtractor={(item) => item._id}
            renderItem={({ item, index }) => (
              <CompanyCard
                item={item}
                index={index}
                isSelected={
                  selectedCompany?._id === item._id
                }
                onPress={() =>
                  handleSelectCompany(item)
                }
              />
            )}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#002E15"
              />
            }
            showsVerticalScrollIndicator={false}
          />

          {/* Bottom Action */}
          <Animated.View
            style={[
              styles.bottomContainer,
              {
                opacity:
                  bottomAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                transform: [
                  {
                    translateY:
                      bottomAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [35, 0],
                      }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.bottomInner}>
              {selectedCompany && (
                <View style={styles.bottomSelection}>
                  <View style={styles.bottomCheck}>
                    <Ionicons
                      name="checkmark"
                      size={13}
                      color="#fff"
                    />
                  </View>

                  <View style={styles.bottomSelectionText}>
                    <Text style={styles.bottomLabel}>
                      Emergency alerts will be sent to
                    </Text>

                    <Text
                      style={styles.bottomCompany}
                      numberOfLines={1}
                    >
                      {selectedCompany.companyName}
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.continueButton,
                  !selectedCompany &&
                    styles.disabledButton,
                ]}
                disabled={!selectedCompany}
                activeOpacity={0.88}
                onPress={handleConfirmSelection}
              >
                <Text style={styles.continueText}>
                  {selectedCompany
                    ? "Confirm Security Company"
                    : "Select a Security Company"}
                </Text>

                {selectedCompany && (
                  <View style={styles.buttonIcon}>
                    <Ionicons
                      name="arrow-forward"
                      size={17}
                      color="#002E15"
                    />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}

      {/* Custom Alert */}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        showCancel={alert.showCancel}
        onConfirm={() => {
          alert.onConfirm();
          closeAlert();
        }}
        onCancel={closeAlert}
      />
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9F8",
  },

  // ===================================================
  // BACKGROUND
  // ===================================================

  backgroundCircleTop: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#EAF2ED",
    top: 70,
    right: -150,
    opacity: 0.7,
  },

  backgroundCircleBottom: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#EEF2F0",
    bottom: 80,
    left: -140,
    opacity: 0.8,
  },

  // ===================================================
  // HERO HEADER
  // ===================================================

  header: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },

  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#E7F1EB",

    marginRight: 13,
  },

  heroText: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: "#718078",
    marginBottom: 3,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.7,
    color: "#101412",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: "#727A76",
    maxWidth: 340,
  },

  // ===================================================
  // CURRENT SELECTION
  // ===================================================

  currentSelection: {
    flexDirection: "row",
    alignItems: "center",

    marginHorizontal: 20,
    marginBottom: 14,

    paddingHorizontal: 13,
    paddingVertical: 11,

    borderRadius: 16,

    backgroundColor: "#EEF7F1",

    borderWidth: 1,
    borderColor: "#D7E8DD",
  },

  currentSelectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#DDEEE3",

    marginRight: 10,
  },

  currentSelectionContent: {
    flex: 1,
  },

  currentLabel: {
    fontSize: 8.5,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "#718078",
    marginBottom: 2,
  },

  currentCompany: {
    fontSize: 13,
    fontWeight: "700",
    color: "#173A27",
  },

  // ===================================================
  // SECTION
  // ===================================================

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 20,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#171B19",
  },

  sectionSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: "#8A918D",
  },

  secureBadge: {
    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 9,
    paddingVertical: 6,

    borderRadius: 10,

    backgroundColor: "#ECEFED",
  },

  secureText: {
    marginLeft: 4,
    fontSize: 10,
    fontWeight: "600",
    color: "#666D69",
  },

  // ===================================================
  // LIST
  // ===================================================

  list: {
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 205,
  },

  cardWrapper: {
    marginBottom: 11,
  },

  companyCard: {
    position: "relative",

    flexDirection: "row",
    alignItems: "center",

    minHeight: 98,

    paddingHorizontal: 14,
    paddingVertical: 14,

    borderRadius: 20,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#ECEFEE",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.045,
    shadowRadius: 12,

    elevation: 2,

    overflow: "hidden",
  },

  selectedCard: {
    borderColor: "#9EB9A8",
    backgroundColor: "#FBFDFC",

    shadowOpacity: 0.09,
    shadowRadius: 16,

    elevation: 4,
  },

  selectedAccent: {
    position: "absolute",
    left: 0,
    top: 16,
    bottom: 16,

    width: 3,

    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,

    backgroundColor: "#002E15",
  },

  // ===================================================
  // COMPANY ICON
  // ===================================================

  companyIcon: {
    width: 52,
    height: 52,

    borderRadius: 17,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 12,

    backgroundColor: "#F1F3F2",

    borderWidth: 1,
    borderColor: "#E6E9E7",
  },

  companyIconSelected: {
    backgroundColor: "#E7F2EA",
    borderColor: "#CFE1D5",
  },

  companyIconText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#414743",
  },

  companyIconTextSelected: {
    color: "#002E15",
  },

  // ===================================================
  // COMPANY INFORMATION
  // ===================================================

  companyInfo: {
    flex: 1,
    minWidth: 0,
  },

  companyNameRow: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: 5,
  },

  companyName: {
    flex: 1,

    fontSize: 15,
    fontWeight: "700",

    color: "#161A18",

    letterSpacing: -0.2,
  },

  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",

    marginLeft: 6,

    paddingHorizontal: 6,
    paddingVertical: 3,

    borderRadius: 7,

    backgroundColor: "#E5F1E9",
  },

  selectedBadgeText: {
    marginLeft: 2,

    fontSize: 7.5,
    fontWeight: "800",
    letterSpacing: 0.3,

    color: "#002E15",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 2,
  },

  detail: {
    flex: 1,

    marginLeft: 5,

    fontSize: 11.5,
    color: "#727975",
  },

  address: {
    flex: 1,

    marginLeft: 5,

    fontSize: 11,
    color: "#8A918D",
  },

  // ===================================================
  // RADIO
  // ===================================================

  radio: {
    width: 25,
    height: 25,

    borderRadius: 13,

    borderWidth: 1.6,
    borderColor: "#C3C9C5",

    alignItems: "center",
    justifyContent: "center",

    marginLeft: 9,

    backgroundColor: "#FAFBFA",
  },

  radioSelected: {
    borderColor: "#002E15",
    backgroundColor: "#002E15",
  },

  radioDot: {
    width: 19,
    height: 19,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",
  },

  // ===================================================
  // BOTTOM ACTION
  // ===================================================

  bottomContainer: {
    position: "absolute",

    left: 0,
    right: 0,
    bottom: 0,

    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 17,

    backgroundColor: "rgba(247,249,248,0.98)",

    borderTopWidth: 1,
    borderTopColor: "#E8EBE9",
  },

  bottomInner: {
    width: "100%",
  },

  bottomSelection: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: 9,

    paddingHorizontal: 4,
  },

  bottomCheck: {
    width: 25,
    height: 25,

    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#002E15",

    marginRight: 8,
  },

  bottomSelectionText: {
    flex: 1,
  },

  bottomLabel: {
    fontSize: 9.5,
    color: "#818883",
  },

  bottomCompany: {
    marginTop: 1,

    fontSize: 12.5,
    fontWeight: "700",
    color: "#202622",
  },

  continueButton: {
    minHeight: 55,

    borderRadius: 17,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 17,

    backgroundColor: "#002E15",

    shadowColor: "#002E15",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.16,
    shadowRadius: 14,
   marginBottom: 20,
    elevation: 5,
  },

  disabledButton: {
    backgroundColor: "#B9BFBB",

    shadowOpacity: 0,
    elevation: 0,
  },

  continueText: {
    color: "#FFFFFF",

    fontSize: 14,
    fontWeight: "700",

    textAlign: "center",
  },

  buttonIcon: {
    width: 30,
    height: 30,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FFFFFF",

    marginLeft: 10,
  },

  // ===================================================
  // LOADING
  // ===================================================

  loadingContainer: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  loadingIcon: {
    width: 62,
    height: 62,

    borderRadius: 21,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#E7F1EB",

    marginBottom: 18,
  },

  loadingText: {
    marginTop: 10,

    fontSize: 13,
    color: "#737A76",
  },

  // ===================================================
  // EMPTY
  // ===================================================

  center: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 25,
    paddingBottom: 80,
  },

  emptyCard: {
    width: "100%",

    padding: 28,

    borderRadius: 24,

    alignItems: "center",

    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#E9ECEA",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.05,
    shadowRadius: 16,

    elevation: 2,
  },

  emptyIconContainer: {
    width: 66,
    height: 66,

    borderRadius: 22,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#EFF2F0",

    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#171B19",
  },

  emptyText: {
    marginTop: 7,

    fontSize: 13,
    lineHeight: 19,

    textAlign: "center",

    color: "#7B827E",
  },

  emptyRefreshButton: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 18,

    paddingHorizontal: 17,
    paddingVertical: 10,

    borderRadius: 12,

    backgroundColor: "#E8F1EB",
  },

  emptyRefreshText: {
    marginLeft: 6,

    fontSize: 12,
    fontWeight: "700",

    color: "#002E15",
  },

  // ===================================================
  // ERROR
  // ===================================================

  errorContainer: {
    marginHorizontal: 20,
    marginTop: 10,

    padding: 24,

    borderRadius: 22,

    alignItems: "center",

    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#F0DADA",
  },

  errorIcon: {
    width: 54,
    height: 54,

    borderRadius: 18,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FCEEEE",

    marginBottom: 12,
  },

  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#351818",
  },

  errorText: {
    marginTop: 6,

    fontSize: 12.5,
    lineHeight: 19,

    textAlign: "center",

    color: "#777",
  },

  retryButton: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 17,

    paddingHorizontal: 20,
    paddingVertical: 11,

    borderRadius: 12,

    backgroundColor: "#002E15",
  },

  retryText: {
    marginLeft: 7,

    color: "#FFFFFF",

    fontSize: 12.5,
    fontWeight: "700",
  },
});

