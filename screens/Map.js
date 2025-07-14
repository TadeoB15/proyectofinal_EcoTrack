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
  Modal,
  Alert 
} from 'react-native';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

const BOTTOM_SHEET_HEIGHT = height * 0.33;
const STATUS_SHEET_HEIGHT = height * 0.6;
const MIN_BOTTOM_SHEET_HEIGHT = 0; 

export default function Map() { 
  const navigation = useNavigation();
  const mapRef = useRef(null);

  const [origin, setOrigin] = useState({
    latitude: 32.46112324200113,
    longitude: -116.82542748158332,
  });

  // Ubicaciones de empresas/zonas de recolección
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

  // Contenedores específicos por empresa
  const [containersByCompany, setContainersByCompany] = useState({
    'COMP-001': [
      { id: 'CNT-001', latitude: 32.465100, longitude: -116.820100, percentage: 75, type: 'biohazard' },
      { id: 'CNT-002', latitude: 32.465200, longitude: -116.820200, percentage: 90, type: 'normal' },
      { id: 'CNT-003', latitude: 32.465300, longitude: -116.820300, percentage: 20, type: 'normal' },
      { id: 'CNT-004', latitude: 32.465400, longitude: -116.820400, percentage: 85, type: 'biohazard' },
    ],
    'COMP-002': [
      { id: 'CNT-005', latitude: 32.455100, longitude: -116.835100, percentage: 60, type: 'normal' },
      { id: 'CNT-006', latitude: 32.455200, longitude: -116.835200, percentage: 95, type: 'biohazard' },
      { id: 'CNT-007', latitude: 32.455300, longitude: -116.835300, percentage: 15, type: 'normal' },
    ],
    'COMP-003': [
      { id: 'CNT-008', latitude: 32.448100, longitude: -116.810100, percentage: 80, type: 'normal' },
      { id: 'CNT-009', latitude: 32.448200, longitude: -116.810200, percentage: 70, type: 'biohazard' },
      { id: 'CNT-010', latitude: 32.448300, longitude: -116.810300, percentage: 25, type: 'normal' },
      { id: 'CNT-011', latitude: 32.448400, longitude: -116.810400, percentage: 90, type: 'normal' },
      { id: 'CNT-012', latitude: 32.448500, longitude: -116.810500, percentage: 35, type: 'biohazard' },
      { id: 'CNT-013', latitude: 32.448600, longitude: -116.810600, percentage: 88, type: 'biohazard' },
    ],
  });

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [isRouteStarted, setIsRouteStarted] = useState(false);
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);
  const [showFinishSuccess, setShowFinishSuccess] = useState(false);

  const panY = React.useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current;

  // Solicitar permisos de ubicación al cargar el componente
  useEffect(() => {
    requestLocationPermission();
  }, []);

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

  const handleStartRoute = () => {
    if (isRouteStarted) {
      setShowFinishConfirmation(true);
    } else {
      setIsRouteStarted(true);
      alert('Ruta iniciada. ¡A recolectar basura!');
    }
  };

  const handleConfirmFinishRoute = () => {
    setShowFinishConfirmation(false);
    setShowFinishSuccess(true);
  };

  const handleCancelFinishRoute = () => {
    setShowFinishConfirmation(false);
  };

  const handleFinishRouteSuccess = () => {
    setShowFinishSuccess(false);
    setIsRouteStarted(false);
    setShowRoute(false);
    setSelectedCompany(null);
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

  const handleCompanyMarkerPress = (company) => {
    setSelectedCompany(company);
    setShowCompanyMenu(true);
    setShowStatusMenu(false);
    setShowRoute(false);
  };

  const handleSelectCompany = () => {
    setShowRoute(true);
    setShowCompanyMenu(false);
    setShowStatusMenu(false);
  };

  const handleSelectAnother = () => {
    setShowCompanyMenu(false);
    setShowStatusMenu(false);
    setSelectedCompany(null);
    setShowRoute(false);
    alert('Puedes seleccionar otra empresa en el mapa');
  };

  const handleContainerPress = (containerId) => {
    navigation.navigate('ContainersDataScreen', { containerId: containerId });
  };

  const handleIncidences = () => {
    if (selectedCompany) {
      navigation.navigate('IncidencesScreen', {
        companyId: selectedCompany.id,
        companyName: selectedCompany.name
      });
    }
  };
  
  const handleStatus = () => {
    setShowCompanyMenu(false);
    setShowStatusMenu(true);
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

  const renderContainerItem = ({ item }) => (
    <TouchableOpacity
      style={styles.containerListItem}
      onPress={() => handleContainerPress(item.id)}
    >
      <Image
        source={getContainerIcon(item.type)}
        style={styles.containerListIcon}
      />
      <View style={styles.containerListInfo}>
        <Text style={styles.containerListId}>{item.id}</Text>
        <Text style={styles.containerListPercentage}>{item.percentage}%</Text>
      </View>
      <TouchableOpacity style={styles.containerOptionsButton}>
        <Image
          source={require('../assets/other-2.png')}
          style={styles.containerOptionsIcon}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        followsUserLocation={false}
      >
        {/* Marcador del usuario */}
        <Marker
          coordinate={origin}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.userLocationMarker}>
            <Image
              source={require('../assets/arrow.webp')}
              style={styles.userArrowIcon}
            />
          </View>
        </Marker>

        {/* Círculo de área del usuario */}
        <Circle
          center={origin}
          radius={500}
          strokeWidth={1}
          strokeColor={'rgba(0, 122, 255, 0.5)'}
          fillColor={'rgba(0, 122, 255, 0.1)'}
        />

        {/* Marcadores de empresas/ubicaciones */}
        {!showRoute && companyLocations.map(company => (
          <Marker
            key={company.id}
            coordinate={{ latitude: company.latitude, longitude: company.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={() => handleCompanyMarkerPress(company)} 
          >
            <View style={styles.companyMarker}>
              <Image
                source={require('../assets/locationTrash.png')}
                style={styles.companyIcon}
              />
            </View>
          </Marker>
        ))}

        {/* Marcadores de contenedores cuando se selecciona una empresa */}
        {showRoute && selectedCompany && containersByCompany[selectedCompany.id] && 
          containersByCompany[selectedCompany.id].map(container => (
            <Marker
              key={container.id}
              coordinate={{ latitude: container.latitude, longitude: container.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => handleContainerPress(container.id)} 
            >
              <View style={styles.containerMarker}>
                <Image
                  source={getContainerIcon(container.type)}
                  style={styles.containerIcon}
                />
              </View>
            </Marker>
          ))
        }

        {/* Ruta hacia la empresa seleccionada */}
        {showRoute && selectedCompany && (
          <Polyline
            coordinates={[
              origin, 
              { latitude: selectedCompany.latitude, longitude: selectedCompany.longitude }
            ]}
            strokeColor="#4CAF50"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Foto del usuario */}
      <TouchableOpacity
        style={styles.userPhotoContainer}
        onPress={handleOpenDrawer}
      >
        <Image
          source={require('../assets/user.jpg')}
          style={styles.userPhoto}
        />
      </TouchableOpacity>

      {/* Botón Start/Finish Route */}
      <TouchableOpacity
        style={[
          styles.startButton,
          isRouteStarted && styles.finishButton
        ]}
        onPress={handleStartRoute}
      >
        <Text style={styles.startButtonText}>
          {isRouteStarted ? 'Finish route' : 'Start route'}
        </Text>
      </TouchableOpacity>

      {/* Botón de recentrar con funcionalidad real */}
      <TouchableOpacity
        style={styles.recenterButton}
        onPress={handleRecenterMap}
      >
        <Image
          source={require('../assets/location.png')}
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
                source={require('../assets/locationTrash.png')}
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
                  source={require('../assets/incidenceTrash.png')}
                  style={styles.actionButtonIcon}
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleStatus}
              >
                <Image
                  source={require('../assets/status.png')}
                  style={styles.actionButtonIcon}
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleOptions}
              >
                <Image
                  source={require('../assets/other-2.png')}
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

          <FlatList
            data={containersByCompany[selectedCompany.id] || []}
            renderItem={renderContainerItem}
            keyExtractor={item => item.id}
            style={styles.containerList}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      )}
    </View>
  );
}

// ...existing code...
// Los estilos permanecen igual
const styles = StyleSheet.create({
  // ...existing styles...
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
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  userArrowIcon: {
    width: 20,
    height: 20,
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
  },
  containerIcon: {
    width: 25,
    height: 25,
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
  finishButton: {
    backgroundColor: '#FF5722',
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 20,
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
    marginBottom: 15,
  },
  companyMenuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  companyIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  companyMenuIcon: {
    width: 30,
    height: 30,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  companyDistance: {
    fontSize: 13,
    color: '#FF5722',
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
    backgroundColor: '#f0f0f0',
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
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#333',
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
  containerListIcon: {
    width: 30,
    height: 30,
    marginRight: 15,
  },
  containerListInfo: {
    flex: 1,
  },
  containerListId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
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
    tintColor: '#999',
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
});