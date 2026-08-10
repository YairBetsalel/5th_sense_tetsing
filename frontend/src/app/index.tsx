import { useEffect, useRef, useCallback } from "react";
import { View, Text, Animated, Easing } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { useFonts } from "expo-font";
import { Magnetometer } from 'expo-sensors';

import { commonStyles } from "@/styles/commonStyles";
import { indexStyles } from "@/styles/indexStyles";

import { useFocusEffect } from "expo-router";
import { vibrate, type VibrationStrength } from '@/vibration/haptics';
import { settingsStyles } from '@/styles/settingsStyles';

// UI Components
import NavigationBar from '@/components/NavigationBar';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function MapPage() {
  const rotation = useRef(new Animated.Value(0)).current;
  const vibrationRunId = useRef(0);
  const isNorthRef = useRef(false);

  const stopVibration = useCallback(() => {
    vibrationRunId.current += 1;
  }, []);

  // Loop vibration until the user stops it
  const loopVibration = useCallback(
    async (strength: VibrationStrength) => {
      stopVibration();

      const currentRunId = vibrationRunId.current;

      try {
        while (vibrationRunId.current === currentRunId) {
          await vibrate(strength);

          if (vibrationRunId.current !== currentRunId) {
            break;
          }

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

      Animated.timing(rotation, {
        toValue: -heading,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      subscription.remove();
      stopVibration();
    };
  }, [rotation, loopVibration, stopVibration]);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-360, 0, 360],
    outputRange: ["-360deg", "0deg", "360deg"],
  });

  return (
    <View style={commonStyles.screen}>
      <View style={indexStyles.topFrame}>
        <View style={[indexStyles.map, { backgroundColor: "transparent" }]}>
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