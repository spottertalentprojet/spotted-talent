import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export function AuthScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Saisissez un email et un mot de passe.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const signInError = await signIn(email, password);

    if (signInError) {
      setErrorMessage("Connexion impossible. Verifiez vos identifiants.");
    }

    setSubmitting(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.brand}>Spotted Talent Mobile</Text>
        <Text style={styles.title}>Connexion</Text>
        <Text style={styles.subtitle}>Accedez a votre espace Talent ou Entreprise.</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="exemple@spottedtalent.fr"
            placeholderTextColor="#6f7891"
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            placeholder="Votre mot de passe"
            placeholderTextColor="#6f7891"
            style={styles.input}
          />
        </View>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && !submitting ? styles.buttonPressed : null,
            submitting ? styles.buttonDisabled : null,
          ]}
          onPress={handleSignIn}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05070f",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: "#111522",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#242b42",
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 12,
  },
  brand: {
    color: "#6bb4ff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  title: {
    color: "#f5f8ff",
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: "#a7b3cc",
    fontSize: 15,
    marginBottom: 6,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    color: "#d6ddf0",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#181e31",
    borderWidth: 1,
    borderColor: "#283151",
    color: "#f8fbff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: {
    color: "#ff9494",
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "#2ca7f7",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
  },
});
