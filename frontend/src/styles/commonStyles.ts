import { StyleSheet } from "react-native";

export const commonStyles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#c1dfdf"
    },

    menuFrame: {
        position: "absolute",
        bottom: 32,
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 24,
        gap: 16,

        backgroundColor: "#ffffff",
        borderRadius: 40,

        shadowColor: "#2C3E50",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 10,
    },

    menuButton: {
        alignItems: "center",
        justifyContent: "center",
    },

    menuTitle: {
        fontSize: 12,
        fontFamily: "InstrumentSans-Regular",
        color: "#2C3E50",
        textAlign: "center",
        fontWeight: "600",
        marginTop: 6
    },
});