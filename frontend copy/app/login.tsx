import { StyleSheet, Text, View } from "react-native";
import { useFonts } from "expo-font";

export default function Page() {
    return (
        <View style={styles.screen}>
            <View style={styles.loginFrame}>

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
    backgroundColor: ""
  }
});