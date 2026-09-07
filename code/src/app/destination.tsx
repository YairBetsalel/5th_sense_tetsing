import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useFonts } from "expo-font";
import NavigationBar from "@/components/NavigationBar";
import { request } from "@/api/client";
import {commonStyles} from "@/styles/commonStyles";

// Types based on Map Table structure
type MapItem = {
    id: number;
    name: string;
    grid_data: unknown; //JSON
    cell_size: number;
    length: number;
    width: number;
    created_by: number;
    created_at: string;
};

type DestinationItem = {
    id: number;
    map: number;
    name: string;
    coordinates: {x:number; y:number} | number[];
    created_by: number;
    created_at: string;
}

export default function DestinationPage(){
    const router = useRouter();

    // Font Loaded
    const [fontsLoaded] = useFonts({
    "InstrumentSans-Regular": require("../../assets/fonts/InstrumentSans-VariableFont_wdth,wght.ttf"),
    "Inter-Regular": require("../../assets/fonts/Inter-VariableFont_opsz,wght.ttf")
  });

    const [maps, setMaps] = useState<MapItem[]>([]);
    const [destinations, setDestinations] = useState<DestinationItem[]>([]);

    const [selectedMap, setSelectedMap] = useState<MapItem | null>(null);
    const [selectedDestination, setSelectedDestination] = useState<DestinationItem | null>(null);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all maps
    useEffect(() => {
        const fetchMaps = async () => {
            try{
                setLoading(true);
                setError(null);
                // Use Client component to send request
                const data = await request<MapItem[]>("/api/maps/");
                setMaps(data);

            } catch (error){
                // Error displayed in the console at testing stage
                console.error("Failed to fetch maps:",error);
                setError("Failed to load maps");
            } finally {
                setLoading(false);
            }
        };
        fetchMaps();
    }, []);

    // Fetch Destinations once a map is selected
    useEffect(() => {
        const fetchDestination = async () => {
            // Prevent errors. If map is not selected, let the user select a map first
            if(!selectedMap) return;

            try{
                setLoading(true);
                setError(null);
                // Use Client component to send request
                const data = await request<DestinationItem[]>(`/api/destinations/?map_id=${selectedMap.id}`);
                setDestinations(data);
            } catch (error){
                 // Error displayed in the console at testing stage
                console.error("Failed to fetch destinations:",error);
                setError("Failed to load destinations");
            } finally {
                setLoading(false);
            }

        };
        fetchDestination();
    }, [selectedMap]);

    const handleStartNavigation = () => {
        if (!selectedMap || !selectedDestination) return;

        // Navigate back to the Map page and pass parameters
        router.push({
          pathname: "/",
          params: {
            mapId: selectedMap.id,
            destinationId: selectedDestination.id,
          },
        });
    };

    // Clear everything if the user wishes to reset
    const resetSelection = () => {
        setSelectedMap(null);
        setSelectedDestination(null);
        setDestinations([]);
      };

      if (!fontsLoaded) {
        return (
            <View style={[commonStyles.screen, styles.centerLoader]}>
                <ActivityIndicator size="large" color="#5cbdb9" />
            </View>
        );
      }

      return (
        <View style={commonStyles.screen}>
          <View style={styles.container}>
              <View style={styles.header}>
                  <Text
                  style={styles.title}
                  accessibilityRole="header"
                >
                  {!selectedMap ? "Select a Map" : "Select a Destination"}
                </Text>
              </View>

          <View style={styles.contentFrame}>
            {loading && <ActivityIndicator size="large" color="#5cbdb9" style={styles.loader} />}

            {error && (
              <Text style={styles.errorText} accessibilityLiveRegion="assertive">
                {error}
              </Text>
            )}

            {/* Map selection list */}
            {!selectedMap && !loading && !error && (
              <FlatList
                data={maps}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.card}
                    onPress={() => setSelectedMap(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select map ${item.name}`}
                    accessibilityHint="Double tap to view destinations for this map"
                  >
                    <Text style={styles.cardText}>{item.name}</Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No maps available.</Text>
                }
              />
            )}

            {/* Destination selection list */}
            {selectedMap && !loading && !error && (
              <>
                <Pressable
                  style={styles.backButton}
                  onPress={resetSelection}
                  accessibilityRole="button"
                  accessibilityLabel="Go back to map selection"
                >
                  <Text style={styles.backButtonText}>← Back to Maps</Text>
                </Pressable>

                <FlatList
                  data={destinations}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={styles.listContainer}
                  renderItem={({ item }) => {
                    const isSelected = selectedDestination?.id === item.id;
                    return (
                      <Pressable
                        style={[styles.card, isSelected && styles.cardSelected]}
                        onPress={() => setSelectedDestination(item)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={`Destination ${item.name}`}
                      >
                        <Text style={[styles.cardText, isSelected && styles.cardTextSelected]}>
                          {item.name}
                        </Text>
                      </Pressable>
                    );
                  }}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>No destinations available for this map.</Text>
                  }
                />

                {/* Confirm navigation */}
                {selectedDestination && (
                  <Pressable
                    style={styles.button}
                    onPress={handleStartNavigation}
                    accessibilityRole="button"
                    accessibilityLabel={`Start navigation to ${selectedDestination.name}`}
                  >
                    <Text style={styles.buttonText}>Start Navigation</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
          </View>
          <NavigationBar />
        </View>
      );

}

const styles = StyleSheet.create({
      centerLoader: {
          justifyContent: "center",
          alignItems: "center",
      },
    container: {
        flex: 1,
        padding: 24,
        paddingTop: 60,
    },
    header: {
          alignItems: "center",
        marginBottom: 24,
    },
    title: {
          fontSize: 22,
        fontWeight: "bold",
        fontFamily: "InstrumentSans-Regular",
        color: "#2C3E50",
        marginBottom: 4,
        textAlign:"center",
    },
    subtitle:{
          fontSize: 14,
        color: "#A0AAB2",
        fontFamily: "Inter-Regular",
        textAlign: "center",
    },
    contentFrame: {
          flex:1,
        width:"100%",
        paddingBottom: 80,
    },
    listContainer: {
          gap: 12,
        paddingBottom: 20,
    },
    loader: {
          marginTop: 40,
    },
    card: {
          backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#2C3E50",
        shadowOffset: {width:0, height: 4},
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1.5,
        borderColor: "transparent",
    },
    cardSelected: {
          backgroundColor: "#ebf6f5",
        borderColor: "#5cbdb9",
    },
    cardText: {
          fontSize: 16,
        fontFamily: "Inter-Regular",
        fontWeight: "600",
        color: "#2C3E50",
    },
    cardTextSelected: {
          color: "#5cbdb9",
        fontWeight: "bold",
    },
    backButton: {
          alignSelf: "flex-start",
        paddingVertical: 12,
        marginBottom: 8,
    },
    backButtonText: {
          color: "#A0AAB2",
        fontSize: 14,
        fontFamily: "Inter-Regular",
        fontWeight: "500",
    },
    button: {
          backgroundColor: "#5cbdb9",
        height: 52,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 16,
    },
    buttonText: {
          color: "#ffffff",
        fontSize: 15,
        fontWeight: "bold",
        fontFamily: "InstrumentSans-Regular",
        letterSpacing: 0.5,
    },
    errorText: {
          color: "#FF6B6B",
        fontSize: 15,
        textAlign: "center",
        marginBottom: 16,
        fontFamily: "Inter-Regular",
    },
    emptyText: {
          color: "#A0AAB2",
        fontSize: 15,
        textAlign: "center",
        marginTop: 40,
        fontFamily: "Inter-Regular",
    },

});