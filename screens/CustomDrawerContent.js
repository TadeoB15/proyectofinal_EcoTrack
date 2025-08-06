import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated // ✅ AGREGAR PARA ANIMACIONES
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import ApiService from '../services/ApiService';

const { width } = Dimensions.get('window');

export default function CustomDrawerContent(props) {
  // Estados básicos
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [todayStats, setTodayStats] = useState({
    collectionsToday: 0,
    activeRoute: null
  });

  // ✅ ESTADOS PARA ANIMACIONES
  const [animatedValues] = useState({
    home: new Animated.Value(1),
    route: new Animated.Value(1),
    history: new Animated.Value(1),
    incidents: new Animated.Value(1),
    notifications: new Animated.Value(1),
    settings: new Animated.Value(1),
  });

  useEffect(() => {
    loadUserData();
    loadTodayStats();
    
    // Actualizar cada minuto
    const interval = setInterval(() => {
      loadTodayStats();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // CARGAR DATOS DEL USUARIO DESDE LA BASE DE DATOS
  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Intentar obtener perfil desde API
      const profileResult = await ApiService.getUserProfile();
      
      if (profileResult.success) {
        setUserInfo(profileResult.profile);
      } else {
        // Fallback: usar datos guardados localmente
        const storedUser = await ApiService.getStoredUser();
        if (storedUser) {
          setUserInfo({
            username: storedUser.username || 'Unknown User',
            nombre: storedUser.nombre || 'Unknown',
            apellido: storedUser.apellido || 'User',
            email: storedUser.email || 'no-email@ecotrack.com',
            role: storedUser.role || 'user',
            userId: storedUser.id || 'N/A',
            company_name: 'EcoTrack Services'
          });
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      
      // Fallback con datos básicos
      const storedUser = await ApiService.getStoredUser();
      if (storedUser) {
        setUserInfo({
          username: storedUser.username || 'User',
          nombre: storedUser.nombre || 'Unknown',
          apellido: storedUser.apellido || 'User',
          email: storedUser.email || 'no-email@ecotrack.com',
          role: storedUser.role || 'user',
          userId: storedUser.id || 'N/A',
          company_name: 'EcoTrack Services'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // CARGAR ESTADÍSTICAS BÁSICAS DEL DÍA (solo para collectors)
  const loadTodayStats = async () => {
    try {
      const isCollector = await ApiService.isCollector();
      
      if (isCollector) {
        // Obtener ruta actual
        const routeResult = await ApiService.getCurrentRoute();
        if (routeResult.success && routeResult.route) {
          setTodayStats(prev => ({
            ...prev,
            activeRoute: routeResult.route
          }));
        }
      }
    } catch (error) {
      console.error('Error loading today stats:', error);
    }
  };

  // FUNCIÓN PARA LOGOUT
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => console.log('Logout cancelled')
        },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.logout();
              props.navigation.reset({
                index: 0,
                routes: [{ name: 'InitialPage' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              // Forzar navegación incluso si hay error
              props.navigation.reset({
                index: 0,
                routes: [{ name: 'InitialPage' }],
              });
            }
          }
        }
      ]
    );
  };

  // FUNCIÓN PARA OBTENER INICIALES DEL NOMBRE
  const getInitials = (nombre, apellido) => {
    const firstInitial = nombre ? nombre.charAt(0).toUpperCase() : 'U';
    const lastInitial = apellido ? apellido.charAt(0).toUpperCase() : 'U';
    return `${firstInitial}${lastInitial}`;
  };

  // FUNCIÓN PARA OBTENER COLOR DEL ROL
  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'collector': return '#158419';
      case 'admin': return '#FF9800';
      case 'employee': return '#2196F3';
      default: return '#666';
    }
  };

  // ✅ FUNCIÓN PARA NAVEGACIÓN CON ANIMACIÓN
  const navigateToScreen = (screenName, animationKey) => {
    // Animación de presionar
    Animated.sequence([
      Animated.timing(animatedValues[animationKey], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValues[animationKey], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();

    // Navegar después de la animación
    setTimeout(() => {
      props.navigation.navigate(screenName);
    }, 150);
  };

  // ✅ COMPONENTE PERSONALIZADO PARA ITEMS DEL MENÚ
  const CustomMenuItem = ({ iconSource, label, onPress, animationKey }) => (
    <Animated.View style={{ transform: [{ scale: animatedValues[animationKey] }] }}>
      <TouchableOpacity
        style={styles.customMenuItem}
        onPress={() => navigateToScreen(onPress, animationKey)}
        activeOpacity={0.7}
      >
        <Image source={iconSource} style={styles.customMenuIcon} />
        <Text style={styles.customMenuLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // MOSTRAR LOADING SI ESTÁ CARGANDO
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#158419" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <DrawerContentScrollView
      {...props}
      style={styles.drawerScrollView}
      contentContainerStyle={styles.drawerContentContainer}
      showsVerticalScrollIndicator={false}
    >
      
      {/* 🎨 HEADER CON GRADIENTE MODERNO */}
      <LinearGradient
        colors={['#158419', '#2E7D32', '#1B5E20']}
        style={styles.profileHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Patrón decorativo de fondo */}
        <View style={styles.backgroundPattern}>
          <View style={[styles.patternCircle, styles.patternCircle1]} />
          <View style={[styles.patternCircle, styles.patternCircle2]} />
          <View style={[styles.patternCircle, styles.patternCircle3]} />
        </View>

        {/* Avatar con iniciales o imagen */}
        <View style={styles.avatarContainer}>
          {userInfo?.photo ? (
            <Image
              source={{ uri: userInfo.photo }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>
                {getInitials(userInfo?.nombre, userInfo?.apellido)}
              </Text>
            </View>
          )}
          
          {/* Indicador de estado online */}
          <View style={[
            styles.statusIndicatorLarge,
            { backgroundColor: onlineStatus ? '#4CAF50' : '#FF5722' }
          ]} />
        </View>

        {/* Información del usuario */}
        <View style={styles.userInfoSection}>
          <Text style={styles.userName}>
            {userInfo?.nombre || 'Unknown'} {userInfo?.apellido || 'User'}
          </Text>
          <Text style={styles.userEmail}>
            {userInfo?.email || 'no-email@ecotrack.com'}
          </Text>
          
          {/* Badge del rol con color dinámico */}
          <View style={[
            styles.userRoleContainer,
            { backgroundColor: getRoleColor(userInfo?.role) }
          ]}>
            <Text style={styles.userRole}>
              {userInfo?.role?.toUpperCase() || 'USER'}
            </Text>
          </View>
        </View>

        {/* Información adicional para collectors */}
        {userInfo?.role === 'collector' && todayStats.activeRoute && (
          <View style={styles.activeRouteCard}>
            <Text style={styles.activeRouteLabel}>🚛 Active Route</Text>
            <Text style={styles.activeRouteValue}>
              {todayStats.activeRoute.route_id}
            </Text>
            <Text style={styles.activeRouteProgress}>
              {todayStats.activeRoute.completed_containers || 0}/
              {todayStats.activeRoute.containers?.length || 0} completed
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* ✅ MENÚ DE NAVEGACIÓN PERSONALIZADO SIN RECUADROS */}
      <View style={styles.customMenuContainer}>
        
        {/* 🏠 Home */}
        <CustomMenuItem
          iconSource={require('../assets/icons8-marcador-de-mapa-48.png')}
          label="Home"
          onPress="Home"
          animationKey="home"
        />

        {/* 📋 Route Preparation (solo para collectors) */}
        {userInfo?.role === 'collector' && (
          <CustomMenuItem
            iconSource={require('../assets/icons8-edit-property-48.png')}
            label="Route Preparation"
            onPress="RoutePreparation"
            animationKey="route"
          />
        )}

        {/* 📜 History */}
        <CustomMenuItem
          iconSource={require('../assets/icons8-test-passed-48.png')}
          label="History"
          onPress="History"
          animationKey="history"
        />

        {/* 🚨 Incidents */}
        <CustomMenuItem
          iconSource={require('../assets/icons8-alarmas-48.png')}
          label="Incidents"
          onPress="Incidences"
          animationKey="incidents"
        />

        {/* 🔔 Notifications */}
        <CustomMenuItem
          iconSource={require('../assets/icons8-notificación-de-tema-push-48.png')}
          label="Notifications"
          onPress="Notifications"
          animationKey="notifications"
        />

        {/* ⚙️ Settings */}
        <CustomMenuItem
          iconSource={require('../assets/icons8-settings-48.png')}
          label="Settings"
          onPress="Settings"
          animationKey="settings"
        />

        {/* Separador elegante */}
        <View style={styles.elegantSeparator}>
          <View style={styles.separatorLine} />
          <View style={styles.separatorDot} />
          <View style={styles.separatorLine} />
        </View>
        
        {/* Botón de logout moderno */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LinearGradient
            colors={['#FF5252', '#F44336']}
            style={styles.logoutGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Image
              source={require('../assets/icons8-logout-48.png')}
              style={styles.logoutIcon}
            />
            <Text style={styles.logoutText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

    </DrawerContentScrollView>
  );
}

//ESTILOS 
const styles = StyleSheet.create({
  drawerScrollView: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  drawerContentContainer: {
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  
  // LOADING
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },

  //  HEADER CON GRADIENTE
  profileHeader: {
    width: '100%',
    paddingVertical: 25,
    paddingHorizontal: 20,
    paddingTop: 60,
    alignItems: 'center',
    marginBottom: 0,
    position: 'relative',
    overflow: 'hidden',
  },

  //  PATRÓN DECORATIVO DE FONDO
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  patternCircle1: {
    width: 120,
    height: 120,
    top: -30,
    right: -40,
  },
  patternCircle2: {
    width: 80,
    height: 80,
    bottom: -20,
    left: -20,
  },
  patternCircle3: {
    width: 60,
    height: 60,
    top: '50%',
    right: 10,
  },

  // AVATAR MODERNO
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusIndicatorLarge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#fff',
  },

  // INFORMACIÓN DEL USUARIO
  userInfoSection: {
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 1,
    width: '100%',
    paddingHorizontal: 0,
  },
  userName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  userEmail: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  userRoleContainer: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  userRole: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // 🎨 CARD DE RUTA ACTIVA (solo para collectors)
  activeRouteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeRouteLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginBottom: 2,
  },
  activeRouteValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  activeRouteProgress: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // ✅ CONTENEDOR DE MENÚ PERSONALIZADO
  customMenuContainer: {
    paddingTop: 25,
    paddingHorizontal: 20, // ✅ MISMO ESPACIADO QUE EL HEADER
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  // ✅ ITEM DE MENÚ PERSONALIZADO SIN RECUADROS
  customMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16, // ✅ MÁS ESPACIO VERTICAL
    paddingHorizontal: 0, // ✅ SIN PADDING HORIZONTAL EXTRA
    width: '100%', // ✅ ANCHO COMPLETO
  },

  // ✅ ICONO PERSONALIZADO
  customMenuIcon: {
    width: 28, // ✅ ICONOS GRANDES
    height: 28,
    tintColor: '#158419',
    marginRight: 20, // ✅ BUENA SEPARACIÓN DEL TEXTO
  },

  // ✅ LABEL PERSONALIZADO
  customMenuLabel: {
    fontSize: 17, // ✅ TEXTO MÁS GRANDE
    color: '#333',
    fontWeight: '500',
    flex: 1, // ✅ OCUPA TODO EL ESPACIO DISPONIBLE
    textAlign: 'left', // ✅ ALINEADO A LA IZQUIERDA
  },

  // 🎨 SEPARADOR ELEGANTE
  elegantSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25, // ✅ MÁS ESPACIO VERTICAL
    marginHorizontal: 0, // ✅ SIN MARGIN HORIZONTAL EXTRA
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  separatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10,
  },

  // 🎨 BOTÓN DE LOGOUT MODERNO
  logoutButton: {
    marginHorizontal: 0, // ✅ SIN MARGIN HORIZONTAL EXTRA
    marginBottom: 20,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#FF5252',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  logoutIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
    marginRight: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});