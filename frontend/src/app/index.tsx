import { useEffect, useRef, useCallback, useState } from "react";

import Svg, { Path, Defs, LinearGradient, Stop, Circle } from "react-native-svg";
import { View, Text, Animated, Easing, StyleSheet } from "react-native";

import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';

import { commonStyles } from "@/styles/commonStyles";
import { indexStyles } from "@/styles/indexStyles";

import { vibrate, type VibrationStrength } from '@/vibration/haptics';

import NavigationBar from '@/components/NavigationBar';

import { request_MapsIdPath } from '@/api/api_maps_id_path';
import { router, useLocalSearchParams, Redirect } from "expo-router";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const GRID_WIDTH = 8;
const GRID_HEIGHT = 8;
const ARRIVAL_THRESHOLD = 0.5;
const HEADING_CONE_DEGREES = 15;
const MINIMAP_SIZE = 150;

// Earth radius in meters for Equirectangular approximation
const EARTH_RADIUS = 6371000;
// Cell size derived from your API
const METERS_PER_CELL = 27;

const START = { x: 0, y: 0 };
const END = { x: 7, y: 7 };

const normalizeAngle = (deg: number) => {
  const wrapped = deg % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
};

const shortestAngleDelta = (from: number, to: number) => {
  const diff = normalizeAngle(to - from);
  return diff > 180 ? diff - 360 : diff;
};

const angularDistance = (a: number, b: number) => Math.abs(shortestAngleDelta(a, b));

