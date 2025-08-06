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
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CommonActions } from '@react-navigation/native';
import ApiService from '../services/ApiService';

const { width, height } = Dimensions.get('window');

export default function Login({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // ==========================================
  // FUNCIÓN DE TEST DE CONEXIÓN
  // ==========================================
  const testConnection = async () => {
    try {
      setLoading(true);
      const result = await ApiService.debugConnection();
      console.log('🔍 Connection test result:', result);
      
      if (result.success) {
        Alert.alert(
          '✅ Conexión exitosa', 
          'El backend está funcionando correctamente',
          [
            { 
              text: 'OK',
              onPress: () => {
                // Auto-completar credenciales para testing
                setUsername('larry_collector');
                setPassword('123456');
              }
            }
          ]
        );
      } else {
        Alert.alert(
          '❌ Error de conexión', 
          `No se puede conectar al backend: ${result.error || result.status}`
        );
      }
    } catch (error) {
      Alert.alert('❌ Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FUNCIÓN DE LOGIN PRINCIPAL
  // ==========================================
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Starting login process...');
      const result = await ApiService.login(username, password);
      
      if (result.success) {
        const user = result.user;
        console.log('✅ Login successful, user role:', user.role);
        
        // Mostrar mensaje de bienvenida
        Alert.alert(
          'Login exitoso',
          `Bienvenido ${user.nombre} ${user.apellido}`,
          [
            {
              text: 'OK',
              onPress: () => navigateToRoleScreen(user.role)
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      Alert.alert('Error de autenticación', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // NAVEGACIÓN SEGÚN ROL
  // ==========================================
  const navigateToRoleScreen = (role) => {
    // Usar reset para limpiar el stack de navegación
    if (role === 'collector') {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'CollectorDrawer' }],
        })
      );
    } else if (role === 'employee') {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'ClientMap' }],
        })
      );
    } else if (role === 'admin') {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'CollectorDrawer' }],
        })
      );
    } else {
      Alert.alert('Error', 'Rol de usuario no reconocido');
    }
  };

  // ==========================================
  // FUNCIÓN PARA CREDENCIALES RÁPIDAS (SOLO DESARROLLO)
  // ==========================================
  const fillCollectorCredentials = () => {
    setUsername('larry_collector');
    setPassword('123456');
  };

  const fillEmployeeCredentials = () => {
    setUsername('juan_employee'); // Ajustar según tu BD
    setPassword('123456');
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
            
            <Text style={styles.subtitle}>Login with your username and password</Text>
            
            {/* Campos de entrada */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#999"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  editable={!loading}
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
                  editable={!loading}
                />
                <View style={styles.inputLine} />
              </View>
            </View>
            
            {/* Botones de testing rápido (solo para desarrollo) */}
            <View style={styles.quickTestContainer}>
              <TouchableOpacity 
                style={[styles.quickTestButton, { backgroundColor: '#FF6B6B' }]}
                onPress={fillCollectorCredentials}
                disabled={loading}
              >
                <Text style={styles.quickTestText}>Collector</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.quickTestButton, { backgroundColor: '#4ECDC4' }]}
                onPress={fillEmployeeCredentials}
                disabled={loading}
              >
                <Text style={styles.quickTestText}>Employee</Text>
              </TouchableOpacity>
            </View>
            
            {/* Botón de test de conexión */}
            <TouchableOpacity 
              style={[styles.loginButton, { backgroundColor: '#007AFF', marginBottom: 10 }]}
              onPress={testConnection}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>Test Conexión</Text>
            </TouchableOpacity>

            {/* Botón principal de login */}
            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Información de ayuda */}
            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>
                Collector: larry_collector / 123456{'\n'}
                Employee: juan_employee / 123456
              </Text>
            </View>
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
    height: height * 0.3,
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
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: height * 0.15,
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
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
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
  quickTestContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickTestButton: {
    flex: 0.48,
    paddingVertical: 10,
    borderRadius: 15,
    alignItems: 'center',
  },
  quickTestText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  helpContainer: {
    alignSelf: 'center',
    marginTop: 10,
  },
  helpText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
});