import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { AuthScreen } from "./src/screens/AuthScreen";
import { EntrepriseHomeScreen } from "./src/screens/EntrepriseHomeScreen";
import { LoadingScreen } from "./src/screens/LoadingScreen";
import { TalentHomeScreen } from "./src/screens/TalentHomeScreen";

function Root() {
  const { loading, session, profile, refreshProfile } = useAuth();

  if (loading) {
    return <LoadingScreen message="Connexion en cours..." />;
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (!profile) {
    return (
      <View style={styles.missingProfileContainer}>
        <Text style={styles.missingProfileTitle}>Profil introuvable</Text>
        <Text style={styles.missingProfileBody}>
          Votre session est active, mais le profil n'est pas encore charge.
        </Text>
        <Text style={styles.missingProfileLink} onPress={refreshProfile}>
          Recharger mon profil
        </Text>
      </View>
    );
  }

  if (profile.role === "entreprise") {
    return <EntrepriseHomeScreen />;
  }

  return <TalentHomeScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Root />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  missingProfileContainer: {
    flex: 1,
    backgroundColor: "#05070f",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  missingProfileTitle: {
    color: "#f4f7ff",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  missingProfileBody: {
    color: "#a6b0c7",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 380,
  },
  missingProfileLink: {
    marginTop: 8,
    color: "#4fc6ff",
    fontSize: 16,
    fontWeight: "700",
  },
});
