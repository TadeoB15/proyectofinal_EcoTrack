import React, { useState, useEffect } from 'react'; 
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ApiService from '../services/ApiService';

const { width, height } = Dimensions.get('window');

export default function ContainersDataScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Extraer parámetros de navegación
  const { 
    containerId, 
    containerData: initialData, 
    isInRoute = false, 
    routeId = null,
    onContainerCompleted = null 
  } = route.params || {};

  const [currentView, setCurrentView] = useState('data');
  const [reportTitle, setReportTitle] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [containerData, setContainerData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);

  // Cargar datos del contenedor si no se proporcionaron
  useEffect(() => {
    if (!containerData && containerId) {
      loadContainerData();
    }
  }, [containerId]);

  const loadContainerData = async () => {
    try {
      setLoading(true);
      console.log(`📦 Loading data for container: ${containerId}`);
      
      const result = await ApiService.getContainerDetails(containerId);
      console.log('🔍 Full container response:', JSON.stringify(result, null, 2));
      
      if (result.success && result.container) {
        const container = result.container;
        
        // ✅ LOG ESPECÍFICO DE LOS DATOS DEL SENSOR
        console.log('📊 Sensor data details:', {
          device_id: container.device_id,
          latest_sensor_data: container.latest_sensor_data,
          fill_level: container.latest_sensor_data?.fill_level,
          temperature: container.latest_sensor_data?.temperature,
          alerts: container.latest_sensor_data?.alerts
        });
        
        setContainerData(container);
      } else {
        throw new Error('Container not found');
      }
    } catch (error) {
      console.error('❌ Error loading container data:', error);
      
      // ✅ DATOS MOCK MEJORADOS PARA TESTING
      const mockData = {
        _id: "mock_id",
        container_id: containerId,
        company_id: "COMP-001",
        company_name: "Unknown Company",
        type: "normal",
        status: "active",
        capacity: 240,
        device_id: `MWAB-${containerId?.replace('CTN-', '') || '001'}`,
        location: {
          address: "Unknown Location",
          latitude: 32.465100,
          longitude: -116.820100
        },
        latest_sensor_data: {
          device_id: `MWAB-${containerId?.replace('CTN-', '') || '001'}`,
          timestamp: new Date().toISOString(),
          temperature: 25.0 + Math.random() * 10, // 25-35°C
          humidity: 45.0 + Math.random() * 20,    // 45-65%
          co2: 350 + Math.random() * 200,         // 350-550 ppm
          methane: 70 + Math.random() * 50,       // 70-120 ppm
          fill_level: 60 + Math.random() * 35,    // 60-95%
          battery_level: 85 + Math.random() * 15, // 85-100%
          alerts: Math.random() > 0.7 ? ['high_fill_level'] : []
        },
        last_collection: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      console.warn('🔧 Using enhanced mock data for container:', containerId);
      setContainerData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (currentView === 'reportForm') {
      setCurrentView('data'); 
    } else if (currentView === 'success') {
      setCurrentView('data'); 
    } else if (currentView === 'completed') {
      setCurrentView('data'); 
    } else {
      navigation.goBack(); 
    }
  };

  const handleReportPress = () => {
    setCurrentView('reportForm'); 
  };

  const handleCompletePress = async () => {
    if (!isInRoute || !onContainerCompleted) {
      return;
    }

    try {
      setLoading(true);
      
      // Llamar al callback para marcar como completado
      await onContainerCompleted(containerId);
      
      setCurrentView('completed');
      setIsCompleted(true);
    } catch (error) {
      console.error('Error marking container as completed:', error);
      Alert.alert('Error', 'Could not mark container as completed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReport = async () => {
    try {
      setLoading(true);
      
      // Crear incidencia
      const result = await ApiService.createIncident({
        containerId: containerId,
        title: reportTitle,
        description: reportMessage,
        type: 'complaint',
        priority: 'medium'
      });

      if (result.success) {
        console.log('✅ Report sent successfully:', result);
        setCurrentView('success');
        setReportTitle('');
        setReportMessage('');
      } else {
        throw new Error('Failed to send report');
      }
    } catch (error) {
      console.error('Error sending report:', error);
      Alert.alert('Error', 'Could not send report');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    setCurrentView('data'); 
  };

  const handleCancelReport = () => {
    setCurrentView('data'); 
    setReportTitle(''); 
    setReportMessage('');
  };

  const handleInsertImage = () => {
    alert('Funcionalidad de insertar imagen (no implementada).');
  };

  // Mostrar loading si están cargando los datos
  if (loading && !containerData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#158419" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading container data...</Text>
      </View>
    );
  }

  // ✅ ESTRUCTURAS DE DATOS CORREGIDAS
  const sensorData = containerData?.latest_sensor_data || {};
  const locationData = containerData?.location || {};

  // ✅ FUNCIONES AUXILIARES MEJORADAS
  const getContainerIcon = (type) => {
    return type === 'biohazard' 
      ? require('../assets/toxictrash.png')
      : require('../assets/trashcanMenu.png');
  };

  const getThresholdColor = (type, fillLevel) => {
    if (type === 'biohazard') {
      if (fillLevel >= 90) return '#FF0000';
      if (fillLevel >= 75) return '#FF6600';
      if (fillLevel >= 50) return '#FFA500';
      return '#4CAF50';
    } else {
      if (fillLevel >= 90) return '#FF0000';
      if (fillLevel >= 80) return '#FF6600';
      if (fillLevel >= 70) return '#FFA500';
      return '#4CAF50';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'inactive': return '#FF5722';
      case 'maintenance': return '#FF9800';
      default: return '#999';
    }
  };

  const getPriorityLevel = (type, fillLevel) => {
    if (type === 'biohazard') {
      if (fillLevel >= 90) return 'CRITICAL';
      if (fillLevel >= 75) return 'HIGH';
      if (fillLevel >= 50) return 'MEDIUM';
      return 'LOW';
    } else {
      if (fillLevel >= 90) return 'HIGH';
      if (fillLevel >= 80) return 'MEDIUM';
      return 'LOW';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  // ✅ VALORES SEGUROS PARA RENDERIZADO
  const fillLevel = sensorData.fill_level || 0;
  const temperature = sensorData.temperature || 0;
  const humidity = sensorData.humidity || 0;
  const co2 = sensorData.co2 || 0;
  const methane = sensorData.methane || 0;
  const batteryLevel = sensorData.battery_level || 0;
  const alerts = sensorData.alerts || [];

  // Renderizado condicional de las vistas
  const renderContent = () => {
    switch (currentView) {
      case 'data':
        return (
          <View style={styles.mainContainer}>
            {/* 🎯 TARJETA SUPERIOR DE OVERVIEW */}
            <View style={styles.containerOverviewCard}>
              <View style={styles.overviewHeader}>
                <View style={styles.overviewLeft}>
                  <Image
                    source={getContainerIcon(containerData?.type)}
                    style={[
                      styles.overviewIcon,
                      { tintColor: getThresholdColor(containerData?.type, fillLevel) }
                    ]}
                  />
                  <View style={styles.overviewInfo}>
                    <Text style={styles.overviewTitle}>{containerId}</Text>
                    <Text style={styles.overviewCompany}>
                      {containerData?.company_name || 'Unknown Company'}
                    </Text>
                    <View style={styles.typeBadgeContainer}>
                      <View style={[
                        styles.typeBadge,
                        { backgroundColor: containerData?.type === 'biohazard' ? '#FF6600' : '#4CAF50' }
                      ]}>
                        <Text style={styles.typeBadgeText}>
                          {containerData?.type?.toUpperCase() || 'NORMAL'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                
                <View style={styles.overviewRight}>
                  <View style={styles.fillLevelContainer}>
                    <Text style={[
                      styles.fillLevelText,
                      { color: getThresholdColor(containerData?.type, fillLevel) }
                    ]}>
                      {Math.round(fillLevel)}%
                    </Text>
                    <View style={styles.fillProgressBar}>
                      <View 
                        style={[
                          styles.fillProgress,
                          { 
                            width: `${Math.min(fillLevel, 100)}%`,
                            backgroundColor: getThresholdColor(containerData?.type, fillLevel)
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.fillLevelLabel}>Fill Level</Text>
                  </View>
                  
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(containerData?.status) }
                  ]}>
                    <Text style={styles.statusBadgeText}>
                      {containerData?.status?.toUpperCase() || 'UNKNOWN'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 🎯 MÉTRICAS RÁPIDAS */}
              <View style={styles.quickMetrics}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{temperature.toFixed(1)}°C</Text>
                  <Text style={styles.metricLabel}>Temperature</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{humidity.toFixed(1)}%</Text>
                  <Text style={styles.metricLabel}>Humidity</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{Math.round(co2)}</Text>
                  <Text style={styles.metricLabel}>CO2 ppm</Text>
                </View>
              </View>

              {/* 🎯 NIVEL DE PRIORIDAD */}
              <View style={[
                styles.priorityContainer,
                { backgroundColor: getThresholdColor(containerData?.type, fillLevel) + '20' }
              ]}>
                <Image 
                  source={require('../assets/warning.png')} 
                  style={[
                    styles.priorityIcon,
                    { tintColor: getThresholdColor(containerData?.type, fillLevel) }
                  ]} 
                />
                <Text style={[
                  styles.priorityText,
                  { color: getThresholdColor(containerData?.type, fillLevel) }
                ]}>
                  Priority: {getPriorityLevel(containerData?.type, fillLevel)}
                </Text>
              </View>

              {/* 🎯 ALERTAS ACTIVAS */}
              {alerts.length > 0 && (
                <View style={styles.alertsSection}>
                  <Text style={styles.alertsTitle}>🚨 Active Alerts:</Text>
                  {alerts.map((alert, index) => (
                    <Text key={index} style={styles.alertText}>
                      • {alert.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
              {/* 🎯 TARJETA DE UBICACIÓN */}
              <View style={styles.dataCard}>
                <View style={styles.dataHeader}>
                  <View style={styles.dataHeaderLeft}>
                    <Image source={require('../assets/icons8-marcador-48.png')} style={styles.dataHeaderIcon} />
                    <Text style={styles.dataTitle}>Location Details</Text>
                  </View>
                  <TouchableOpacity style={styles.mapButton}>
                    <Text style={styles.mapButtonText}>View Map</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.locationContent}>
                  <Text style={styles.addressText}>
                    {locationData.address || 'Address not available'}
                  </Text>
                  <View style={styles.coordinatesContainer}>
                    <View style={styles.coordinateItem}>
                      <Text style={styles.coordinateLabel}>Latitude</Text>
                      <Text style={styles.coordinateValue}>
                        {locationData.latitude?.toFixed(6) || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.coordinateItem}>
                      <Text style={styles.coordinateLabel}>Longitude</Text>
                      <Text style={styles.coordinateValue}>
                        {locationData.longitude?.toFixed(6) || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 🎯 TARJETA DE SENSORES AMBIENTALES */}
              <View style={styles.dataCard}>
                <View style={styles.dataHeader}>
                  <View style={styles.dataHeaderLeft}>
                    <Image source={require('../assets/icons8-temperatura-48.png')} style={styles.dataHeaderIcon} />
                    <Text style={styles.dataTitle}>Environmental</Text>
                  </View>
                  <View style={styles.lastUpdateContainer}>
                    <Text style={styles.lastUpdateText}>Last Update</Text>
                    <Text style={styles.lastUpdateTime}>
                      {formatTimestamp(sensorData.timestamp)}
                    </Text>
                  </View>
                </View>
                <View style={styles.sensorsGrid}>
                  <View style={styles.sensorItem}>
                    <Text style={styles.sensorValue}>{temperature.toFixed(1)}°C</Text>
                    <Text style={styles.sensorLabel}>Temperature</Text>
                    <View style={[
                      styles.sensorStatusDot, 
                      { backgroundColor: temperature > 35 ? '#FF5722' : '#4CAF50' }
                    ]} />
                  </View>
                  <View style={styles.sensorItem}>
                    <Text style={styles.sensorValue}>{humidity.toFixed(1)}%</Text>
                    <Text style={styles.sensorLabel}>Humidity</Text>
                    <View style={[
                      styles.sensorStatusDot, 
                      { backgroundColor: humidity > 80 ? '#FF9800' : '#4CAF50' }
                    ]} />
                  </View>
                </View>
              </View>

              {/* 🎯 TARJETA DE GASES */}
              <View style={styles.dataCard}>
                <View style={styles.dataHeader}>
                  <View style={styles.dataHeaderLeft}>
                    <Image source={require('../assets/icons8-riesgo-biológico-48.png')} style={styles.dataHeaderIcon} />
                    <Text style={styles.dataTitle}>Gas Emissions</Text>
                  </View>
                  <View style={[
                    styles.alertBadge,
                    { backgroundColor: (co2 > 500 || methane > 150) ? '#FF5722' : '#4CAF50' }
                  ]}>
                    <Text style={styles.alertBadgeText}>
                      {(co2 > 500 || methane > 150) ? 'Alert' : 'Normal'}
                    </Text>
                  </View>
                </View>
                <View style={styles.gasGrid}>
                  <View style={styles.gasItem}>
                    <Text style={styles.gasValue}>{Math.round(co2)}</Text>
                    <Text style={styles.gasLabel}>CO2 (ppm)</Text>
                    <View style={styles.gasBar}>
                      <View 
                        style={[
                          styles.gasProgress,
                          { 
                            width: `${Math.min((co2 / 1000) * 100, 100)}%`,
                            backgroundColor: co2 > 500 ? '#FF5722' : '#4CAF50'
                          }
                        ]} 
                      />
                    </View>
                  </View>
                  {methane > 0 && (
                    <View style={styles.gasItem}>
                      <Text style={styles.gasValue}>{Math.round(methane)}</Text>
                      <Text style={styles.gasLabel}>Methane (ppm)</Text>
                      <View style={styles.gasBar}>
                        <View 
                          style={[
                            styles.gasProgress,
                            { 
                              width: `${Math.min((methane / 300) * 100, 100)}%`,
                              backgroundColor: methane > 150 ? '#FF5722' : '#4CAF50'
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* 🎯 TARJETA DE INFORMACIÓN DEL CONTENEDOR */}
              <View style={styles.dataCard}>
                <View style={styles.dataHeader}>
                  <View style={styles.dataHeaderLeft}>
                    <Image source={require('../assets/trashcanMenu.png')} style={styles.dataHeaderIcon} />
                    <Text style={styles.dataTitle}>Container Information</Text>
                  </View>
                </View>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Capacity</Text>
                    <Text style={styles.infoValue}>{containerData?.capacity || 240}L</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Fill Level</Text>
                    <Text style={styles.infoValue}>{Math.round(fillLevel)}%</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Battery Level</Text>
                    <Text style={styles.infoValue}>{Math.round(batteryLevel)}%</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Device ID</Text>
                    <Text style={styles.infoValue}>{sensorData.device_id || containerData?.device_id || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Last Collection</Text>
                    <Text style={styles.infoValue}>
                      {containerData?.last_collection 
                        ? new Date(containerData.last_collection).toLocaleDateString('es-MX')
                        : 'N/A'
                      }
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Status</Text>
                    <Text style={[styles.infoValue, {color: getStatusColor(containerData?.status)}]}>
                      {containerData?.status?.toUpperCase() || 'UNKNOWN'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 🎯 SPACER PARA EL BOTTOM */}
              <View style={{height: 20}} />
            </ScrollView>

            {/* 🎯 BOTONES INFERIORES */}
            <View style={styles.bottomContainer}>
              {isInRoute && !isCompleted ? (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.completeButton]} 
                  onPress={handleCompletePress}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Image source={require('../assets/check.png')} style={styles.buttonIcon} />
                      <Text style={styles.actionButtonText}>Complete Collection</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : !isInRoute ? (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.reportButton]} 
                  onPress={handleReportPress}
                >
                  <Image source={require('../assets/warning.png')} style={styles.buttonIcon} />
                  <Text style={styles.actionButtonText}>Report Issue</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        );

      case 'completed':
        return (
          <View style={styles.completedContainer}>
            <View style={styles.completedCard}>
              <Image source={require('../assets/check.png')} style={styles.completedIcon} />
              <Text style={styles.completedTitle}>Collection Complete!</Text>
              <Text style={styles.completedSubtitle}>Container successfully marked as empty</Text>
              <Text style={styles.completedMessage}>
                The container {containerId} has been processed and is now ready for the next cycle.
              </Text>
              <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                <Text style={styles.doneButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'reportForm':
        return (
          <ScrollView contentContainerStyle={styles.formContainer}>
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Image source={require('../assets/warning.png')} style={styles.formHeaderIcon} />
                <Text style={styles.formHeaderTitle}>Report Issue</Text>
              </View>
              
              <Text style={styles.formLabel}>Issue Title</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter a brief title for the issue"
                value={reportTitle}
                onChangeText={setReportTitle}
                placeholderTextColor="#999"
              />

              <Text style={styles.formLabel}>Detailed Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="Describe the issue in detail..."
                multiline
                numberOfLines={5}
                value={reportMessage}
                onChangeText={setReportMessage}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />

              <TouchableOpacity style={styles.imageButton} onPress={handleInsertImage}>
                <Image source={require('../assets/city.png')} style={styles.imageButtonIcon} />
                <Text style={styles.imageButtonText}>Add Photo</Text>
              </TouchableOpacity>

              <View style={styles.formButtonsContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancelReport}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.submitButton,
                    (!reportTitle.trim() || !reportMessage.trim() || loading) && styles.submitButtonDisabled
                  ]} 
                  onPress={handleSendReport}
                  disabled={loading || !reportTitle.trim() || !reportMessage.trim()}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Report</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        );

      case 'success':
        return (
          <View style={styles.successContainer}>
            <View style={styles.successCard}>
              <Image source={require('../assets/city.png')} style={styles.successIcon} />
              <Text style={styles.successTitle}>Report Submitted!</Text>
              <Text style={styles.successMessage}>
                Your report has been successfully submitted and will be reviewed by our team.
              </Text>
              <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* 🎯 HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
          <Image
            source={require('../assets/icons8-less-than-48.png')} 
            style={styles.headerIcon}
          />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Container Details</Text>
          <Text style={styles.headerSubtitle}>
            {isInRoute ? 'In Active Route' : 'View Only'}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.headerMenuButton}>
          <Image source={require('../assets/arrow.webp')} style={styles.headerMenuIcon} />
        </TouchableOpacity>
      </View>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // 🎯 HEADER STYLES
  header: {
    backgroundColor: '#158419',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  headerMenuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMenuIcon: {
    width: 16,
    height: 16,
    tintColor: '#fff',
  },

  // 🎯 MAIN CONTAINER
  mainContainer: {
    flex: 1,
  },

  // 🎯 OVERVIEW CARD
  containerOverviewCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 5,
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  overviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  overviewIcon: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
  overviewInfo: {
    flex: 1,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  overviewCompany: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  typeBadgeContainer: {
    flexDirection: 'row',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  overviewRight: {
    alignItems: 'flex-end',
  },
  fillLevelContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  fillLevelText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fillProgressBar: {
    width: 60,
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  fillProgress: {
    height: '100%',
    borderRadius: 3,
  },
  fillLevelLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // 🎯 QUICK METRICS
  quickMetrics: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#158419',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  metricDivider: {
    width: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 10,
  },

  // 🎯 PRIORITY CONTAINER
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  priorityIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  // 🎯 ALERTS SECTION
  alertsSection: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  alertsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 6,
  },
  alertText: {
    fontSize: 11,
    color: '#E65100',
    marginBottom: 2,
  },

  // 🎯 CONTENT CONTAINER
  contentContainer: {
    flex: 1,
    padding: 15,
    paddingTop: 20,
  },

  // 🎯 DATA CARDS
  dataCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  dataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dataHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dataHeaderIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    tintColor: '#158419',
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },

  // 🎯 LOCATION STYLES
  mapButton: {
    backgroundColor: '#158419',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  locationContent: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 12,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  coordinateItem: {
    flex: 1,
  },
  coordinateLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  coordinateValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },

  // 🎯 SENSORS STYLES
  lastUpdateContainer: {
    alignItems: 'flex-end',
  },
  lastUpdateText: {
    fontSize: 10,
    color: '#666',
  },
  lastUpdateTime: {
    fontSize: 12,
    color: '#158419',
    fontWeight: '600',
  },
  sensorsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sensorItem: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    position: 'relative',
  },
  sensorValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  sensorLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  sensorStatusDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // 🎯 GAS STYLES
  alertBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  gasGrid: {
    gap: 15,
  },
  gasItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
  },
  gasValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  gasLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  gasBar: {
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    overflow: 'hidden',
  },
  gasProgress: {
    height: '100%',
    borderRadius: 2,
  },

  // 🎯 INFO GRID
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
  },
  infoLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },

  // 🎯 BOTTOM CONTAINER
  bottomContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 35,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  completeButton: {
    backgroundColor: '#158419',
  },
  reportButton: {
    backgroundColor: '#FF9800',
  },
  buttonIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
    marginRight: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // 🎯 COMPLETED VIEW
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completedCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: '100%',
    maxWidth: 350,
  },
  completedIcon: {
    width: 80,
    height: 80,
    tintColor: '#158419',
    marginBottom: 20,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#158419',
    marginBottom: 8,
    textAlign: 'center',
  },
  completedSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  completedMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 25,
  },
  doneButton: {
    backgroundColor: '#158419',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // 🎯 FORM STYLES
  formContainer: {
    padding: 20,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  formHeaderIcon: {
    width: 24,
    height: 24,
    tintColor: '#FF9800',
    marginRight: 12,
  },
  formHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  formInput: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  formTextArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 15,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  imageButtonIcon: {
    width: 20,
    height: 20,
    tintColor: '#666',
    marginRight: 8,
  },
  imageButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  formButtonsContainer: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 25,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#158419',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // 🎯 SUCCESS VIEW
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: '100%',
    maxWidth: 350,
  },
  successIcon: {
    width: 80,
    height: 80,
    tintColor: '#158419',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#158419',
    marginBottom: 15,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
});