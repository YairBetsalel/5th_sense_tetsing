import { Pressable, Text, View, ScrollView } from 'react-native';

import { commonStyles } from '@/styles/commonStyles';
import { settingsStyles } from '@/styles/settingsStyles';
import NavigationBar from '@/components/NavigationBar';

import { request_MapsId } from '@/api/api_maps_id';
import { request_MapsIdPath } from '@/api/api_maps_id_path';

export default function SettingsPage() {
    return (
        <View style={commonStyles.screen}>
            <ScrollView contentContainerStyle={settingsStyles.scrollContent}>

                <View style={settingsStyles.sectionFrame}>
                    <Text style={settingsStyles.sectionTitle}>API Debugging</Text>
                    <View style={{ gap: 12 }}>
                        <Pressable style={settingsStyles.button} onPress={() => request_MapsId(2)}>
                            <Text style={settingsStyles.buttonText}>Fetch Map Data /2</Text>
                        </Pressable>
                        <Pressable style={settingsStyles.button} onPress={() => request_MapsIdPath(2, 0, 0, 7, 7)}>
                            <Text style={settingsStyles.buttonText}>Fetch Path (0,0) to (7,7)</Text>
                        </Pressable>
                    </View>
                </View>

            </ScrollView>
            <NavigationBar />
        </View>
    );
}