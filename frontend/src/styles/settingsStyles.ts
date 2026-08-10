import { StyleSheet } from "react-native";

export const settingsStyles = StyleSheet.create({
    sectionFrame: {
        width: "100%",
        minHeight: 180,
        padding: 20,
        gap: 16,

        backgroundColor: "rgba(255, 255, 255, 0.06)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.18)",
        borderRadius: 20,
    },

    sectionTitle: {
        color: "#FFFFFF",
        fontSize: 26,
        fontWeight: "700",
        fontFamily: "InstrumentSans-Regular",
        textAlign: "left",
    },

    buttonContainer: {
        gap: 12,
    },

    button: {
        minHeight: 48,
        paddingHorizontal: 18,
        paddingVertical: 12,

        borderWidth: 1,
        borderRadius: 12,

        alignItems: "center",
        justifyContent: "center",
    },

    buttonText: {
        fontSize: 16,
        fontWeight: "600",
        fontFamily: "InstrumentSans-Regular",
    },

    redButton: {
        backgroundColor: "rgba(239, 68, 68, 0.15)",
        borderColor: "#EF4444",
    },

    redButtonText: {
        color: "#F87171",
    },

    blueButton: {
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        borderColor: "#3B82F6",
    },

    blueButtonText: {
        color: "#60A5FA",
    },

    yellowButton: {
        backgroundColor: "rgba(234, 179, 8, 0.15)",
        borderColor: "#EAB308",
    },

    yellowButtonText: {
        color: "#FACC15",
    },

    greenButton: {
        backgroundColor: "rgba(34, 197, 94, 0.15)",
        borderColor: "#22C55E",
    },

    greenButtonText: {
        color: "#4ADE80",
    },
});