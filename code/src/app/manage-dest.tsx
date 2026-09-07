import React, {useEffect, useState} from "react";
import {View,Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert} from "react-native";
import {useFonts} from "expo-font";
import AdminIcon from "@/assets/icons/admin.svg";
import {commonStyles} from "@/styles/commonStyles";
import NavigationBar from "@/components/NavigationBar";
import {request_GetUsers, request_CreateUser, request_UpdateUser, request_DeleteUser, UserData} from "@/api/api_users";

export default function ManageDestPage() {
    const [dests, setDests] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDest, setSelectedDest] = useState<UserData | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);

    const [fontsLoaded] = useFonts({
        "InstrumentSans-Regular": require("../../assets/fonts/InstrumentSans-VariableFont_wdth,wght.ttf"),
        "Inter-Regular": require("../../assets/fonts/Inter-VariableFont_opsz,wght.ttf")
    });

    useEffect(() => {
        fetchDests();
    }, []);

    const fetchDests = async () => {
        
    };

    return (
        <View style={commonStyles.screen}>

        </View>
    );
}