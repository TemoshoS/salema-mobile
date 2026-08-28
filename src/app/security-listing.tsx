
import Header from "@/components/Header";
import { api } from "@/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

import { showError, showSuccess } from "@/utils/toast";

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
  const cardScale = useRef(
    new Animated.Value(0.96)
  ).current;

  const cardOpacity = useRef(
    new Animated.Value(0)
  ).current;

  const radioScale = useRef(
    new Animated.Value(isSelected ? 1 : 0)
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 350,
        delay: index * 70,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),

      Animated.spring(cardScale, {
        toValue: 1,
        delay: index * 70,
        friction: 7,
        tension: 60,
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
      toValue: 0.97,
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

  return (
    <Animated.View
      style={{
        opacity: cardOpacity,
        transform: [{ scale: cardScale }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
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
          {/* Glass highlight */}
          <View
            pointerEvents="none"
            style={styles.glassHighlight}
          />

          {/* Company Icon */}
          <View
            style={[
              styles.companyIcon,
              isSelected && styles.companyIconSelected,
            ]}
          >
            <Text style={styles.companyIconText}>
              {item.companyName
                ?.charAt(0)
                ?.toUpperCase() || "S"}
            </Text>
          </View>

          {/* Company Information */}
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
                  <Text style={styles.selectedBadgeText}>
                    SELECTED
                  </Text>
                </View>
              )}
            </View>

            {item.contactPerson && (
              <Text
                style={styles.detail}
                numberOfLines={1}
              >
                {item.contactPerson}
              </Text>
            )}

            <Text style={styles.detail}>
              {item.phoneNumber}
            </Text>

            {item.address && (
              <Text
                style={styles.address}
                numberOfLines={2}
              >
                {item.address}
              </Text>
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
                  transform: [
                    {
                      scale: radioScale,
                    },
                  ],
                },
              ]}
            />
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

  const [refreshing, setRefreshing] =
    useState(false);

  const [selectedCompany, setSelectedCompany] =
    useState<SecurityCompany | null>(null);

  const [error, setError] = useState("");

  const bottomAnimation = useRef(
    new Animated.Value(0)
  ).current;

  // =====================================================
  // GET SECURITY COMPANIES
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

      // Restore saved selection
      const selectedId =
        await AsyncStorage.getItem(
          "selectedSecurityCompanyId"
        );

      if (selectedId) {
        const savedCompany = companyList.find(
          (company: SecurityCompany) =>
            company._id === selectedId
        );

        if (savedCompany) {
          setSelectedCompany(savedCompany);
        } else {
          setSelectedCompany(null);
        }
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
  // BOTTOM BUTTON ANIMATION
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
  // SELECT / UNSELECT
  // =====================================================

  const handleSelectCompany = async (
    company: SecurityCompany
  ) => {
    try {
      // ==========================================
      // UNSELECT
      // ==========================================

      if (selectedCompany?._id === company._id) {
        setSelectedCompany(null);

        await AsyncStorage.multiRemove([
          "selectedSecurityCompanyId",
          "selectedSecurityCompanyName",
          "selectedSecurityCompanyPhone",
        ]);

        console.log(
          "Security company unselected:",
          company.companyName
        );

        return;
      }

      // ==========================================
      // SELECT
      // ==========================================

      setSelectedCompany(company);

      console.log(
        "Security company selected:",
        company.companyName
      );
    } catch (error) {
      console.log(
        "Selection error:",
        error
      );
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

    showSuccess(
      `${selectedCompany.companyName} will receive your emergency alerts.`,
      "Security Company Selected"
    );

    console.log(
      "Security company confirmed:",
      selectedCompany.companyName
    );
  } catch (error) {
    console.log(
      "Error saving security company:",
      error
    );

    showError(
      "We could not save your security company selection.",
      "Selection Failed"
    );
  }
};

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingGlass}>
            <ActivityIndicator
              size="small"
              color="#111"
            />
          </View>

          <Text style={styles.loadingText}>
            Loading security companies...
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

      {/* Water / Glass Background */}
      <View
        pointerEvents="none"
        style={styles.glowTop}
      />

      <View
        pointerEvents="none"
        style={styles.glowBottom}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Security Companies
        </Text>

        <Text style={styles.subtitle}>
          Select a security company to receive your
          emergency alerts.
        </Text>

        {selectedCompany && (
          <View style={styles.selectionHint}>
            <View style={styles.selectionDot} />

            <Text
              style={styles.selectionHintText}
              numberOfLines={1}
            >
              {selectedCompany.companyName} selected
            </Text>
          </View>
        )}
      </View>

      {/* Error */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchSecurityCompanies}
          >
            <Text style={styles.retryText}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : companies.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyGlass}>
            <Text style={styles.emptyIcon}>
              ◯
            </Text>

            <Text style={styles.emptyTitle}>
              No Security Companies
            </Text>

            <Text style={styles.emptyText}>
              There are currently no security
              companies available.
            </Text>
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
            contentContainerStyle={
              styles.list
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#111"
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
                    outputRange: [0.75, 1],
                  }),

                transform: [
                  {
                    translateY:
                      bottomAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [25, 0],
                      }),
                  },
                ],
              },
            ]}
          >
            <View
              style={styles.bottomGlassLine}
            />

            <TouchableOpacity
              style={[
                styles.continueButton,
                !selectedCompany &&
                  styles.disabledButton,
              ]}
              disabled={!selectedCompany}
              activeOpacity={0.85}
              onPress={handleConfirmSelection}
            >
              <Text style={styles.continueText}>
                {selectedCompany
                  ? `Continue with ${selectedCompany.companyName}`
                  : "Select a Security Company"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },

  // ===================================================
  // BACKGROUND
  // ===================================================

  glowTop: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor:
      "rgba(255,255,255,0.75)",
    top: 90,
    right: -120,
  },

  glowBottom: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor:
      "rgba(225,230,233,0.55)",
    bottom: 130,
    left: -120,
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: "#111",
  },

  subtitle: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 20,
    color: "#777",
    maxWidth: 350,
  },

  selectionHint: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",

    marginTop: 12,

    paddingHorizontal: 12,
    paddingVertical: 7,

    borderRadius: 20,

    backgroundColor:
      "rgba(255,255,255,0.72)",

    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.95)",
  },

  selectionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,

    backgroundColor: "#111",

    marginRight: 7,
  },

  selectionHintText: {
    maxWidth: 260,

    fontSize: 12,
    fontWeight: "600",
    color: "#444",
  },

  // ===================================================
  // LIST
  // ===================================================

  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 150,
  },

  cardWrapper: {
    marginBottom: 13,
  },

 companyCard: {
  position: "relative",

  flexDirection: "row",
  alignItems: "center",

  minHeight: 105,

  padding: 16,

  borderRadius: 22,

  overflow: "hidden",

  backgroundColor: "#fff",

  borderWidth: 0,

  shadowColor: "#000",

  shadowOffset: {
    width: 0,
    height: 5,
  },

  shadowOpacity: 0.05,
  shadowRadius: 15,

  elevation: 2,
},

