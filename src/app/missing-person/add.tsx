import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomAlert from "../../components/CustomAlert";
import Header from "../../components/Header";
import { api } from "../../config/api";

type AlertType =
  | "error"
  | "warning"
  | "success"
  | "info";

export default function AddMissingPerson() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  const [description, setDescription] = useState("");
  const [lastSeenLocation, setLastSeenLocation] =
    useState("");

  const [contactName, setContactName] = useState("");
  const [contactNumber, setContactNumber] =
    useState("");

  const [photo, setPhoto] = useState("");

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // Custom Alert
  const [alertVisible, setAlertVisible] =
    useState(false);

  const [alertTitle, setAlertTitle] =
    useState("");

  const [alertMessage, setAlertMessage] =
    useState("");

  const [alertType, setAlertType] =
    useState<AlertType>("info");

  const [alertConfirmText, setAlertConfirmText] =
    useState("OK");

  const [alertShowCancel, setAlertShowCancel] =
    useState(false);

  const [alertConfirmAction, setAlertConfirmAction] =
    useState<() => void>(() => {});

  const showAlert = ({
    title,
    message,
    type = "info",
    confirmText = "OK",
    showCancel = false,
    onConfirm,
  }: {
    title: string;
    message: string;
    type?: AlertType;
    confirmText?: string;
    showCancel?: boolean;
    onConfirm?: () => void;
  }) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertConfirmText(confirmText);
    setAlertShowCancel(showCancel);

    setAlertConfirmAction(() => () => {
      setAlertVisible(false);
      onConfirm?.();
    });

    setAlertVisible(true);
  };

  const closeAlert = () => {
    setAlertVisible(false);
  };

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showAlert({
          title: "Permission Required",
          message:
            "Please allow gallery access so you can add a photo of the missing person.",
          type: "warning",
          confirmText: "OK",
        });

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.9,
        });

      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.log(
        "Image picker error:",
        error
      );

      showAlert({
        title: "Unable to Select Photo",
        message:
          "We couldn't open your gallery. Please try again.",
        type: "error",
        confirmText: "OK",
      });
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      showAlert({
        title: "Missing Name",
        message:
          "Please enter the full name of the missing person.",
        type: "warning",
        confirmText: "OK",
      });

      return false;
    }

    if (!age.trim()) {
      showAlert({
        title: "Missing Age",
        message:
          "Please enter the age of the missing person.",
        type: "warning",
        confirmText: "OK",
      });

      return false;
    }

    const numericAge = Number(age);

    if (
      !Number.isInteger(numericAge) ||
      numericAge < 0 ||
      numericAge > 120
    ) {
      showAlert({
        title: "Invalid Age",
        message:
          "Please enter a valid age between 0 and 120.",
        type: "warning",
        confirmText: "OK",
      });

      return false;
    }

    if (!gender) {
      showAlert({
        title: "Gender Required",
        message:
          "Please select the gender of the missing person.",
        type: "warning",
        confirmText: "OK",
      });

      return false;
    }

    if (!description.trim()) {
      showAlert({
        title: "Description Required",
        message:
          "Please provide a description to help identify the missing person.",
        type: "warning",
        confirmText: "OK",
      });

      return false;
    }

    if (!lastSeenLocation.trim()) {
      showAlert({
        title: "Location Required",
        message:
          "Please enter where the person was last seen.",
        type: "warning",
        confirmText: "OK",
      });

      return false;
    }

    if (!contactName.trim()) {
      showAlert({
        title: "Reporter Name Required",
        message:
          "Please enter the name of the person reporting this case.",
        type: "warning",
        confirmText: "OK",
      });

      return false;
    }

    if (!contactNumber.trim()) {
      showAlert({
        title: "Phone Number Required",
        message:
          "Please enter a contact number for the reporter.",
        type: "warning",
        confirmText: "OK",
      });

      return false;
    }

    return true;
  };

  const submit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const reportedBy =
        await AsyncStorage.getItem("userId");

      if (!reportedBy) {
        showAlert({
          title: "Session Expired",
          message:
            "We couldn't identify your account. Please log in again.",
          type: "error",
          confirmText: "Go to Login",
          onConfirm: () =>
            router.replace("/login"),
        });

        return;
      }

      await api.post("/missing-person", {
        reportedBy,
        fullName: fullName.trim(),
        age: Number(age),
        gender,
        description: description.trim(),
        lastSeenLocation:
          lastSeenLocation.trim(),
        lastSeenDate: date,
        contactName: contactName.trim(),
        contactNumber: contactNumber.trim(),
        photo,
      });

      showAlert({
        title: "Report Submitted",
        message:
          "The missing person report has been submitted successfully.",
        type: "success",
        confirmText: "View Reports",
        onConfirm: () =>
          router.replace("/missing-person"),
      });
    } catch (error: any) {
      console.log(
        "Missing person error:",
        error?.response?.data || error
      );

      showAlert({
        title: "Submission Failed",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to submit the missing person report. Please try again.",
        type: "error",
        confirmText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value: Date) => {
    return value.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
      

        {/* PHOTO */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Photo
          </Text>

          <Text style={styles.sectionSubtitle}>
            Add a recent photo if available
          </Text>
        </View>

        <TouchableOpacity
          style={styles.photoCard}
          onPress={pickImage}
          activeOpacity={0.85}
        >
          {photo ? (
            <>
              <Image
                source={{ uri: photo }}
                style={styles.photo}
              />

              <View style={styles.changePhotoButton}>
                <Ionicons
                  name="camera-outline"
                  size={16}
                  color="#FFFFFF"
                />

                <Text style={styles.changePhotoText}>
                  Change Photo
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.photoIcon}>
                <Ionicons
                  name="camera-outline"
                  size={32}
                  color="#002E15"
                />
              </View>

              <Text style={styles.photoTitle}>
                Add Photo
              </Text>

              <Text style={styles.photoSubtitle}>
                Tap to choose a photo
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* PERSON DETAILS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Person Details
          </Text>

          <Text style={styles.sectionSubtitle}>
            Information about the missing person
          </Text>
        </View>

        <View style={styles.formCard}>
          {/* NAME */}
          <FieldLabel
            icon="person-outline"
            label="Full Name"
            required
          />

          <Input
            icon="person-outline"
            placeholder="Enter full name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          {/* AGE */}
          <FieldLabel
            icon="calendar-outline"
            label="Age"
            required
          />

          <Input
            icon="calendar-outline"
            placeholder="Enter age"
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            maxLength={3}
          />

          {/* GENDER */}
          <FieldLabel
            icon="male-female-outline"
            label="Gender"
            required
          />

          <View style={styles.pickerContainer}>
            <Ionicons
              name="male-female-outline"
              size={20}
              color="#7D857F"
              style={styles.pickerIcon}
            />

            <Picker
              selectedValue={gender}
              onValueChange={(itemValue) =>
                setGender(itemValue)
              }
              style={styles.picker}
              dropdownIconColor="#002E15"
            >
              <Picker.Item
                label="Select gender"
                value=""
              />

              <Picker.Item
                label="Male"
                value="Male"
              />

              <Picker.Item
                label="Female"
                value="Female"
              />

              <Picker.Item
                label="Other"
                value="Other"
              />
            </Picker>
          </View>

          {/* DESCRIPTION */}
          <FieldLabel
            icon="document-text-outline"
            label="Description"
            required
          />

          <View
            style={[
              styles.textAreaContainer,
              styles.descriptionContainer,
            ]}
          >
            <Ionicons
              name="document-text-outline"
              size={20}
              color="#7D857F"
              style={styles.textAreaIcon}
            />

            <TextInput
              placeholder="Clothing, height, hair, identifying marks..."
              placeholderTextColor="#A5ACA7"
              multiline
              textAlignVertical="top"
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              maxLength={500}
            />
          </View>

          <Text style={styles.characterCount}>
            {description.length}/500
          </Text>
        </View>

        {/* LAST SEEN */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Last Seen
          </Text>

          <Text style={styles.sectionSubtitle}>
            Where and when they were last seen
          </Text>
        </View>

        <View style={styles.formCard}>
          <FieldLabel
            icon="location-outline"
            label="Last Seen Location"
            required
          />

          <Input
            icon="location-outline"
            placeholder="Enter location"
            value={lastSeenLocation}
            onChangeText={setLastSeenLocation}
          />

          <FieldLabel
            icon="calendar-outline"
            label="Last Seen Date"
            required
          />

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.8}
          >
            <View style={styles.dateIcon}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#002E15"
              />
            </View>

            <View style={styles.dateContent}>
              <Text style={styles.dateLabel}>
                Last seen on
              </Text>

              <Text style={styles.dateValue}>
                {formatDate(date)}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#7D857F"
            />
          </TouchableOpacity>

          {showPicker && (
            <View style={styles.pickerWrapper}>
              <DateTimePicker
                value={date}
                mode="date"
                maximumDate={new Date()}
                display={
                  Platform.OS === "ios"
                    ? "spinner"
                    : "default"
                }
                onChange={(
                  event,
                  selectedDate
                ) => {
                  setShowPicker(false);

                  if (selectedDate) {
                    setDate(selectedDate);
                  }
                }}
              />
            </View>
          )}
        </View>

        {/* REPORTER */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Reporter Details
          </Text>

          <Text style={styles.sectionSubtitle}>
            How we can contact you about this report
          </Text>
        </View>

        <View style={styles.formCard}>
          <FieldLabel
            icon="person-outline"
            label="Reporter Name"
            required
          />

          <Input
            icon="person-outline"
            placeholder="Enter reporter name"
            value={contactName}
            onChangeText={setContactName}
            autoCapitalize="words"
          />

          <FieldLabel
            icon="call-outline"
            label="Reporter Phone"
            required
          />

          <Input
            icon="call-outline"
            placeholder="Enter phone number"
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
          />
        </View>

        {/* SUBMIT */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            loading && styles.submitButtonDisabled,
          ]}
          onPress={submit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <>
              <ActivityIndicator
                color="#FFFFFF"
                size="small"
              />

              <Text style={styles.submitText}>
                Submitting Report...
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="send-outline"
                size={21}
                color="#FFFFFF"
              />

              <Text style={styles.submitText}>
                Submit Report
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomNotice}>
          <Ionicons
            name="shield-checkmark-outline"
            size={17}
            color="#7D857F"
          />

          <Text style={styles.bottomNoticeText}>
            Please make sure the information provided
            is accurate before submitting.
          </Text>
        </View>
      </ScrollView>

      {/* CUSTOM ALERT */}
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        confirmText={alertConfirmText}
        showCancel={alertShowCancel}
        onConfirm={alertConfirmAction}
        onCancel={closeAlert}
      />
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/* FIELD LABEL                                                                */
/* -------------------------------------------------------------------------- */

function FieldLabel({
  icon,
  label,
  required = false,
}: {
  icon: any;
  label: string;
  required?: boolean;
}) {
  return (
    <View style={styles.fieldLabel}>
      <Ionicons
        name={icon}
        size={17}
        color="#002E15"
      />

      <Text style={styles.labelText}>
        {label}
      </Text>

      {required && (
        <Text style={styles.required}>
          *
        </Text>
      )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* INPUT                                                                      */
/* -------------------------------------------------------------------------- */

function Input({
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
  maxLength,
}: {
  icon: any;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: any;
  autoCapitalize?: any;
  maxLength?: number;
}) {
  return (
    <View style={styles.inputContainer}>
      <Ionicons
        name={icon}
        size={20}
        color="#7D857F"
      />

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#A5ACA7"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={
          autoCapitalize || "none"
        }
        maxLength={maxLength}
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F6",
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 45,
  },

  /* HEADER */

  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  pageHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#EAF4EC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 23,
    fontWeight: "700",
    color: "#002E15",
  },

  subtitle: {
    fontSize: 12,
    color: "#8A8F8B",
    marginTop: 3,
  },

  /* NOTICE */

  notice: {
    flexDirection: "row",
    backgroundColor: "#EAF4EC",
    borderRadius: 17,
    padding: 14,
    marginBottom: 24,
  },

  noticeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  noticeContent: {
    flex: 1,
    marginLeft: 11,
  },

  noticeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#002E15",
  },

  noticeText: {
    fontSize: 11,
    lineHeight: 17,
    color: "#667069",
    marginTop: 3,
  },

  /* SECTIONS */

  sectionHeader: {
    marginBottom: 10,
    paddingHorizontal: 3,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#002E15",
  },

  sectionSubtitle: {
    fontSize: 11,
    color: "#8A8F8B",
    marginTop: 3,
  },

  /* PHOTO */

  photoCard: {
    height: 205,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E1E7E2",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 25,
  },

  photo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  photoIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#EAF4EC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  photoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#002E15",
  },

  photoSubtitle: {
    fontSize: 11,
    color: "#8A8F8B",
    marginTop: 3,
  },

  changePhotoButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,46,21,0.9)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  changePhotoText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 5,
  },

  /* FORM */

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 17,
    borderWidth: 1,
    borderColor: "#E7EBE8",
    marginBottom: 25,
  },

  fieldLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  labelText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#39413C",
    marginLeft: 7,
  },

  required: {
    color: "#D32F2F",
    fontSize: 14,
    marginLeft: 3,
  },

  inputContainer: {
    minHeight: 53,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFBFA",
    borderWidth: 1,
    borderColor: "#DDE5DF",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 19,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: "#202522",
    marginLeft: 10,
    paddingVertical: 0,
  },

  /* PICKER */

  pickerContainer: {
    height: 53,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFBFA",
    borderWidth: 1,
    borderColor: "#DDE5DF",
    borderRadius: 14,
    marginBottom: 19,
    overflow: "hidden",
  },

  pickerIcon: {
    marginLeft: 14,
  },

  picker: {
    flex: 1,
    height: 53,
    color: "#202522",
    marginLeft: 3,
  },

  /* DESCRIPTION */

  descriptionContainer: {
    minHeight: 125,
    alignItems: "flex-start",
    paddingTop: 14,
  },

  textAreaContainer: {
    flexDirection: "row",
    backgroundColor: "#FAFBFA",
    borderWidth: 1,
    borderColor: "#DDE5DF",
    borderRadius: 14,
    paddingHorizontal: 14,
  },

  textAreaIcon: {
    marginTop: 2,
  },

  textArea: {
    flex: 1,
    minHeight: 95,
    fontSize: 14,
    color: "#202522",
    marginLeft: 10,
    paddingTop: 0,
  },

  characterCount: {
    textAlign: "right",
    color: "#9AA19C",
    fontSize: 10,
    marginTop: -13,
    marginBottom: 3,
  },

  /* DATE */

  dateButton: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFBFA",
    borderWidth: 1,
    borderColor: "#DDE5DF",
    borderRadius: 14,
    paddingHorizontal: 10,
    marginBottom: 3,
  },

  dateIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EAF4EC",
    justifyContent: "center",
    alignItems: "center",
  },

  dateContent: {
    flex: 1,
    marginLeft: 11,
  },

  dateLabel: {
    fontSize: 10,
    color: "#8A8F8B",
    marginBottom: 2,
  },

  dateValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#202522",
  },

  pickerWrapper: {
    alignItems: "center",
    marginTop: 10,
  },

  /* SUBMIT */

  submitButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#002E15",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -5,
  },

  submitButtonDisabled: {
    opacity: 0.7,
  },

  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 9,
  },

  /* BOTTOM */

  bottomNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: 18,
  },

  bottomNoticeText: {
    flex: 1,
    textAlign: "center",
    color: "#8A8F8B",
    fontSize: 10,
    lineHeight: 16,
    marginLeft: 7,
  },
});

