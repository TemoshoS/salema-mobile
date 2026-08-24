import { BaseToast, ErrorToast } from "react-native-toast-message";

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftWidth: 0,
        backgroundColor: "#002E15",
        borderRadius: 16,
        marginHorizontal: 16,
        elevation: 8,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
      }}
      text2Style={{
        color: "#E5E7EB",
        fontSize: 14,
      }}
    />
  ),

  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftWidth: 0,
        backgroundColor: "#DC2626",
        borderRadius: 16,
        marginHorizontal: 16,
        elevation: 8,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
      }}
      text2Style={{
        color: "#FDECEC",
        fontSize: 14,
      }}
    />
  ),

  info: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftWidth: 0,
        backgroundColor: "#2563EB",
        borderRadius: 16,
        marginHorizontal: 16,
        elevation: 8,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
      }}
      text2Style={{
        color: "#EAF2FF",
        fontSize: 14,
      }}
    />
  ),
};