import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function InitialPage({ navigation }) {
  
  useEffect(() => {
    // Navega automáticamente al Login después de 5 segundos
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigation]);

  // Icono del logo con imagen personalizada (sin círculo)
  const EcoIcon = () => (
    <View style={styles.iconContainer}>
      <Image
        source={require('../assets/logo.png')} // Ajusta la ruta a tu imagen
        style={styles.logoImage}
        resizeMode="contain"
      />
    </View>
  );

  // Silueta de ciudad con imagen PNG
  const CityScape = () => (
    <View style={styles.cityContainer}>
      <Image
        source={require('../assets/city.png')} // Cambia por el nombre de tu imagen
        style={styles.cityImage}
        resizeMode="cover"
      />
    </View>
  );

  return (
    <LinearGradient
      colors={['#158419', '#0FD429']}
      style={styles.container}
    >
      <View style={styles.content}>
        <EcoIcon />
        
        <Text style={styles.title}>EcoTrack</Text>
      </View>
      
      <CityScape />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 15, // Reducido para mover todo más arriba
  },
  iconContainer: {
    marginBottom: 30, // Reducido el margen
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8, // Sombra hacia abajo
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  logoImage: {
    width: 100, // Reducido de 120 a 100
    height: 100, // Reducido de 120 a 100
  },
  title: {
    fontSize: 36, // Reducido de 48 a 36
    fontWeight: '300',
    color: '#fff',
    letterSpacing: 2,
    marginTop: 10, // Agregado para mover las letras más arriba
  },
  cityContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    overflow: 'hidden',
  },
  cityImage: {
    width: width,
    height: 200,
    opacity: 0.8, // Agregada la opacidad que faltaba
  },
});