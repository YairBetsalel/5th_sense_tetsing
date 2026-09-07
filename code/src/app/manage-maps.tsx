import React, {useEffect, useState} from "react";
import {View,Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert} from "react-native";
import {useFonts} from "expo-font";
import MapIcon from "@/assets/icons/map.svg";
import {commonStyles} from "@/styles/commonStyles";
import NavigationBar from "@/components/NavigationBar";
import {request_Maps, MapItem} from "@/api/api_maps";

export default function ManageMapPage() {
    const [maps, setMaps] = useState<MapItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMap, setSelectedMap] = useState<MapItem | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);

    const [mapname, setMapName] = useState<string>("");
    const [cellsize, setCellSize] = useState<number>(0);
    const [length, setLength] = useState<number>(0);
    const [width, setWidth] = useState<number>(0);

    const [fontsLoaded] = useFonts({
        "InstrumentSans-Regular": require("../../assets/fonts/InstrumentSans-VariableFont_wdth,wght.ttf"),
        "Inter-Regular": require("../../assets/fonts/Inter-VariableFont_opsz,wght.ttf")
    });

    useEffect(() => {
        fetchMaps();
    }, []);

    const fetchMaps = async () => {
        setIsLoading(true);
        try {
            const data = await request_Maps();
            setMaps(data);
        } catch (error) {
            console.error("Failed to fetch maps", error);
            Alert.alert("Failed to load map list");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setSelectedMap(null);
        setMapName("");
        setCellSize("");
        setWidth("");
        setLength("");
        setIsFormVisible(true);
    };

    // For edit user details
    const handleOpenEdit = (map: MapItem) => {
        console.log(map);
        setSelectedMap(map);
        setMapName(map.name);
        setCellSize(map.cell_size);
        setWidth(map.width);
        setLength(map.length);
        setIsFormVisible(true);
    };

    const handleSave = async () => {
        console.log("nuh uh");
    };

    return (
        <View style={commonStyles.screen}>
            <View style={styles.container}>
                {isFormVisible ? (
                    <View style={styles.card}>
                        <View style={styles.header}>
                            <View style={styles.iconWrapper}>
                                <MapIcon width={28} height={28} fill="#5cbdb9"/>
                            </View>
                            <Text style={styles.title}>
                                {selectedMap ? "Edit Map" : "Create Map"}
                            </Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Map Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter the map name"
                                    placeholderTextColor="#A0AAB2"
                                    value={mapname}
                                    onChangeText={setMapName}
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Cell Size</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter the cell size"
                                    placeholderTextColor="#A0AAB2"
                                    value={String(cellsize)}
                                    onChangeText={(text) => setWidth(Number(text))}
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Length</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter the length"
                                    placeholderTextColor="#A0AAB2"
                                    value={String(length)}
                                    onChangeText={(text) => setWidth(Number(text))}
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Width</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter the width"
                                    placeholderTextColor="#A0AAB2"
                                    value={String(width)}
                                    onChangeText={(text) => setWidth(Number(text))}
                                    autoCapitalize="none"
                                />
                            </View>

                            <Pressable style={styles.button} onPress={handleSave}>
                                <Text style={styles.buttonText}>Save Changes</Text>
                            </Pressable>

                            <Pressable style={[styles.button, styles.cancelButton]} onPress={() => setIsFormVisible(false)}>
                                <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
                            </Pressable>

                        </View>

                    </View>
                ) : (
                    <View style={[styles.card, { flex: 1, maxHeight: '85%' }]}>
                        
                        <View style={styles.listHeader}>
                            <Text style={styles.title}>Map Management</Text>
                            <Pressable style={styles.addButton}  onPress={handleOpenCreate}>
                                <Text style={styles.addButtonText}>+ New</Text>
                            </Pressable>

                        </View>

                    {isLoading ? (
                        <ActivityIndicator size="large" color="#5cbdb9" style={{ marginTop: 40 }} />
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>

                            {maps.map((map) => (
                                <View key={map.name} style={styles.mapRow}>

                                    <View style={styles.mapInfo}>
                                        <Text style={styles.mapName}>{map.name}</Text>
                                        <Text style={styles.mapSub}>{map.id || 'No ID'} • {map.created_by}</Text>
                                    </View>

                                    <View style={styles.actionButtons}>
                                        <Pressable style={styles.editBtn} onPress={() => handleOpenEdit(map)}>
                                            <Text style={styles.editBtnText}>Edit</Text>
                                        </Pressable>

                                        <Pressable style={styles.deleteBtn}>
                                            <Text style={styles.deleteBtnText}>Delete</Text>
                                        </Pressable>
                                    </View>

                                </View>
                            ))}
                        
                        </ScrollView>
                    )}
                    </View>
                )}
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
        maxWidth: 380,
        backgroundColor: "#ffffff",
        borderRadius: 24,
        padding: 24,
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0,
            height: 12 },
        shadowOpacity: 0.05,
        shadowRadius: 24,
        elevation: 8,
    },
    header: {
        alignItems: "center",
        marginBottom: 24,
    },

    listHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
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
    },
    addButton: {
        backgroundColor: "#5cbdb9",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontFamily: "InstrumentSans-Regular",
    },
    listContent: {
        gap: 12,
    },


    mapRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#ebf6f5",
    },
    mapInfo: {
        flex: 1,
    },

    mapName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#2C3E50",
        fontFamily: "InstrumentSans-Regular",
        marginBottom: 4,
    },
    mapSub: {
        fontSize: 13,
        color: "#A0AAB2",
        fontFamily: "Inter-Regular",
    },
    actionButtons: {
        flexDirection: "row",
        gap: 8,
    },
    editBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: "rgba(92, 189, 185, 0.15)",
        borderRadius: 6,
    },
    editBtnText: {
        color: "#5cbdb9",
        fontSize: 13,
        fontWeight: "bold",
    },
    deleteBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: "rgba(231, 76, 60, 0.1)",
        borderRadius: 6,
    },
    deleteBtnText: {
        color: "#e74c3c",
        fontSize: 13,
        fontWeight: "bold",
    },
    form: {
        gap: 16,
    },


    inputGroup: {
        gap: 6,
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

    roleContainer: {
        flexDirection: "row",
        gap: 8,
    },
    roleButton: {
        flex: 1,
        height: 48,
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    roleButtonActive: {
        backgroundColor: "rgba(92, 189, 185, 0.15)",
        borderColor: "#5cbdb9",
    },
    roleText: {
        color: "#A0AAB2",
        fontFamily: "Inter-Regular",
        fontWeight: "600",
    },

    roleTextActive: {
        color: "#5cbdb9",
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

    cancelButton: {
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderColor: "#ebf6f5",
        marginTop: 0,
    },

    cancelText: {
        color: "#A0AAB2",
    },
});
