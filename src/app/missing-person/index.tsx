
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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

import Header from "../../components/Header";
import { api } from "../../config/api";

interface Person {
  _id: string;
  photo?: string;
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

  const loadPeople = useCallback(async () => {
    try {
      setLoading(true);

      const res = await api.get("/missing-person");

      setPeople(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load missing persons:", error);
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);

      const res = await api.get("/missing-person");

      setPeople(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const missingCount = useMemo(
    () =>
      people.filter(
        (person) => person.status === "Missing"
      ).length,
    [people]
  );

  const foundCount = useMemo(
    () =>
      people.filter(
        (person) => person.status === "Found"
      ).length,
    [people]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />

        <View style={styles.loader}>
          <View style={styles.loaderIcon}>
            <Ionicons
              name="person-search-outline"
              size={28}
              color="#002E15"
            />
          </View>

          <ActivityIndicator
            size="small"
            color="#002E15"
            style={styles.loaderSpinner}
          />

          <Text style={styles.loadingText}>
            Loading missing persons...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />

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
            tintColor="#002E15"
          />
        }
        ListHeaderComponent={
          <TopSection
            total={people.length}
            missing={missingCount}
            found={foundCount}
            onReport={() =>
              router.push("/missing-person/add")
            }
          />
        }
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }) => (
          <Card
            person={item}
            onPress={() =>
              router.push(
                `/missing-person/${item._id}`
              )
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/* TOP SECTION                                                                */
/* -------------------------------------------------------------------------- */

const TopSection = ({
  total,
  missing,
  found,
  onReport,
}: {
  total: number;
  missing: number;
  found: number;
  onReport: () => void;
}) => {
  return (
    <View style={styles.topSection}>
    
      
      {/* REPORT BUTTON */}

      <TouchableOpacity
        style={styles.reportButton}
        onPress={onReport}
        activeOpacity={0.85}
      >
        <View style={styles.reportIcon}>
          <Ionicons
            name="add"
            size={22}
            color="#002E15"
          />
        </View>

        <View style={styles.reportContent}>
          <Text style={styles.reportTitle}>
            Report a Missing Person
          </Text>

          <Text style={styles.reportSubtitle}>
            Submit a new missing person report
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      {/* LIST HEADER */}

      <View style={styles.listHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.listTitle}>
            Recent Reports
          </Text>

          <Text style={styles.listSubtitle}>
            People currently reported missing
          </Text>
        </View>

        <View style={styles.reportCount}>
          <Text style={styles.reportCountText}>
            {total}
          </Text>
        </View>
      </View>
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* CARD                                                                       */
/* -------------------------------------------------------------------------- */

const Card = ({
  person,
  onPress,
}: {
  person: Person;
  onPress: () => void;
}) => {
  const isMissing = person.status === "Missing";

  const formattedDate = new Date(
    person.lastSeenDate
  ).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      style={styles.card}
      onPress={onPress}
    >
      {/* PHOTO */}

      <View style={styles.imageContainer}>
        {person.photo ? (
          <Image
            source={{ uri: person.photo }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noPhoto}>
            <Ionicons
              name="person-outline"
              size={30}
              color="#8A8F8B"
            />
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        {/* NAME + STATUS */}

        <View style={styles.topRow}>
          <Text
            numberOfLines={1}
            style={styles.name}
          >
            {person.fullName}
          </Text>

          <View
            style={[
              styles.status,
              isMissing
                ? styles.missingStatus
                : styles.foundStatus,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                isMissing
                  ? styles.missingDot
                  : styles.foundDot,
              ]}
            />

            <Text
              style={[
                styles.statusText,
                isMissing
                  ? styles.missingText
                  : styles.foundText,
              ]}
            >
              {person.status}
            </Text>
          </View>
        </View>

        {/* BASIC INFO */}

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons
              name="person-outline"
              size={14}
              color="#7A827C"
            />

            <Text style={styles.detailText}>
              {person.age} years
            </Text>
          </View>

          <View style={styles.detailSeparator} />

          <Text style={styles.detailText}>
            {person.gender}
          </Text>
        </View>

        {/* LOCATION */}

        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={15}
            color="#7A827C"
          />

          <Text
            numberOfLines={1}
            style={styles.location}
          >
            {person.lastSeenLocation}
          </Text>
        </View>

        {/* BOTTOM */}

        <View style={styles.bottomRow}>
          <View style={styles.dateRow}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color="#999"
            />

            <Text style={styles.date}>
              {formattedDate}
            </Text>
          </View>

          <View style={styles.viewButton}>
            <Text style={styles.viewText}>
              View Details
            </Text>

            <Ionicons
              name="chevron-forward"
              size={14}
              color="#002E15"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

/* -------------------------------------------------------------------------- */
/* EMPTY STATE                                                                */
/* -------------------------------------------------------------------------- */

const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIcon}>
      <Ionicons
        name="person-search-outline"
        size={38}
        color="#002E15"
      />
    </View>

    <Text style={styles.emptyTitle}>
      No Missing Persons
    </Text>

    <Text style={styles.emptySubtitle}>
      There are currently no missing person reports.
      New reports will appear here.
    </Text>
  </View>
);

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F6",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loaderIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#EAF4EC",
    justifyContent: "center",
    alignItems: "center",
  },

  loaderSpinner: {
    marginTop: 18,
  },

  loadingText: {
    marginTop: 9,
    color: "#7D857F",
    fontSize: 13,
  },

  list: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  /* TOP */

  topSection: {
    paddingTop: 14,
  },

  hero: {
    height: 190,
    backgroundColor: "#002E15",
    borderRadius: 24,
    padding: 21,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
  },

  heroContent: {
    width: "78%",
    zIndex: 2,
  },

  heroIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: "rgba(180,224,183,0.14)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 13,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
  },

  heroSubtitle: {
    color: "#B4E0B7",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },

  heroDecoration: {
    position: "absolute",
    right: -15,
    bottom: -15,
  },

  /* STATS */

  statsCard: {
    minHeight: 82,
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    marginTop: -25,
    marginHorizontal: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E7EBE8",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 4,
  },

  totalStat: {
    minWidth: 82,
    alignItems: "center",
  },

  totalNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#002E15",
  },

  totalLabel: {
    fontSize: 9,
    color: "#8A8F8B",
    marginTop: 2,
  },

  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E8ECE9",
    marginHorizontal: 7,
  },

  smallStat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 7,
  },

  missingIcon: {
    backgroundColor: "#FFF0F0",
  },

  foundIcon: {
    backgroundColor: "#EAF5EC",
  },

  statNumber: {
    fontSize: 17,
    fontWeight: "800",
    color: "#202522",
  },

  statLabel: {
    fontSize: 9,
    color: "#8A8F8B",
    marginTop: 1,
  },

  /* REPORT */

  reportButton: {
    minHeight: 70,
    backgroundColor: "#002E15",
    borderRadius: 18,
    marginTop: 16,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  reportIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#B4E0B7",
    justifyContent: "center",
    alignItems: "center",
  },

  reportContent: {
    flex: 1,
    marginHorizontal: 12,
  },

  reportTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  reportSubtitle: {
    color: "#B4E0B7",
    fontSize: 10,
    marginTop: 3,
  },

  /* LIST HEADER */

  listHeader: {
    marginTop: 26,
    marginBottom: 12,
    paddingHorizontal: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  listTitle: {
    color: "#002E15",
    fontSize: 18,
    fontWeight: "800",
  },

  listSubtitle: {
    color: "#8A8F8B",
    fontSize: 10,
    marginTop: 3,
  },

  reportCount: {
    minWidth: 31,
    height: 27,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: "#EAF4EC",
    justifyContent: "center",
    alignItems: "center",
  },

  reportCountText: {
    color: "#002E15",
    fontSize: 11,
    fontWeight: "800",
  },

  /* CARD */

  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    marginBottom: 13,
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.055,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 3,
  },

  imageContainer: {
    width: 94,
    height: 105,
    borderRadius: 17,
    overflow: "hidden",
    backgroundColor: "#EEF3EF",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  noPhoto: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  cardContent: {
    flex: 1,
    marginLeft: 13,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#202522",
    marginRight: 7,
  },

  status: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },

  missingStatus: {
    backgroundColor: "#FFF0F0",
  },

  foundStatus: {
    backgroundColor: "#EAF5EC",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  missingDot: {
    backgroundColor: "#D32F2F",
  },

  foundDot: {
    backgroundColor: "#2E7D32",
  },

  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },

  missingText: {
    color: "#C62828",
  },

  foundText: {
    color: "#2E7D32",
  },

  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  detailText: {
    color: "#7A827C",
    fontSize: 11,
    marginLeft: 4,
  },

  detailSeparator: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#B8BDB9",
    marginHorizontal: 8,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  location: {
    flex: 1,
    marginLeft: 5,
    color: "#667069",
    fontSize: 11,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  date: {
    marginLeft: 4,
    color: "#9AA19C",
    fontSize: 9,
  },

  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F6F1",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
  },

  viewText: {
    color: "#002E15",
    fontWeight: "700",
    marginRight: 3,
    fontSize: 9,
  },

  /* EMPTY */

  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 35,
    paddingTop: 55,
  },

  emptyIcon: {
    width: 78,
    height: 78,
    borderRadius: 25,
    backgroundColor: "#EAF4EC",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 17,
    fontSize: 19,
    fontWeight: "800",
    color: "#002E15",
  },

  emptySubtitle: {
    marginTop: 7,
    textAlign: "center",
    color: "#8A8F8B",
    fontSize: 12,
    lineHeight: 19,
  },
});

