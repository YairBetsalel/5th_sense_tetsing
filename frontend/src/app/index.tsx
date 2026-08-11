import { useEffect, useRef, useCallback, useState } from "react";
import { View, Text, Animated, Easing, PanResponder, StyleSheet } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { Magnetometer } from 'expo-sensors';

import { commonStyles } from "@/styles/commonStyles";
import { indexStyles } from "@/styles/indexStyles";

import { useFocusEffect } from "expo-router";
import { vibrate, type VibrationStrength } from '@/vibration/haptics';

// UI Components
import NavigationBar from '@/components/NavigationBar';

import { request_MapsIdPath } from '@/api/api_maps_id_path';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const GRID_WIDTH = 8;
const GRID_HEIGHT = 8;
const JOYSTICK_RADIUS = 40;
const MAX_SPEED = 0.05;

export default function MapPage() {
  const rotation = useRef(new Animated.Value(0)).current;
  const joystickPan = useRef(new Animated.ValueXY()).current;

  const vibrationRunId = useRef(0);
  const isNorthRef = useRef(false);

  // Virtual position state
  const virtualPos = useRef({ x: 0, y: 0 });
  const joystickVelocity = useRef({ dx: 0, dy: 0 });

  const [safePath, setSafePath] = useState<[number, number][]>([]);
  const [targetIndex, setTargetIndex] = useState(0);

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
        console.error("Vibration failed:", error);
        stopVibration();
      }
    },
    [stopVibration],
  );

  useEffect(() => {
    const fetchPath = async () => {
      try {
        const response = await request_MapsIdPath(2, 0, 0, 7, 7);
        if (response && response.path) {
          setSafePath(response.path);
        }
      } catch (err) {
        console.error("Failed to fetch path:", err);
      }
    };
    fetchPath();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {

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
    })
  ).current;

  useEffect(() => {
    let animationFrameId: number;

    const updatePosition = () => {
      if (joystickVelocity.current.dx !== 0 || joystickVelocity.current.dy !== 0) {
        virtualPos.current.x += joystickVelocity.current.dx * MAX_SPEED;
        virtualPos.current.y += joystickVelocity.current.dy * MAX_SPEED;


        if (virtualPos.current.x < 0) virtualPos.current.x += GRID_WIDTH;
        if (virtualPos.current.x >= GRID_WIDTH) virtualPos.current.x -= GRID_WIDTH;
        if (virtualPos.current.y < 0) virtualPos.current.y += GRID_HEIGHT;
        if (virtualPos.current.y >= GRID_HEIGHT) virtualPos.current.y -= GRID_HEIGHT;

        if (safePath.length > 0 && targetIndex < safePath.length) {
          const target = safePath[targetIndex];
          const distToTarget = Math.sqrt(
            (target[0] - virtualPos.current.x) ** 2 +
            (target[1] - virtualPos.current.y) ** 2
          );
          if (distToTarget < 0.5 && targetIndex < safePath.length - 1) {
            setTargetIndex(prev => prev + 1);
          }
        }
      }
      animationFrameId = requestAnimationFrame(updatePosition);
    };

    updatePosition();
    return () => cancelAnimationFrame(animationFrameId);
  }, [safePath, targetIndex]);

  useEffect(() => {
    Magnetometer.setUpdateInterval(100);

    const subscription = Magnetometer.addListener((data) => {
      let { x, y } = data;
      let heading = Math.atan2(y, x) * (180 / Math.PI);
      heading = heading >= 0 ? heading : heading + 360;

      const isNorth = heading <= 20 || heading >= 340;

      if (isNorth && !isNorthRef.current) {
        isNorthRef.current = true;
        loopVibration('error');
      } else if (!isNorth && isNorthRef.current) {
        isNorthRef.current = false;
        stopVibration();
      }


      let arrowRotationAngle = -heading;

      if (safePath.length > 0 && targetIndex < safePath.length) {
        const target = safePath[targetIndex];
        const dx = target[0] - virtualPos.current.x;

        const dy = target[1] - virtualPos.current.y;


        let bearingToTarget = Math.atan2(dx, -dy) * (180 / Math.PI);


        arrowRotationAngle = bearingToTarget - heading;
      }

      Animated.timing(rotation, {
        toValue: arrowRotationAngle,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      subscription.remove();
      stopVibration();
    };
  }, [rotation, loopVibration, stopVibration, safePath, targetIndex]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-720, -360, 0, 360, 720],
    outputRange: ["-720deg", "-360deg", "0deg", "360deg", "720deg"],
  });

  return (
    <View style={commonStyles.screen}>
      <View style={indexStyles.topFrame}>
        <View style={[indexStyles.map, { backgroundColor: "transparent" }]}></View>
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

        {/* Virtual Joystick */}
        <View style={localStyles.joystickBase}>
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              localStyles.joystickStick,
              { transform: joystickPan.getTranslateTransform() }
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
  }
});