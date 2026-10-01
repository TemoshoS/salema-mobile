import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "@/components/Header";
import CustomAlert from "@/components/CustomAlert";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STORAGE_KEY = "VOICE_EMERGENCY_PHRASES";
const MAX_PHRASES = 5;
const ENABLE_KEY = "VOICE_EMERGENCY_ENABLED";

type AlertType = "error" | "warning" | "success" | "info";

export default function VoiceEmergencySettingsScreen() {
  const [phrase, setPhrase] = useState("");
  const [phrases, setPhrases] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadSettings();
  }, []);

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

  const loadSettings = async () => {
    try {
      const savedPhrases = await AsyncStorage.getItem(STORAGE_KEY);
      const savedEnabled = await AsyncStorage.getItem(ENABLE_KEY);

      if (savedPhrases) {
        const parsed = JSON.parse(savedPhrases);

        if (Array.isArray(parsed)) {
          setPhrases(parsed);
        }
      } else {
        setPhrases(["salema help"]);
      }

      if (savedEnabled !== null) {
        setEnabled(savedEnabled === "true");
      }
    } catch (error) {
      console.log("Failed to load voice emergency settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    const value = phrase.trim().toLowerCase();

    if (!value) {
      showAlert({
        title: "Voice Command",
        message: "Please enter an emergency phrase.",
        type: "warning",
      });
      return;
    }

    if (value.split(/\s+/).length < 1) {
      showAlert({
        title: "Voice Command",
        message: "Please use at least one word for your emergency phrase.",
        type: "warning",
      });
      return;
    }

    if (phrases.includes(value)) {
      showAlert({
        title: "Already Added",
        message: "This emergency phrase has already been saved.",
        type: "info",
      });
      return;
    }

    if (phrases.length >= MAX_PHRASES) {
      showAlert({
        title: "Maximum Reached",
        message: "You can only save up to 5 emergency phrases.",
        type: "warning",
      });
      return;
    }

    const updated = [...phrases, value];

    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEY, JSON.stringify(updated)],
        [ENABLE_KEY, String(enabled)],
      ]);

      setPhrases(updated);
      setPhrase("");

      showAlert({
        title: "Phrase Added",
        message: "Your emergency phrase has been added successfully.",
        type: "success",
      });
    } catch (error) {
      console.log("Failed to save phrase:", error);

      showAlert({
        title: "Unable to Save",
        message: "Something went wrong while saving your emergency phrase.",
        type: "error",
      });
    }
  };

  const toggleVoiceEmergency = async (value: boolean) => {
    setEnabled(value);

    try {
      await AsyncStorage.setItem(ENABLE_KEY, String(value));
    } catch (error) {
      console.log("Failed to save voice emergency status:", error);

      setEnabled(!value);

      showAlert({
        title: "Unable to Update",
        message: "Your voice emergency setting could not be updated.",
        type: "error",
      });
    }
  };
