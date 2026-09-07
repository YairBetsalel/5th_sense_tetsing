import { useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { RelativePathString, useRouter, usePathname } from "expo-router";

import MapIcon from "@/assets/icons/map.svg";
import SettingsIcon from "@/assets/icons/settings.svg";
import AdminIcon from "@/assets/icons/admin.svg";

// Temporarily using the map icon. To be changed later
import DestinationIcon from "@/assets/icons/map.svg";

import { commonStyles } from "@/styles/commonStyles";

const ACTIVE_COLOR = "#5cbdb9";
const INACTIVE_COLOR = "#A0AAB2";

type NavItem = {
    label: string;
    path: string;
    Icon: React.ComponentType<{ width: number; height: number; fill: string }>;
};

const NAV_ITEMS: NavItem[] = [
    { label: "Map", path: "/", Icon: MapIcon },
    { label: "Destination", path: "/destination", Icon: DestinationIcon},
    { label: "Settings", path: "/settings", Icon: SettingsIcon },
    { label: "System", path: "/admin", Icon: AdminIcon },
];

function NavButton({ item, isActive, onPress }: { item: NavItem; isActive: boolean; onPress: () => void }) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.85,
            useNativeDriver: true,
            speed: 40,
            bounciness: 6,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 40,
            bounciness: 6,
        }).start();
    };

    const color = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;

    return (
        <Pressable
            style={commonStyles.menuButton}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            hitSlop={12}
        >
            <Animated.View style={{ alignItems: "center", transform: [{ scale }] }}>
                <View
                    style={{
                        padding: 10,
                        borderRadius: 20,
                        backgroundColor: isActive ? "rgba(92, 189, 185, 0.15)" : "transparent",
                    }}
                >
                    <item.Icon width={24} height={24} fill={color} />
                </View>
                <Text
                    style={[
                        commonStyles.menuTitle,
                        { color, opacity: isActive ? 1 : 0.6 },
                    ]}
                >
                    {item.label}
                </Text>
            </Animated.View>
        </Pressable>
    );
}

export default function NavigationBar() {
    const router = useRouter();
    const pathname = usePathname();

    const onNavigate = (path: string) => {
        if (pathname === path) return;
        router.push(path as RelativePathString);
    };

    return (
        <View style={commonStyles.menuFrame}>
            {NAV_ITEMS.map((item) => (
                <NavButton
                    key={item.path}
                    item={item}
                    isActive={pathname === item.path}
                    onPress={() => onNavigate(item.path)}
                />
            ))}
        </View>
    );
}