import { StyleSheet } from "react-native";

export const settingsStyles = StyleSheet.create({
    scrollContent: {
        padding: 24,
        paddingTop: 80,
        paddingBottom: 120,
    },

    sectionFrame: {
        width: "100%",
        padding: 28,
        gap: 20,
        backgroundColor: "#ffffff",
        borderRadius: 24,
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 6,
    },

    sectionTitle: {
        color: "#2C3E50",
        fontSize: 16,
        fontWeight: "bold",
        fontFamily: "InstrumentSans-Regular",
        letterSpacing: 1,
        textTransform: "uppercase",
    },

    button: {
        width: "100%",
        paddingVertical: 16,
        backgroundColor: "#ebf6f5",
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },

    buttonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#5cbdb9",
        fontFamily: "InstrumentSans-Regular",
        letterSpacing: 0.5,
    },
});