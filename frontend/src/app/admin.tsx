import { TextInput, Pressable, StyleSheet, Text, View, Animated } from "react-native";
import { useFonts } from "expo-font";
import { useRouter, usePathname, RelativePathString } from "expo-router";
import React, { useState, useRef } from "react";

import MapIcon from "@/assets/icons/map.svg";
import SettingsIcon from "@/assets/icons/settings.svg";
import AdminIcon from "@/assets/icons/admin.svg";

import { commonStyles } from "@/styles/commonStyles";
import { request_Login } from "../api/login";

const ACTIVE_COLOR = "#000352";
const INACTIVE_COLOR = "#9B9DB8";

type NavItem = {
    label: string;
    path: string;
    Icon: React.ComponentType<{ width: number; height: number; fill: string }>;
};

const NAV_ITEMS: NavItem[] = [
    { label: "Map", path: "/", Icon: MapIcon },
    { label: "Settings", path: "/settings", Icon: SettingsIcon },
    { label: "Admin", path: "/admin", Icon: AdminIcon },
];

function NavButton({ item, isActive, onPress }: { item: NavItem; isActive: boolean; onPress: () => void }) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.88,
            useNativeDriver: true,
            speed: 40,
            bounciness: 6,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 40,
            bounciness: 6,
        }).start();
    };

  const color = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;

  return (
    <Pressable
      style={commonStyles.menuButton}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={8}
    >
      <Animated.View style={{ alignItems: "center", transform: [{ scale }] }}>
        <View
          style={{
            paddingHorizontal: isActive ? 18 : 0,
            paddingVertical: isActive ? 6 : 0,
            borderRadius: 16,
            backgroundColor: isActive ? "#EDEEFB" : "transparent",
          }}
        >
          <item.Icon width={26} height={26} fill={color} />
        </View>
        <Text
          style={[
            commonStyles.menuTitle,
            { color, fontFamily: isActive ? "InstrumentSans-Regular" : "Inter-Regular", marginTop: 4 },
          ]}
        >
          {item.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function Page() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await request_Login({
        username,
        password
      });

      console.log(response);

    } catch (error) {
      console.log(error);
    }
  };

  const router = useRouter();
  const pathname = usePathname();

  const onNavigate = (path: string) => {
    if (pathname === path) return;
    router.push(path as RelativePathString);
  };

  const [fontsLoaded] = useFonts({
    "InstrumentSans-Regular": require("../../assets/fonts/InstrumentSans-VariableFont_wdth,wght.ttf"),
    "Inter-Regular": require("../../assets/fonts/Inter-VariableFont_opsz,wght.ttf")
  });

  return (
    <View style={styles.screen}>
      <View style={styles.loginFrame}>
        <View style={styles.titleFrame}>
          <View style={styles.iconWrapper}>
            <AdminIcon style={styles.loginIcon} width={36} height={36} fill="white" />
          </View>
          <Text style={styles.titleLabel}>Landlord Page</Text>
        </View>

        <View style={styles.inputFrame}>
          <View style={styles.idFrame}>
            <Text style={styles.loginLabel}>Username</Text>
            <TextInput style={styles.loginInput} placeholder="Enter Username" onChangeText={setUsername} />
          </View>

          <View style={styles.passwordFrame}>
            <Text style={styles.loginLabel}>Password</Text>
            <TextInput style={styles.loginInput} placeholder="Enter Password" secureTextEntry={true} onChangeText={setPassword} />
          </View>

          <Pressable style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonLabel}>Login</Text>
          </Pressable>
        </View>
      </View>

      <View
        style={[
          commonStyles.menuFrame,
          {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 12,
          },
        ]}
      >
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.path}
            item={item}
            isActive={pathname === item.path}
            onPress={() => onNavigate(item.path)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#353535"
  },
  loginFrame: {
    flex: 1,
    width: 300,
    height: 200,
    borderColor: "gray",
    marginBottom: 16,
    alignSelf: "center",
    justifyContent: "center",
  },
  loginLabel: {
    color: "#000352",
    fontFamily: "InstrumentSans-Regular",
    fontSize: 20,
    marginBottom: 8,
    fontWeight: "bold"
  },
  loginInput: {
    width: "100%",
    borderColor: "black",
    borderWidth: 1,
    fontSize: 16,
  },
  titleFrame: {
    backgroundColor: "#000352",
    width: "100%",
  },
  iconWrapper: {
    alignItems: "center",
  },
  loginIcon: {
    padding: 16,
  },
  titleLabel: {
    color: "white",
    fontFamily: "InstrumentSans-Regular",
    fontSize: 20,
    marginBottom: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
  inputFrame: {
    backgroundColor: "gray",
    width: "100%",
    padding: 16
  },
  idFrame: {
    backgroundColor: "gray",
    width: "100%",
    height: 50,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 16
  },
  passwordFrame: {
    backgroundColor: "gray",
    width: "100%",
    height: 50,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 16
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#000352"
  },
  loginButtonLabel: {
    textAlign: "center",
    fontSize: 16,
    color: "white",
  },
});