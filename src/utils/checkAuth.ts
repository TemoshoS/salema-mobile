import AsyncStorage from "@react-native-async-storage/async-storage";

export const checkAuth = async () => {
  try {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      return true;
    }

    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
};