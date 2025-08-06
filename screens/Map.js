import React, { useState, useEffect, useRef } from 'react';
import ApiService from '../services/ApiService';
import RouteService from '../services/RouteService';
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
import OSMMapView from 'react-native-osm';
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

  //  NUEVOS ESTADOS PARA CONTENEDORES REALES
  const [containersByCompany, setContainersByCompany] = useState({});
  const [loadingContainers, setLoadingContainers] = useState(false);

  //  NUEVOS ESTADOS PARA OPENROUTESERVICE
  const [isNavigating, setIsNavigating] = useState(false);
  const [routePolyline, setRoutePolyline] = useState([]);
  const [locationTracking, setLocationTracking] = useState(false);
  const [nextWaypoint, setNextWaypoint] = useState(null);
  const [routeInstructions, setRouteInstructions] = useState([]);
  const [recalculating, setRecalculating] = useState(false);

  const panY = React.useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current;

  // Cargar datos de ruta si vienen en los parámetros
  useEffect(() => {
    if (routeData && routeData.started) {
      console.log('✅ Route data received in Map:', routeData);
      setCurrentRoute(routeData);
      setRouteContainers(routeData.containers || []);
      setIsRouteStarted(true);
      
      // Mostrar información de la ruta
      Alert.alert(
        'Ruta Iniciada 🚛',
        `Ruta ${routeData.route_id} con ${routeData.containers?.length || 0} contenedores`,
        [{ text: 'OK' }]
      );
    }
  }, [routeData]);

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
      const hasToken = await ApiService.loadStoredToken();
      
      if (!hasToken) {
        navigation.replace('Login');
        return;
      }

      const result = await ApiService.getAssignments();
      
      if (result.success) {
        setAssignments(result.assignments);
        updateCompanyLocations(result.assignments);
        console.log('✅ Assignments loaded:', result.assignments.length);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
      Alert.alert('Error', 'No se pudieron cargar las asignaciones');
    } finally {
      setLoading(false);
    }
  };

  // Cargar ruta actual si existe
  const loadCurrentRoute = async () => {
    if (routeData) return; // No cargar si ya viene una ruta de RoutePreparation
    
    try {
      const result = await ApiService.getCurrentRoute();
      if (result.success && result.route) {
        setCurrentRoute(result.route);
        setRouteContainers(result.route.containers || []);
        setIsRouteStarted(result.route.status === 'in_progress');
        setRoutePaused(result.route.status === 'paused');
      }
    } catch (error) {
      console.log('No current route found or error loading:', error.message);
    }
  };

  useEffect(() => {
    loadUserData();
    loadAssignments();
    loadCurrentRoute();
    requestLocationPermission();
  }, []);

  const updateCompanyLocations = (assignments) => {
    // Convertir asignaciones a formato de ubicaciones para el mapa
    const locations = assignments.flatMap(assignment => 
      assignment.companies?.map(companyId => ({
        id: companyId,
        name: `Company ${companyId}`,
        latitude: 32.465000 + Math.random() * 0.01, // Coordenadas de ejemplo
        longitude: -116.820000 + Math.random() * 0.01,
        distance: '2-5 min',
        containerCount: assignment.containers?.length || 0
      })) || []
    );
    
    setCompanyLocations(locations);
  };

  // Función de logout
  const handleLogout = async () => {
    try {
      await ApiService.logout();
      navigation.replace('Login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Ubicaciones de empresas/zonas de recolección (datos mock como fallback)
  const [companyLocations, setCompanyLocations] = useState([
    { 
      id: 'COMP-001', 
      name: 'Medtronic',
      latitude: 32.465000, 
      longitude: -116.820000,
      distance: '2 min',
      containerCount: 4
    },
    { 
      id: 'COMP-002', 
      name: 'Tech Solutions',
      latitude: 32.455000, 
      longitude: -116.835000,
      distance: '5 min',
      containerCount: 3
    },
    { 
      id: 'COMP-003', 
      name: 'Green Industries',
      latitude: 32.448000, 
      longitude: -116.810000,
      distance: '8 min',
      containerCount: 6
    },
  ]);

  // ✅ MEJORAR loadCompanyContainers CON MEJOR ERROR HANDLING
const loadCompanyContainers = async (companyId) => {
  try {
    setLoadingContainers(true);
    console.log(`📦 Loading containers for company: ${companyId}`);
    
    const result = await ApiService.getCompanyContainers(companyId);
    console.log(`🔍 Raw API response for ${companyId}:`, JSON.stringify(result, null, 2));
    
    if (result.success) {
      const containers = result.containers || [];
      
      if (containers.length === 0) {
        console.warn(`⚠️ No containers found for company ${companyId}`);
        Alert.alert(
          'No Containers',
          `No containers found for company ${companyId}`,
          [{ text: 'OK' }]
        );
        return [];
      }
      
      // ✅ PROCESAR Y VALIDAR DATOS CORRECTAMENTE
      const processedContainers = containers.map(container => {
        const processedContainer = {
          id: container.container_id || container.id,
          container_id: container.container_id || container.id,
          type: container.type || 'normal',
          capacity: container.capacity || 240,
          status: container.status || 'active',
          device_id: container.device_id,
          percentage: Math.round(Number(container.percentage) || 0), // ✅ ASEGURAR NÚMERO
          location: {
            latitude: Number(container.location?.latitude) || 32.465000,
            longitude: Number(container.location?.longitude) || -116.820000,
            address: container.location?.address || 'Address not available'
          },
          last_collection: container.last_collection,
          created_at: container.created_at
        };
        
        console.log(`✅ Processed container:`, {
          id: processedContainer.container_id,
          percentage: processedContainer.percentage,
          type: processedContainer.type
        });
        
        return processedContainer;
      });
      
      // Actualizar estado
      setContainersByCompany(prevState => ({
        ...prevState,
        [companyId]: processedContainers
      }));
      
      console.log(`✅ Successfully loaded ${processedContainers.length} containers for ${companyId}`);
      return processedContainers;
      
    } else {
      throw new Error(result.message || 'Failed to load containers');
    }
  } catch (error) {
    console.error(`❌ Error loading containers for company ${companyId}:`, error);
    
    Alert.alert(
      'Connection Error',
      `Could not load containers for ${companyId}: ${error.message}`,
      [
        { 
          text: 'Use Sample Data', 
          onPress: () => {
            const mockContainers = generateMockContainersForCompany(companyId);
            setContainersByCompany(prevState => ({
              ...prevState,
              [companyId]: mockContainers
            }));
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
    
    return [];
  } finally {
    setLoadingContainers(false);
  }
};

  // ✅ FUNCIÓN DE FALLBACK PARA GENERAR MOCK DATA
  const generateMockContainersForCompany = (companyId) => {
    const mockContainers = {
      'COMP-001': [
        { id: 'CTN-001', container_id: 'CTN-001', latitude: 32.465100, longitude: -116.820100, percentage: 75, type: 'biohazard' },
        { id: 'CTN-002', container_id: 'CTN-002', latitude: 32.465200, longitude: -116.820200, percentage: 90, type: 'normal' },
        { id: 'CTN-003', container_id: 'CTN-003', latitude: 32.465300, longitude: -116.820300, percentage: 60, type: 'normal' },
      ],
      'COMP-002': [
        { id: 'CTN-005', container_id: 'CTN-005', latitude: 32.455100, longitude: -116.835100, percentage: 85, type: 'biohazard' },
      ],
      'COMP-003': [
        { id: 'CTN-008', container_id: 'CTN-008', latitude: 32.448100, longitude: -116.810100, percentage: 80, type: 'normal' },
        { id: 'CTN-009', container_id: 'CTN-009', latitude: 32.448200, longitude: -116.810200, percentage: 70, type: 'normal' },
      ],
    };
    
    return mockContainers[companyId] || [];
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        getCurrentLocation();
      } else {
        Alert.alert(
          'Permisos de ubicación',
          'Se necesitan permisos de ubicación para usar el mapa',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error al solicitar permisos de ubicación:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const newOrigin = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setOrigin(newOrigin);
    } catch (error) {
      console.error('Error al obtener la ubicación:', error);
      // Mantener la ubicación por defecto si hay error
    }
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gestureState) => {
        if (gestureState.dy > 0) { 
          panY.setValue(gestureState.dy);
        } else { 
          panY.setValue(Math.max(0, gestureState.dy));
        }
      },
      onPanResponderRelease: (event, gestureState) => {
        const currentHeight = showStatusMenu ? STATUS_SHEET_HEIGHT : BOTTOM_SHEET_HEIGHT;
        if (gestureState.dy > currentHeight / 3) {
          Animated.timing(panY, {
            toValue: currentHeight,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setShowCompanyMenu(false);
            setShowStatusMenu(false);
            setSelectedCompany(null);
          });
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (showCompanyMenu || showStatusMenu) {
      const targetHeight = showStatusMenu ? STATUS_SHEET_HEIGHT : BOTTOM_SHEET_HEIGHT;
      Animated.spring(panY, {
        toValue: 0, 
        useNativeDriver: true,
      }).start();
    } else {
      const targetHeight = showStatusMenu ? STATUS_SHEET_HEIGHT : BOTTOM_SHEET_HEIGHT;
      Animated.timing(panY, {
        toValue: targetHeight, 
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showCompanyMenu, showStatusMenu]);

  const handleStartNavigation = async () => {
    if (!selectedCompany || !containersByCompany[selectedCompany.id]) {
      Alert.alert('Error', 'Please select a company and containers first');
      return;
    }

    try {
      setRecalculating(true);
      
      // Obtener contenedores como waypoints
      const containers = containersByCompany[selectedCompany.id];
      const waypoints = containers.map(container => ({
        id: container.container_id,
        latitude: container.location.latitude,
        longitude: container.location.longitude,
        type: container.type,
        percentage: container.percentage
      }));

      console.log(`🚗 Starting navigation to ${waypoints.length} containers...`);

      // Calcular ruta optimizada
      const route = await RouteService.getOptimizedRoute(origin, waypoints);
      
      if (route) {
        setCurrentRoute(route);
        setRoutePolyline(route.polylineCoordinates);
        setRouteInstructions(route.instructions);
        setIsNavigating(true);
        
        // Guardar ruta
        await RouteService.saveRoute(route);
        
        // Iniciar tracking de ubicación
        startLocationTracking();
        
        Alert.alert(
          '🗺️ Navigation Started',
          `Route calculated: ${route.summary.totalDistance} - ${route.summary.estimatedTime}`,
          [{ text: 'Start Driving', onPress: () => setShowRoute(true) }]
        );
        
      } else {
        throw new Error('Could not calculate route');
      }
      
    } catch (error) {
      console.error('❌ Error starting navigation:', error);
      Alert.alert(
        'Navigation Error', 
        `Could not start navigation: ${error.message}`,
        [
          { 
            text: 'Use Basic Route', 
            onPress: () => handleSelectCompany() // Fallback al método anterior
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setRecalculating(false);
    }
  };

  // NUEVA FUNCIÓN: TRACKING DE UBICACIÓN EN TIEMPO REAL
  const startLocationTracking = () => {
    setLocationTracking(true);
    
    RouteService.startLocationTracking(
      // Callback para actualización de posición
      (newPosition) => {
        setOrigin(newPosition);
        
        // Actualizar siguiente waypoint
        if (currentRoute) {
          const next = RouteService.getNextWaypoint(newPosition, currentRoute);
          setNextWaypoint(next);
        }
      },
      // Callback para recalculación de ruta
      (recalculation) => {
        if (recalculation.recalculated) {
          console.log('🔄 Route recalculated due to:', recalculation.reason);
          setCurrentRoute(recalculation);
          setRoutePolyline(recalculation.polylineCoordinates);
          setRouteInstructions(recalculation.instructions);
          
          Alert.alert(
            '🔄 Route Updated',
            'Your route has been recalculated due to deviation',
            [{ text: 'Continue' }]
          );
        }
      }
    );
  };

  // NUEVA FUNCIÓN: DETENER NAVEGACIÓN
  const stopNavigation = () => {
    setIsNavigating(false);
    setLocationTracking(false);
    setCurrentRoute(null);
    setRoutePolyline([]);
    setRouteInstructions([]);
    setNextWaypoint(null);
    
    RouteService.stopLocationTracking();
    
    Alert.alert('Navigation Stopped', 'You can start a new route anytime');
  };

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
      // Lógica existente para rutas activas
      handleFinishRoute();
    } else {
      // Navegar a RoutePreparation
      navigation.navigate('RoutePreparation', {
        assignmentData: assignments
      });
    }
  };

  // Nueva función para pausar ruta
  const handlePauseRoute = () => {
    setRoutePaused(true);
    Alert.alert('Route Paused', 'You can resume the route anytime');
  };

  // Nueva función para reanudar ruta
  const handleResumeRoute = () => {
    setRoutePaused(false);
    Alert.alert('Route Resumed', 'Continue collecting containers');
  };

  // Función mejorada para centrar el mapa
  const handleRecenterMap = async () => {
    try {
      // Obtener la ubicación actual del usuario
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      // Actualizar el estado de origin
      setOrigin(userLocation);
      
      // Animar el mapa hacia la ubicación del usuario con zoom
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01, // Zoom más cercano
          longitudeDelta: 0.01, // Zoom más cercano
        }, 1000); // Duración de la animación en milisegundos
      }
      
    } catch (error) {
      console.error('Error al obtener la ubicación actual:', error);
      
      // Si no se puede obtener la ubicación, centrar en la ubicación guardada
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
      
      Alert.alert(
        'Error de ubicación',
        'No se pudo obtener la ubicación actual. Se centró en la última ubicación conocida.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleOpenDrawer = () => {
    navigation.openDrawer();
  };

  // ✅ ACTUALIZAR handleCompanyMarkerPress PARA CARGAR CONTENEDORES REALES
  const handleCompanyMarkerPress = async (company) => {
    setSelectedCompany(company);
    setShowCompanyMenu(true);
    setShowStatusMenu(false);
    setShowRoute(false);
    
    // ✅ CARGAR CONTENEDORES REALES CUANDO SE SELECCIONA LA EMPRESA
    await loadCompanyContainers(company.id);
  };

  // handleSelectCompany PARA MOSTRAR LOS CONTENEDORES CARGADOS
  const handleSelectCompany = () => {
    Alert.alert(
      'Route Options',
      'How would you like to plan your route?',
      [
        { 
          text: 'Smart Navigation', 
          onPress: handleStartNavigation // NUEVA OPCIÓN
        },
        { 
          text: 'Basic Route', 
          onPress: () => {
            setShowRoute(true);
            setShowCompanyMenu(false);
            setShowStatusMenu(false);
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleSelectAnother = () => {
    setShowCompanyMenu(false);
    setShowStatusMenu(false);
    setSelectedCompany(null);
    setShowRoute(false);
    alert('Puedes seleccionar otra empresa en el mapa');
  };

  const handleContainerPress = async (container) => {
    try {
      // Verificar si es parte de la ruta actual
      if (currentRoute && routeContainers.find(c => c.id === container.id)) {
        const isCompleted = completedContainers.includes(container.id);
        
        if (isCompleted) {
          Alert.alert('Container Status', 'This container has already been collected');
          return;
        }

        // 🎯 Obtener datos reales del contenedor desde MongoDB
        const containerData = await getContainerRealTimeData(container.id);
        
        // Navegar a ContainersDataScreen con datos completos y en modo ruta
        navigation.navigate('ContainersDataScreen', { 
          containerId: container.id,
          containerData: containerData,
          isInRoute: true, // ✅ Indica que está en una ruta activa
          routeId: currentRoute.route_id,
          onContainerCompleted: handleMarkAsCollected // Callback para marcar como completado
        });
      } else {
        // 🎯 Comportamiento normal - solo ver datos, sin botón Complete
        const containerData = await getContainerRealTimeData(container.id);
        
        navigation.navigate('ContainersDataScreen', { 
          containerId: container.id,
          containerData: containerData,
          isInRoute: false, // ✅ No está en ruta, solo vista
          routeId: null
        });
      }
    } catch (error) {
      console.error('Error getting container data:', error);
      Alert.alert('Error', 'Could not load container data');
    }
  };

  // 🔧 Nueva función para obtener datos en tiempo real del contenedor
  const getContainerRealTimeData = async (containerId) => {
    try {
      // Llamar al nuevo endpoint para obtener datos del contenedor
      const result = await ApiService.getContainerDetails(containerId);
      
      if (result.success) {
        return result.container;
      } else {
        throw new Error('Container not found');
      }
    } catch (error) {
      console.error('Error fetching container data:', error);
      // Retornar datos por defecto si hay error
      return {
        container_id: containerId,
        location: { latitude: 0, longitude: 0 },
        latest_sensor_data: {
          temperature: 25.0,
          humidity: 50,
          co2: 400,
          fill_level: 0
        },
        company_name: 'Unknown Company',
        type: 'normal',
        status: 'active'
      };
    }
  };

  const handleMarkAsCollected = async (containerId) => {
    try {
      if (!currentRoute || !currentRoute.route_id) {
        Alert.alert('Error', 'No active route found');
        return;
      }

      // Llamar al endpoint para marcar como recolectado
      const result = await ApiService.markContainerCollected(
        containerId, 
        currentRoute.route_id,
        'Collected by collector',
        Math.floor(Math.random() * 100) // Fill level antes de recolectar
      );
      
      if (result.success) {
        setCompletedContainers(prev => [...prev, containerId]);
        
        Alert.alert(
          '✅ Container Collected', 
          'Container marked as collected successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                // Regresar al mapa
                navigation.goBack();
                
                // Verificar si se completó la ruta
                if (completedContainers.length + 1 === routeContainers.length) {
                  setTimeout(() => {
                    Alert.alert(
                      'Route Completed! 🎉',
                      'All containers have been collected. Ready to finish route?',
                      [
                        { text: 'Continue', style: 'cancel' },
                        { 
                          text: 'Finish Route', 
                          onPress: () => setShowFinishConfirmation(true)
                        }
                      ]
                    );
                  }, 500);
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Could not mark container as collected');
      }
    } catch (error) {
      console.error('Error marking container as collected:', error);
      Alert.alert('Error', 'Could not mark container as collected');
    }
  };

  // Función para confirmar finalización de ruta
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

  const handleFinishRoute = () => {
    if (currentRoute && completedContainers.length < routeContainers.length) {
      const remaining = routeContainers.length - completedContainers.length;
      Alert.alert(
        'Incomplete Route',
        `${remaining} containers are still pending. Are you sure you want to finish?`,
        [
          { text: 'Continue Route', style: 'cancel' },
          { text: 'Force Finish', onPress: () => setShowFinishConfirmation(true) }
        ]
      );
    } else {
      setShowFinishConfirmation(true);
    }
  };

  const handleCancelFinishRoute = () => {
    setShowFinishConfirmation(false);
  };

  const handleFinishRouteSuccess = () => {
    setShowFinishSuccess(false);
    setIsRouteStarted(false);
    setShowRoute(false);
    setSelectedCompany(null);
    setCurrentRoute(null);
    setRouteContainers([]);
    setCompletedContainers([]);
    setRoutePaused(false);
  };

  const handleIncidences = () => {
    if (selectedCompany) {
      navigation.navigate('IncidencesScreen', {
        companyId: selectedCompany.id,
        companyName: selectedCompany.name,
        userRole: userInfo?.role || 'collector'
      });
    }
  };
  
  // ✅ ACTUALIZAR handleStatus PARA MOSTRAR CONTENEDORES REALES
  const handleStatus = async () => {
    setShowCompanyMenu(false);
    setShowStatusMenu(true);
    
    // Asegurar que los contenedores estén cargados
    if (!containersByCompany[selectedCompany.id] || containersByCompany[selectedCompany.id].length === 0) {
      await loadCompanyContainers(selectedCompany.id);
    }
  };

  const handleOptions = () => {
    alert('Mostrar opciones');
  };

  const getContainerIcon = (type) => {
    switch(type) {
      case 'biohazard':
        return require('../assets/toxictrash.png');
      case 'normal':
        return require('../assets/trashcanMenu.png');
      default:
        return require('../assets/trashcanMenu.png');
    }
  };

  // ✅ ACTUALIZAR renderContainerItem PARA MOSTRAR DATOS REALES
  const renderContainerItem = ({ item }) => {
    // Determinar el color basado en el tipo y porcentaje
    const getContainerColor = (type, percentage) => {
      if (type === 'biohazard') {
        if (percentage >= 90) return '#FF0000'; // Crítico
        if (percentage >= 75) return '#FF6600'; // Alto
        if (percentage >= 50) return '#FFA500'; // Medio
        return '#4CAF50'; // Bajo
      } else {
        if (percentage >= 90) return '#FF0000'; // Crítico
        if (percentage >= 80) return '#FF6600'; // Alto
        if (percentage >= 70) return '#FFA500'; // Medio
        return '#4CAF50'; // Bajo
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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#158419" />
        <Text style={{ marginTop: 10, color: '#666' }}>Cargando asignaciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mostrar información de ruta activa en la parte superior */}
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
        showsUserLocation={false}
        followsUserLocation={locationTracking}
        zoomEnabled={true}
        scrollEnabled={true}
        
        // ✅ CONFIGURACIÓN ESPECÍFICA DE OSM
        mapType="standard" // standard, satellite, hybrid
        tileSource="openstreetmap" // openstreetmap, opentopomap, cyclosm
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

        {/* ✅ POLYLINE DE NAVEGACIÓN OSM */}
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
            <Marker
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
            </Marker>
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

      </OSMMapView>

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
            strokePattern={[5, 5]} // Línea punteada
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


      {/* Botón de recentrar con funcionalidad real */}
      <TouchableOpacity
        style={styles.recenterButton}
        onPress={handleRecenterMap}
      >
        <Image
          source={require('../assets/icons8-center-of-gravity-48.png')}
          style={styles.recenterIcon}
        />
      </TouchableOpacity>

      {/* Botón para seleccionar otra empresa (cuando hay ruta activa) */}
      {showRoute && (
        <TouchableOpacity
          style={styles.selectAnotherButton}
          onPress={handleSelectAnother}
        >
          <Text style={styles.selectAnotherButtonText}>Select Another</Text>
        </TouchableOpacity>
      )}

      {/* Modal de confirmación para finalizar ruta */}
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

      {/* Modal de éxito al finalizar ruta */}
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

      {/* ✅ MENÚ DE STATUS CON LOADING Y CONTENEDORES REALES */}
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

          {/* ✅ MOSTRAR LOADING O LISTA DE CONTENEDORES */}
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
    zIndex:100,
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
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  userPhoto: {
    width: '100%',
    height: '100%',
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
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
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
  navigatingButton: {
    backgroundColor: '#FF5722',
  },
});