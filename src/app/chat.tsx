import Header from "@/components/Header";
import { api } from "@/config/api";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

export default function Chat() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "👋 Hello! I'm Salema AI. How can I help you today?",
      sender: "bot",
    },
  ]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);

    const text = message;
    setMessage("");
    setLoading(true);

    try {
      const { data } = await api.post("/chat", {
        message: text,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: data.reply,
          sender: "bot",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          text: "Sorry, I couldn't respond right now.",
          sender: "bot",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 15 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.message,
              item.sender === "user"
                ? styles.userMessage
                : styles.botMessage,
            ]}
          >
            <Text
              style={{
                color: item.sender === "user" ? "#fff" : "#000",
              }}
            >
              {item.text}
            </Text>
          </View>
        )}
      />

      {loading && (
        <ActivityIndicator
          size="small"
          color="#002E15"
          style={{ marginBottom: 10 }}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
          style={styles.input}
          multiline
        />

        <TouchableOpacity style={styles.send} onPress={sendMessage}>
          <Ionicons name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8F7",
  },

  message: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 12,
    marginVertical: 5,
  },

  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#002E15",
  },

  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#E8E8E8",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },

  input: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
  },

  send: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#002E15",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
});