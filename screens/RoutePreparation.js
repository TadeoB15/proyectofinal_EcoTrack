import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ApiService from '../services/ApiService';

const { width, height } = Dimensions.get('window');

export default function RoutePreparation() {
  const navigation = useNavigation();
  const route = useRoute();
  const { assignmentData } = route.params || {};

  const [availableContainers, setAvailableContainers] = useState([]);
  const [selectedContainers, setSelectedContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadAvailableContainers();
  }, []);

  const loadAvailableContainers = async () => {
    try {
      setLoading(true);
      
      // Intentar cargar desde el backend primero
      const result = await ApiService.getAvailableContainers();
      
      if (result.success && result.containers) {
        // Formatear datos del backend
        const formattedContainers = result.containers.map(container => ({
          id: container.id || container.container_id,
          company_id: container.company_id,
          company_name: container.company_name,
          type: container.type,
          fill_level: container.fill_level,
          location: container.location,
          priority: container.priority || 'medium',
          estimated_time: container.estimated_time || (container.type === 'biohazard' ? 15 : 10)
        }));
        
        // Ordenar por prioridad
        const sortedContainers = formattedContainers.sort((a, b) => {
          if (a.type === 'biohazard' && b.type !== 'biohazard') return -1;
          if (b.type === 'biohazard' && a.type !== 'biohazard') return 1;
          return b.fill_level - a.fill_level;
        });

        setAvailableContainers(sortedContainers);
      } else {
        // Fallback a datos mock si no hay respuesta del backend
        console.warn('Using mock data for containers');
        setAvailableContainers(mockContainers);
      }
    } catch (error) {
      console.error('Error loading containers:', error);
      // Usar datos mock como fallback
      setAvailableContainers(mockContainers);
    } finally {
      setLoading(false);
    }
  };

  const handleContainerToggle = (containerId) => {
    setSelectedContainers(prev => {
      if (prev.includes(containerId)) {
        return prev.filter(id => id !== containerId);
      } else {
        return [...prev, containerId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedContainers.length === availableContainers.length) {
      setSelectedContainers([]);
    } else {
      setSelectedContainers(availableContainers.map(container => container.id));
    }
  };

  const handleStartRoute = async () => {
    if (selectedContainers.length === 0) {
      Alert.alert('Selección requerida', 'Debes seleccionar al menos un contenedor');
      return;
    }

    try {
      setCreating(true);
      
      const selectedContainerData = availableContainers.filter(
        container => selectedContainers.includes(container.id)
      );

      // 1. Crear la ruta
      const estimatedDuration = calculateEstimatedTime();
      const createResult = await ApiService.createRoute(selectedContainers, estimatedDuration);
      
      if (!createResult.success) {
        Alert.alert('Error', 'No se pudo crear la ruta');
        return;
      }

      console.log('✅ Route created:', createResult.route);

      // 2. Iniciar la ruta inmediatamente
      const startResult = await ApiService.startRoute(createResult.route.route_id);
      
      if (!startResult.success) {
        Alert.alert('Error', 'No se pudo iniciar la ruta');
        return;
      }

      console.log('✅ Route started:', startResult.route);

      // 3. Navegar con los datos completos
      const routeData = {
        route_id: createResult.route.route_id,
        containers: selectedContainerData,
        started: true,
        status: 'in_progress',
        created_at: createResult.route.created_at,
        started_at: startResult.route.started_at
      };

      console.log('🚀 Starting route with data:', routeData);

      Alert.alert(
        'Ruta iniciada',
        `Se ha iniciado la ruta con ${selectedContainers.length} contenedores`,
        [
          {
            text: 'Comenzar Recolección',
            onPress: () => {
              navigation.navigate('Home', {  
                routeData
              });
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error creating/starting route:', error);
      Alert.alert('Error', 'No se pudo crear o iniciar la ruta');
    } finally {
      setCreating(false);
    }
  };

  const getContainerIcon = (type) => {
    return type === 'biohazard' 
      ? require('../assets/toxictrash.png')
      : require('../assets/trashcanMenu.png');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#FF0000';
      case 'high': return '#FF6600';
      case 'medium': return '#FFA500';
      case 'low': return '#4CAF50';
      default: return '#999';
    }
  };

  const getThresholdColor = (type, fillLevel) => {
    if (type === 'biohazard') {
      if (fillLevel >= 75) return '#FF0000';
      if (fillLevel >= 50) return '#FF6600';
      return '#FFA500';
    } else {
      if (fillLevel >= 90) return '#FF0000';
      if (fillLevel >= 70) return '#FFA500';
      return '#4CAF50';
    }
  };

  const calculateEstimatedTime = () => {
    const selectedData = availableContainers.filter(
      container => selectedContainers.includes(container.id)
    );
    return selectedData.reduce((total, container) => total + container.estimated_time, 0);
  };

  const mockContainers = [
    {
      id: 'CNT-001',
      company_id: 'COMP-001',
      company_name: 'Medtronic',
      type: 'biohazard',
      fill_level: 85,
      location: { latitude: 32.465100, longitude: -116.820100 },
      priority: 'high',
      estimated_time: 15
    },
    {
      id: 'CNT-002',
      company_id: 'COMP-001',
      company_name: 'Medtronic',
      type: 'normal',
      fill_level: 78,
      location: { latitude: 32.465200, longitude: -116.820200 },
      priority: 'medium',
      estimated_time: 10
    },
    {
      id: 'CNT-005',
      company_id: 'COMP-002',
      company_name: 'Tech Solutions',
      type: 'biohazard',
      fill_level: 95,
      location: { latitude: 32.455200, longitude: -116.835200 },
      priority: 'critical',
      estimated_time: 15
    }
  ];

  const renderContainerItem = ({ item, index }) => {
    const isSelected = selectedContainers.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.containerItem,
          isSelected && styles.selectedContainer,
          item.type === 'biohazard' && styles.biohazardContainer
        ]}
        onPress={() => handleContainerToggle(item.id)}
      >
        <View style={styles.containerHeader}>
          <View style={styles.containerLeft}>
            <Image
              source={getContainerIcon(item.type)}
              style={[
                styles.containerIcon,
                { tintColor: getThresholdColor(item.type, item.fill_level) }
              ]}
            />
            <View style={styles.containerInfo}>
              <Text style={styles.containerId}>{item.id}</Text>
              <Text style={styles.companyName}>{item.company_name}</Text>
            </View>
          </View>
          
          <View style={styles.containerRight}>
            <View style={styles.fillLevelContainer}>
              <Text style={[
                styles.fillLevel,
                { color: getThresholdColor(item.type, item.fill_level) }
              ]}>
                {item.fill_level}%
              </Text>
              <View style={styles.fillBar}>
                <View 
                  style={[
                    styles.fillProgress,
                    { 
                      width: `${item.fill_level}%`,
                      backgroundColor: getThresholdColor(item.type, item.fill_level)
                    }
                  ]} 
                />
              </View>
            </View>
            
            <View style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(item.priority) }
            ]}>
              <Text style={styles.priorityText}>
                {item.priority.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.selectionContainer}>
            <View style={[
              styles.checkbox,
              isSelected && styles.checkboxSelected
            ]}>
              {isSelected && (
                <Image
                  source={require('../assets/check.png')}
                  style={styles.checkIcon}
                />
              )}
            </View>
          </View>
        </View>

        {item.type === 'biohazard' && (
          <View style={styles.biohazardWarning}>
            <Image
              source={require('../assets/warning.png')}
              style={styles.warningIcon}
            />
            <Text style={styles.warningText}>
              Requires special handling - Biohazard waste
            </Text>
          </View>
        )}

        <View style={styles.containerFooter}>
          <Text style={styles.estimatedTime}>
            ⏱️ ~{item.estimated_time} min
          </Text>
          <Text style={styles.priorityIndex}>
            Priority #{index + 1}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#158419" />
        <Text style={styles.loadingText}>Loading containers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Image
            source={require('../assets/less.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Plan Today's Route</Text>
          <Text style={styles.headerSubtitle}>
            {availableContainers.length} containers need collection
          </Text>
        </View>
        
        <TouchableOpacity 
          onPress={handleSelectAll}
          style={styles.selectAllButton}
        >
          <Text style={styles.selectAllText}>
            {selectedContainers.length === availableContainers.length ? 'Clear' : 'All'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Statistics Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{selectedContainers.length}</Text>
          <Text style={styles.statLabel}>Selected</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {availableContainers.filter(c => selectedContainers.includes(c.id) && c.type === 'biohazard').length}
          </Text>
          <Text style={styles.statLabel}>Biohazard</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{calculateEstimatedTime()}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
      </View>

      {/* Container List */}
      <FlatList
        data={availableContainers}
        renderItem={renderContainerItem}
        keyExtractor={item => item.id}
        style={styles.containerList}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Action Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.startRouteButton,
            selectedContainers.length === 0 && styles.startRouteButtonDisabled
          ]}
          onPress={handleStartRoute}
          disabled={selectedContainers.length === 0 || creating}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.startRouteButtonText}>
                Start Route ({selectedContainers.length})
              </Text>
              <Image
                source={require('../assets/arrow.webp')}
                style={styles.startArrowIcon}
              />
            </>
          )}
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#158419',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  selectAllButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  selectAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsBar: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#158419',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginHorizontal: 10,
  },
  containerList: {
    flex: 1,
  },
  listContent: {
    padding: 15,
    paddingBottom: 100,
  },
  containerItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedContainer: {
    borderColor: '#158419',
    backgroundColor: '#f8fff8',
  },
  biohazardContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6600',
  },
  containerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  containerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  containerIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  containerInfo: {
    flex: 1,
  },
  containerId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  companyName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  containerRight: {
    alignItems: 'flex-end',
    marginRight: 15,
  },
  fillLevelContainer: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  fillLevel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  fillBar: {
    width: 50,
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fillProgress: {
    height: '100%',
    borderRadius: 2,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  selectionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#158419',
    borderColor: '#158419',
  },
  checkIcon: {
    width: 14,
    height: 14,
    tintColor: '#fff',
  },
  biohazardWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  warningIcon: {
    width: 16,
    height: 16,
    tintColor: '#FF6600',
    marginRight: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
    flex: 1,
  },
  containerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  estimatedTime: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  priorityIndex: {
    fontSize: 12,
    color: '#158419',
    fontWeight: '600',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  startRouteButton: {
    backgroundColor: '#158419',
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  startRouteButtonDisabled: {
    backgroundColor: '#ccc',
  },
  startRouteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
  startArrowIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
});