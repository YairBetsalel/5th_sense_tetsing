import { Pressable, Text, View } from 'react-native';
import { useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";

// iPhone Haptics API
import { vibrate } from '@/vibration/haptics';

// Styles
import { commonStyles } from '@/styles/commonStyles';
import { settingsStyles } from '@/styles/settingsStyles';

// UI Components
import NavigationBar from '@/components/NavigationBar';
import { request } from '@/api/client';

// API
import { request_MapsId } from '@/api/api_maps_id';

type VibrationStrength = "light" | "medium" | "heavy" | "soft" | "rigid" | "success" | "warning" | "error";

export default function SettingsPage() {
    const vibrationRunId = useRef(0);

    // Sleep for a specified number of milliseconds
    const sleep = (ms: number) =>
        new Promise<void>((resolve) => {
            setTimeout(resolve, ms);
    });

    // Stop the vibration loop
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

    useFocusEffect(
        useCallback(() => {
        // Execute when lose focus or remove the component from the screen.
            return () => {
                stopVibration();
            };
        }, [stopVibration]),
    );

    const requestMap2nd = async () => {
        const response = request_MapsId(2);
        console.log(response);
    }

    return (
        <View style={commonStyles.screen}>

            <View style={settingsStyles.sectionFrame}>
                <Text style={settingsStyles.sectionTitle}>Haptics Test</Text>

                <Pressable style={settingsStyles.blueButton} onPress={() => loopVibration('light')}>
                    <Text style={settingsStyles.buttonText}>Vibrate: Light</Text>
                </Pressable>
                <Pressable style={settingsStyles.blueButton} onPress={() => loopVibration('medium')}>
                    <Text style={settingsStyles.buttonText}>Vibrate: Medium</Text>
                </Pressable>
                <Pressable style={settingsStyles.blueButton} onPress={() => loopVibration('heavy')}>
                    <Text style={settingsStyles.buttonText}>Vibrate: Heavy</Text>
                </Pressable>
                <Pressable style={settingsStyles.blueButton} onPress={() => loopVibration('soft')}>
                    <Text style={settingsStyles.buttonText}>Vibrate: Soft</Text>
                </Pressable>
                <Pressable style={settingsStyles.blueButton} onPress={() => loopVibration('rigid')}>
                    <Text style={settingsStyles.buttonText}>Vibrate: Rigid</Text>
                </Pressable>
                <Pressable style={settingsStyles.greenButton} onPress={() => loopVibration('success')}>
                    <Text style={settingsStyles.buttonText}>Vibrate: Success</Text>
                </Pressable>
                <Pressable style={settingsStyles.yellowButton} onPress={() => loopVibration('warning')}>
                    <Text style={settingsStyles.buttonText}>Vibrate: Warning</Text>
                </Pressable>
                <Pressable style={settingsStyles.redButton} onPress={() => loopVibration('error')}>
                    <Text style={settingsStyles.buttonText}>Vibrate: Error</Text>
                </Pressable>
                <Pressable style={settingsStyles.redButton} onPress={() => stopVibration()}>
                    <Text style={settingsStyles.buttonText}>Stop Vibration</Text>
                </Pressable>
            </View>

            <View style={settingsStyles.sectionFrame}>
                <Text style={settingsStyles.sectionTitle}>Debug: API</Text>

                <Pressable style={settingsStyles.redButton} onPress={() => requestMap2nd()}>
                    <Text style={settingsStyles.buttonText}>/api/maps/2</Text>
                </Pressable>
            </View>

            {/* NavigationBar UI component: /components/NavigationBar.tsx */}
            <NavigationBar />
        </View>
    );
}