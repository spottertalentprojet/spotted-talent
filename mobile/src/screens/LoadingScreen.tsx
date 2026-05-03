import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export function LoadingScreen({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color="#4cc7ff" size="large" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05070f",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  message: {
    color: "#cad4e8",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
