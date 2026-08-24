import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

type AlertButtonProps = {
    onPress: () => void;
    loading?: boolean;
};

export default function AlertButton({
    onPress,
    loading = false,
}: AlertButtonProps) {
    return (
        <TouchableOpacity
            style={{
                backgroundColor: "#FF0000",
                width: 70,
                height: 70,
                borderRadius: 35,
                justifyContent: "center",
                alignItems: "center",
                alignSelf: "center",
                marginVertical: 20,
                elevation: 6,
                shadowColor: "#000",
                shadowOffset: {
                    width: 0,
                    height: 3,
                },
                shadowOpacity: 0.3,
                shadowRadius: 3,
                opacity: loading ? 0.7 : 1,
            }}
            onPress={onPress}
            disabled={loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text
                    style={{
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: 16,
                        letterSpacing: 0.5,
                    }}
                >
                    SOS
                </Text>
            )}
        </TouchableOpacity>
    );
}