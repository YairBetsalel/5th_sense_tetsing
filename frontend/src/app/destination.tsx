import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useFonts } from "expo-font";
import NavigationBar from "@/components/NavigationBar";
import { request } from "@/api/client";

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
        return <ActivityIndicator size="large" color="#000352" style={styles.centreLoader} />;
      }

      return (
        <View style={styles.screen}>
          <View style={styles.headerFrame}>
            <Text
              style={styles.headerTitle}
              accessibilityRole="header"
            >
              {!selectedMap ? "Select a Map" : "Select a Destination"}
            </Text>
          </View>

          <View style={styles.contentFrame}>
            {loading && <ActivityIndicator size="large" color="#000352" />}

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
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.listItem}
                    onPress={() => setSelectedMap(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select map ${item.name}`}
                    accessibilityHint="Double tap to view destinations for this map"
                  >
                    <Text style={styles.listItemText}>{item.name}</Text>
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
                  renderItem={({ item }) => {
                    const isSelected = selectedDestination?.id === item.id;
                    return (
                      <Pressable
                        style={[styles.listItem, isSelected && styles.listItemSelected]}
                        onPress={() => setSelectedDestination(item)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={`Destination ${item.name}`}
                      >
                        <Text style={[styles.listItemText, isSelected && styles.listItemTextSelected]}>
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
                    style={styles.actionButton}
                    onPress={handleStartNavigation}
                    accessibilityRole="button"
                    accessibilityLabel={`Start navigation to ${selectedDestination.name}`}
                  >
                    <Text style={styles.actionButtonText}>Start Navigation</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>

          <NavigationBar />
        </View>
      );

}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#353535",
  },
  centreLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#353535",
  },
  headerFrame: {
    backgroundColor: "#000352",
    width: "100%",
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: "center",
  },
  headerTitle: {
    color: "white",
    fontFamily: "InstrumentSans-Regular",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  contentFrame: {
    flex: 1,
    padding: 20,
    width: "100%",
  },
  listItem: {
    backgroundColor: "gray",
    padding: 24,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  listItemSelected: {
    backgroundColor: "#EDEEFB",
    borderColor: "#000352",
  },
  listItemText: {
    color: "white",
    fontFamily: "InstrumentSans-Regular",
    fontSize: 24,
    fontWeight: "600",
  },
  listItemTextSelected: {
    color: "#000352",
  },
  backButton: {
    paddingVertical: 12,
    marginBottom: 16,
  },
  backButtonText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Inter-Regular",
    textDecorationLine: "underline",
  },
  actionButton: {
    backgroundColor: "#000352",
    padding: 24,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontSize: 24,
    fontFamily: "InstrumentSans-Regular",
    fontWeight: "bold",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "Inter-Regular",
  },
  emptyText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginTop: 40,
    fontFamily: "Inter-Regular",
  },
});