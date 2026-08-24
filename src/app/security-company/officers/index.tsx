import { api } from "@/config/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OfficersScreen() {
  const router = useRouter();

  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  useFocusEffect(
    useCallback(() => {
      loadOfficers();
    }, [])
  );

  const loadOfficers = async () => {
    try {
      const token = await AsyncStorage.getItem(
        "companyToken"
      );

      const res = await api.get(
        "/security-company/officers",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOfficers(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const deleteOfficer = (id: string) => {
    Alert.alert(
      "Delete Officer",
      "Are you sure you want to delete this officer?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token =
                await AsyncStorage.getItem(
                  "companyToken"
                );

              await api.delete(
                `/security-company/officers/${id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              loadOfficers();
            } catch (err) {
              console.log(err);
            }
          },
        },
      ]
    );
  };

  const filteredOfficers = useMemo(() => {
    return officers.filter((officer) => {
      const matchesSearch =
        `${officer.firstName} ${officer.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        officer.email
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        officer.psiraNumber
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        filter === "all"
          ? true
          : officer.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [officers, search, filter]);

  const activeCount = officers.filter(
    (o) => o.status === "active"
  ).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator
          size="large"
          color="#002E15"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="#002E15"
        barStyle="light-content"
      />

      {/* Header */}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Security Officers
        </Text>

        <TouchableOpacity
          onPress={() =>
            router.push(
              "/security-company/officers/add"
            )
          }
        >
          <Ionicons
            name="add-circle"
            size={34}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* Dashboard Summary */}

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>
            Total Officers
          </Text>

          <Text style={styles.summaryValue}>
            {officers.length}
          </Text>
        </View>

        <View style={styles.activeBadge}>
          <Ionicons
            name="shield-checkmark"
            size={18}
            color="#16A34A"
          />

          <Text style={styles.activeText}>
            {activeCount} Active
          </Text>
        </View>
      </View>

      {/* Search */}

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#888"
        />

        <TextInput
          style={styles.searchInput}
          placeholder="Search officers..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Buttons */}

      <View style={styles.filterRow}>
        {["all", "active", "inactive"].map(
          (item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.filterButton,
                filter === item &&
                  styles.filterButtonActive,
              ]}
              onPress={() =>
                setFilter(item as any)
              }
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item &&
                    styles.filterTextActive,
                ]}
              >
                {item.charAt(0).toUpperCase() +
                  item.slice(1)}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>
      <FlatList
        data={filteredOfficers}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadOfficers();
            }}
            colors={["#002E15"]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 30,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="people-outline"
              size={80}
              color="#C7C7C7"
            />

            <Text style={styles.emptyTitle}>
              No Officers Found
            </Text>

            <Text style={styles.emptyText}>
              Add your first security officer or
              adjust your search.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.95}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname:
                  "/security-company/officers/details",
                params: {
                  id: item._id,
                },
              })
            }
          >
            {/* Header */}

            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.firstName?.charAt(0)}
                  {item.lastName?.charAt(0)}
                </Text>
              </View>

              <View style={styles.infoContainer}>
                <Text style={styles.name}>
                  {item.firstName} {item.lastName}
                </Text>

                <Text style={styles.rank}>
                  {item.rank}
                </Text>

                <Text style={styles.email}>
                  {item.email}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.status === "active"
                        ? "#DCFCE7"
                        : "#FEE2E2",
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        item.status === "active"
                          ? "#16A34A"
                          : "#DC2626",
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        item.status === "active"
                          ? "#15803D"
                          : "#DC2626",
                    },
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            </View>

            {/* Divider */}

            <View style={styles.divider} />

            {/* Information */}

            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color="#0F766E"
                />

                <Text style={styles.infoLabel}>
                  PSIRA
                </Text>

                <Text style={styles.infoValue}>
                  {item.psiraNumber}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <Ionicons
                  name="call"
                  size={20}
                  color="#2563EB"
                />

                <Text style={styles.infoLabel}>
                  Phone
                </Text>

                <Text style={styles.infoValue}>
                  {item.phoneNumber || "-"}
                </Text>
              </View>
            </View>

            {/* Bottom Actions */}

            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  router.push({
                    pathname:
                      "/security-company/officers/details",
                    params: {
                      id: item._id,
                    },
                  })
                }
              >
                <Ionicons
                  name="eye-outline"
                  size={21}
                  color="#2563EB"
                />

                <Text
                  style={[
                    styles.actionText,
                    { color: "#2563EB" },
                  ]}
                >
                  View
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  router.push({
                    pathname:
                      "/security-company/officers/edit",
                    params: {
                      id: item._id,
                    },
                  })
                }
              >
                <Ionicons
                  name="create-outline"
                  size={21}
                  color="#EA580C"
                />

                <Text
                  style={[
                    styles.actionText,
                    { color: "#EA580C" },
                  ]}
                >
                  Edit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  deleteOfficer(item._id)
                }
              >
                <Ionicons
                  name="trash-outline"
                  size={21}
                  color="#DC2626"
                />

                <Text
                  style={[
                    styles.actionText,
                    { color: "#DC2626" },
                  ]}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#EEF6F3",
    },
  
    loader: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  
    header: {
      backgroundColor: "#002E15",
      paddingHorizontal: 20,
      paddingVertical: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      elevation: 6,
    },
  
    headerTitle: {
      color: "#fff",
      fontSize: 21,
      fontWeight: "700",
    },
  
    summaryCard: {
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 14,
      backgroundColor: "#fff",
      borderRadius: 20,
      padding: 18,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      elevation: 3,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 4,
      },
    },
  
    summaryLabel: {
      color: "#777",
      fontSize: 14,
    },
  
    summaryValue: {
      fontSize: 32,
      fontWeight: "700",
      color: "#002E15",
      marginTop: 5,
    },
  
    activeBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#DCFCE7",
      borderRadius: 30,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
  
    activeText: {
      marginLeft: 6,
      color: "#15803D",
      fontWeight: "700",
    },
  
    searchContainer: {
      height: 54,
      backgroundColor: "#fff",
      marginHorizontal: 16,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      elevation: 2,
    },
  
    searchInput: {
      flex: 1,
      marginLeft: 10,
      color: "#222",
      fontSize: 16,
    },
  
    filterRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginHorizontal: 16,
      marginVertical: 16,
    },
  
    filterButton: {
      flex: 1,
      marginHorizontal: 4,
      backgroundColor: "#fff",
      borderRadius: 30,
      paddingVertical: 10,
      alignItems: "center",
      elevation: 2,
    },
  
    filterButtonActive: {
      backgroundColor: "#002E15",
    },
  
    filterText: {
      color: "#555",
      fontWeight: "600",
    },
  
    filterTextActive: {
      color: "#fff",
    },
  
    card: {
      backgroundColor: "#fff",
      borderRadius: 24,
      padding: 18,
      marginBottom: 18,
      elevation: 5,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: {
        width: 0,
        height: 5,
      },
    },
  
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
  
    avatar: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: "#002E15",
      justifyContent: "center",
      alignItems: "center",
    },
  
    avatarText: {
      color: "#fff",
      fontSize: 24,
      fontWeight: "700",
    },
  
    infoContainer: {
      flex: 1,
      marginLeft: 15,
    },
  
    name: {
      fontSize: 19,
      fontWeight: "700",
      color: "#002E15",
    },
  
    rank: {
      marginTop: 2,
      color: "#0F766E",
      fontWeight: "600",
      fontSize: 14,
    },
  
    email: {
      marginTop: 5,
      color: "#777",
      fontSize: 14,
    },
  
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 30,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
  
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
  
    statusText: {
      fontWeight: "700",
      textTransform: "capitalize",
      fontSize: 13,
    },
  
    divider: {
      height: 1,
      backgroundColor: "#ECECEC",
      marginVertical: 18,
    },
  
    infoGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
  
    infoCard: {
      width: "48%",
      backgroundColor: "#F8FAFC",
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 10,
      alignItems: "center",
    },
  
    infoLabel: {
      marginTop: 8,
      color: "#888",
      fontSize: 12,
      fontWeight: "600",
    },
  
    infoValue: {
      marginTop: 6,
      color: "#002E15",
      fontWeight: "700",
      textAlign: "center",
      fontSize: 14,
    },
  
    bottomActions: {
      flexDirection: "row",
      justifyContent: "space-around",
      borderTopWidth: 1,
      borderColor: "#F1F1F1",
      marginTop: 18,
      paddingTop: 16,
    },
  
    actionButton: {
      alignItems: "center",
      flex: 1,
    },
  
    actionText: {
      marginTop: 5,
      fontWeight: "700",
      fontSize: 13,
    },
  
    empty: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 30,
      paddingTop: 80,
    },
  
    emptyTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: "#333",
      marginTop: 20,
    },
  
    emptyText: {
      marginTop: 12,
      textAlign: "center",
      color: "#777",
      fontSize: 15,
      lineHeight: 23,
    },
  });