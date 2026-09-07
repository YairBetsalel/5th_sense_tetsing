import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useFonts } from "expo-font";
import * as Speech from "expo-speech";
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import NavigationBar from "@/components/NavigationBar";
import { request } from "@/api/client";
import { commonStyles } from "@/styles/commonStyles";

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
  coordinates: { x: number; y: number } | number[];
  created_by: number;
  created_at: string;
}

// ---- Theme (strictly: teal / dark slate / soft grey / mint, plus white) ----
const COLOR_TEAL = "#5cbdb9";
const COLOR_SLATE = "#2C3E50";
const COLOR_GREY = "#A0AAB2";
const COLOR_MINT = "#ebf6f5";

const CARD_PRESS_SCALE = 0.98;

// ---- Small inline icons (react-native-svg, already a project dependency) ----

function MapPinIcon({ color = COLOR_TEAL }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={10} r={2.4} stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

function FlagIcon({ color = COLOR_TEAL }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3.5v17" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Path
        d="M6 4.5h11.5L14 8l3.5 3.5H6"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function CheckIcon({ color = COLOR_TEAL }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 13l4.5 4.5L19 8"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ---- Reusable selectable card: press-scale + subtle gradient + focus/confirm states ----

type SelectableCardProps = {
  title: string;
  icon: React.ReactNode;
  isFocused: boolean;
  isConfirmed: boolean;
  onPress: () => void;
  accessibilityLabel: string;
};

function SelectableCard({
  title,
  icon,
  isFocused,
  isConfirmed,
  onPress,
  accessibilityLabel,
}: SelectableCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: CARD_PRESS_SCALE,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const isActive = isFocused || isConfirmed;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={[styles.card, isActive && styles.cardActive]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={
          isFocused ? "Tap again to confirm" : "Tap to hear and focus this option"
        }
      >
        <View style={styles.cardBackdrop} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop
                  offset="0"
                  stopColor={isActive ? COLOR_MINT : "#ffffff"}
                  stopOpacity={1}
                />
                <Stop
                  offset="1"
                  stopColor={isActive ? COLOR_TEAL : COLOR_MINT}
                  stopOpacity={isActive ? 0.22 : 0.4}
                />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width="100%" height="100%" rx={18} fill="url(#cardGrad)" />
          </Svg>
        </View>

        <View style={styles.cardIconWrap}>{icon}</View>

        <Text style={[styles.cardText, isActive && styles.cardTextActive]} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.cardStatusWrap}>
          {isConfirmed ? (
            <CheckIcon color={COLOR_TEAL} />
          ) : isFocused ? (
            <View style={styles.focusDot} />
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function DestinationPage() {
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

  // Focus = "read aloud but not yet confirmed" state for the two-tap flow
  const [focusedMapId, setFocusedMapId] = useState<number | null>(null);
  const [focusedDestinationId, setFocusedDestinationId] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all maps
  useEffect(() => {
    const fetchMaps = async () => {
      try {
        setLoading(true);
        setError(null);
        // Use Client component to send request
        const data = await request<MapItem[]>("/api/maps/");
        setMaps(data);

      } catch (error) {
        // Error displayed in the console at testing stage
        console.error("Failed to fetch maps:", error);
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
      if (!selectedMap) return;

      try {
        setLoading(true);
        setError(null);
        // Use Client component to send request
        const data = await request<DestinationItem[]>(`/api/destinations/?map_id=${selectedMap.id}`);
        setDestinations(data);
      } catch (error) {
        // Error displayed in the console at testing stage
        console.error("Failed to fetch destinations:", error);
        setError("Failed to load destinations");
      } finally {
        setLoading(false);
      }

    };
    fetchDestination();
  }, [selectedMap]);

  // Stop any in-flight speech when the screen unmounts
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const handleStartNavigation = useCallback((destinationOverride?: DestinationItem) => {
    const destinationToUse = destinationOverride ?? selectedDestination;
    if (!selectedMap || !destinationToUse) return;

    // Navigate back to the Map page and pass parameters
    router.push({
      pathname: "/",
      params: {
        mapId: selectedMap.id,
        destinationId: destinationToUse.id,
      },
    });
  }, [router, selectedMap, selectedDestination]);

  // Clear everything if the user wishes to reset
  const resetSelection = useCallback(() => {
    Speech.stop();
    setFocusedMapId(null);
    setFocusedDestinationId(null);
    setSelectedMap(null);
    setSelectedDestination(null);
    setDestinations([]);
  }, []);

  // Tapping empty space cancels any pending focus + speech without touching a confirmed selection
  const clearFocus = useCallback(() => {
    Speech.stop();
    setFocusedMapId(null);
    setFocusedDestinationId(null);
  }, []);

  const handleMapPress = useCallback((item: MapItem) => {
    if (focusedMapId === item.id) {
      // Second tap: confirm and proceed
      Speech.stop();
      Speech.speak(`${item.name} confirmed. Loading destinations.`);
      setFocusedMapId(null);
      setSelectedMap(item);
    } else {
      // First tap: focus + read aloud
      Speech.stop();
      setFocusedDestinationId(null);
      setFocusedMapId(item.id);
      Speech.speak(`Map selected: ${item.name}`);
    }
  }, [focusedMapId]);

  const handleDestinationPress = useCallback((item: DestinationItem) => {
    if (focusedDestinationId === item.id) {
      // Second tap: confirm and start navigation
      Speech.stop();
      Speech.speak(`${item.name} confirmed. Starting navigation.`);
      setFocusedDestinationId(null);
      setSelectedDestination(item);
      handleStartNavigation(item);
    } else {
      // First tap: focus + read aloud
      Speech.stop();
      setFocusedDestinationId(item.id);
      Speech.speak(`Destination selected: ${item.name}`);
    }
  }, [focusedDestinationId, handleStartNavigation]);

  if (!fontsLoaded) {
    return (
      <View style={[commonStyles.screen, styles.centerLoader]}>
        <ActivityIndicator size="large" color={COLOR_TEAL} />
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
          <Text style={styles.subtitle}>
            Tap once to hear an option, tap again to confirm
          </Text>
        </View>

        <Pressable style={styles.contentFrame} onPress={clearFocus} accessibilityLabel="Clear focus">
          {loading && <ActivityIndicator size="large" color={COLOR_TEAL} style={styles.loader} />}

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
                <SelectableCard
                  title={item.name}
                  icon={
                    <MapPinIcon
                      color={
                        focusedMapId === item.id || selectedMap?.id === item.id
                          ? COLOR_TEAL
                          : COLOR_SLATE
                      }
                    />
                  }
                  isFocused={focusedMapId === item.id}
                  isConfirmed={selectedMap?.id === item.id}
                  onPress={() => handleMapPress(item)}
                  accessibilityLabel={`Map ${item.name}`}
                />
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
                renderItem={({ item }) => (
                  <SelectableCard
                    title={item.name}
                    icon={
                      <FlagIcon
                        color={
                          focusedDestinationId === item.id || selectedDestination?.id === item.id
                            ? COLOR_TEAL
                            : COLOR_SLATE
                        }
                      />
                    }
                    isFocused={focusedDestinationId === item.id}
                    isConfirmed={selectedDestination?.id === item.id}
                    onPress={() => handleDestinationPress(item)}
                    accessibilityLabel={`Destination ${item.name}`}
                  />
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No destinations available for this map.</Text>
                }
              />

              {/* Confirm navigation (manual fallback alongside the two-tap flow) */}
              {selectedDestination && (
                <Pressable
                  style={styles.button}
                  onPress={() => handleStartNavigation()}
                  accessibilityRole="button"
                  accessibilityLabel={`Start navigation to ${selectedDestination.name}`}
                >
                  <Text style={styles.buttonText}>Start Navigation</Text>
                </Pressable>
              )}
            </>
          )}
        </Pressable>
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
    color: COLOR_SLATE,
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: COLOR_GREY,
    fontFamily: "Inter-Regular",
    textAlign: "center",
  },
  contentFrame: {
    flex: 1,
    width: "100%",
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    overflow: "hidden",
    shadowColor: COLOR_SLATE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  cardActive: {
    borderColor: COLOR_TEAL,
    shadowOpacity: 0.12,
  },
  cardBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLOR_MINT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter-Regular",
    fontWeight: "600",
    color: COLOR_SLATE,
  },
  cardTextActive: {
    color: COLOR_TEAL,
    fontWeight: "bold",
  },
  cardStatusWrap: {
    width: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  focusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLOR_TEAL,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 12,
    marginBottom: 8,
  },
  backButtonText: {
    color: COLOR_GREY,
    fontSize: 14,
    fontFamily: "Inter-Regular",
    fontWeight: "500",
  },
  button: {
    backgroundColor: COLOR_TEAL,
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
    color: COLOR_GREY,
    fontSize: 15,
    textAlign: "center",
    marginTop: 40,
    fontFamily: "Inter-Regular",
  },

});