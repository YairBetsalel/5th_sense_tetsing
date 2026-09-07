import { StyleSheet, Text, View } from "react-native";
import { useFonts } from "expo-font";

import MapIcon from "@/assets/icons/map.svg";
import SettingsIcon from "@/assets/icons/settings.svg";
import AdminIcon from "@/assets/icons/admin.svg";
import symbolicateStackTrace from "react-native/Libraries/Core/Devtools/symbolicateStackTrace";

/*

[ API SERVER ]
SERVER: 209.38.89.2
PORT:   8000

*/

export default function Page() {
  const [fontsLoaded] = useFonts({
    "InstrumentSans-Regular": require("../assets/fonts/InstrumentSans-VariableFont_wdth,wght.ttf"),
    "Inter-Regular": require("../assets/fonts/Inter-VariableFont_opsz,wght.ttf")
  });
  return (
    <View style={styles.screen}>
      <View style={styles.topFrame}>
        <View style={styles.map}>

        </View>
      </View>
      
      <View style={styles.centerFrame}>

      </View>

      <View style={styles.bottomFrame}>
        <View style={styles.distanceFrame}>
          <Text style={styles.distanceTitle}>50 m</Text>
          <Text style={styles.distanceSubtitle}>turn left</Text>
        </View>
      </View>

      <View style={styles.menuFrame}>

        <View style={styles.menuButton}>
          <MapIcon width={36} height={36} fill="#000352"/>
          <Text style={styles.menuTitle}>Map</Text>
        </View>

        <View style={styles.menuButton}>
          <SettingsIcon width={36} height={36} fill="#000352"/>
          <Text style={styles.menuTitle}>Settings</Text>
        </View>

        <View style={styles.menuButton}>
          <AdminIcon width={36} height={36} fill="#000352"/>
          <Text style={styles.menuTitle}>Admin</Text>
        </View>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#353535"
  },

  topFrame: {
    backgroundColor: "transparent",
    padding: 10,
    minHeight: "30%",
  },
  map: {
    backgroundColor: "#D9D9D9",
    borderRadius: 25,
    minHeight: 228,
    width: "100%"
  },

  centerFrame: {
    backgroundColor: "transparent",
    padding: 20,
    minHeight: "40%",
  },

  bottomFrame: {
    backgroundColor: "transparent",
  },
  distanceFrame: {
    backgroundColor: "transparent",
    padding: 20,
    textAlign: "left",
  },
  distanceTitle: {
    textAlign: "left",
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: "InstrumentSans-Regular",
    color: "#ffffff",
  },
  distanceSubtitle: {
    textAlign: "left",
    fontSize: 24,
    fontFamily: "InstrumentSans-Regular",
    color: "#ffffff",
  },  

  menuFrame: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    overflow: "hidden",
    borderRadius: 200,

    shadowColor: "#000",
    shadowOffset: {
      width: -8,
      height: -10,
    },
    shadowOpacity: 0.37,
    shadowRadius: 46,
    elevation: 12,
  },

  menuButton: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  menuTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontFamily: "Inter-Regular",
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "regular"
  },

});