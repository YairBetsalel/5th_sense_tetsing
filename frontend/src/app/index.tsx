import { useEffect, useRef, useCallback, useState } from "react";
import { View, Text, Animated, Easing, PanResponder, StyleSheet } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { Magnetometer } from 'expo-sensors';

import { commonStyles } from "@/styles/commonStyles";
import { indexStyles } from "@/styles/indexStyles";

import { vibrate, type VibrationStrength } from '@/vibration/haptics';

import NavigationBar from '@/components/NavigationBar';

import { request_MapsIdPath } from '@/api/api_maps_id_path';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const GRID_WIDTH = 8;
const GRID_HEIGHT = 8;
const JOYSTICK_RADIUS = 40;
const MAX_SPEED = 0.05;
const ARRIVAL_THRESHOLD = 0.5;
const HEADING_CONE_DEGREES = 15;
const MINIMAP_SIZE = 150;

const MAP_ID = 2;
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
  const rotation = useRef(new Animated.Value(0)).current;
  const rotationValueRef = useRef(0);

  const mapRotation = useRef(new Animated.Value(0)).current;
  const mapRotationValueRef = useRef(0);

  const joystickPan = useRef(new Animated.ValueXY()).current;
  const mapCursorPan = useRef(new Animated.ValueXY()).current;

  const vibrationRunId = useRef(0);
  const isCorrectRef = useRef(false);

  const virtualPos = useRef({ x: 0, y: 0 });
  const joystickVelocity = useRef({ dx: 0, dy: 0 });
  const currentHeadingRef = useRef(0);

  const safePathRef = useRef<[number, number][]>([]);
  const targetIndexRef = useRef(0);

  const [safePath, setSafePathState] = useState<[number, number][]>([]);

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
        const response = await request_MapsIdPath(MAP_ID, START.x, START.y, END.x, END.y);
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
  }, [applySafePath]);

  useEffect(() => {
    if (safePath.length > 0 && (safePath[0][0] !== START.x || safePath[0][1] !== START.y)) {
      console.warn(
        "[MapPage] safePath did not start at the user's spawn position, prepending START:",
        safePath[0],
      );
    }
  }, [safePath]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_e, gestureState) => {
        const distance = Math.sqrt(gestureState.dx ** 2 + gestureState.dy ** 2);
        const scale = distance > JOYSTICK_RADIUS ? JOYSTICK_RADIUS / distance : 1;

        const clampedX = gestureState.dx * scale;
        const clampedY = gestureState.dy * scale;

        joystickPan.setValue({ x: clampedX, y: clampedY });

        joystickVelocity.current = {
          dx: clampedX / JOYSTICK_RADIUS,
          dy: clampedY / JOYSTICK_RADIUS,
        };
      },
      onPanResponderRelease: () => {
        Animated.spring(joystickPan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
        joystickVelocity.current = { dx: 0, dy: 0 };
      },
      onPanResponderTerminate: () => {
        console.warn("[MapPage] PanResponder gesture terminated by system.");
        Animated.spring(joystickPan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
        joystickVelocity.current = { dx: 0, dy: 0 };
      },
    })
  ).current;

  useEffect(() => {
    let animationFrameId: number;

    const updatePosition = () => {
      try {
        const { dx, dy } = joystickVelocity.current;

        if (dx !== 0 || dy !== 0) {
          let { x, y } = virtualPos.current;

          const theta = currentHeadingRef.current * (Math.PI / 180);
          const vx = dx * Math.cos(theta) - dy * Math.sin(theta);
          const vy = dx * Math.sin(theta) + dy * Math.cos(theta);

          x += vx * MAX_SPEED;
          y += vy * MAX_SPEED;

          x = ((x % GRID_WIDTH) + GRID_WIDTH) % GRID_WIDTH;
          y = ((y % GRID_HEIGHT) + GRID_HEIGHT) % GRID_HEIGHT;

          virtualPos.current = { x, y };
          mapCursorPan.setValue({ x, y });

          const path = safePathRef.current;
          const idx = targetIndexRef.current;
          if (path.length > 0 && idx < path.length) {
            const target = path[idx];
            if (!target || target.length < 2) {
              console.error(`[MapPage] Invalid target coordinate at index ${idx}:`, target);
              return;
            }
            const [tx, ty] = target;
            const distToTarget = Math.hypot(tx - x, ty - y);
            if (distToTarget < ARRIVAL_THRESHOLD && idx < path.length - 1) {
              targetIndexRef.current = idx + 1;
            }
          }
        }
      } catch (err) {
        console.error("[MapPage] Error in virtual movement loop:", err);
      }

      animationFrameId = requestAnimationFrame(updatePosition);
    };

    animationFrameId = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(animationFrameId);
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
              {pathData && (
                <Path
                  d={pathData}
                  stroke="#4CAF50"
                  strokeWidth={0.3}
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

      <View style={[indexStyles.centerFrame, { justifyContent: "center", alignItems: "center" }]}>
        <Animated.View
          style={{
            transform: [{ rotate: rotateInterpolate }],
            transformOrigin: "center center",
            marginTop: -80,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.55,
            shadowRadius: 6,
            elevation: 8,
          }}
        >
          <Svg width={150} height={171} viewBox="0 0 70 80">
            <Defs>
              <LinearGradient id="cursorGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
                <Stop offset="1" stopColor="#C7C7C7" stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Path
              d="M35 0 L70 68 L35 54 L0 68 Z"
              fill="url(#cursorGradient)"
              stroke="#D8D8D8"
              strokeWidth={1}
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>

        <View style={localStyles.joystickBase}>
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              localStyles.joystickStick,
              { transform: joystickPan.getTranslateTransform() },
            ]}
          />
        </View>
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
  joystickBase: {
    width: JOYSTICK_RADIUS * 2.5,
    height: JOYSTICK_RADIUS * 2.5,
    borderRadius: JOYSTICK_RADIUS * 1.25,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
  },
  joystickStick: {
    width: JOYSTICK_RADIUS,
    height: JOYSTICK_RADIUS,
    borderRadius: JOYSTICK_RADIUS / 2,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  miniMapContainer: {
    width: MINIMAP_SIZE,
    height: MINIMAP_SIZE,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: MINIMAP_SIZE / 2, // Circular to look like GTA/Mario
    overflow: 'hidden',
    position: 'relative',
  },
  miniMapCursor: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
});