selectedCard: {
  backgroundColor: "#fff",

  borderColor: "#002E15",

  borderWidth: 1.5,

  shadowOpacity: 0.10,
  shadowRadius: 18,

  elevation: 4,
},

  glassHighlight: {
    position: "absolute",

    top: 0,
    left: 22,
    right: 22,

    height: 1,

    backgroundColor:
      "rgba(255,255,255,0.95)",
  },

  // ===================================================
  // ICON
  // ===================================================

  companyIcon: {
    width: 52,
    height: 52,

    borderRadius: 18,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 14,

    backgroundColor:
      "rgba(245,246,247,0.85)",

    borderWidth: 1,

    borderColor:
      "rgba(0,0,0,0.05)",
  },

 companyIconSelected: {
  backgroundColor: "#EEF6F3",
  borderColor: "#002E15",
},

  companyIconText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#222",
  },

  // ===================================================
  // COMPANY INFO
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

    fontSize: 16,
    fontWeight: "700",

    color: "#111",

    letterSpacing: -0.2,
  },

  selectedBadge: {
    marginLeft: 7,

    paddingHorizontal: 7,
    paddingVertical: 3,

    borderRadius: 8,

    backgroundColor:
      "rgba(0,0,0,0.055)",
  },

  selectedBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#555",
  },

  detail: {
    fontSize: 12.5,
    color: "#666",
    marginTop: 2,
  },

  address: {
    fontSize: 11.5,
    lineHeight: 16,

    color: "#888",

    marginTop: 4,
  },

  // ===================================================
  // RADIO
  // ===================================================

  radio: {
    width: 23,
    height: 23,

    borderRadius: 12,

    borderWidth: 1.7,
    borderColor: "#b8b8b8",

    alignItems: "center",
    justifyContent: "center",

    marginLeft: 10,

    backgroundColor:
      "rgba(255,255,255,0.65)",
  },

 radioSelected: {
  borderColor: "#002E15",
  backgroundColor: "#fff",
},
radioDot: {
  width: 11,
  height: 11,

  borderRadius: 6,

  backgroundColor: "#002E15",
},

  // ===================================================
  // BOTTOM
  // ===================================================

  bottomContainer: {
    position: "absolute",

    left: 0,
    right: 0,
    bottom: 0,

    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,

    backgroundColor: "white",

    borderTopWidth: 1,

    borderTopColor:
      "white",
  },

  bottomGlassLine: {
    position: "absolute",

    top: 0,
    left: 40,
    right: 40,

    height: 1,

    backgroundColor:
      "white",
  },

  continueButton: {
  minHeight: 54,

  borderRadius: 17,

  alignItems: "center",
  justifyContent: "center",

  paddingHorizontal: 16,

  backgroundColor: "#002E15",

  shadowColor: "#000",

  shadowOffset: {
    width: 0,
    height: 7,
  },

  shadowOpacity: 0.12,
  shadowRadius: 15,

  elevation: 5,
},

  disabledButton: {
    backgroundColor:
      "rgba(185,185,185,0.70)",

    shadowOpacity: 0,
    elevation: 0,
  },

  continueText: {
    color: "#fff",

    fontSize: 14.5,
    fontWeight: "700",

    textAlign: "center",
  },

  // ===================================================
  // LOADING
  // ===================================================

  loadingContainer: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  loadingGlass: {
    width: 54,
    height: 54,

    borderRadius: 27,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
      "rgba(255,255,255,0.75)",

    borderWidth: 1,

    borderColor:
      "rgba(255,255,255,0.95)",

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.05,
    shadowRadius: 12,

    elevation: 2,
  },

  loadingText: {
    marginTop: 12,

    fontSize: 13,

    color: "#666",
  },

  // ===================================================
  // EMPTY
  // ===================================================

  center: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    padding: 30,
  },

  emptyGlass: {
    width: "100%",
    maxWidth: 350,

    padding: 28,

    borderRadius: 24,

    alignItems: "center",

    backgroundColor:
      "rgba(255,255,255,0.70)",

    borderWidth: 1,

    borderColor:
      "rgba(255,255,255,0.95)",

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 7,
    },

    shadowOpacity: 0.05,
    shadowRadius: 18,

    elevation: 2,
  },

  emptyIcon: {
    fontSize: 34,

    color: "#aaa",

    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 19,

    fontWeight: "700",

    color: "#111",
  },

  emptyText: {
    marginTop: 8,

    fontSize: 13,

    lineHeight: 20,

    textAlign: "center",

    color: "#777",
  },

  // ===================================================
  // ERROR
  // ===================================================

  errorContainer: {
    margin: 20,

    padding: 22,

    borderRadius: 20,

    alignItems: "center",

    backgroundColor:
      "rgba(255,255,255,0.75)",

    borderWidth: 1,

    borderColor:
      "rgba(0,0,0,0.06)",
  },

  errorText: {
    fontSize: 13,

    textAlign: "center",

    color: "#b00000",

    marginBottom: 15,
  },

  retryButton: {
    paddingHorizontal: 25,

    paddingVertical: 11,

    borderRadius: 12,

    backgroundColor: "#111",
  },

  retryText: {
    color: "#fff",

    fontSize: 13,

    fontWeight: "700",
  },
});

