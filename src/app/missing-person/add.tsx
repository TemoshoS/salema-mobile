import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import { api } from "../../config/api";
export default function AddMissingPerson() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");



  const [description, setDescription] = useState("");
  const [lastSeenLocation, setLastSeenLocation] = useState("");

  const [contactName, setContactName] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const [photo, setPhoto] = useState("");

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
  
      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Please allow gallery access."
        );
        return;
      }
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 1,
        legacy: true,
      });
  
      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
      }
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Unable to open gallery.");
    }
  };

  const submit = async () => {
    try {
      if (!gender) {
        Alert.alert("Validation", "Please select a gender.");
        return;
      }
      setLoading(true);

      const reportedBy = await AsyncStorage.getItem("userId");

      await api.post("/missing-person", {
        reportedBy,
        fullName,
        age: Number(age),
        gender,
        description,
        lastSeenLocation,
        lastSeenDate: date,
        contactName,
        contactNumber,
        photo,
      });

      Alert.alert(
        "Success",
        "Missing person reported successfully."
      );

      router.replace("/missing-person");

    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.photoButton}
          onPress={pickImage}
        >
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={styles.photo}
            />
          ) : (
            <Text>Select Photo</Text>
          )}
        </TouchableOpacity>

        <TextInput
          placeholder="Full Name"
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
        />

        <TextInput
          placeholder="Age"
          keyboardType="numeric"
          style={styles.input}
          value={age}
          onChangeText={setAge}
        />


<View style={styles.pickerContainer}>
  <Picker
    selectedValue={gender}
    onValueChange={(itemValue) => setGender(itemValue)}
  >
    <Picker.Item label="Select Gender" value="" />
    <Picker.Item label="Male" value="Male" />
    <Picker.Item label="Female" value="Female" />
    <Picker.Item label="Other" value="Other" />
  </Picker>
</View>


        <TextInput
          placeholder="Description (Clothing, height, identifying marks...)"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={[styles.input, { height: 120 }]}
          value={description}
          onChangeText={setDescription}
        />

        <TextInput
          placeholder="Last Seen Location"
          style={styles.input}
          value={lastSeenLocation}
          onChangeText={setLastSeenLocation}
        />

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowPicker(true)}
        >
          <Text>
            Last Seen: {date.toDateString()}
          </Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            onChange={(e, selectedDate) => {
              setShowPicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        <TextInput
          placeholder="Reporter Name"
          style={styles.input}
          value={contactName}
          onChangeText={setContactName}
        />

        <TextInput
          placeholder="Reporter Phone"
          keyboardType="phone-pad"
          style={styles.input}
          value={contactNumber}
          onChangeText={setContactNumber}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              Submit Report
            </Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
  },
  photoButton: {
    alignSelf: "center",
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 12,
    overflow: "hidden",
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#002E15",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});