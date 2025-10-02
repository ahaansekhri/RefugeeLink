// src/navigation/StackLayout.jsx

import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";

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

const RefugeeTabs = () => {
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

const DrawerNavigator = ({ role }) => {
  const navigation = useNavigation();

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

  return (
    <Drawer.Navigator initialRouteName="MainTabs">
      <Drawer.Screen
        name="MainTabs"
        component={role === 'ngo' ? NGOTabs : RefugeeTabs}
        options={{ title: 'Home' }}
      />
      <Drawer.Screen
        name="Logout"
        component={View} // dummy component
        options={{
          title: 'Logout',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="log-out-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          drawerItemPress: (e) => {
            e.preventDefault();
            handleLogout();
          },
        }}
      />
    </Drawer.Navigator>
  );
};

export default function StackLayout() {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setRole(docSnap.data().role);
          } else {
            setRole(null);
          }
        } catch (error) {
          console.error("Error fetching role:", error);
        }
      } else {
        setRole(null);
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
        {user ? (
          <Stack.Screen name="Drawer">
            {() => <DrawerNavigator role={role} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="LoginRegister" component={LoginRegister} />
        )}
      </Stack.Navigator>
  );
}
