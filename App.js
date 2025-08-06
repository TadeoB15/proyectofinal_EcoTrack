import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Dimensions, ActivityIndicator, Text } from 'react-native';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Importar servicios
import ApiService from './services/ApiService';

// Importar contextos
import { AuthProvider } from './context/AuthContext';

// Importar screens
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
import RoutePreparation from './screens/RoutePreparation';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// ==========================================
// DRAWER PARA COLLECTORS - CON PARÁMETROS SEGUROS
// ==========================================
function CollectorDrawerScreens() {
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
        options={{ title: 'Collector Map' }}
        initialParams={{}} // Parámetros iniciales seguros
      />
      <Drawer.Screen
        name="RoutePreparation"
        component={RoutePreparation}
        options={{ title: 'Route Preparation' }}
        initialParams={{}}
      />
      <Drawer.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'Collection History' }}
        initialParams={{}}
      />
      <Drawer.Screen
        name="Incidences"
        component={IncidencesScreen}
        options={{ title: 'Incidents' }}
        initialParams={{}}
      />
      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
        initialParams={{}}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
        initialParams={{}}
      />
    </Drawer.Navigator>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL CON MEJOR MANEJO DE ERRORES
// ==========================================
function AuthenticatedApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [initialRoute, setInitialRoute] = useState('InitialPage');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking authentication status...');
      
      // Verificar si hay token guardado
      const hasToken = await ApiService.loadStoredToken();
      
      if (hasToken) {
        // Obtener información del usuario guardada
        const user = await ApiService.getStoredUser();
        
        if (user && user.role) {
          console.log('✅ User authenticated:', user.username, 'Role:', user.role);
          setIsAuthenticated(true);
          setUserRole(user.role);
          
          // Determinar ruta inicial según el rol
          if (user.role === 'collector') {
            setInitialRoute('CollectorDrawer');
          } else if (user.role === 'employee') {
            setInitialRoute('ClientMap');
          } else {
            setInitialRoute('CollectorDrawer'); // Default para admin
          }
        } else {
          console.log('❌ No valid user data found');
          setIsAuthenticated(false);
          setInitialRoute('InitialPage');
        }
      } else {
        console.log('❌ No authentication token found');
        setIsAuthenticated(false);
        setInitialRoute('InitialPage');
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      setIsAuthenticated(false);
      setInitialRoute('InitialPage');
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#158419" />
        <Text style={styles.loadingText}>Verificando autenticación...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator 
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        {/* Pantallas de entrada y autenticación */}
        <Stack.Screen
          name="InitialPage"
          component={InitialPage}
        />
        <Stack.Screen
          name="Login"
          component={Login}
        />
        <Stack.Screen
          name="SetupGPS"
          component={SetupGPS}
        />
        
        {/* Pantallas para COLLECTORS */}
        <Stack.Screen
          name="CollectorDrawer"
          component={CollectorDrawerScreens}
        />
        
        {/* Pantallas para EMPLOYEES */}
        <Stack.Screen
          name="ClientMap"
          component={ClientMap}
        />
        
        {/* Pantallas adicionales compartidas */}
        <Stack.Screen
          name="MyAccount"
          component={MyAccountScreen}
        />
        <Stack.Screen
          name="ContainersDataScreen" 
          component={ContainersDataScreen}
        />
        
        {/* Pantalla independiente de incidencias para employees */}
        <Stack.Screen 
          name="IncidencesScreen" 
          component={IncidencesScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ==========================================
// NAVEGADOR PRINCIPAL
// ==========================================
export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});