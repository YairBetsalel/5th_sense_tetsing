import { TextInput, Pressable, StyleSheet, Text, View } from "react-native";
import { useFonts } from "expo-font";
import React, { useState } from "react";

import AdminIcon from "@/assets/icons/admin.svg";
import { commonStyles } from "@/styles/commonStyles";
import NavigationBar from "@/components/NavigationBar";
import { request_Login } from "../api/login";
import {error} from "@expo/fingerprint/cli/build/utils/log";
import {useRouter} from "expo-router";

export default function AdminPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // For post-login routing
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");

  // Error message
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    setErrorMessage("");
    try {
      const response = await request_Login({
        username,
        password
      });
      console.log("Login successful:",response);
      // Record user role and login status
      setUserRole(response.user_role);
      setIsLoggedIn(true);
    } catch (error: any) {
      setErrorMessage(error.message || "Login failed");
    }
  };

  const handleLogout = () => {
    // Clear everything when the user wants to log out
    setIsLoggedIn(false);
    setUserRole("");
    setUsername("");
    setPassword("");
  }


  const [fontsLoaded] = useFonts({
    "InstrumentSans-Regular": require("../../assets/fonts/InstrumentSans-VariableFont_wdth,wght.ttf"),
    "Inter-Regular": require("../../assets/fonts/Inter-VariableFont_opsz,wght.ttf")
  });

  return (
    <View style={commonStyles.screen}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconWrapper}>
              <AdminIcon width={28} height={28} fill="#5cbdb9" />
            </View>
            <Text style={styles.title}>System Access</Text>
            <Text style={styles.subtitle}>Please authenticate to continue</Text>
          </View>
          {!isLoggedIn ? (
            // Dynamic content: if not logged in
          <View style={styles.form}>
            {errorMessage ? (
                <Text style={{color: "#e74c3c", fontSize: 13, marginBottom: 8}}>
                  {errorMessage}

                </Text>
            ): null}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="#A0AAB2"
                onChangeText={setUsername}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#A0AAB2"
                secureTextEntry={true}
                onChangeText={setPassword}
              />
            </View>

            <Pressable style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Sign In</Text>
            </Pressable>


          </View>


              ) : (
                  // Dynamic content: if logged in
                  <View style={styles.form}>
                    {userRole==="superadmin"&&(
                        // For superadmin only
                        <Pressable style={styles.button}
                        onPress={()=>router.push("/manage-users")}
                        >
                          <Text style={styles.buttonText}>Manage Users</Text>
                        </Pressable>
                    )}
                    <Pressable style={styles.button} onPress={()=>router.push("/manage-maps")}>
                      <Text style={styles.buttonText}>Manage Maps</Text>
                    </Pressable>
                    <Pressable style={styles.button}>
                      <Text style={styles.buttonText}>Manage Destinations</Text>
                    </Pressable>
                    <Pressable style={[styles.button, styles.logoutButton]}>
                      <Text style={[styles.buttonText, styles.logoutText]}>Sign Out</Text>

                    </Pressable>
                  </View>
          )}
        </View>
      </View>

      <NavigationBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconWrapper: {
    padding: 16,
    backgroundColor: "rgba(92, 189, 185, 0.15)",
    borderRadius: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: "InstrumentSans-Regular",
    color: "#2C3E50",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#A0AAB2",
    fontFamily: "Inter-Regular",
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2C3E50",
    fontFamily: "Inter-Regular",
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#ebf6f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: "#2C3E50",
    fontFamily: "Inter-Regular",
  },
  button: {
    backgroundColor: "#5cbdb9",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
    fontFamily: "InstrumentSans-Regular",
    letterSpacing: 0.5,
  },
  logoutButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#ebf6f5",
    marginTop: 4,
  },
  logoutText: {
    color: "#A0AAB2",
  },
});