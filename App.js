import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Importa tus pantallas
import InitialPage from './screens/InitialPage';
import Login from './screens/Login';
import Map from './screens/Map';
import SetupGPS from './screens/SetupGPS';
import CustomDrawerContent from './screens/CustomDrawerContent';
import NotificationsScreen from './screens/NotificationsScreen';
import SettingsScreen from './screens/SettingsScreen';
import MyAccountScreen from './screens/MyAccountScreen';
import HistoryScreen from './screens/HistoryScreen';
import ContainersDataScreen from './screens/ContainersDataScreen'; 
import ClientMap from './screens/ClientMap';
import IncidencesScreen from './screens/IncidencesScreen'; 
const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Define las pantallas que estarán dentro del Drawer Navigator
function DrawerScreens() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          width: Dimensions.get('window').width * 0.8,
        },
        headerShown: false,
        drawerActiveTintColor: '#158419',
        drawerInactiveTintColor: '#666',
        drawerActiveBackgroundColor: 'rgba(21, 132, 25, 0.1)',
        drawerLabelStyle: {
          marginLeft: 0,
          fontSize: 16,
        },
        drawerItemStyle: {
          marginVertical: 0,
          marginHorizontal: 0,
          borderRadius: 0,
          paddingHorizontal: 20,
        },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={Map}
        options={{ title: 'Home' }}
      />
      <Drawer.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Drawer.Screen
        name="Logout"
        component={Login}
        options={{ title: 'Logout' }}
      />
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator initialRouteName="InitialPage">
        <Stack.Screen
          name="InitialPage"
          component={InitialPage}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SetupGPS"
          component={SetupGPS}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MapScreenWithDrawer"
          component={DrawerScreens}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MyAccount"
          component={MyAccountScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ContainersDataScreen" 
          component={ContainersDataScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ClientMap" 
          component={ClientMap}
          options={{ headerShown: false }}
        />
         <Stack.Screen 
          name="IncidencesScreen" 
          component={IncidencesScreen}
          options={{ headerShown: false }}  
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
