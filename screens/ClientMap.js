import * as React from 'react';
import { StyleSheet, Text, View, Dimensions, Image, TouchableOpacity, FlatList, Animated, PanResponder } from 'react-native';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');


const BOTTOM_SHEET_HEIGHT = height * 0.4; 
const MIN_BOTTOM_SHEET_HEIGHT = 0; 

export default function ClientMap() { 
  const navigation = useNavigation();

  const [origin, setOrigin] = React.useState({
    latitude: 32.46112324200113,
    longitude: -116.82542748158332,
  });

  
  const [trashLocations, setTrashLocations] = React.useState([
    { id: 'CNT-001', latitude: 32.465000, longitude: -116.820000, percentage: 75, status: 'Active', type: 'biohazard' },
    { id: 'CNT-002', latitude: 32.455000, longitude: -116.835000, percentage: 78, status: 'Active', type: 'normal' },
    { id: 'CNT-003', latitude: 32.448000, longitude: -116.810000, percentage: 90, status: 'Active', type: 'normal' },
    { id: 'CNT-004', latitude: 32.470000, longitude: -116.828000, percentage: 20, status: 'Active', type: 'normal' },
  ]);

  const [selectedContainerId, setSelectedContainerId] = React.useState(null);
  const [showContainerList, setShowContainerList] = React.useState(false);

  
  const panY = React.useRef(new Animated.Value(MIN_BOTTOM_SHEET_HEIGHT)).current;

 
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


  React.useEffect(() => {
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

  const handleStartRoute = () => {
    alert('Ruta iniciada. ¡A recolectar basura!');
  };

  const handleRecenterMap = () => {
    alert('Mapa centrado en tu ubicación.');
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
        source={item.type === 'biohazard' ? require('../assets/toxictrash.png') : require('../assets/trash.png')}
        style={styles.containerListItemIcon}
      />
      <View style={styles.containerListItemTextContent}>
        <Text style={styles.containerListItemId}>{item.id}</Text>
        <Text style={styles.containerListItemPercentage}>{item.percentage}%</Text>
      </View>
      <TouchableOpacity onPress={() => alert(`Opciones para ${item.id}`)}>
        <Image
          source={require('../assets/threepoints.png')} 
          style={styles.containerListItemEllipsis}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

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

      
        <Circle
          center={origin}
          radius={500}
          strokeWidth={1}
          strokeColor={'rgba(0, 122, 255, 0.5)'}
          fillColor={'rgba(0, 122, 255, 0.1)'}
        />

        {trashLocations.map(trash => (
          <Marker
            key={trash.id}
            coordinate={{ latitude: trash.latitude, longitude: trash.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={() => handleTrashMarkerPress(trash.id)} 
          >
            <View style={styles.trashBinMarker}>
              <Image
                source={trash.type === 'biohazard' ? require('../assets/city.png') : require('../assets/trash.png')}
                style={styles.trashBinIcon}
              />
            </View>
          </Marker>
        ))}

        
        {trashLocations.length > 0 && (
          <Polyline
            coordinates={[origin, trashLocations[0]]}
            strokeColor="#000"
            strokeWidth={6}
          />
        )}
      </MapView>

     
      <TouchableOpacity
        style={styles.userPhotoContainer}
        onPress={handleOpenDrawer}
      >
        <Image
          source={require('../assets/user.jpg')}
          style={styles.userPhoto}
        />
      </TouchableOpacity>

      
      <TouchableOpacity
        style={styles.startButton}
        onPress={handleStartRoute}
      >
        <Text style={styles.startButtonText}>Start route</Text>
      </TouchableOpacity>

      
      <TouchableOpacity
        style={styles.recenterButton}
        onPress={handleRecenterMap}
      >
        <Image
          source={require('../assets/location.png')}
          style={styles.recenterIcon}
        />
      </TouchableOpacity>

      
      {showContainerList && (
        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: panY }] },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.bottomSheetHandle} />
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
  trashBinMarker: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
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
});
