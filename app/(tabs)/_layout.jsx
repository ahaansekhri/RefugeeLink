// src/navigation/StackLayout.jsx

import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import AboutScreen from "./AboutScreen";
import AddEvent from "./AddEvent";
import EventScreen from "./EventScreen";
import ManageEventsScreen from "./ManageEventsScreen";
import MyEventsScreen from "./MyEventsScreen";
import NGOProfile from "./NGOProfile";
import NGOScreen from "./NGOScreen";
import LoginRegister from "./index";

import { auth } from '../../config/firebase';
import { Colors } from "../../constants/Colors";
import { useColorScheme } from "../../hooks/useColorScheme";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const db = getFirestore();

const JusticeTabs = () => {
  const colorScheme = useColorScheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].background,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
         if (route.name === "About") {
            iconName = focused ? "information-circle" : "information-circle-outline";
          } else if (route.name === "Event") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "My Events") {
            iconName = focused ? "bookmark" : "bookmark-outline";
          } else if (route.name === "NGO") {
            iconName = focused ? "people" : "people-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="About" component={AboutScreen} />
      <Tab.Screen name="Event" component={EventScreen} />
      <Tab.Screen name="My Events" component={MyEventsScreen} />
      <Tab.Screen name="NGO" component={NGOScreen} />
    </Tab.Navigator>
  );
};

const NGOTabs = () => {
  const colorScheme = useColorScheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].background,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Add Event") {
            iconName = focused ? "add-circle" : "add-circle-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "Manage Events") {
            iconName = focused ? "settings" : "settings-outline";
          } else {
            iconName = "ellipse";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Profile" component={NGOProfile} />
      <Tab.Screen name="Add Event" component={AddEvent} />
      <Tab.Screen name="Manage Events" component={ManageEventsScreen} />
      
    </Tab.Navigator>
  );
};

// Custom Drawer Content Component
const CustomDrawerContent = ({ role, user, userData, ...props }) => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? "light"];

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigation.replace("LoginRegister");
      })
      .catch((err) => {
        console.error("Logout Error:", err);
        Alert.alert("Error", "Failed to logout. Please try again.");
      });
  };

  const handleLoginRegisterPress = () => {
    if (!user) {
      navigation.navigate("LoginRegister");
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user && userData) {
      const name = userData.name || user.displayName || 'User';
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return '?';
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[
        styles.drawerContent,
        { backgroundColor: colors.background }
      ]}
    >
      {/* User Info Header */}
      <View style={[
        styles.userHeader,
        { backgroundColor: isDark ? '#1a1a1a' : '#007bff' }
      ]}>
        <TouchableOpacity
          onPress={handleLoginRegisterPress}
          activeOpacity={0.8}
          style={styles.userInfoContainer}
        >
          {user && userData ? (
            <>
              <View style={[
                styles.avatarContainer,
                { backgroundColor: isDark ? '#2d2d2d' : '#0056b3' }
              ]}>
                <Text style={styles.avatarText}>{getUserInitials()}</Text>
              </View>
              <View style={styles.userTextContainer}>
                <Text style={styles.userName} numberOfLines={1}>
                  {userData.name || user.displayName || 'User'}
                </Text>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {userData.email || user.email || ''}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={[
                styles.avatarContainer,
                { backgroundColor: isDark ? '#2d2d2d' : '#0056b3' }
              ]}>
                <Ionicons name="person-outline" size={28} color="#fff" />
              </View>
              <View style={styles.userTextContainer}>
                <Text style={styles.userName}>Login / Register</Text>
                <Text style={styles.userEmail}>Tap to sign in</Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Drawer Items */}
      <View style={styles.drawerItems}>
        <DrawerItemList {...props} />
      </View>

      {/* Logout Button */}
      {user && (
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={[
              styles.logoutButton,
              { backgroundColor: isDark ? '#2d2d2d' : '#f8f9fa' }
            ]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons
              name="log-out-outline"
              size={22}
              color={isDark ? '#ff4444' : '#dc3545'}
            />
            <Text style={[
              styles.logoutText,
              { color: isDark ? '#ff4444' : '#dc3545' }
            ]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </DrawerContentScrollView>
  );
};

const DrawerNavigator = ({ role, user, userData }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Drawer.Navigator
      initialRouteName="MainTabs"
      drawerContent={(props) => (
        <CustomDrawerContent
          {...props}
          role={role}
          user={user}
          userData={userData}
        />
      )}
      screenOptions={{
        drawerActiveTintColor: colors.tint,
        drawerInactiveTintColor: colors.icon,
        drawerStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={role === 'ngo' ? NGOTabs : JusticeTabs}
        options={{
          title: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      {!user && (
        <Drawer.Screen
          name="LoginRegister"
          component={LoginRegister}
          options={{
            title: 'Login / Register',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      )}
    </Drawer.Navigator>
  );
};

export default function StackLayout() {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setRole(data.role);
            setUserData({
              name: data.name || currentUser.displayName || '',
              email: data.email || currentUser.email || '',
            });
          } else {
            setRole(null);
            setUserData({
              name: currentUser.displayName || '',
              email: currentUser.email || '',
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setRole(null);
          setUserData({
            name: currentUser.displayName || '',
            email: currentUser.email || '',
          });
        }
      } else {
        setRole(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: Colors[colorScheme ?? "light"].background,
          },
        }}
      >
        <Stack.Screen name="Drawer">
          {() => <DrawerNavigator role={role} user={user} userData={userData} />}
        </Stack.Screen>
        <Stack.Screen name="LoginRegister" component={LoginRegister} />

      </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  userHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  drawerItems: {
    flex: 1,
    paddingTop: 10,
  },
  logoutContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
