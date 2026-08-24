import AlertButton from "@/components/AlertButton";
import useShake from "@/hooks/useShake";
import useVoiceEmergency from "@/hooks/useVoiceEmergency";
import { showError, showInfo, showSuccess } from "@/utils/toast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    Vibration,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import { api } from "../config/api";
import { IMAGES } from "../constants/assets";

export default function Home() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState(false);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [relationship, setRelationship] = useState("");

    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editRelationship, setEditRelationship] = useState("");

  
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [voiceCommands, setVoiceCommands] = useState<string[]>([]);
  

    const [selectedContact, setSelectedContact] = useState<any>(null);
    const [viewModalVisible, setViewModalVisible] = useState(false);



    const [loadingAdd, setLoadingAdd] = useState(false);
    const [loadingUpdate, setLoadingUpdate] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [loadingList, setLoadingList] = useState(false);
    const [sendingSOS, setSendingSOS] = useState(false);
    const [iconState, setIconState] = useState<
        "inactive" | "activating" | "active"
    >("inactive");

    const sendSOS = useCallback(async () => {
        if (sendingSOS) return;
    
        try {
            setSendingSOS(true);
            setIconState("activating");
    
            const userId = await AsyncStorage.getItem("userId");
    
            if (!userId) {
                showError("User Not Found", "Please log in again.");
                setIconState("inactive");
                return;
            }
    
            // Get selected security company
            const securityCompanyId = await AsyncStorage.getItem(
                "selectedSecurityCompanyId"
            );

            const { status } =
                await Location.requestForegroundPermissionsAsync();
    
            if (status !== "granted") {
                showInfo(
                    "Location Permission",
                    "Please allow location access to send an SOS."
                );
    
                setIconState("inactive");
                return;
            }
    
            const location =
                await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });
    
            Vibration.vibrate([300, 200, 300]);
           
            // Send SOS with selected security company
            await api.post("/alerts/send", {
                userId,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                ...(securityCompanyId ? { securityCompanyId } : {}),
            });
    
            setIconState("active");
    
            showSuccess(
                "SOS Activated",
                "Emergency alert sent successfully."
            );
    
            setTimeout(() => {
                setIconState("inactive");
            }, 10000);
    
        } catch (error: any) {
            setIconState("inactive");
    
            showError(
                "SOS Failed",
                error.response?.data?.message ??
                "Unable to send SOS."
            );
    
        } finally {
            setSendingSOS(false);
        }
    }, [sendingSOS]);

    const {
        isListening,
        startListening,
        stopListening,
      } = useVoiceEmergency(sendSOS, {
        commands: voiceCommands,
      });


      useEffect(() => {
        if (voiceEnabled) {
          startListening();
        } else {
          stopListening();
        }
      
        return () => {
          stopListening();
        };
      }, [voiceEnabled, startListening, stopListening]);

      useEffect(() => {
        if (!voiceEnabled) return;
      
        const restart = async () => {
          await stopListening();
          await startListening();
        };
      
        restart();
      }, [voiceCommands]);
    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        try {
            setLoadingList(true);

            const userId = await AsyncStorage.getItem("userId");
            const res = await api.get(`/contacts/user/${userId}`);

            setContacts(res.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoadingList(false);
        }
    };


   

    useFocusEffect(
        useCallback(() => {
          const loadVoiceSettings = async () => {
            const saved =
              await AsyncStorage.getItem("VOICE_EMERGENCY_PHRASES");
      
            const enabled =
              (await AsyncStorage.getItem(
                "VOICE_EMERGENCY_ENABLED"
              )) === "true";
      
            const commands = saved
              ? JSON.parse(saved)
              : ["salema help"];
      
            setVoiceCommands(commands);
            setVoiceEnabled(enabled);
          };
      
          loadVoiceSettings();
        }, [])
      );

    useShake(() => {
        if (!sendingSOS) {
            sendSOS();
        }
    });

    const addContact = async () => {
        try {
            setLoadingAdd(true);

            const userId = await AsyncStorage.getItem("userId");

            await api.post("/contacts/add", {
                userId,
                name,
                phone,
                relationship,
            });
            showSuccess(
                "Contact Added",
                "Trusted contact saved successfully."
            );
            setModalVisible(false);
            setName("");
            setPhone("");
            setRelationship("");

            loadContacts();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                showError(
                    "Add Contact Failed",
                    error.response?.data?.message ||
                    "Unable to add contact."
                );
            } else {
                showError(
                    "Add Contact Failed",
                    "Something went wrong."
                );
            }

            console.log(error);
        } finally {
            setLoadingAdd(false);
        }
    };

    const deleteContact = async (id: string) => {
        try {
            setLoadingDelete(true);

            await api.delete(`/contacts/${id}`);
            showSuccess(
                "Contact Deleted",
                "Trusted contact removed successfully."
            );
            setViewModalVisible(false);
            loadContacts();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                showError(
                    "Delete Failed",
                    error.response?.data?.message ||
                    "Unable to delete contact."
                );
            } else {
                showError(
                    "Add Contact Failed",
                    "Something went wrong."
                );
            }

            console.log(error);
        } finally {
            setLoadingDelete(false);
        }
    };
    const confirmDelete = (id: string) => {
        Alert.alert(
            "Delete Contact",
            "Are you sure you want to delete this contact?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteContact(id),
                },
            ]
        );
    };

    const updateContact = async () => {
        try {
            setLoadingUpdate(true);

            await api.put(`/contacts/${selectedContact._id}`, {
                name: editName,
                phone: editPhone,
                relationship: editRelationship,
            });
            showSuccess(
                "Contact Updated",
                "Trusted contact updated successfully."
            );
            setViewModalVisible(false);
            loadContacts();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                showError(
                    "Update Contact Failed",
                    error.response?.data?.message ||
                    "Unable to update contact."
                );
            } else {
                showError(
                    "Add Contact Failed",
                    "Something went wrong."
                );
            }

            console.log(error);
        } finally {
            setLoadingUpdate(false);
        }
    };

    const Loader = () => (
        <View style={styles.loader}>
            <ActivityIndicator size="large" color="#002E15" />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Header />
            {sendingSOS && <Loader />}
            {/* ✅ SCROLL ADDED HERE */}
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    <Image source={IMAGES.no} style={{ width: 150, height: 150 }} />

                    <Text style={styles.message}>
                        Your safety just a shake away
                    </Text>

                    <Image
                        source={
                            iconState === "inactive"
                                ? IMAGES.inactive
                                : iconState === "activating"
                                    ? IMAGES.activating
                                    : IMAGES.mainIcon
                        }
                        style={styles.salemaIcon}
                    />

                    <Text style={styles.heading}>"Shake to Alert"</Text>

                    <Text style={styles.message}>
                        In an emergency, every second counts.
                    </Text>

                    <Image source={IMAGES.undraw} style={styles.salemaUndraw} />
                    <AlertButton onPress={sendSOS} loading={sendingSOS} />

                    {/* CARD */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Trusted Contacts</Text>

                        <FlatList
                            data={contacts}
                            keyExtractor={(item) => item._id}
                            numColumns={3}
                            scrollEnabled={false}   // ✅ IMPORTANT inside ScrollView
                            style={{ width: "100%" }}
                            contentContainerStyle={{ paddingVertical: 10 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.contactItem}
                                    onPress={() => {
                                        setSelectedContact(item);
                                        setEditName(item.name);
                                        setEditPhone(item.phone);
                                        setEditRelationship(item.relationship);
                                        setViewModalVisible(true);
                                    }}
                                >
                                    <Text style={styles.contactName}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />

                        {/* ADD BUTTON */}
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => setModalVisible(true)}
                        >
                            <Text style={styles.addButtonText}>
                                Add Contact
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* MODAL */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>
                            Add Trusted Contact
                        </Text>

                        <TextInput
                            placeholder="Name"
                            value={name}
                            onChangeText={setName}
                            style={styles.input}
                        />

                        <TextInput
                            placeholder="Phone"
                            value={phone}
                            onChangeText={setPhone}
                            style={styles.input}
                            keyboardType="phone-pad"
                        />

                        <TextInput
                            placeholder="Relationship"
                            value={relationship}
                            onChangeText={setRelationship}
                            style={styles.input}
                        />

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={addContact}
                            disabled={loadingAdd}
                        >
                            {loadingAdd ? <ActivityIndicator color="white" /> : <Text style={{ color: "white" }}>Save</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={{ color: "white" }}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Modal visible={viewModalVisible} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalBox}>

                        <Text style={styles.modalTitle}>Contact Details</Text>

                        {selectedContact && (
                            <>
                                <TextInput
                                    value={editName}
                                    onChangeText={setEditName}
                                    style={styles.input}
                                />

                                <TextInput
                                    value={editPhone}
                                    onChangeText={setEditPhone}
                                    style={styles.input}
                                />

                                <TextInput
                                    value={editRelationship}
                                    onChangeText={setEditRelationship}
                                    style={styles.input}
                                />



                                <TouchableOpacity
                                    style={[styles.saveButton, { backgroundColor: "#002E15" }]}
                                    onPress={updateContact}
                                    disabled={loadingUpdate}
                                >
                                    {loadingUpdate ? <ActivityIndicator color="white" /> : <Text style={{ color: "white" }}>Update</Text>}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.saveButton, { backgroundColor: "red" }]}
                                    onPress={() => confirmDelete(selectedContact._id)}
                                    disabled={loadingDelete}
                                >
                                    {loadingDelete ? <ActivityIndicator color="white" /> : <Text style={{ color: "white" }}>Delete</Text>}
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                            <Text style={{ marginTop: 10, color: "red", textAlign: "center" }}>
                                Close
                            </Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",

    },

    content: {
        flex: 1,
        alignItems: "center",
        paddingHorizontal: 16,
        // paddingTop: 10,
    },

    salemaIcon: {
        width: 80,
        height: 80,
        marginVertical: 30,
    },

    salemaUndraw: {
        width: 200,
        height: 200,
        marginTop: 10,
    },

    heading: {
        fontSize: 24,
        fontWeight: "bold",
        color: "black",
        textAlign: "center",
    },

    message: {
        fontSize: 16,
        color: "#555",
        textAlign: "center",
        marginVertical: 10,
    },

    card: {
        width: "100%",
        marginTop: 10,
        padding: 15,
        backgroundColor: "#002E15",
        borderRadius: 20,
        //alignItems: "center",
    },

    cardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "white",
        textAlign: "center"
    },
    contactItem: {
        flexBasis: "30%",
        flexGrow: 1,
        paddingVertical: 10,
        margin: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    contactName: {
        fontWeight: "bold",
        color: "#fff",

    },

    contactPhone: {
        color: "#fff",
    },

    emptyText: {
        color: "white",
        textAlign: "center",
        marginTop: 10,
    },
    addButton: {
        marginTop: 10,
        backgroundColor: "#b4e0b7",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: "center",
    },

    addButtonText: {
        color: "#002E15",

    },

    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        padding: 20,
    },

    modalBox: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 10,
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
    },

    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 10,
        marginTop: 10,
        borderRadius: 8,
    },

    saveButton: {
        backgroundColor: "#002E15",
        padding: 12,
        marginTop: 15,
        borderRadius: 8,
        alignItems: "center",
    },
    detailText: {
        fontSize: 16,
        marginVertical: 5,
        color: "#333",
    },
    loader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
    },
});