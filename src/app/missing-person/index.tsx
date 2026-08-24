import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import React from "react";
import Header from "../../components/Header";
import { api } from "../../config/api";

interface Person {
  _id: string;
  photo: string;
  fullName: string;
  status: "Missing" | "Found";
  age: number;
  gender: string;
  lastSeenLocation: string;
  lastSeenDate: string;
}

export default function MissingPeople() {
  const router = useRouter();

  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    try {
      setLoading(true);
      const res = await api.get("/missing-person");
      setPeople(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await api.get("/missing-person");
      setPeople(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#002E15" />
          <Text style={styles.loadingText}>Loading Missing Persons...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <HeaderSection />
      <FlatList
        data={people}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#002E15"]}
          />
        }
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }) => (
          <Card person={item} onPress={() => router.push(`/missing-person/${item._id}`)} />
        )}
      />
    </SafeAreaView>
  );
}

const Card = React.memo(
  ({ person, onPress }: { person: Person; onPress: () => void }) => (
    <TouchableOpacity
      activeOpacity={0.92}
      style={styles.card}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
      <Image
        source={{ uri: person.photo }}
        style={styles.image}
        resizeMode="cover"
      />
</View>
      <View style={styles.cardContent}>
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={styles.name}>
            {person.fullName}
          </Text>

          <View
            style={[
              styles.status,
              {
                backgroundColor:
                  person.status === "Missing"
                    ? "#FFE7E7"
                    : "#E6F7EC",
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    person.status === "Missing"
                      ? "#E53935"
                      : "#2E7D32",
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color:
                    person.status === "Missing"
                      ? "#C62828"
                      : "#2E7D32",
                },
              ]}
            >
              {person.status}
            </Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={15}
            color="#7A7A7A"
          />

          <Text numberOfLines={1} style={styles.location}>
            {person.lastSeenLocation}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.dateRow}>
            <Ionicons
              name="time-outline"
              size={14}
              color="#999"
            />

            <Text style={styles.date}>
              {new Date(person.lastSeenDate).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.viewButton}>
            <Text style={styles.viewText}>View</Text>

            <Ionicons
              name="arrow-forward"
              size={14}
              color="#002E15"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
);

const HeaderSection = () => (
  <View style={styles.headerSection}>
    <Text style={styles.title}>Missing Persons</Text>
    
  </View>
);

const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <Ionicons name="people-outline" size={90} color="#C7C7C7" />
    <Text style={styles.emptyTitle}>No Missing Persons</Text>
    <Text style={styles.emptySubtitle}>Missing person reports will appear here.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 16,
  },

  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#002E15",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 15,
    color: "#666",
  },

  list: {
    paddingHorizontal: 16,
    paddingBottom: 25,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 14,
    marginBottom: 18,
    alignItems: "center",
  
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
  
    elevation: 6,
  },
  
  
  imageContainer: {
  width: 94,
  height: 94,
  borderRadius: 22,
  padding: 3,
  backgroundColor: "#EEF4F1",
},

image: {
  width: "100%",
  height: "100%",
  borderRadius: 19,
},
  
  cardContent: {
    flex: 1,
    marginLeft: 14,
  },
  
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginRight: 10,
  },
  
  status: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 30,
  },
  
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  
  statusText: {
    fontWeight: "700",
    fontSize: 12,
  },
  
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  
  location: {
    flex: 1,
    marginLeft: 6,
    color: "#666",
    fontSize: 14,
  },
  
  bottomRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  
  date: {
    marginLeft: 4,
    color: "#999",
    fontSize: 12,
  },
  
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F7F5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  
  viewText: {
    color: "#002E15",
    fontWeight: "600",
    marginRight: 4,
    fontSize: 13,
  },
  
  emptyContainer: {
    marginTop: 100,
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyTitle: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },

  emptySubtitle: {
    marginTop: 8,
    textAlign: "center",
    color: "#777",
    fontSize: 15,
    lineHeight: 22,
  },
});