import { IMAGES } from "@/constants/assets";
import { showError, showInfo, showSuccess } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../config/api";

export default function SecurityCompanyRegisterScreen() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [form, setForm] = useState({
        companyName: "",
        email: "",
        phoneNumber: "",
        psiraCompanyNumber: "",
        registrationNumber: "",
        address: "",
        contactPerson: "",
        password: "",
        confirmPassword: "",
    });

    const handleChange = (
        key: keyof typeof form,
        value: string
    ) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const phoneRegex =
        /^(?:\+27|0)[6-8][0-9]{8}$/;

    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,}$/;

    const register = async () => {
        if (
            !form.companyName.trim() ||
            !form.email.trim() ||
            !form.phoneNumber.trim() ||
            !form.psiraCompanyNumber.trim() ||
            !form.registrationNumber.trim() ||
            !form.address.trim() ||
            !form.contactPerson.trim() ||
            !form.password ||
            !form.confirmPassword
        ) {
            showInfo(
                "Incomplete Form",
                "Please complete all fields."
            );
            return;
        }

        if (!emailRegex.test(form.email.trim())) {
            showError(
                "Invalid Email",
                "Please enter a valid email address."
            );
            return;
        }

        if (!phoneRegex.test(form.phoneNumber.trim())) {
            showError(
                "Invalid Phone Number",
                "Please enter a valid South African phone number."
            );
            return;
        }

        if (!passwordRegex.test(form.password)) {
            showError(
                "Weak Password",
                "Password must contain at least 8 characters, an uppercase letter, a lowercase letter, a number and a special character."
            );
            return;
        }

        if (form.password !== form.confirmPassword) {
            showError(
                "Password Mismatch",
                "Passwords do not match."
            );
            return;
        }

        try {
            setLoading(true);

            const res = await api.post(
                "/security-company/register",
                form
            );

            showSuccess(
                "Registration Successful",
                res.data.message
            );

            setTimeout(() => {
                router.replace("/security-company/login");
            }, 1500);

        } catch (error: any) {
            showError(
                "Registration Failed",
                error.response?.data?.message ||
                "Unable to create security company account."
            );
        } finally {
            setLoading(false);
        }
    };
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.logoCircle}>
                    <Image
                        source={IMAGES.logo}
                        style={{
                            width: 100,
                            height: 100,
                            tintColor: "#fff",
                        }}
                        resizeMode="contain"
                    />
                </View>

                <Text style={styles.title}>Security Company Registration</Text>

                <Text style={styles.subtitle}>
                    Register your security company to manage officers,
                    branches and emergency responses.
                </Text>

                <View style={styles.card}>
                    {/* Company Name */}
                    <Text style={styles.label}>Company Name</Text>

                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="business-outline"
                            size={22}
                            color="#666"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Enter Company name"
                            placeholderTextColor="#999"
                            value={form.companyName}
                            onChangeText={(v) =>
                                handleChange("companyName", v)
                            }
                        />
                    </View>

                    {/* Email */}
                    <Text style={styles.label}>Email Address</Text>

                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="mail-outline"
                            size={22}
                            color="#666"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Enter email"
                            placeholderTextColor="#999"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={form.email}
                            onChangeText={(v) =>
                                handleChange("email", v)
                            }
                        />
                    </View>

                    {/* Phone */}
                    <Text style={styles.label}>Phone Number</Text>

                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="call-outline"
                            size={22}
                            color="#666"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Enter phone number"
                            placeholderTextColor="#999"
                            keyboardType="phone-pad"
                            value={form.phoneNumber}
                            onChangeText={(v) =>
                                handleChange("phoneNumber", v)
                            }
                        />
                    </View>


                    {/* PSIRA */}
                    <Text style={styles.label}>PSIRA Number</Text>

                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="shield-checkmark-outline"
                            size={22}
                            color="#666"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="PSIRA Company Number"
                            placeholderTextColor="#999"
                            autoCapitalize="characters"
                            value={form.psiraCompanyNumber}
                            onChangeText={(v) =>
                                handleChange("psiraCompanyNumber", v)
                            }
                        />
                    </View>

                    {/* Registration Number */}
                    <Text style={styles.label}>Registration Number</Text>

                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="card-outline"
                            size={22}
                            color="#666"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Registration number"
                            placeholderTextColor="#999"
                            value={form.registrationNumber}
                            onChangeText={(v) =>
                                handleChange("registrationNumber", v)
                            }
                        />
                    </View>


                    {/* Address */}
                    <Text style={styles.label}>Address</Text>

                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="home-outline"
                            size={22}
                            color="#666"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Company address"
                            placeholderTextColor="#999"
                            value={form.address}
                            onChangeText={(v) =>
                                handleChange("address", v)
                            }
                        />
                    </View>

                    {/* Contact Person*/}
                    <Text style={styles.label}>Contact Person</Text>

                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="person-circle-outline"
                            size={22}
                            color="#666"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Contact Person"
                            placeholderTextColor="#999"
                            value={form.contactPerson}
                            onChangeText={(v) =>
                                handleChange("contactPerson", v)
                            }
                        />
                    </View>


                    {/* Password */}
                    <Text style={styles.label}>Password</Text>

                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={22}
                            color="#666"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Create password"
                            placeholderTextColor="#999"
                            secureTextEntry={!showPassword}
                            value={form.password}
                            onChangeText={(v) =>
                                handleChange("password", v)
                            }
                        />

                        <TouchableOpacity
                            onPress={() =>
                                setShowPassword(!showPassword)
                            }
                        >
                            <Ionicons
                                name={
                                    showPassword
                                        ? "eye-off-outline"
                                        : "eye-outline"
                                }
                                size={22}
                                color="#666"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Confirm Password */}
                    <Text style={styles.label}>
                        Confirm Password
                    </Text>

                    <View style={styles.inputContainer}>
                        <Ionicons
                            name="lock-closed-outline"
                            size={22}
                            color="#666"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Confirm password"
                            placeholderTextColor="#999"
                            secureTextEntry={!showConfirmPassword}
                            value={form.confirmPassword}
                            onChangeText={(v) =>
                                handleChange(
                                    "confirmPassword",
                                    v
                                )
                            }
                        />

                        <TouchableOpacity
                            onPress={() =>
                                setShowConfirmPassword(
                                    !showConfirmPassword
                                )
                            }
                        >
                            <Ionicons
                                name={
                                    showConfirmPassword
                                        ? "eye-off-outline"
                                        : "eye-outline"
                                }
                                size={22}
                                color="#666"
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={register}
                    >
                        <Text style={styles.buttonText}>
                            Register Security Company
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Already have a company account?
                    </Text>

                    <TouchableOpacity
                        onPress={() =>
                            router.replace("/security-company/login")
                        }
                    >
                        <Text style={styles.signup}>
                            Sign In
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.bottomText}>
                    Verified PSIRA security companies only.
                </Text>
            </ScrollView>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingBox}>
                        <ActivityIndicator
                            size="large"
                            color="#002E15"
                        />

                        <Text style={styles.loadingText}>
                            Creating company account...
                        </Text>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#EEF6F3",
    },

    content: {
        padding: 22,
        paddingBottom: 40,
    },

    logoCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: "#002E15",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        marginBottom: 18,
    },

    title: {
        fontSize: 30,
        fontWeight: "700",
        color: "#002E15",
        textAlign: "center",
    },

    subtitle: {
        textAlign: "center",
        color: "#666",
        marginTop: 8,
        marginBottom: 28,
        fontSize: 15,
        lineHeight: 22,
    },

    card: {
        backgroundColor: "#fff",
        borderRadius: 22,
        padding: 20,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 3,
        },
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 14,
        backgroundColor: "#fff",
        marginBottom: 18,
        overflow: "hidden",
    },

    picker: {
        color: "#222",
    },

    label: {
        marginBottom: 8,
        marginTop: 12,
        fontWeight: "600",
        color: "#444",
        fontSize: 15,
    },

    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        height: 56,
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 14,
        paddingHorizontal: 15,
        backgroundColor: "#fff",
    },

    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: "#222",
    },

    button: {
        marginTop: 25,
        height: 56,
        borderRadius: 14,
        backgroundColor: "#002E15",
        justifyContent: "center",
        alignItems: "center",
    },

    buttonText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "700",
    },

    footer: {
        marginTop: 30,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },

    footerText: {
        color: "#666",
        fontSize: 15,
    },

    loginText: {
        marginLeft: 5,
        color: "#002E15",
        fontWeight: "700",
        fontSize: 15,
    },
    signup: {
        marginLeft: 6,
        color: "#002E15",
        fontSize: 15,
        fontWeight: "700",
    },

    bottomText: {
        textAlign: "center",
        marginTop: 30,
        color: "#8A8A8A",
        fontSize: 13,
        fontWeight: "500",
    },

    loadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,.25)",
        justifyContent: "center",
        alignItems: "center",
    },

    loadingBox: {
        backgroundColor: "#fff",
        paddingHorizontal: 35,
        paddingVertical: 28,
        borderRadius: 18,
        alignItems: "center",
    },

    loadingText: {
        marginTop: 12,
        color: "#002E15",
        fontWeight: "600",
        fontSize: 15,
    },
});