import { api } from "@/config/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditOfficerScreen() {
  const router = useRouter();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] =
    useState("");
  const [idNumber, setIdNumber] =
    useState("");
  const [psiraNumber, setPsiraNumber] =
    useState("");
  const [rank, setRank] = useState("");

  useEffect(() => {
    loadOfficer();
  }, []);

  const loadOfficer = async () => {
    try {
      const token =
        await AsyncStorage.getItem(
          "companyToken"
        );

      const res = await api.get(
        `/security-company/officers/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const officer = res.data;

      setFirstName(officer.firstName);
      setLastName(officer.lastName);
      setEmail(officer.email);
      setPhoneNumber(officer.phoneNumber);
      setIdNumber(officer.idNumber);
      setPsiraNumber(officer.psiraNumber);
      setRank(officer.rank);
    } catch (err) {
      Alert.alert(
        "Error",
        "Unable to load officer."
      );

      router.back();
    } finally {
      setLoading(false);
    }
  };
  const updateOfficer = async () => {
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phoneNumber ||
      !idNumber ||
      !psiraNumber ||
      !rank
    ) {
      return Alert.alert(
        "Validation",
        "Please complete all fields."
      );
    }

    try {
      setSaving(true);

      const token = await AsyncStorage.getItem(
        "companyToken"
      );

      await api.put(
        `/security-company/officers/${id}`,
        {
          firstName,
          lastName,
          email,
          phoneNumber,
          idNumber,
          psiraNumber,
          rank,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert(
        "Success",
        "Officer updated successfully.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err) {
      console.log(err);

      Alert.alert(
        "Error",
        "Failed to update officer."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator
          size="large"
          color="#002E15"
        />

        <Text
          style={{
            marginTop: 15,
            color: "#666",
          }}
        >
          Loading officer...
        </Text>
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
          Edit Officer
        </Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.card}>
          <Text style={styles.title}>
            Update Officer
          </Text>

          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
          />

          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
          />

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phoneNumber}
            keyboardType="phone-pad"
            onChangeText={setPhoneNumber}
          />

          <TextInput
            style={styles.input}
            placeholder="ID Number"
            value={idNumber}
            onChangeText={setIdNumber}
          />

          <TextInput
            style={styles.input}
            placeholder="PSIRA Number"
            value={psiraNumber}
            onChangeText={setPsiraNumber}
          />

          <TextInput
            style={styles.input}
            placeholder="Rank"
            value={rank}
            onChangeText={setRank}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={updateOfficer}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="save-outline"
                  size={20}
                  color="#fff"
                />

                <Text style={styles.buttonText}>
                  Save Changes
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
      backgroundColor: "#EEF6F3",
    },
  
    header: {
      backgroundColor: "#002E15",
      paddingHorizontal: 20,
      paddingVertical: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      elevation: 6,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 4,
      },
    },
  
    headerTitle: {
      color: "#fff",
      fontSize: 21,
      fontWeight: "700",
    },
  
    content: {
      padding: 20,
      paddingBottom: 40,
    },
  
    card: {
      backgroundColor: "#fff",
      borderRadius: 24,
      padding: 22,
      elevation: 4,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: {
        width: 0,
        height: 4,
      },
    },
  
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: "#002E15",
      marginBottom: 24,
      textAlign: "center",
    },
  
    input: {
      height: 56,
      backgroundColor: "#F8FAFC",
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderRadius: 14,
      paddingHorizontal: 16,
      fontSize: 16,
      color: "#111827",
      marginBottom: 16,
    },
  
    button: {
      marginTop: 10,
      backgroundColor: "#002E15",
      height: 58,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
      elevation: 3,
    },
  
    buttonText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "700",
      marginLeft: 10,
    },
  });