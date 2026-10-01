
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ImageViewing from "react-native-image-viewing";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../../components/Header";
import { api } from "../../config/api";

interface Person {
  photo?: string;
  fullName: string;
  status: "Missing" | "Found";
  age: number;
  gender: string;
  lastSeenLocation: string;
  lastSeenDate: string;
  description: string;
  contactName: string;
  contactNumber?: string;
}

export default function MissingPersonDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [person, setPerson] = useState<Person | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      loadPerson();
    }
  }, [id]);

  const loadPerson = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/missing-person/${id}`);

      setPerson(res.data);
    } catch (error) {
      console.error("Failed to load person:", error);

      Alert.alert(
        "Unable to Load",
        "We couldn't load the missing person details.",
        [
          {
            text: "Go Back",
            onPress: () => router.back(),
          },
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshPerson = async () => {
    try {
      setRefreshing(true);

      const res = await api.get(`/missing-person/${id}`);

      setPerson(res.data);
    } catch (error) {
      console.error("Refresh error:", error);

      Alert.alert(
        "Refresh Failed",
        "Unable to refresh the person details."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const callReporter = async () => {
    if (!person?.contactNumber) {
      Alert.alert(
        "Unavailable",
        "The reporter's phone number is not available."
      );
      return;
    }

    try {
      await Linking.openURL(`tel:${person.contactNumber}`);
    } catch (error) {
      Alert.alert(
        "Unable to Call",
        "Your device could not open the phone dialer."
      );
    }
  };

  const markAsFound = () => {
    Alert.alert(
      "Mark Person as Found?",
      "This will update the report status to Found. You can still view the record afterwards.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Mark as Found",
          onPress: async () => {
            try {
              setUpdating(true);

              await api.patch(`/missing-person/${id}/found`);

              Alert.alert(
                "Person Found",
                "The missing person has been successfully marked as found."
              );

              await loadPerson();
            } catch (error: any) {
              console.error("Mark as found error:", error);

              Alert.alert(
                "Update Failed",
                error.response?.data?.message ||
                  "Failed to update the person's status."
              );
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const deletePerson = () => {
    Alert.alert(
      "Delete Report",
      "Are you sure you want to permanently delete this missing person record? This action cannot be undone.",
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
              setUpdating(true);

              await api.delete(`/missing-person/${id}`);

              Alert.alert(
                "Report Deleted",
                "The missing person record has been deleted successfully.",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      router.replace("/missing-person");
                    },
                  },
                ]
              );
            } catch (error: any) {
              console.error("Delete error:", error);

              Alert.alert(
                "Delete Failed",
                error.response?.data?.message ||
                  "Failed to delete the missing person record."
              );
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const formattedDate = person?.lastSeenDate
    ? new Date(person.lastSeenDate).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Not available";

  const formattedTime = person?.lastSeenDate
    ? new Date(person.lastSeenDate).toLocaleTimeString("en-ZA", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const isMissing = person?.status === "Missing";

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          backgroundColor="#F5F7F6"
          barStyle="dark-content"
        />

        <Header />

        <View style={styles.loader}>
          <View style={styles.loaderIcon}>
            <Ionicons
              name="person-search-outline"
              size={30}
              color="#002E15"
            />
          </View>

          <ActivityIndicator
            size="small"
            color="#002E15"
            style={styles.loaderSpinner}
          />

          <Text style={styles.loadingText}>
            Loading person details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!person) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          backgroundColor="#F5F7F6"
          barStyle="dark-content"
        />

        <Header />

        <View style={styles.notFound}>
          <View style={styles.notFoundIcon}>
            <Ionicons
              name="person-remove-outline"
              size={34}
              color="#002E15"
            />
          </View>

          <Text style={styles.notFoundTitle}>
            Person Not Found
          </Text>

          <Text style={styles.notFoundText}>
            This missing person record could not be found.
          </Text>

          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={19}
              color="#FFFFFF"
            />

            <Text style={styles.goBackText}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="#F5F7F6"
        barStyle="dark-content"
      />

      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* BACK */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <View style={styles.backIcon}>
            <Ionicons
              name="arrow-back"
              size={19}
              color="#002E15"
            />
          </View>

          <Text style={styles.backText}>
            Missing Persons
          </Text>
        </TouchableOpacity>

        {/* HERO */}
        <View style={styles.heroCard}>
          <View style={styles.heroImageWrapper}>
            {person.photo ? (
              <TouchableOpacity
                activeOpacity={0.95}
                onPress={() => setVisible(true)}
              >
                <Image
                  source={{ uri: person.photo }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />

                <View style={styles.expandButton}>
                  <Ionicons
                    name="expand-outline"
                    size={19}
                    color="#FFFFFF"
                  />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.heroPlaceholder}>
                <Ionicons
                  name="person-outline"
                  size={55}
                  color="#7D9184"
                />
              </View>
            )}
          </View>

          <View style={styles.heroInfo}>
            <View
              style={[
                styles.statusBadge,
                isMissing
                  ? styles.missingBadge
                  : styles.foundBadge,
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
                    ? styles.missingStatusText
                    : styles.foundStatusText,
                ]}
              >
                {person.status}
              </Text>
            </View>

            <Text style={styles.name}>
              {person.fullName}
            </Text>

            <Text style={styles.heroDescription}>
              {isMissing
                ? "This person has been reported missing."
                : "This person has been reported as found."}
            </Text>
          </View>
        </View>

        {/* QUICK INFORMATION */}
        <View style={styles.quickInfoCard}>
          <View style={styles.quickItem}>
            <View style={styles.quickIcon}>
              <Ionicons
                name="person-outline"
                size={18}
                color="#002E15"
              />
            </View>

            <Text style={styles.quickLabel}>
              Age
            </Text>

            <Text style={styles.quickValue}>
              {person.age}
            </Text>
          </View>

          <View style={styles.quickDivider} />

          <View style={styles.quickItem}>
            <View style={styles.quickIcon}>
              <Ionicons
                name="male-female-outline"
                size={18}
                color="#002E15"
              />
            </View>

            <Text style={styles.quickLabel}>
              Gender
            </Text>

            <Text
              numberOfLines={1}
              style={styles.quickValue}
            >
              {person.gender}
            </Text>
          </View>

          <View style={styles.quickDivider} />

          <View style={styles.quickItem}>
            <View style={styles.quickIcon}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color="#002E15"
              />
            </View>

            <Text style={styles.quickLabel}>
              Report
            </Text>

            <Text style={styles.quickValue}>
              {new Date(
                person.lastSeenDate
              ).toLocaleDateString("en-ZA", {
                day: "numeric",
                month: "short",
              })}
            </Text>
          </View>
        </View>

        {/* LAST SEEN */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons
                name="location"
                size={19}
                color="#002E15"
              />
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Last Seen
              </Text>

              <Text style={styles.sectionSubtitle}>
                Where and when they were last seen
              </Text>
            </View>
          </View>

          <View style={styles.locationBox}>
            <View style={styles.locationIcon}>
              <Ionicons
                name="location-outline"
                size={21}
                color="#002E15"
              />
            </View>

            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>
                Location
              </Text>

              <Text style={styles.locationValue}>
                {person.lastSeenLocation}
              </Text>
            </View>
          </View>

          <View style={styles.dateBox}>
            <View style={styles.dateIcon}>
              <Ionicons
                name="time-outline"
                size={20}
                color="#002E15"
              />
            </View>

            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>
                Date & Time
              </Text>

              <Text style={styles.locationValue}>
                {formattedDate}
                {formattedTime
                  ? ` • ${formattedTime}`
                  : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* DESCRIPTION */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons
                name="document-text-outline"
                size={19}
                color="#002E15"
              />
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Description
              </Text>

              <Text style={styles.sectionSubtitle}>
                Additional information
              </Text>
            </View>
          </View>

          <View style={styles.descriptionBox}>
            <Text style={styles.description}>
              {person.description?.trim() ||
                "No additional description was provided."}
            </Text>
          </View>
        </View>

        {/* REPORTER */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons
                name="person-circle-outline"
                size={20}
                color="#002E15"
              />
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Reported By
              </Text>

              <Text style={styles.sectionSubtitle}>
                Contact information for the reporter
              </Text>
            </View>
          </View>

          <View style={styles.reporterRow}>
            <View style={styles.reporterAvatar}>
              <Ionicons
                name="person"
                size={21}
                color="#002E15"
              />
            </View>

            <View style={styles.reporterInfo}>
              <Text style={styles.reporterName}>
                {person.contactName || "Not provided"}
              </Text>

              <Text style={styles.reporterLabel}>
                Reporter
              </Text>
            </View>
          </View>

          <View style={styles.phoneRow}>
            <View style={styles.phoneIcon}>
              <Ionicons
                name="call-outline"
                size={19}
                color="#002E15"
              />
            </View>

            <View style={styles.phoneContent}>
              <Text style={styles.phoneLabel}>
                Phone Number
              </Text>

              <Text style={styles.phoneNumber}>
                {person.contactNumber || "Not available"}
              </Text>
            </View>
          </View>
        </View>

        {/* CALL */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            !person.contactNumber &&
              styles.disabledButton,
          ]}
          onPress={callReporter}
          activeOpacity={0.85}
          disabled={!person.contactNumber}
        >
          <View style={styles.buttonIconCircle}>
            <Ionicons
              name="call"
              size={19}
              color="#002E15"
            />
          </View>

          <View style={styles.buttonContent}>
            <Text style={styles.primaryButtonTitle}>
              Call Reporter
            </Text>

            <Text style={styles.primaryButtonSubtitle}>
              Contact the person who submitted this report
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* REFRESH */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={refreshPerson}
          disabled={refreshing || updating}
          activeOpacity={0.85}
        >
          {refreshing ? (
            <ActivityIndicator
              size="small"
              color="#002E15"
            />
          ) : (
            <Ionicons
              name="refresh-outline"
              size={20}
              color="#002E15"
            />
          )}

          <Text style={styles.secondaryButtonText}>
            {refreshing
              ? "Refreshing Details..."
              : "Refresh Details"}
          </Text>
        </TouchableOpacity>

        {/* MARK FOUND */}
        {isMissing && (
          <TouchableOpacity
            style={styles.foundButton}
            onPress={markAsFound}
            disabled={updating}
            activeOpacity={0.85}
          >
            {updating ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Ionicons
                name="checkmark-circle-outline"
                size={21}
                color="#FFFFFF"
              />
            )}

            <Text style={styles.foundButtonText}>
              {updating
                ? "Updating..."
                : "Mark Person as Found"}
            </Text>
          </TouchableOpacity>
        )}

        {/* DELETE */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={deletePerson}
          disabled={updating}
          activeOpacity={0.85}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color="#C62828"
          />

          <Text style={styles.deleteButtonText}>
            Delete Record
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Please make sure the information is accurate before
          updating or deleting this report.
        </Text>
      </ScrollView>

      <ImageViewing
        images={
          person.photo
            ? [{ uri: person.photo }]
            : []
        }
        imageIndex={0}
        visible={visible}
        onRequestClose={() => setVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F6",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 45,
  },

  /* ---------------------------------------------------------------------- */
  /* LOADING                                                                */
  /* ---------------------------------------------------------------------- */

  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loaderIcon: {
    width: 70,
    height: 70,
    borderRadius: 23,
    backgroundColor: "#EAF4EC",
    alignItems: "center",
    justifyContent: "center",
  },

  loaderSpinner: {
    marginTop: 18,
  },

  loadingText: {
    marginTop: 10,
    color: "#7D857F",
    fontSize: 13,
  },

  /* ---------------------------------------------------------------------- */
  /* NOT FOUND                                                              */
  /* ---------------------------------------------------------------------- */

  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
  },

  notFoundIcon: {
    width: 78,
    height: 78,
    borderRadius: 26,
    backgroundColor: "#EAF4EC",
    alignItems: "center",
    justifyContent: "center",
  },

  notFoundTitle: {
    marginTop: 18,
    color: "#002E15",
    fontSize: 20,
    fontWeight: "800",
  },

  notFoundText: {
    marginTop: 7,
    color: "#7D857F",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },

  goBackButton: {
    marginTop: 22,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 15,
    backgroundColor: "#002E15",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  goBackText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  /* ---------------------------------------------------------------------- */
  /* BACK                                                                   */
  /* ---------------------------------------------------------------------- */

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  backIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E4E9E5",
  },

  backText: {
    marginLeft: 9,
    color: "#4D5750",
    fontSize: 13,
    fontWeight: "700",
  },

  /* ---------------------------------------------------------------------- */
  /* HERO                                                                   */
  /* ---------------------------------------------------------------------- */

  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",

    shadowColor: "#000",
    shadowOpacity: 0.055,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 3,
  },

  heroImageWrapper: {
    width: "100%",
    height: 280,
    backgroundColor: "#EAF0EC",
  },

  heroImage: {
    width: "100%",
    height: "100%",
  },

  heroPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF0EC",
  },

  expandButton: {
    position: "absolute",
    right: 14,
    bottom: 14,
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.62)",
    alignItems: "center",
    justifyContent: "center",
  },

  heroInfo: {
    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  missingBadge: {
    backgroundColor: "#FFF0F0",
  },

  foundBadge: {
    backgroundColor: "#EAF5EC",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  missingDot: {
    backgroundColor: "#D32F2F",
  },

  foundDot: {
    backgroundColor: "#2E7D32",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  missingStatusText: {
    color: "#C62828",
  },

  foundStatusText: {
    color: "#2E7D32",
  },

  name: {
    marginTop: 10,
    color: "#17201A",
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
  },

  heroDescription: {
    marginTop: 5,
    color: "#7A827C",
    fontSize: 12,
    lineHeight: 18,
  },

  /* ---------------------------------------------------------------------- */
  /* QUICK INFO                                                             */
  /* ---------------------------------------------------------------------- */

  quickInfoCard: {
    marginTop: 13,
    minHeight: 90,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#E7EBE8",
  },

  quickItem: {
    flex: 1,
    alignItems: "center",
  },

  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#EAF4EC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },

  quickLabel: {
    color: "#929A95",
    fontSize: 9,
    fontWeight: "600",
  },

  quickValue: {
    marginTop: 2,
    color: "#202522",
    fontSize: 12,
    fontWeight: "800",
  },

  quickDivider: {
    width: 1,
    height: 48,
    backgroundColor: "#E8ECE9",
  },

  /* ---------------------------------------------------------------------- */
  /* SECTION CARDS                                                          */
  /* ---------------------------------------------------------------------- */

  sectionCard: {
    marginTop: 13,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 17,

    borderWidth: 1,
    borderColor: "#E7EBE8",

    shadowColor: "#000",
    shadowOpacity: 0.035,
    shadowRadius: 9,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#EAF4EC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  sectionTitle: {
    color: "#002E15",
    fontSize: 15,
    fontWeight: "800",
  },

  sectionSubtitle: {
    marginTop: 2,
    color: "#929A95",
    fontSize: 10,
  },

  /* ---------------------------------------------------------------------- */
  /* LAST SEEN                                                              */
  /* ---------------------------------------------------------------------- */

  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F9F7",
    borderRadius: 15,
    padding: 12,
  },

  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F9F7",
    borderRadius: 15,
    padding: 12,
    marginTop: 9,
  },

  locationIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EAF4EC",
    alignItems: "center",
    justifyContent: "center",
  },

  dateIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EAF4EC",
    alignItems: "center",
    justifyContent: "center",
  },

  locationContent: {
    flex: 1,
    marginLeft: 11,
  },

  locationLabel: {
    color: "#929A95",
    fontSize: 9,
    fontWeight: "600",
  },

  locationValue: {
    marginTop: 3,
    color: "#29322D",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },

  /* ---------------------------------------------------------------------- */
  /* DESCRIPTION                                                            */
  /* ---------------------------------------------------------------------- */

  descriptionBox: {
    backgroundColor: "#F6F9F7",
    borderRadius: 15,
    padding: 14,
  },

  description: {
    color: "#56615A",
    fontSize: 13,
    lineHeight: 21,
  },

  /* ---------------------------------------------------------------------- */
  /* REPORTER                                                               */
  /* ---------------------------------------------------------------------- */

  reporterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1EF",
  },

  reporterAvatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#EAF4EC",
    alignItems: "center",
    justifyContent: "center",
  },

  reporterInfo: {
    marginLeft: 11,
  },

  reporterName: {
    color: "#202522",
    fontSize: 14,
    fontWeight: "800",
  },

  reporterLabel: {
    marginTop: 2,
    color: "#929A95",
    fontSize: 10,
  },

  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },

  phoneIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EAF4EC",
    alignItems: "center",
    justifyContent: "center",
  },

  phoneContent: {
    marginLeft: 11,
  },

  phoneLabel: {
    color: "#929A95",
    fontSize: 9,
    fontWeight: "600",
  },

  phoneNumber: {
    marginTop: 3,
    color: "#202522",
    fontSize: 13,
    fontWeight: "700",
  },

  /* ---------------------------------------------------------------------- */
  /* BUTTONS                                                                */
  /* ---------------------------------------------------------------------- */

  primaryButton: {
    minHeight: 70,
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: "#002E15",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.5,
  },

  buttonIconCircle: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#B4E0B7",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonContent: {
    flex: 1,
    marginHorizontal: 12,
  },

  primaryButtonTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  primaryButtonSubtitle: {
    marginTop: 3,
    color: "#B4E0B7",
    fontSize: 9,
    lineHeight: 13,
  },

  secondaryButton: {
    height: 52,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDE5DF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  secondaryButtonText: {
    marginLeft: 8,
    color: "#002E15",
    fontSize: 13,
    fontWeight: "700",
  },

  foundButton: {
    height: 54,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  foundButtonText: {
    marginLeft: 9,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  deleteButton: {
    height: 52,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FFDCDC",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  deleteButtonText: {
    marginLeft: 8,
    color: "#C62828",
    fontSize: 13,
    fontWeight: "800",
  },

  footerText: {
    marginTop: 18,
    paddingHorizontal: 20,
    color: "#9AA19C",
    fontSize: 9,
    lineHeight: 15,
    textAlign: "center",
  },
});