const handleAlertConfirm = () => {
  const action = alert.onConfirm;

  closeAlert();

  action();
};

 const confirmDeletePhrase = (item: string) => {
  showAlert({
    title: "Delete Phrase?",
    message: `"${item}" will no longer trigger an emergency alert.`,
    type: "warning",
    confirmText: "Delete",
    cancelText: "Cancel",
    showCancel: true,
    onConfirm: () => {
      deletePhrase(item);
    },
  });
};

  const deletePhrase = async (item: string) => {
    const updated = phrases.filter((phraseItem) => phraseItem !== item);

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );

      setPhrases(updated);

      showAlert({
        title: "Phrase Deleted",
        message: "The emergency phrase has been removed.",
        type: "success",
      });
    } catch (error) {
      console.log("Failed to delete phrase:", error);

      showAlert({
        title: "Unable to Delete",
        message: "Something went wrong while deleting the phrase.",
        type: "error",
      });
    }
  };

  if (loading) return null;

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* PAGE HEADER */}

        <View style={styles.pageHeader}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="mic-outline"
              size={26}
              color="#002E15"
            />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.title}>
              Voice Emergency
            </Text>

            <Text style={styles.subtitle}>
              Trigger an emergency alert using a phrase you choose.
            </Text>
          </View>
        </View>


        {/* ADD PHRASE */}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Emergency Phrase
              </Text>

              <Text style={styles.sectionSubtitle}>
                Add a phrase that activates your emergency alert.
              </Text>
            </View>

            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {phrases.length}/{MAX_PHRASES}
              </Text>
            </View>
          </View>

          <View style={styles.inputCard}>
            

            <TextInput
              value={phrase}
              onChangeText={setPhrase}
              placeholder="e.g. Purple Banana"
              placeholderTextColor="#A2A9A4"
              autoCapitalize="words"
              style={styles.input}
              maxLength={50}
              returnKeyType="done"
              onSubmitEditing={save}
            />
          </View>

          <View style={styles.tipRow}>
         
            <Text style={styles.tip}>
              Choose something unique that people don't normally say.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.addButton,
              !phrase.trim() &&
                styles.addButtonDisabled,
            ]}
            onPress={save}
            activeOpacity={0.85}
            disabled={!phrase.trim()}
          >
            <Ionicons
              name="add"
              size={21}
              color="#FFFFFF"
            />

            <Text style={styles.addButtonText}>
              Add Emergency Phrase
            </Text>
          </TouchableOpacity>
        </View>

        {/* SAVED PHRASES */}

        <View style={styles.savedSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Saved Phrases
              </Text>

              <Text style={styles.sectionSubtitle}>
                These phrases can trigger an emergency alert.
              </Text>
            </View>
          </View>

          {phrases.length > 0 ? (
            <View style={styles.phrasesCard}>
              {phrases.map((item, index) => (
                <View
                  key={`${item}-${index}`}
                  style={[
                    styles.phraseRow,
                    index === phrases.length - 1 &&
                      styles.lastPhraseRow,
                  ]}
                >
                  <View style={styles.phraseIcon}>
                    <Ionicons
                      name="mic-outline"
                      size={18}
                      color="#002E15"
                    />
                  </View>

                  <View style={styles.phraseContent}>
                    <Text
                      style={styles.phraseText}
                      numberOfLines={2}
                    >
                      {item}
                    </Text>

                    <Text style={styles.phraseStatus}>
                      Voice emergency phrase
                    </Text>
                  </View>


                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() =>
                      confirmDeletePhrase(item)
                    }
                    activeOpacity={0.75}
                    hitSlop={{
                      top: 8,
                      bottom: 8,
                      left: 8,
                      right: 8,
                    }}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color="#D32F2F"
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="mic-off-outline"
                  size={25}
                  color="#002E15"
                />
              </View>

              <Text style={styles.emptyTitle}>
                No phrases added
              </Text>

              <Text style={styles.emptyText}>
                Add an emergency phrase above to get started.
              </Text>
            </View>
          )}
        </View>

        {/* INFO */}

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={21}
              color="#002E15"
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Use it when you need help
            </Text>

            <Text style={styles.infoText}>
              Say one of your saved phrases clearly to trigger
              your emergency alert.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* CUSTOM ALERT */}

     <CustomAlert
  visible={alert.visible}
  title={alert.title}
  message={alert.message}
  type={alert.type}
  confirmText={alert.confirmText}
  cancelText={alert.cancelText}
  showCancel={alert.showCancel}
  onConfirm={handleAlertConfirm}
  onCancel={closeAlert}
/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F6",
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
  },

  /* HEADER */

  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: "#E6F2E8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#002E15",
    letterSpacing: -0.4,
  },

  subtitle: {
    marginTop: 4,
    color: "#7A827C",
    fontSize: 12,
    lineHeight: 18,
  },

  /* STATUS */

  statusCard: {
    minHeight: 76,
    borderRadius: 19,
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },

  statusEnabled: {
    backgroundColor: "#EFF8F1",
    borderColor: "#D7EBDD",
  },

  statusDisabled: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E8E5",
  },

  statusIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  statusIconEnabled: {
    backgroundColor: "#DCEEDF",
  },

  statusIconDisabled: {
    backgroundColor: "#F0F2F1",
  },

  statusContent: {
    flex: 1,
  },

  statusTitle: {
    color: "#202522",
    fontSize: 14,
    fontWeight: "700",
  },

  statusSubtitle: {
    color: "#7C857F",
    fontSize: 10,
    marginTop: 3,
  },

  /* SECTIONS */

  section: {
    marginTop: 25,
  },

  savedSection: {
    marginTop: 30,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    color: "#002E15",
    fontSize: 17,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: "#8A928C",
    fontSize: 10,
    marginTop: 3,
    lineHeight: 15,
  },

  counter: {
    backgroundColor: "#E6F2E8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },

  counterText: {
    color: "#002E15",
    fontSize: 10,
    fontWeight: "800",
  },

  /* INPUT */

  inputCard: {
    height: 58,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E7E3",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  inputIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: "#EAF4EC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  input: {
    flex: 1,
    height: "100%",
    color: "#202522",
    fontSize: 14,
    fontWeight: "600",
  },

  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 9,
    paddingHorizontal: 2,
  },

  tip: {
    flex: 1,
    marginLeft: 6,
    color: "#7B847E",
    fontSize: 10,
    lineHeight: 15,
  },

  /* ADD BUTTON */

  addButton: {
    height: 52,
    backgroundColor: "#002E15",
    borderRadius: 15,
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#002E15",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 3,
  },

  addButtonDisabled: {
    opacity: 0.55,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 7,
  },

  /* PHRASES */

  phrasesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#E6EAE7",
  },

  phraseRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1EF",
  },

  lastPhraseRow: {
    borderBottomWidth: 0,
  },

  phraseIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: "#EAF4EC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  phraseContent: {
    flex: 1,
    minWidth: 0,
  },

  phraseText: {
    color: "#202522",
    fontSize: 13,
    fontWeight: "700",
  },

  phraseStatus: {
    color: "#929A95",
    fontSize: 9,
    marginTop: 3,
  },

  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAF5EC",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    marginLeft: 8,
  },

  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#2E7D32",
    marginRight: 4,
  },

  activeText: {
    color: "#2E7D32",
    fontSize: 8,
    fontWeight: "800",
  },

  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FFF1F1",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  /* EMPTY */

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    paddingVertical: 30,
    paddingHorizontal: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6EAE7",
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: "#EAF4EC",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 12,
    color: "#202522",
    fontSize: 14,
    fontWeight: "700",
  },

  emptyText: {
    marginTop: 4,
    color: "#929A95",
    fontSize: 10,
    textAlign: "center",
    lineHeight: 16,
  },

  /* INFO */

  infoCard: {
    marginTop: 25,
    backgroundColor: "#EAF4EC",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#D7EBDD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: "#002E15",
    fontSize: 12,
    fontWeight: "800",
  },

  infoText: {
    color: "#66736A",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 3,
  },
});