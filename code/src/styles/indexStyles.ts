import { StyleSheet } from "react-native";

export const indexStyles = StyleSheet.create({
    topFrame: {
        paddingTop: 10,
        paddingHorizontal: 24,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        zIndex: 10,
    },

    hudPanel: {
        backgroundColor: "#ffffff",
        borderRadius: 20,
        padding: 16,
        minWidth: 130,
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 6,
    },

    hudLabel: {
        fontSize: 11,
        color: "#A0AAB2",
        fontWeight: "600",
        letterSpacing: 0.5,
        marginBottom: 4,
        textTransform: "uppercase",
    },

    hudValue: {
        fontSize: 26,
        color: "#2C3E50",
        fontWeight: "bold",
        fontFamily: "InstrumentSans-Regular",
    },

    hudSubValue: {
        fontSize: 14,
        color: "#5cbdb9",
        fontWeight: "600",
        fontFamily: "InstrumentSans-Regular",
        marginTop: 2,
    },

    centerFrame: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    // --- Added missing styles below to fix the TypeScript ts(2339) error ---

    bottomFrame: {
        position: 'absolute',
        bottom: 120, // Adjusted to sit above the NavigationBar
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },

    distanceFrame: {
        backgroundColor: '#ffffff',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 6,
    },

    distanceTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2C3E50',
        fontFamily: "InstrumentSans-Regular",
    },

    distanceSubTitle: {
        fontSize: 14,
        color: '#5cbdb9',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 4,
        fontFamily: "InstrumentSans-Regular",
    }
});