import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Dimensions,
  Image 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function Login({ navigation }) {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
  // Aquí puedes agregar la lógica de autenticación
  navigation.replace('MapScreenWithDrawer'); 
  };

  return (
    <View style={styles.container}>
      {/* Fondo dividido: 30% ciudad, 70% blanco */}
      <View style={styles.backgroundContainer}>
        {/* Sección superior - Ciudad (30%) */}
        <View style={styles.citySection}>
          <LinearGradient
            colors={['#158419', '#0FD429']}
            style={styles.cityGradient}
          >
            <Image
              source={require('../assets/city.png')}
              style={styles.cityBackgroundImage}
              resizeMode="cover"
            />
          </LinearGradient>
        </View>
        
        {/* Sección inferior - Blanco (70%) */}
        <View style={styles.whiteSection} />
      </View>

      {/* Contenedor del Login superpuesto */}
      <KeyboardAvoidingView 
        style={styles.loginContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.loginCard}>
            <Text style={styles.title}>Sign In</Text>
            <View style={styles.underline} />
            
            <Text style={styles.subtitle}>Login with your user and password</Text>
            
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="User"
                  placeholderTextColor="#999"
                  value={user}
                  onChangeText={setUser}
                  autoCapitalize="none"
                />
                <View style={styles.inputLine} />
              </View>
              
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <View style={styles.inputLine} />
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  citySection: {
    height: height * 0.3, // 30% de la pantalla
    overflow: 'hidden',
  },
  cityGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cityBackgroundImage: {
    width: width,
    height: '100%',
    opacity: 0.5,
    position: 'absolute',
    bottom: 0,
  },
  whiteSection: {
    flex: 1, // 70% restante
    backgroundColor: '#f5f5f5',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: height * 0.15, // Posiciona el card para que se superponga
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loginCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 30,
    paddingHorizontal: 30,
    paddingVertical: 40,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  underline: {
    width: 60,
    height: 4,
    backgroundColor: '#158419',
    alignSelf: 'center',
    borderRadius: 2,
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 50,
  },
  inputContainer: {
    marginBottom: 40,
  },
  inputWrapper: {
    marginBottom: 30,
  },
  input: {
    fontSize: 18,
    color: '#333',
    paddingVertical: 15,
    paddingHorizontal: 5,
    backgroundColor: 'transparent',
  },
  inputLine: {
    height: 2,
    backgroundColor: '#158419',
    marginTop: 5,
  },
  loginButton: {
    backgroundColor: '#158419',
    paddingVertical: 18,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});