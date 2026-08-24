import Header from "@/components/Header";
import { api } from "@/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
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

export default function SecurityListing() {
  const [companies, setCompanies] = useState<SecurityCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCompany, setSelectedCompany] =
    useState<SecurityCompany | null>(null);
  const [error, setError] = useState("");

  // ==========================================
  // GET ALL SECURITY COMPANIES
  // ==========================================

  const fetchSecurityCompanies = async () => {
    try {
      setError("");

      const response = await api.get("/security-company/all");

      const companyList = response.data.companies || [];

      setCompanies(companyList);

      // Restore previously confirmed company
      const selectedId = await AsyncStorage.getItem(
        "selectedSecurityCompanyId"
      );

      if (selectedId) {
        const selected = companyList.find(
          (company: SecurityCompany) =>
            company._id === selectedId
        );

        if (selected) {
          setSelectedCompany(selected);
        }
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

  // ==========================================
  // LOAD WHEN SCREEN GETS FOCUS
  // ==========================================

  useFocusEffect(
    useCallback(() => {
      fetchSecurityCompanies();
    }, [])
  );

  // ==========================================
  // REFRESH
  // ==========================================

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSecurityCompanies();
  };

  // ==========================================
  // SELECT COMPANY
  // ==========================================

  const handleSelectCompany = (
    company: SecurityCompany
  ) => {
    setSelectedCompany(company);

    console.log(
      "Selected security company:",
      company.companyName
    );

    console.log(
      "Security company ID:",
      company._id
    );
  };

  // ==========================================
  // CONFIRM COMPANY
  // ==========================================

  const handleConfirmSelection = async () => {
    if (!selectedCompany) return;
  
    try {
      await AsyncStorage.setItem(
        "selectedSecurityCompanyId",
        selectedCompany._id
      );
  
      await AsyncStorage.setItem(
        "selectedSecurityCompanyName",
        selectedCompany.companyName
      );
  
      await AsyncStorage.setItem(
        "selectedSecurityCompanyPhone",
        selectedCompany.phoneNumber
      );
  
      console.log(
        "Security company selected:",
        selectedCompany.companyName
      );
  
      console.log(
        "Security company phone:",
        selectedCompany.phoneNumber
      );
    } catch (error) {
      console.log(
        "Error saving security company:",
        error
      );
    }
  };

  // ==========================================
  // COMPANY CARD
  // ==========================================

  const renderCompany = ({
    item,
  }: {
    item: SecurityCompany;
  }) => {
    const isSelected =
      selectedCompany?._id === item._id;

    return (
      <TouchableOpacity
        style={[
          styles.companyCard,
          isSelected && styles.selectedCard,
        ]}
        activeOpacity={0.8}
        onPress={() => handleSelectCompany(item)}
      >
        {/* Company Icon */}
        <View style={styles.companyIcon}>
          <Text style={styles.companyIconText}>
            {item.companyName
              ?.charAt(0)
              ?.toUpperCase() || "S"}
          </Text>
        </View>

        {/* Company Information */}
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>
            {item.companyName}
          </Text>

          {item.contactPerson && (
            <Text style={styles.detail}>
              Contact: {item.contactPerson}
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
          {isSelected && (
            <View style={styles.radioDot} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        
        <View style={styles.center}>
          <ActivityIndicator size="large" />

          <Text style={styles.loadingText}>
            Loading security companies...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // SCREEN
  // ==========================================

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header />
      <View style={styles.header}>
        <Text style={styles.title}>
          Security Companies
        </Text>

        <Text style={styles.subtitle}>
          Select a security company to receive your
          emergency alerts.
        </Text>
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
        /* Empty */
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>
            No Security Companies
          </Text>

          <Text style={styles.emptyText}>
            There are currently no security companies
            available.
          </Text>
        </View>
      ) : (
        <>
          {/* Company List */}
          <FlatList
            data={companies}
            keyExtractor={(item) => item._id}
            renderItem={renderCompany}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            showsVerticalScrollIndicator={false}
          />

          {/* Bottom Button */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                !selectedCompany &&
                  styles.disabledButton,
              ]}
              disabled={!selectedCompany}
              onPress={handleConfirmSelection}
            >
              <Text style={styles.continueText}>
                {selectedCompany
                  ? `Continue with ${selectedCompany.companyName}`
                  : "Select a Security Company"}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#777",
  },

  list: {
    padding: 20,
    paddingBottom: 120,
  },

  companyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
  },

  selectedCard: {
    borderColor: "#111",
    borderWidth: 2,
  },

  companyIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f1f1f1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  companyIconText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },

  companyInfo: {
    flex: 1,
  },

  companyName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
    marginBottom: 5,
  },

  detail: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  address: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#aaa",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  radioSelected: {
    borderColor: "#111",
  },

  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#111",
  },

  bottomContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },

  continueButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  disabledButton: {
    backgroundColor: "#ccc",
  },

  continueText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  loadingText: {
    marginTop: 12,
    color: "#666",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },

  emptyText: {
    marginTop: 8,
    textAlign: "center",
    color: "#777",
    lineHeight: 20,
  },

  errorContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 14,
    backgroundColor: "#fafafa",
    alignItems: "center",
  },

  errorText: {
    textAlign: "center",
    color: "#d00",
    marginBottom: 15,
  },

  retryButton: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#111",
  },

  retryText: {
    color: "#fff",
    fontWeight: "700",
  },
});