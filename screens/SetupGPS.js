import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function SetupGPS() {
  const navigation = useNavigation();

  const handleLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      alert('Permiso de ubicación denegado. Para usar todas las funciones de la aplicación, necesitamos acceso a tu ubicación.');
      return;
    }

    navigation.replace('MapScreenWithDrawer');
  };


  const handleClientButton = () => {
    navigation.navigate('ClientMap'); 
  };

  return (
    <View style={styles.container}>

      <View style={styles.topSection}>
        <LinearGradient
          colors={['#158419', '#0FD429']}
          style={styles.gradientOverlay}
        >
          <Image
            source={require('../assets/city.png')}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </LinearGradient>
      </View>


      <View style={styles.bottomSection}>
        <Text style={styles.greetingText}>Hi, nice to meet you!</Text>
        <Text style={styles.instructionText}>
          To use our app you need to enable access to your location.
        </Text>

        <TouchableOpacity
          style={styles.locationButton}
          onPress={handleLocationPermission}
        >
          <Image
            source={require('../assets/check.png')}
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>Use current location</Text>
        </TouchableOpacity>

        {/* Nuevo botón "Client" */}
        <TouchableOpacity
          style={[styles.locationButton, styles.clientButton]}
          onPress={handleClientButton}
        >
          <Text style={styles.clientButtonText}>Client</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topSection: {
    height: height * 0.4,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gradientOverlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationImage: {
    width: '80%',
    height: '80%',
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: height * 0.05,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 60,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderColor: '#158419',
    borderWidth: 2,
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    width: '100%',
    marginBottom: 15,
  },
  buttonIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: '#158419',
  },
  buttonText: {
    color: '#158419',
    fontSize: 18,
    fontWeight: '600',
  },
  clientButton: {
    backgroundColor: '#158419',
    borderColor: '#158419',
  },
  clientButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
