import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  ActivityIndicator 
} from 'react-native';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import ApiService from '../services/ApiService';

const { width, height } = Dimensions.get('window');
const BOTTOM_SHEET_HEIGHT = height * 0.4; 
const MIN_BOTTOM_SHEET_HEIGHT = 0; 

export default function ClientMap() { 
  const navigation = useNavigation();
  
  // Estados principales
  const [origin, setOrigin] = useState({
    latitude: 32.46112324200113,
    longitude: -116.82542748158332,
  });

  // Estados para datos del backend
  const [companyContainers, setCompanyContainers] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados de la UI
  const [trashLocations, setTrashLocations] = useState([
    { id: 'CTN-001', latitude: 32.465000, longitude: -116.820000, percentage: 75, status: 'Active', type: 'biohazard' },
    { id: 'CTN-002', latitude: 32.455000, longitude: -116.835000, percentage: 78, status: 'Active', type: 'normal' },
    { id: 'CTN-003', latitude: 32.448000, longitude: -116.810000, percentage: 90, status: 'Active', type: 'normal' },
    { id: 'CTN-004', latitude: 32.470000, longitude: -116.828000, percentage: 20, status: 'Active', type: 'normal' },
  ]);

  const [selectedContainerId, setSelectedContainerId] = useState(null);
  const [showContainerList, setShowContainerList] = useState(false);

  // Refs
  const panY = useRef(new Animated.Value(MIN_BOTTOM_SHEET_HEIGHT)).current;

  // PanResponder
  const panResponder = useRef(
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
        if (gestureState.dy > BOTTOM_SHEET_HEIGHT / 3) {
          Animated.timing(panY, {
            toValue: BOTTOM_SHEET_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => setShowContainerList(false));
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;
  
  // Cargar datos al iniciar el componente
  useEffect(() => {
    loadUserData();
    loadCompanyContainers();
  }, []);

  // Animación del bottom sheet
  useEffect(() => {
    if (showContainerList) {
      Animated.spring(panY, {
        toValue: 0, 
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(panY, {
        toValue: BOTTOM_SHEET_HEIGHT, 
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showContainerList]);

  const loadUserData = async () => {
    try {
      const user = await ApiService.getStoredUser();
      setUserInfo(user);
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
    }
  };

  const loadCompanyContainers = async () => {
    try {
      setLoading(true);
      const hasToken = await ApiService.loadStoredToken();

      if (!hasToken) {
        navigation.replace('Login');
        return;
      }

      // Obtener contenedores de la empresa del employee
      const result = await ApiService.getCompanyContainers();

      if (result.success) {
        setCompanyContainers(result.containers);
        // Actualizar locations con datos reales
        setTrashLocations(result.containers);
      }
    } catch (error) {
      console.error('Error al cargar contenedores de la empresa:', error);
      Alert.alert('Info', 'Usando datos de ejemplo. Endpoint no disponible aún.');
    } finally {
      setLoading(false);
    }
  };

  const updateTrashLocations = (incidents) => {
    const containers = incidents.map(incident => ({
      id: incident.container_id,
      latitude: incident.location?.coordinates[1] || 32.465000,
      longitude: incident.location?.coordinates[0] || -116.820000,
      percentage: Math.floor(Math.random() * 100),
      status: incident.status === 'open' ? 'Active' : 'Inactive',
      type: incident.type === 'toxic' ? 'biohazard' : 'normal'
    }));
    
    setTrashLocations(containers);
  };

  const handleReportIncident = async (containerId, incidentData) => {
    try {
      const result = await ApiService.createIncident({
        containerId,
        title: incidentData.title,
        description: incidentData.description,
        type: incidentData.type || 'overflow',
        priority: incidentData.priority || 'medium',
        location: {
          type: 'Point',
          coordinates: [origin.longitude, origin.latitude]
        }
      });

      if (result.success) {
        Alert.alert('Éxito', 'Incidencia reportada correctamente');
        loadCompanyContainers();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo reportar la incidencia');
    }
  };

  const handleLogout = async () => {
    try {
      await ApiService.logout();
      navigation.replace('Login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleStartRoute = () => {
    Alert.alert('Ruta iniciada', '¡A recolectar basura!');
  };

  const handleRecenterMap = () => {
    Alert.alert('Ubicación', 'Mapa centrado en tu ubicación.');
  };

  const handleOpenDrawer = () => {
    navigation.openDrawer();
  };

  const handleTrashMarkerPress = (containerId) => {
    setSelectedContainerId(containerId);
    setShowContainerList(true); 
  };

  const handleContainerListItemPress = (containerId) => {
    navigation.navigate('ContainersDataScreen', { containerId: containerId });
    setShowContainerList(false); 
  };

  const renderContainerItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.containerListItem,
        selectedContainerId === item.id && styles.selectedContainerListItem,
        item.type === 'biohazard' && styles.biohazardContainerListItem, 
      ]}
      onPress={() => handleContainerListItemPress(item.id)}
    >
      <Image
        source={item.type === 'biohazard' ? require('../assets/toxictrash.png') : require('../assets/trashempty.png')}
        style={styles.containerListItemIcon}
      />
      <View style={styles.containerListItemTextContent}>
        <Text style={styles.containerListItemId}>{item.id}</Text>
        <Text style={styles.containerListItemPercentage}>{item.percentage}%</Text>
      </View>
      <TouchableOpacity onPress={() => Alert.alert('Opciones', `Opciones para ${item.id}`)}>
        <Image
          source={require('../assets/threepoints.png')} 
          style={styles.containerListItemEllipsis}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#158419" />
        <Text style={{ marginTop: 10, color: '#666' }}>Cargando contenedores...</Text>
        {userInfo && (
          <Text style={{ marginTop: 5, color: '#999', fontSize: 12 }}>
            Empresa: {userInfo.mongoCompanyId || 'COMP-001'}
          </Text>
        )}
      </View>
    );
  }

  
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {/* Marcador del usuario */}
        <Marker
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
        </Marker>

        {/* Círculo de ubicación */}
        <Circle
          center={origin}
          radius={500}
          strokeWidth={2}
          strokeColor={'rgba(21, 132, 25, 0.8)'}
          fillColor={'rgba(21, 132, 25, 0.15)'}
          zIndex={500}
        />

        {/* Marcadores de contenedores */}
        {trashLocations.map(trash => (
          <Marker
            key={trash.id}
            coordinate={{ latitude: trash.latitude, longitude: trash.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={() => handleTrashMarkerPress(trash.id)} 
            zIndex={100}
          >
            <View style={styles.trashBinMarker}>
              <Image
                source={trash.type === 'biohazard' ? require('../assets/toxictrash.png') : require('../assets/trashempty.png')}
                style={styles.trashBinIcon}
              />
            </View>
          </Marker>
        ))}

        {/* Línea de ruta */}
        {trashLocations.length > 0 && (
          <Polyline
            coordinates={[origin, trashLocations[0]]}
            strokeColor="#158419"
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* Foto de usuario */}
      <TouchableOpacity
        style={styles.userPhotoContainer}
        onPress={handleOpenDrawer}
      >
        <Image
          source={require('../assets/icons8-profile-48.png')} 
          style={styles.userPhoto}
        />
      </TouchableOpacity>

      {/* Botón de iniciar ruta */}
      <TouchableOpacity
        style={styles.startButton}
        onPress={handleStartRoute}
      >
        <Text style={styles.startButtonText}>Start route</Text>
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

      {/* Bottom sheet de contenedores */}
      {showContainerList && (
        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: panY }] },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.bottomSheetHandle} />
          <Text style={styles.bottomSheetTitle}>
            Contenedores de tu empresa {userInfo?.mongoCompanyId || 'COMP-001'}
          </Text>
          <FlatList
            data={trashLocations}
            renderItem={renderContainerItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.containerListContent}
          />
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
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
  trashBinMarker: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  trashBinIcon: {
    width: 25,
    height: 25,
    tintColor: '#333',
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
    backgroundColor: '#158419',
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
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_SHEET_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 15,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 10,
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  containerListContent: {
    paddingBottom: 20, 
  },
  containerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedContainerListItem: {
    borderColor: '#158419', 
    backgroundColor: 'rgba(21, 132, 25, 0.1)', 
  },
  biohazardContainerListItem: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)', 
    borderColor: '#FFC107', 
  },
  containerListItemIcon: {
    width: 30,
    height: 30,
    marginRight: 15,
    tintColor: '#333', 
  },
  containerListItemTextContent: {
    flex: 1,
  },
  containerListItemId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  containerListItemPercentage: {
    fontSize: 14,
    color: '#666',
  },
  containerListItemEllipsis: {
    width: 20,
    height: 20,
    tintColor: '#999',
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
});