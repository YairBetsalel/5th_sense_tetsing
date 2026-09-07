import React, {useEffect, useState} from "react";
import {View,Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert} from "react-native";
import {useFonts} from "expo-font";
import AdminIcon from "@/assets/icons/admin.svg";
import {commonStyles} from "@/styles/commonStyles";
import NavigationBar from "@/components/NavigationBar";
import {request_GetUsers, request_CreateUser, request_UpdateUser, request_DeleteUser, UserData} from "@/api/api_users";

export default function ManageUsersPage() {
    // Initial settings
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);

    // Form states
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("admin");

    const [fontsLoaded] = useFonts({
        "InstrumentSans-Regular": require("../../assets/fonts/InstrumentSans-VariableFont_wdth,wght.ttf"),
        "Inter-Regular": require("../../assets/fonts/Inter-VariableFont_opsz,wght.ttf")
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        // Set loading status to be true when fetching user list
        setIsLoading(true);
        try{
            // Try to fetch user data
            const data = await request_GetUsers();
            setUsers(data);
        } catch (error) {
            // Catch any errors and output the errors
            console.error("Failed to fetch users", error);
            Alert.alert("Failed to load user list");
        } finally {
            // Once fetched the user list, set loading status to false
            setIsLoading(false);
        }
    };

    // For creating users
    const handleOpenCreate = () => {
        setSelectedUser(null);
        setUsername("");
        setEmail("");
        setPassword("");
        setRole("admin");
        setIsFormVisible(true);
    };

    // For edit user details
    const handleOpenEdit = (user: UserData) => {
        setSelectedUser(user);
        setUsername(user.username);
        setEmail(user.email);
        setPassword("");
        setRole(user.user_role);
        setIsFormVisible(true);
    };

    // For deleting user accounts
    const handleDelete = async (id: number) => {
      Alert.alert("Confirm Deletion", "Are you sure you want to delete this account?",
          [{text: "Cancel", style: "cancel"},
              {text: "Delete", style: "destructive", onPress: async () => {
                  try {
                      await request_DeleteUser(id);
                      fetchUsers();
                  } catch (error) {
                      Alert.alert("Error","Failed to delete the user");
                  }
                  }}
        ]
          );
    };

    // Save any edits
    const handleSave = async () => {
        // Make sure that username is entered
        if(!username) {
            Alert.alert("Error", "Username is required");
            return;
        }

        try {
            // Try to save the details on the server
            const payload: any = { username, email, user_role: role };
            if (password) payload.password = password;

            if (selectedUser) {
                await request_UpdateUser(selectedUser.id, payload);
            } else {
                if (!password) {
                    Alert.alert("Validation Error", "Password is required for new users.");
                    return;
                }
                await request_CreateUser(payload);
            }
            setIsFormVisible(false);
            fetchUsers();
        } catch (error: any) {
            // Show any errors
            Alert.alert("Error", error.message || "Failed to save user");
        }

    };

    if (!fontsLoaded) return null;

    // User interface
    return (
        <View style={commonStyles.screen}>
            <View style={styles.container}>
                {isFormVisible ? (
                    <View style={styles.card}>
                       <View style={styles.header}>
                            <View style={styles.iconWrapper}>
                                <AdminIcon width={28} height={28} fill="#5cbdb9"/>
                            </View>
                            <Text style={styles.title}>
                                {selectedUser ? "Edit User" : "Create User"}
                            </Text>
                        </View>


                        <View style={styles.form}>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Username</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter username"
                                    placeholderTextColor="#A0AAB2"
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter email"
                                    placeholderTextColor="#A0AAB2"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>


                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password {selectedUser && "(Leave blank to keep current)"}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter password"
                                    placeholderTextColor="#A0AAB2"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={true}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Role</Text>
                                <View style={styles.roleContainer}>
                                    <Pressable
                                        style={[styles.roleButton, role === "admin" && styles.roleButtonActive]}
                                        onPress={() => setRole("admin")}
                                    >


                                        <Text style={[styles.roleText, role === "admin" && styles.roleTextActive]}>Admin</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.roleButton, role === "superadmin" && styles.roleButtonActive]}
                                        onPress={() => setRole("superadmin")}
                                    >
                                        <Text style={[styles.roleText, role === "superadmin" && styles.roleTextActive]}>Superadmin</Text>
                                    </Pressable>
                                </View>
                            </View>

                            <Pressable style={styles.button} onPress={handleSave}>
                                <Text style={styles.buttonText}>Save Changes</Text>
                            </Pressable>

                            <Pressable style={[styles.button, styles.cancelButton]} onPress={() => setIsFormVisible(false)}>
                                <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
                            </Pressable>


                        </View>
                    </View>



                ) : (



                    <View style={[styles.card, { flex: 1, maxHeight: '85%' }]}>

                        <View style={styles.listHeader}>
                            <Text style={styles.title}>User Management</Text>
                            <Pressable style={styles.addButton} onPress={handleOpenCreate}>
                                <Text style={styles.addButtonText}>+ New</Text>
                            </Pressable>

                        </View>

                        {isLoading ? (
                            <ActivityIndicator size="large" color="#5cbdb9" style={{ marginTop: 40 }} />
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>

                                {users.map((user) => (

                                    <View key={user.id} style={styles.userRow}>


                                        <View style={styles.userInfo}>
                                            <Text style={styles.userName}>{user.username}</Text>
                                            <Text style={styles.userSub}>{user.email || 'No email'} • {user.user_role}</Text>
                                        </View>

                                        <View style={styles.actionButtons}>
                                            <Pressable style={styles.editBtn} onPress={() => handleOpenEdit(user)}>
                                                <Text style={styles.editBtnText}>Edit</Text>
                                            </Pressable>

                                            <Pressable style={styles.deleteBtn} onPress={() => handleDelete(user.id)}>
                                                <Text style={styles.deleteBtnText}>Delete</Text>
                                            </Pressable>
                                        </View>

                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>



                )}
            </View>

            <NavigationBar />
        </View>
    );


}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },

    card: {
        width: "100%",
        maxWidth: 380,
        backgroundColor: "#ffffff",
        borderRadius: 24,
        padding: 24,
        shadowColor: "#2C3E50",
        shadowOffset: { width: 0,
            height: 12 },
        shadowOpacity: 0.05,
        shadowRadius: 24,
        elevation: 8,
    },
    header: {
        alignItems: "center",
        marginBottom: 24,
    },

    listHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },

    iconWrapper: {
        padding: 16,
        backgroundColor: "rgba(92, 189, 185, 0.15)",
        borderRadius: 20,
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        fontFamily: "InstrumentSans-Regular",
        color: "#2C3E50",
    },
    addButton: {
        backgroundColor: "#5cbdb9",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontFamily: "InstrumentSans-Regular",
    },
    listContent: {
        gap: 12,
    },


    userRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#ebf6f5",
    },
    userInfo: {
        flex: 1,
    },

    userName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#2C3E50",
        fontFamily: "InstrumentSans-Regular",
        marginBottom: 4,
    },
    userSub: {
        fontSize: 13,
        color: "#A0AAB2",
        fontFamily: "Inter-Regular",
    },
    actionButtons: {
        flexDirection: "row",
        gap: 8,
    },
    editBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: "rgba(92, 189, 185, 0.15)",
        borderRadius: 6,
    },
    editBtnText: {
        color: "#5cbdb9",
        fontSize: 13,
        fontWeight: "bold",
    },
    deleteBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: "rgba(231, 76, 60, 0.1)",
        borderRadius: 6,
    },
    deleteBtnText: {
        color: "#e74c3c",
        fontSize: 13,
        fontWeight: "bold",
    },
    form: {
        gap: 16,
    },


    inputGroup: {
        gap: 6,
    },

    label: {
        fontSize: 13,
        fontWeight: "600",
        color: "#2C3E50",
        fontFamily: "Inter-Regular",
        marginLeft: 4,
    },

    input: {
        backgroundColor: "#ebf6f5",
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 52,
        fontSize: 15,
        color: "#2C3E50",
        fontFamily: "Inter-Regular",
    },

    roleContainer: {
        flexDirection: "row",
        gap: 8,
    },
    roleButton: {
        flex: 1,
        height: 48,
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    roleButtonActive: {
        backgroundColor: "rgba(92, 189, 185, 0.15)",
        borderColor: "#5cbdb9",
    },
    roleText: {
        color: "#A0AAB2",
        fontFamily: "Inter-Regular",
        fontWeight: "600",
    },

    roleTextActive: {
        color: "#5cbdb9",
    },

    button: {
        backgroundColor: "#5cbdb9",
        height: 52,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
    },

    buttonText: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "bold",
        fontFamily: "InstrumentSans-Regular",
        letterSpacing: 0.5,

    },

    cancelButton: {
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderColor: "#ebf6f5",
        marginTop: 0,
    },

    cancelText: {
        color: "#A0AAB2",
    },
});