export default function MapPage() {

  const { mapId, destinationId } = useLocalSearchParams();

  const rotation = useRef(new Animated.Value(0)).current;
  const rotationValueRef = useRef(0);

  const mapRotation = useRef(new Animated.Value(0)).current;
  const mapRotationValueRef = useRef(0);

  const mapCursorPan = useRef(new Animated.ValueXY()).current;

  const vibrationRunId = useRef(0);
  const isCorrectRef = useRef(false);

  const virtualPos = useRef({ x: 0, y: 0 });
  const currentHeadingRef = useRef(0);
  const initialLocationRef = useRef<{ lat: number; lon: number } | null>(null);

  const safePathRef = useRef<[number, number][]>([]);
  const targetIndexRef = useRef(0);

  const [safePath, setSafePathState] = useState<[number, number][]>([]);

  // If map or destination is not selected, redirect the user to choose a map and destination
  if (!mapId || !destinationId) {
    return <Redirect href={"/destination"} />;
  }

  // Convert mapId to a number
  const currentMapId = Number(mapId);

  const applySafePath = useCallback((path: [number, number][]) => {
    if (!path || path.length === 0) {
      console.warn("[MapPage] Attempted to apply an empty or invalid safePath:", path);
      return;
    }
    safePathRef.current = path;
    targetIndexRef.current = 0;
    setSafePathState(path);
  }, []);

  const stopVibration = useCallback(() => {
    vibrationRunId.current += 1;
  }, []);

  const loopVibration = useCallback(
    async (strength: VibrationStrength) => {
      stopVibration();
      const currentRunId = vibrationRunId.current;
      try {
        while (vibrationRunId.current === currentRunId) {
          await vibrate(strength);
          if (vibrationRunId.current !== currentRunId) break;
          await sleep(50);
        }
      } catch (error) {
        console.error("[MapPage] Vibration execution failed:", error);
        stopVibration();
      }
    },
    [stopVibration],
  );

  useEffect(() => {
    let cancelled = false;
    const fetchPath = async () => {
      try {
        const response = await request_MapsIdPath(currentMapId, START.x, START.y, END.x, END.y);
        if (!response) {
          console.error("[MapPage] API returned an empty response for request_MapsIdPath.");
          return;
        }
        if (!response.path || response.path.length === 0) {
          console.error("[MapPage] API response missing valid 'path' array:", response);
          return;
        }

        if (!cancelled) {
          applySafePath(response.path);
        }
      } catch (err) {
        console.error("[MapPage] Failed to fetch path from API:", err);
      }
    };
    fetchPath();
    return () => {
      cancelled = true;
    };
  }, [applySafePath, currentMapId]);

  useEffect(() => {
    if (safePath.length > 0 && (safePath[0][0] !== START.x || safePath[0][1] !== START.y)) {
      console.warn(
        "[MapPage] safePath did not start at the user's spawn position, prepending START:",
        safePath[0],
      );
    }
  }, [safePath]);

  // LIVE GPS TRACKING REPLACES JOYSTICK
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      // 1. Request GPS Permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('[MapPage] GPS Permission denied');
        return;
      }

      // 2. Subscribe to live GPS updates
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,     // Update every second
          distanceInterval: 1,    // Update every 1 meter of movement
        },
        (location) => {
          const { latitude, longitude } = location.coords;

          // 3. Anchor the start position as (0,0)
          if (!initialLocationRef.current) {
            initialLocationRef.current = { lat: latitude, lon: longitude };
            virtualPos.current = { x: 0, y: 0 };
            mapCursorPan.setValue({ x: 0, y: 0 });
            return;
          }

          // 4. Calculate Equirectangular distances in meters
          const lat1 = initialLocationRef.current.lat;
          const lon1 = initialLocationRef.current.lon;
          const lat2 = latitude;
          const lon2 = longitude;

          const toRad = Math.PI / 180;

          // Calculate X (East/West) and Y (North/South) displacement in meters
          const xMeters = (lon2 - lon1) * toRad * Math.cos(lat1 * toRad) * EARTH_RADIUS;

          // Note: Subtracting lat2 from lat1 to map North as negative Y (standard UI grid projection)
          const yMeters = (lat1 - lat2) * toRad * EARTH_RADIUS;

          // 5. Convert meters to your Map's Grid Coordinates
          const currentX = xMeters / METERS_PER_CELL;
          const currentY = yMeters / METERS_PER_CELL;

          virtualPos.current = { x: currentX, y: currentY };
          mapCursorPan.setValue({ x: currentX, y: currentY });

          // 6. Path arrival logic
          const path = safePathRef.current;
          const idx = targetIndexRef.current;
          if (path.length > 0 && idx < path.length) {
            const target = path[idx];
            if (target && target.length >= 2) {
              const distToTarget = Math.hypot(target[0] - currentX, target[1] - currentY);
              if (distToTarget < ARRIVAL_THRESHOLD && idx < path.length - 1) {
                targetIndexRef.current = idx + 1;
              }
            }
          }
        }
      );
    };

    startTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [mapCursorPan]);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    try {
      Magnetometer.setUpdateInterval(100);

      subscription = Magnetometer.addListener(({ x, y }) => {
        if (typeof x !== 'number' || typeof y !== 'number') {
          console.error("[MapPage] Magnetometer returned invalid sensor data:", { x, y });
          return;
        }

        const heading = normalizeAngle(Math.atan2(y, x) * (180 / Math.PI));
        currentHeadingRef.current = heading;

        const path = safePathRef.current;
        const idx = targetIndexRef.current;
        const hasActiveTarget = path.length > 0 && idx < path.length;

        let targetAngle = 0;

        if (hasActiveTarget) {
          const target = path[idx];
          if (!target || target.length < 2) {
            console.error(`[MapPage] Invalid path point at target index ${idx}:`, target);
            return;
          }
          const [tx, ty] = target;
          const dx = tx - virtualPos.current.x;
          const dy = ty - virtualPos.current.y;
          targetAngle = normalizeAngle(Math.atan2(dx, -dy) * (180 / Math.PI));

          const diff = angularDistance(targetAngle, heading);
          const isPointingCorrectly = diff <= HEADING_CONE_DEGREES;

          if (isPointingCorrectly && !isCorrectRef.current) {
            isCorrectRef.current = true;
            loopVibration('success');
          } else if (!isPointingCorrectly && isCorrectRef.current) {
            isCorrectRef.current = false;
            stopVibration();
          }
        } else if (isCorrectRef.current) {
          isCorrectRef.current = false;
          stopVibration();
        }

        const rawRotation = normalizeAngle(targetAngle - heading);
        const currentMod = normalizeAngle(rotationValueRef.current);
        const delta = shortestAngleDelta(currentMod, rawRotation);
        rotationValueRef.current += delta;

        Animated.timing(rotation, {
          toValue: rotationValueRef.current,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start();

        const rawMapRot = normalizeAngle(-heading);
        const currentMapMod = normalizeAngle(mapRotationValueRef.current);
        const mapDelta = shortestAngleDelta(currentMapMod, rawMapRot);
        mapRotationValueRef.current += mapDelta;

        Animated.timing(mapRotation, {
          toValue: mapRotationValueRef.current,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start();
      });
    } catch (err) {
      console.error("[MapPage] Failed to initialize Magnetometer listener:", err);
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
      stopVibration();
    };
  }, [rotation, mapRotation, loopVibration, stopVibration]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  const mapRotateInterpolate = mapRotation.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  const mapCursorX = mapCursorPan.x.interpolate({
    inputRange: [0, GRID_WIDTH],
    outputRange: [0, MINIMAP_SIZE],
  });

  const mapCursorY = mapCursorPan.y.interpolate({
    inputRange: [0, GRID_HEIGHT],
    outputRange: [0, MINIMAP_SIZE],
  });

  const needsAnchor =
    safePath.length > 0 && (safePath[0][0] !== START.x || safePath[0][1] !== START.y);

  const visualPathPoints: [number, number][] = needsAnchor
    ? [[START.x, START.y] as [number, number], ...safePath]
    : safePath;

  const pathData =
    visualPathPoints.length > 0
      ? visualPathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]} ${p[1]}`).join(' ')
      : undefined;

  return (
    <View style={commonStyles.screen}>
      <View style={indexStyles.topFrame}>

        <View style={indexStyles.hudPanel}>
          <Text style={indexStyles.hudLabel}>TARGET DISTANCE</Text>
          <Text style={indexStyles.hudValue}>12.4m</Text>
          <Text style={indexStyles.hudSubValue}>turn left</Text>
        </View>

        <View style={localStyles.miniMapContainer}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { transform: [{ rotate: mapRotateInterpolate }] }
            ]}
          >
            <Svg
              width={MINIMAP_SIZE}
              height={MINIMAP_SIZE}
              viewBox={`0 0 ${GRID_WIDTH} ${GRID_HEIGHT}`}
              style={StyleSheet.absoluteFill}
            >
              <Path d="M0 4 L8 4 M4 0 L4 8" stroke="#ebf6f5" strokeWidth="0.1" />
              <Circle cx="4" cy="4" r="3" stroke="#ebf6f5" strokeWidth="0.1" fill="none" />

              {pathData && (
                <Path
                  d={pathData}
                  stroke="#5cbdb9"
                  strokeWidth={0.8}
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </Svg>
            <Animated.View
              pointerEvents="none"
              style={[
                localStyles.miniMapCursor,
                { transform: [{ translateX: mapCursorX }, { translateY: mapCursorY }] },
              ]}
            />
          </Animated.View>
        </View>

      </View>

      <View style={indexStyles.centerFrame}>
        <Animated.View
          style={{
            transform: [{ rotate: rotateInterpolate }],
            transformOrigin: "center center",
            shadowColor: "#2C3E50",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.08,
            shadowRadius: 24,
            elevation: 8,
          }}
        >
          <Svg width={150} height={171} viewBox="0 0 70 80">
            <Defs>
              <LinearGradient id="cursorGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#26ac49" stopOpacity={1} />
                <Stop offset="1" stopColor="#ffffff" stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Path
              d="M35 0 L70 68 L35 54 L0 68 Z"
              fill="url(#cursorGradient)"
              stroke="#5cbdb9"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
      </View>

      <View style={indexStyles.bottomFrame}>
        <View style={indexStyles.distanceFrame}>
          <Text style={indexStyles.distanceTitle}>50 m</Text>
          <Text style={indexStyles.distanceSubTitle}>turn left</Text>
        </View>
      </View>

      <NavigationBar />
    </View>
  );
}

const localStyles = StyleSheet.create({
  miniMapContainer: {
    width: MINIMAP_SIZE,
    height: MINIMAP_SIZE,
    backgroundColor: '#ffffff',
    borderRadius: MINIMAP_SIZE / 2,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 6,
  },
  miniMapCursor: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fbe3e8',
    borderWidth: 1.5,
    borderColor: '#5cbdb9',
    shadowColor: "#5cbdb9",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});