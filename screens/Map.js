import React, { useState, useEffect, useRef } from 'react';
import ApiService from '../services/ApiService';
import RouteService from '../services/RouteService';
import NavigationService from '../services/NavigationService';
import { 
  StyleSheet, 
  Text, 
  View, 
  Dimensions, 
  Image, 
  TouchableOpacity, 
  FlatList, 
  Animated, 
  PanResponder,
  Modal,
  Alert,
  ActivityIndicator 
} from 'react-native';
import OSMMapView from '../components/OSMMapView';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

const BOTTOM_SHEET_HEIGHT = height * 0.33;
const STATUS_SHEET_HEIGHT = height * 0.6;
const MIN_BOTTOM_SHEET_HEIGHT = 0; 

export default function Map({ navigation, route }) { 
  // Manejar route de forma segura
  const routeParams = route?.params || {};
  const routeData = routeParams.routeData || null;
  
  const mapRef = useRef(null);

  const [origin, setOrigin] = useState({
    latitude: 32.46112324200113,
    longitude: -116.82542748158332,
  });

  // Estados para datos del backend
  const [assignments, setAssignments] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentRoute, setCurrentRoute] = useState(routeData);
  const [routeContainers, setRouteContainers] = useState(routeData?.containers || []);
  const [completedContainers, setCompletedContainers] = useState([]);
  const [routePaused, setRoutePaused] = useState(false);

  // Estados para UI
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [isRouteStarted, setIsRouteStarted] = useState(false);
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);
  const [showFinishSuccess, setShowFinishSuccess] = useState(false);

  // Estados para contenedores
  const [containersByCompany, setContainersByCompany] = useState({});
  const [loadingContainers, setLoadingContainers] = useState(false);

  // Estados para navegación
  const [isNavigating, setIsNavigating] = useState(false);
  const [routePolyline, setRoutePolyline] = useState([]);
  const [locationTracking, setLocationTracking] = useState(false);
  const [nextWaypoint, setNextWaypoint] = useState(null);
  const [routeInstructions, setRouteInstructions] = useState([]);
  const [recalculating, setRecalculating] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  const panY = React.useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current;

  // ✅ CONFIGURAR PANRESPONDER
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (event, gestureState) => {
      panY.setValue(Math.max(0, gestureState.dy));
    },
    onPanResponderRelease: (event, gestureState) => {
      if (gestureState.dy > 50) {
        setShowCompanyMenu(false);
        setShowStatusMenu(false);
      }
      Animated.spring(panY, {
        toValue: 0,
        useNativeDriver: false
      }).start();
    },
  });

  // ✅ SOLICITAR PERMISOS DE UBICACIÓN AL INICIAR
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Cargar datos de ruta si vienen en los parámetros
  useEffect(() => {
    if (routeData && routeData.started) {
      console.log('✅ Route data received in Map:', routeData);
      setCurrentRoute(routeData);
      setRouteContainers(routeData.containers || []);
      setIsRouteStarted(true);
      
      Alert.alert(
        'Ruta Iniciada 🚛',
        `Ruta ${routeData.route_id} con ${routeData.containers?.length || 0} contenedores`,
        [{ text: 'OK' }]
      );
    }
  }, [routeData]);

  useEffect(() => {
    loadUserData();
    loadAssignments();
    loadCompanyLocations();
  }, []);

  // ✅ NUEVA FUNCIÓN PARA SOLICITAR PERMISOS DE UBICACIÓN
  const requestLocationPermission = async () => {
  try {
    console.log('📍 Requesting location permission...');
    
    // ✅ LÍNEA SIMPLE PARA SOLICITAR TODOS LOS PERMISOS
    await Location.requestForegroundPermissionsAsync();
    setLocationPermissionGranted(true);
    await getCurrentLocation();
    
  } catch (error) {
    console.log('❌ Error:', error);
    setLocationPermissionGranted(false);
  }
};

  // ✅ FUNCIÓN PARA OBTENER UBICACIÓN ACTUAL
  const getCurrentLocation = async () => {
    try {
      if (!locationPermissionGranted) {
        console.log('⚠️ Location permission not granted, skipping location update');
        return;
      }

      console.log('🗺️ Getting current location...');
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
      });

      const newOrigin = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setOrigin(newOrigin);
      console.log('✅ Location updated:', newOrigin);

      // Centrar el mapa en la ubicación actual
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...newOrigin,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }, 1000);
      }

    } catch (error) {
      console.error('❌ Error getting current location:', error);
      
      Alert.alert(
        '📍 Ubicación no disponible',
        'No se pudo obtener tu ubicación actual. Usando ubicación por defecto.',
        [{ text: 'OK' }]
      );
    }
  };

  const loadUserData = async () => {
    try {
      const user = await ApiService.getStoredUser();
      if (user) {
        setUserInfo(user);
        console.log('✅ User loaded in Map:', user.username);
      } else {
        console.log('❌ No user data found, redirecting to login');
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      navigation.replace('Login');
    }
  };

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const result = await ApiService.getAssignments();
      
      if (result.success && result.assignments) {
        setAssignments(result.assignments);
        console.log('✅ Assignments loaded:', result.assignments.length);
      } else {
        console.log('❌ No assignments found');
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Datos mock para empresas
  const companyLocations = [
    { 
      id: 'COMP-001', 
      name: 'Empresa de Recolección S.A.', 
      latitude: 32.465100, 
      longitude: -116.820100,
      distance: '1.2 km'
    },
    { 
      id: 'COMP-002', 
      name: 'Tech Solutions Inc', 
      latitude: 32.455100, 
      longitude: -116.835100,
      distance: '2.8 km'
    }
  ];

  const loadCompanyLocations = async () => {
    console.log('📍 Company locations loaded:', companyLocations.length);
  };

  // Función para cargar contenedores de una empresa
  const loadContainersForCompany = async (companyId) => {
    try {
      setLoadingContainers(true);
      console.log(`📦 Loading containers for company: ${companyId}`);
      
      const result = await ApiService.getCompanyContainers(companyId);
      
      if (result.success && result.containers) {
        setContainersByCompany(prev => ({
          ...prev,
          [companyId]: result.containers.map(container => ({
            ...container,
            id: container.container_id,
            percentage: container.latest_sensor_data?.fill_level || 0
          }))
        }));
        
        console.log(`✅ Loaded ${result.containers.length} containers for ${companyId}`);
      } else {
        // Datos mock como fallback
        const mockContainers = [
          {
            id: 'CTN-001',
            container_id: 'CTN-001',
            type: 'biohazard',
            location: { latitude: 32.465100, longitude: -116.820100 },
            percentage: 85
          },
          {
            id: 'CTN-002',
            container_id: 'CTN-002',
            type: 'normal',
            location: { latitude: 32.465200, longitude: -116.820200 },
            percentage: 78
          }
        ];
        
        setContainersByCompany(prev => ({
          ...prev,
          [companyId]: mockContainers
        }));
        
        console.log(`⚠️ Using mock data for ${companyId}`);
      }
    } catch (error) {
      console.error('Error loading containers:', error);
    } finally {
      setLoadingContainers(false);
    }
  };

  // FUNCIONES DE MANEJO DE EMPRESA
  const handleCompanyMarkerPress = (company) => {
    setSelectedCompany(company);
    setShowCompanyMenu(true);
    setShowRoute(false);
    console.log('🏢 Company selected:', company.name);
  };

  const handleSelectCompany = () => {
    if (selectedCompany) {
      setShowRoute(true);
      setShowCompanyMenu(false);
      loadContainersForCompany(selectedCompany.id);
      console.log('✅ Company route activated:', selectedCompany.name);
    }
  };

  // Función para iniciar navegación
  const startNavigationToCompany = async () => {
    if (!selectedCompany || !containersByCompany[selectedCompany.id]) {
      Alert.alert('Error', 'Please select a company and containers first');
      return;
    }

    if (!locationPermissionGranted) {
      Alert.alert(
        'Permisos Requeridos',
        'Necesitas habilitar los permisos de ubicación para usar la navegación.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Habilitar', onPress: requestLocationPermission }
        ]
      );
      return;
    }

    try {
      setRecalculating(true);
      
      const containers = containersByCompany[selectedCompany.id];
      const destinations = containers.map(container => ({
        id: container.container_id,
        latitude: container.location.latitude,
        longitude: container.location.longitude,
        type: container.type,
        percentage: container.percentage
      }));

      console.log(`🧭 Starting navigation to ${destinations.length} containers...`);

      const result = await NavigationService.startNavigation(destinations, {
        onNavigationStart: ({ route, initialPosition }) => {
          setCurrentRoute(route);
          setRoutePolyline(route.coordinates);
          setIsNavigating(true);
          setLocationTracking(true);
          
          Alert.alert(
            '🗺️ Navigation Started',
            `Route calculated: ${route.distance}km - ${route.duration} minutes`,
            [{ text: 'Start Driving', onPress: () => setShowRoute(true) }]
          );
        },
        
        onLocationUpdate: ({ position, distanceMoved }) => {
          setOrigin(position);
        },
        
        onRouteRecalculated: ({ newRoute, reason }) => {
          console.log('🔄 Route recalculated:', reason);
          setCurrentRoute(newRoute);
          setRoutePolyline(newRoute.coordinates);
          
          Alert.alert(
            '🔄 Route Updated',
            'Your route has been recalculated due to deviation',
            [{ text: 'Continue' }]
          );
        },
        
        onDestinationReached: ({ destination, remainingDestinations }) => {
          Alert.alert(
            '🎯 Destination Reached',
            `Arrived at ${destination.id}. ${remainingDestinations} remaining.`,
            [{ text: 'Continue' }]
          );
        },
        
        onNavigationComplete: () => {
          Alert.alert(
            '🏁 Navigation Complete',
            'All destinations reached!',
            [{ text: 'Finish', onPress: stopNavigation }]
          );
        }
      });
      
      if (result.success) {
        console.log('✅ Navigation started successfully');
      }
      
    } catch (error) {
      console.error('❌ Error starting navigation:', error);
      Alert.alert(
        'Navigation Error', 
        `Could not start navigation: ${error.message}`,
        [
          { 
            text: 'Use Basic Route', 
            onPress: () => handleSelectCompany()
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setRecalculating(false);
    }
  };

  // Función para detener navegación
  const stopNavigation = async () => {
    await NavigationService.stopNavigation();
    setIsNavigating(false);
    setLocationTracking(false);
    setCurrentRoute(null);
    setRoutePolyline([]);
    setRouteInstructions([]);
    setNextWaypoint(null);
    
    Alert.alert('Navigation Stopped', 'You can start a new route anytime');
  };

  // FUNCIONES DE RUTA
  const handleStartRoute = () => {
    if (isNavigating) {
      Alert.alert(
        'Navigation Active',
        'You are currently navigating. What would you like to do?',
        [
          { text: 'Continue', style: 'cancel' },
          { text: 'Stop Navigation', onPress: stopNavigation, style: 'destructive' }
        ]
      );
    } else if (isRouteStarted) {
      handleFinishRoute();
    } else {
      navigation.navigate('RoutePreparation', {
        assignmentData: assignments
      });
    }
  };

  const handlePauseRoute = () => {
    setRoutePaused(true);
    NavigationService.pauseNavigation();
    Alert.alert('Route Paused', 'You can resume the route anytime');
  };

  const handleResumeRoute = async () => {
    setRoutePaused(false);
    await NavigationService.resumeNavigation();
    Alert.alert('Route Resumed', 'Continue with your collection route');
  };

  const handleFinishRoute = () => {
    setShowFinishConfirmation(true);
  };

  const handleCancelFinishRoute = () => {
    setShowFinishConfirmation(false);
  };

  const handleConfirmFinishRoute = async () => {
    try {
      if (!currentRoute || !currentRoute.route_id) {
        Alert.alert('Error', 'No active route to finish');
        setShowFinishConfirmation(false);
        return;
      }

      console.log('🏁 Finishing route:', currentRoute.route_id);
      
      const result = await ApiService.finishRoute(currentRoute.route_id);
      
      if (result.success) {
        setShowFinishConfirmation(false);
        setShowFinishSuccess(true);
        console.log('✅ Route finished successfully');
      } else {
        Alert.alert('Error', 'Could not finish route');
        setShowFinishConfirmation(false);
      }
    } catch (error) {
      console.error('Error finishing route:', error);
      Alert.alert('Error', 'Could not finish route');
      setShowFinishConfirmation(false);
    }
  };

  const handleFinishRouteSuccess = () => {
    setShowFinishSuccess(false);
    setCurrentRoute(null);
    setRouteContainers([]);
    setCompletedContainers([]);
    setIsRouteStarted(false);
    setRoutePaused(false);
    
    if (isNavigating) {
      stopNavigation();
    }
  };

  // OTRAS FUNCIONES
  const handleContainerPress = (container) => {
    console.log('📦 Container pressed:', container.id);
    
    navigation.navigate('ContainersDataScreen', {
      containerId: container.id || container.container_id,
      containerData: container,
      isInRoute: isRouteStarted,
      routeId: currentRoute?.route_id,
      onContainerCompleted: (containerId) => {
        setCompletedContainers(prev => [...prev, containerId]);
      }
    });
  };

  const handleStatus = () => {
    setShowCompanyMenu(false);
    setShowStatusMenu(true);
    
    if (selectedCompany && !containersByCompany[selectedCompany.id]) {
      loadContainersForCompany(selectedCompany.id);
    }
  };

  const handleIncidences = () => {
    navigation.navigate('IncidencesScreen', {
      companyId: selectedCompany?.id,
      companyName: selectedCompany?.name
    });
  };

  const handleOptions = () => {
    Alert.alert('Options', 'More options coming soon');
  };

  const handleSelectAnother = () => {
    setShowRoute(false);
    setSelectedCompany(null);
    setContainersByCompany({});
  };

  // ✅ FUNCIÓN ACTUALIZADA PARA RECENTRAR MAPA
  const handleRecenterMap = async () => {
    try {
      // Verificar permisos primero
      if (!locationPermissionGranted) {
        await requestLocationPermission();
        return;
      }

      await getCurrentLocation();
      
    } catch (error) {
      console.error('Error recentering map:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación actual');
    }
  };

  const handleOpenDrawer = () => {
    navigation.openDrawer();
  };

  // FUNCIONES DE ICONOS
  const getContainerIcon = (type) => {
    return type === 'biohazard' 
      ? require('../assets/toxictrash.png')
      : require('../assets/trashcanMenu.png');
  };

  // RENDERIZAR ITEMS DE CONTENEDOR
  const renderContainerItem = ({ item }) => {
    const getContainerColor = (type, percentage) => {
      if (type === 'biohazard') {
        return percentage > 80 ? '#FF4444' : '#FF8800';
      } else {
        return percentage > 80 ? '#FF6600' : '#4CAF50';
      }
    };

    return (
      <TouchableOpacity
        style={styles.containerListItem}
        onPress={() => handleContainerPress(item)}
      >
        <Image
          source={getContainerIcon(item.type)}
          style={[
            styles.containerListIcon,
            { tintColor: getContainerColor(item.type, item.percentage) }
          ]}
        />
        <View style={styles.containerListInfo}>
          <Text style={styles.containerListId}>{item.container_id}</Text>
          <Text style={[
            styles.containerListPercentage,
            { color: getContainerColor(item.type, item.percentage) }
          ]}>
            {Math.round(item.percentage || 0)}% • {item.type?.toUpperCase()}
          </Text>
          {item.device_id && (
            <Text style={styles.containerDeviceId}>
              Device: {item.device_id}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.containerOptionsButton}>
          <Image
            source={require('../assets/other-2.png')}
            style={styles.containerOptionsIcon}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#158419" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ MOSTRAR MENSAJE SI NO HAY PERMISOS DE UBICACIÓN */}
      {!locationPermissionGranted && (
        <View style={styles.permissionWarning}>
          <Text style={styles.permissionWarningText}>
            📍 Los permisos de ubicación son necesarios para la funcionalidad completa
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={requestLocationPermission}
          >
            <Text style={styles.permissionButtonText}>Habilitar Ubicación</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Header de navegación activa */}
      {isNavigating && nextWaypoint && (
        <View style={styles.navigationHeader}>
          <View style={styles.navigationInfo}>
            <Text style={styles.navigationDistance}>
              {nextWaypoint.distanceToWaypoint}m to next container
            </Text>
            <Text style={styles.navigationInstruction}>
              {routeInstructions[0]?.instruction || 'Continue straight'}
            </Text>
          </View>
          {recalculating && (
            <ActivityIndicator size="small" color="#fff" />
          )}
        </View>
      )}

      {/* Header de ruta activa existente */}
      {currentRoute && isRouteStarted && !isNavigating && (
        <View style={styles.activeRouteHeader}>
          <View style={styles.routeInfoContainer}>
            <Text style={styles.routeTitle}>{currentRoute.route_id}</Text>
            <Text style={styles.routeProgress}>
              {completedContainers.length}/{routeContainers.length} completed
            </Text>
          </View>
          {routePaused && (
            <View style={styles.pausedBadge}>
              <Text style={styles.pausedText}>PAUSED</Text>
            </View>
          )}
        </View>
      )}

      <OSMMapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={locationPermissionGranted}
        followsUserLocation={locationTracking && locationPermissionGranted}
        zoomEnabled={true}
        scrollEnabled={true}
      >
        {/* Marcador del usuario */}
        <OSMMapView.Marker
          coordinate={origin}
          anchor={{ x: 0.5, y: 0.5 }}
          zIndex={1000}
        >
          <View style={styles.userLocationMarker}>
            <Image
              source={require('../assets/icons8-navegación-48.png')}
              style={styles.userArrowIcon}
            />
          </View>
        </OSMMapView.Marker>

        {/* Polyline de navegación */}
        {routePolyline.length > 0 && (
          <OSMMapView.Polyline
            coordinates={routePolyline}
            strokeColor="#2196F3"
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Círculo de área del usuario */}
        <OSMMapView.Circle
          center={origin}
          radius={500}
          strokeWidth={2}
          strokeColor="rgba(21, 132, 25, 0.8)"
          fillColor="rgba(21, 132, 25, 0.15)"
        />

        {/* Marcadores de contenedores de la ruta activa */}
        {isRouteStarted && routeContainers.map((container, index) => {
          const isCompleted = completedContainers.includes(container.id);
          return (
            <OSMMapView.Marker
              key={container.id}
              coordinate={{ 
                latitude: container.location.latitude, 
                longitude: container.location.longitude 
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => handleContainerPress(container)} 
            >
              <View style={[
                styles.routeContainerMarker,
                isCompleted && styles.completedContainerMarker
              ]}>
                <Text style={styles.containerOrderNumber}>{index + 1}</Text>
                <Image
                  source={getContainerIcon(container.type)}
                  style={[
                    styles.containerIcon,
                    isCompleted && styles.completedContainerIcon
                  ]}
                />
              </View>
            </OSMMapView.Marker>
          );
        })}

        {/* Marcadores de empresas */}
        {!isRouteStarted && !showRoute && companyLocations.map(company => (
          <OSMMapView.Marker
            key={company.id}
            coordinate={{ latitude: company.latitude, longitude: company.longitude }}
            onPress={() => handleCompanyMarkerPress(company)}
          >
            <View style={styles.companyMarker}>
              <Image
                source={require('../assets/icons8-marcador-48.png')}
                style={styles.companyIcon}
              />
            </View>
          </OSMMapView.Marker>
        ))}

        {/* Marcadores de contenedores cuando se selecciona una empresa */}
        {showRoute && selectedCompany && containersByCompany[selectedCompany.id] && 
          containersByCompany[selectedCompany.id].map(container => (
            <OSMMapView.Marker
              key={container.id}
              coordinate={{ latitude: container.location.latitude, longitude: container.location.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => handleContainerPress(container)} 
            >
              <View style={styles.containerMarker}>
                <Image
                  source={getContainerIcon(container.type)}
                  style={styles.containerIcon}
                />
              </View>
            </OSMMapView.Marker>
          ))
        }

        {/* Ruta hacia la empresa seleccionada */}
        {showRoute && selectedCompany && !isNavigating && (
          <OSMMapView.Polyline
            coordinates={[
              origin, 
              { latitude: selectedCompany.latitude, longitude: selectedCompany.longitude }
            ]}
            strokeColor="#4CAF50"
            strokeWidth={4}
          />
        )}

        {/* Polyline para la ruta activa */}
        {isRouteStarted && routeContainers.length > 1 && (
          <OSMMapView.Polyline
            coordinates={[
              origin,
              ...routeContainers.map(container => ({
                latitude: container.location.latitude,
                longitude: container.location.longitude
              }))
            ]}
            strokeColor="#2196F3"
            strokeWidth={4}
            strokePattern={[5, 5]}
          />
        )}
      </OSMMapView>

      {/* Foto del usuario */}
      <TouchableOpacity
        style={styles.userPhotoContainer}
        onPress={handleOpenDrawer}
      >
        <Image
          source={require('../assets/icons8-profile-48.png')} 
          style={styles.userPhoto}
        />
      </TouchableOpacity>

      {/* Botón Start/Finish Route */}
      <TouchableOpacity
        style={[
          styles.startButton,
          isNavigating && styles.navigatingButton,
          isRouteStarted && !routePaused && styles.activeRouteButton,
          routePaused && styles.pausedRouteButton
        ]}
        onPress={routePaused ? handleResumeRoute : handleStartRoute}
      >
        <Text style={styles.startButtonText}>
          {recalculating 
            ? 'Calculating Route...'
            : isNavigating 
              ? 'Stop Navigation'
              : routePaused 
                ? `Resume Route (${completedContainers.length}/${routeContainers.length})`
                : isRouteStarted 
                  ? `Route Progress (${completedContainers.length}/${routeContainers.length})`
                  : 'Plan Route'
          }
        </Text>
      </TouchableOpacity>

      {/* Botón de recentrar */}
      <TouchableOpacity
        style={styles.recenterButton}
        onPress={handleRecenterMap}
      >
        <Image
          source={require('../assets/icons8-center-of-gravity-48.png')}
          style={styles.recenterIcon}
        />
      </TouchableOpacity>

      {/* Botón para seleccionar otra empresa */}
      {showRoute && (
        <TouchableOpacity
          style={styles.selectAnotherButton}
          onPress={handleSelectAnother}
        >
          <Text style={styles.selectAnotherButtonText}>Select Another</Text>
        </TouchableOpacity>
      )}

      {/* Botón de navegación avanzada */}
      {showRoute && selectedCompany && !isNavigating && (
        <TouchableOpacity
          style={styles.navigationButton}
          onPress={startNavigationToCompany}
        >
          <Text style={styles.navigationButtonText}>🧭 Start Navigation</Text>
        </TouchableOpacity>
      )}

      {/* Modales */}
      <Modal
        visible={showFinishConfirmation}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <View style={styles.modalIconContainer}>
              <Image
                source={require('../assets/questionsign.png')}
                style={styles.modalIcon}
              />
            </View>
            <Text style={styles.modalTitle}>Are you sure?</Text>
            <Text style={styles.modalMessage}>Are you sure you will finish the route?</Text>
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={handleCancelFinishRoute}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmButton} 
                onPress={handleConfirmFinishRoute}
              >
                <Text style={styles.modalConfirmButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFinishSuccess}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.modalIconContainer}>
              <Image
                source={require('../assets/check.png')}
                style={styles.modalIcon}
              />
            </View>
            <Text style={styles.modalTitle}>Successful registration</Text>
            <Text style={styles.modalMessage}>The data have been correctly recorded</Text>
            
            <TouchableOpacity 
              style={styles.modalDoneButton} 
              onPress={handleFinishRouteSuccess}
            >
              <Text style={styles.modalDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Menú inferior de empresa seleccionada */}
      {showCompanyMenu && selectedCompany && (
        <Animated.View
          style={[
            styles.bottomSheet,
            { 
              transform: [{ translateY: panY }],
              height: BOTTOM_SHEET_HEIGHT
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.bottomSheetHandle} />
          
          <View style={styles.companyMenuContent}>
            <View style={styles.companyIconContainer}>
              <Image
                source={require('../assets/icons8-marcador-48.png')}
                style={styles.companyMenuIcon}
              />
            </View>
            
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{selectedCompany.name}</Text>
              <Text style={styles.companyDistance}>{selectedCompany.distance}</Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleIncidences}
              >
                <Image
                  source={require('../assets/icons8-alarmas-48.png')}
                  style={styles.actionButtonIcon}
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleStatus}
              >
                <Image
                  source={require('../assets/icons8-confirmar-48.png')}
                  style={styles.actionButtonIcon}
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleOptions}
              >
                <Image
                  source={require('../assets/icons8-tres-puntos-48.png')}
                  style={styles.actionButtonIcon}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.selectButton}
            onPress={handleSelectCompany}
          >
            <Text style={styles.selectButtonText}>Select</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Menú de status de contenedores */}
      {showStatusMenu && selectedCompany && (
        <Animated.View
          style={[
            styles.bottomSheet,
            { 
              transform: [{ translateY: panY }],
              height: STATUS_SHEET_HEIGHT
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.bottomSheetHandle} />
          
          <View style={styles.statusHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                setShowStatusMenu(false);
                setShowCompanyMenu(true);
              }}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.statusTitle}>Container Status</Text>
            <View style={styles.placeholder} />
          </View>

          {loadingContainers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#158419" />
              <Text style={styles.loadingText}>Loading containers...</Text>
            </View>
          ) : (
            <FlatList
              data={containersByCompany[selectedCompany.id] || []}
              renderItem={renderContainerItem}
              keyExtractor={item => item.container_id || item.id}
              style={styles.containerList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No containers found for this company</Text>
                </View>
              )}
            />
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },

  // ✅ NUEVOS ESTILOS PARA WARNING DE PERMISOS
  permissionWarning: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 152, 0, 0.95)',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    zIndex: 1000,
    elevation: 5,
  },
  permissionWarningText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  permissionButtonText: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Estilos existentes...
  activeRouteHeader: {
    position: 'absolute',
    top: 40,
    left: 80,
    right: 20,
    backgroundColor: 'rgba(33, 150, 243, 0.95)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  routeInfoContainer: {
    flex: 1,
  },
  routeTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  routeProgress: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  pausedBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pausedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  userLocationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#158419',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 1000,
  },
  userArrowIcon: {
    width: 30,
    height: 30,
    tintColor: '#fff',
  },
  companyMarker: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyIcon: {
    width: 35,
    height: 35,
  },
  containerMarker: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  routeContainerMarker: {
    width: 40,
    height: 40,
    backgroundColor: '#2196F3',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 3,
  },
  completedContainerMarker: {
    backgroundColor: '#4CAF50',
  },
  containerOrderNumber: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6600',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    width: 16,
    height: 16,
    borderRadius: 8,
    textAlign: 'center',
    lineHeight: 16,
    zIndex: 1,
  },
  containerIcon: {
    width: 25,
    height: 25,
    tintColor: '#fff',
  },
  completedContainerIcon: {
    tintColor: '#fff',
  },
  userPhotoContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff', 
    borderWidth: 2,
    borderColor: '#158419', 
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  userPhoto: {
    width: 30, 
    height: 30, 
    tintColor: '#158419', 
  },
  startButton: {
    position: 'absolute',
    bottom: 80,
    width: width * 0.8,
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  recenterButton: {
    position: 'absolute',
    bottom: 160,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  recenterIcon: {
    width: 25,
    height: 25,
    tintColor: '#333',
  },
  selectAnotherButton: {
    position: 'absolute',
    bottom: 220,
    alignSelf: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  selectAnotherButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  navigationButton: {
    position: 'absolute',
    bottom: 170,
    alignSelf: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  navigationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 10,
    paddingHorizontal: 20,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 5,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  companyMenuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    paddingHorizontal: 15,
  },
  companyIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    elevation: 1,
  },
  companyMenuIcon: {
    width: 30,
    height: 30,
    tintColor: '#158419',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  companyDistance: {
    fontSize: 13,
    color: '#158419',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButtonIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  selectButton: {
    backgroundColor: '#158419',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 25,
    elevation: 3,
    shadowColor: '#158419',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    elevation: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    color: '#158419',
    fontWeight: 'bold',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  containerList: {
    flex: 1,
    paddingHorizontal: 0,
  },
  containerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 0,
  },
  containerListIcon: {
    width: 32,
    height: 32,
    marginRight: 20,
    tintColor: '#158419',
  },
  containerListInfo: {
    flex: 1,
  },
  containerListId: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  containerListPercentage: {
    fontSize: 14,
    color: '#666',
  },
  containerOptionsButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerOptionsIcon: {
    width: 20,
    height: 20,
    tintColor: '#158419',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  confirmationModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  successModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    width: 50,
    height: 50,
    tintColor: '#fff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 15,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalDoneButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
  },
  modalDoneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activeRouteButton: {
    backgroundColor: '#2196F3',
  },
  pausedRouteButton: {
    backgroundColor: '#FF9800',
  },
  navigatingButton: {
    backgroundColor: '#FF5722',
  },
  navigationHeader: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(33, 150, 243, 0.95)',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
    elevation: 5,
  },
  navigationInfo: {
    flex: 1,
  },
  navigationDistance: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  navigationInstruction: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  containerDeviceId: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});