import Header from "@/components/Header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Alert,

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

export default function VoiceEmergencySettingsScreen() {
  const [phrase, setPhrase] = useState("");
const [phrases, setPhrases] = useState<string[]>([]);

  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedPhrases = await AsyncStorage.getItem(STORAGE_KEY);
      const savedEnabled = await AsyncStorage.getItem(ENABLE_KEY);
  
      if (savedPhrases) {
        setPhrases(JSON.parse(savedPhrases));
      } else {
        setPhrases(["salema help"]);
      }
  
      if (savedEnabled !== null) {
        setEnabled(savedEnabled === "true");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  const save = async () => {
    const value = phrase.trim().toLowerCase();
  
    if (!value) {
      Alert.alert("Voice Command", "Please enter an emergency phrase.");
      return;
    }
  
    if (value.split(" ").length < 1) {
      Alert.alert(
        "Voice Command",
        "Use at least two words."
      );
      return;
    }
  
    if (phrases.includes(value)) {
      Alert.alert("Voice Command", "Phrase already exists.");
      return;
    }
  
    if (phrases.length >= MAX_PHRASES) {
      Alert.alert("Maximum Reached", "You can only save 5 phrases.");
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
  
      Alert.alert("Success", "Phrase added.");
    } catch {
      Alert.alert("Error", "Unable to save settings.");
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
        <Text style={styles.title}>Voice Emergency</Text>
  
        <Text style={styles.subtitle}>
          Choose a phrase that will trigger an emergency alert when spoken.
        </Text>
  
        <View style={styles.card}>
          <Text style={styles.label}>Emergency Phrase</Text>
  
          <TextInput
            value={phrase}
            onChangeText={setPhrase}
            placeholder="e.g. Purple Banana"
            autoCapitalize="words"
            style={styles.input}
            maxLength={50}
          />
  
          <Text style={styles.tip}>
            Use something unique that people don't normally say.
          </Text>
        </View>
  
        <View style={styles.switchCard}>
          <Text style={styles.label}>Enable Voice Emergency</Text>
  
          <Switch
            value={enabled}
            onValueChange={setEnabled}
          />
        </View>
  
        <TouchableOpacity style={styles.button} onPress={save}>
          <Text style={styles.buttonText}>Save Settings</Text>
        </TouchableOpacity>
  
        <View style={styles.examples}>
          <Text style={styles.examplesTitle}>
            Saved Emergency Phrases
          </Text>
  
          {phrases.map((item, index) => (
            <View
              key={index}
              style={{
                backgroundColor: "#fff",
                padding: 12,
                borderRadius: 10,
                marginBottom: 10,
              }}
            >
              <Text>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
    padding: 20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
  },

  subtitle: {
    marginTop: 10,
    color: "#666",
    lineHeight: 22,
  },

  card: {
    marginTop: 25,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },

  tip: {
    marginTop: 12,
    color: "#888",
    fontSize: 13,
  },

  switchCard: {
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  button: {
    marginTop: 30,
    height: 55,
    backgroundColor: "#D32F2F",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
  },

  examples: {
    marginTop: 35,
  },

  examplesTitle: {
    fontWeight: "700",
    marginBottom: 10,
  },

  example: {
    color: "#666",
    marginBottom: 6,
  },
});