import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Dimensions,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import ApiService from '../services/ApiService';

const { width, height } = Dimensions.get('window');

// Datos de incidencias mock para employees (fallback)
const mockIncidencesData = {
  'COMP-001': [
    {
      id: 'CNT-001',
      type: 'biohazard',
      date: '26-06-2024',
      description: 'There is a rather unhealthy smell coming out of the container.',
      additionalInfo: 'Apparently, it is some bottles with dangerous chemicals according to what my supervisor told me.',
      images: [require('../assets/incidences1.png')],
      completed: false,
      status: 'pending'
    }
  ],
  'COMP-002': [
    {
      id: 'CNT-002',
      type: 'normal',
      date: '25-06-2024',
      description: 'There are five heavy sacks of debris outside the container.',
      additionalInfo: 'The sacks appear to contain construction debris and need special handling.',
      images: [require('../assets/incidences1.png')],
      completed: false,
      status: 'pending'
    }
  ],
  'COMP-003': [
    {
      id: 'CNT-003',
      type: 'normal',
      date: '24-06-2024',
      description: 'There are three platforms outside the container.',
      additionalInfo: 'Wooden platforms blocking access to the container entrance.',
      images: [require('../assets/incidences1.png')],
      completed: false,
      status: 'pending'
    }
  ]
};

export default function IncidencesScreen({ navigation, route }) {
  // Manejar route params de forma segura
  const routeParams = route?.params || {};
  const { companyId, companyName, userRole } = routeParams;

  const [expandedIncidence, setExpandedIncidence] = useState(null);
  const [showCompleteAllConfirmation, setShowCompleteAllConfirmation] = useState(false);
  const [showCompleteOneConfirmation, setShowCompleteOneConfirmation] = useState(false);
  const [selectedIncidenceId, setSelectedIncidenceId] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [incidences, setIncidences] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userInfo) {
      loadIncidences();
    }
  }, [userInfo]);

  const loadUserData = async () => {
    try {
      const user = await ApiService.getStoredUser();
      setUserInfo(user);
      console.log('✅ User loaded in IncidencesScreen:', user?.username, 'Role:', user?.role);
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  const loadIncidences = async () => {
    try {
      setLoading(true);
      
      if (userInfo?.role === 'collector') {
        // COLLECTORS: Solo consulta incidencias de empresas asignadas
        console.log('🔍 Loading incidents for collector...');
        const result = await ApiService.getAssignmentIncidents();
        
        if (result.success) {
          const formattedIncidents = result.incidents.map(incident => ({
            id: incident.container_id,
            incident_id: incident.incident_id,
            type: incident.type || 'normal',
            date: new Date(incident.created_at).toLocaleDateString('en-GB'),
            description: incident.description,
            additionalInfo: incident.title,
            status: incident.status,
            priority: incident.priority,
            company_id: incident.company_id,
            images: incident.images || [],
            completed: incident.status === 'resolved'
          }));
          setIncidences(formattedIncidents);
          console.log('✅ Incidents loaded for collector:', formattedIncidents.length);
        } else {
          // Fallback para collectors sin incidencias
          setIncidences([]);
        }
      } else {
        // EMPLOYEES: Comportamiento original con datos mock
        const companyIncidents = mockIncidencesData[companyId] || [];
        setIncidences(companyIncidents);
        console.log('✅ Mock incidents loaded for employee:', companyIncidents.length);
      }
    } catch (error) {
      console.error('Error loading incidents:', error);
      // Fallback a datos mock o array vacío
      if (userInfo?.role === 'collector') {
        setIncidences([]);
      } else {
        setIncidences(mockIncidencesData[companyId] || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  const handleExpandIncidence = (incidenceId) => {
    setExpandedIncidence(expandedIncidence === incidenceId ? null : incidenceId);
  };

  const handleCompleteAll = () => {
    if (userInfo?.role === 'collector') {
      Alert.alert('Access Denied', 'Collectors can only view incidents, not complete them.');
      return;
    }
    setShowCompleteAllConfirmation(true);
  };

  const handleCompleteOne = (incidenceId) => {
    if (userInfo?.role === 'collector') {
      Alert.alert('Access Denied', 'Collectors can only view incidents, not complete them.');
      return;
    }
    setSelectedIncidenceId(incidenceId);
    setShowCompleteOneConfirmation(true);
  };

  const confirmCompleteAll = () => {
    setShowCompleteAllConfirmation(false);
    // Marcar todas las incidencias como completadas (solo para employees)
    const updatedIncidences = incidences.map(inc => ({ ...inc, completed: true, status: 'resolved' }));
    setIncidences(updatedIncidences);
    setShowSuccessModal(true);
  };

  const confirmCompleteOne = () => {
    setShowCompleteOneConfirmation(false);
    // Marcar solo una incidencia como completada (solo para employees)
    const updatedIncidences = incidences.map(inc => 
      inc.id === selectedIncidenceId ? { ...inc, completed: true, status: 'resolved' } : inc
    );
    setIncidences(updatedIncidences);
    setExpandedIncidence(null);
    setShowSuccessModal(true);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setSelectedIncidenceId(null);
  };

  const getContainerIcon = (type) => {
    switch(type) {
      case 'biohazard':
      case 'external_trash':
        return require('../assets/toxictrash.png');
      case 'normal':
      case 'complaint':
      case 'damage':
      default:
        return require('../assets/trashcanMenu.png');
    }
  };

  const renderIncidenceImages = (images) => {
    if (!images || images.length === 0) return null;
    
    return (
      <View style={styles.imagesContainer}>
        <FlatList
          data={images}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <Image 
              source={typeof item === 'string' ? { uri: item } : item} 
              style={styles.incidenceImage} 
            />
          )}
          contentContainerStyle={styles.imagesList}
        />
      </View>
    );
  };

  const renderIncidenceItem = (incidence) => {
    const isExpanded = expandedIncidence === incidence.id;
    const isCollector = userInfo?.role === 'collector';
    
    return (
      <View key={incidence.id} style={[
        styles.incidenceItem, 
        incidence.completed && styles.completedIncidence
      ]}>
        {/* Header de la incidencia */}
        <View style={styles.incidenceHeader}>
          <Image
            source={getContainerIcon(incidence.type)}
            style={styles.containerIcon}
          />
          <View style={styles.incidenceInfo}>
            <Text style={styles.incidenceId}>
              {incidence.incident_id || incidence.id}
            </Text>
            <Text style={styles.incidenceDate}>{incidence.date}</Text>
            {incidence.priority && (
              <Text style={[styles.priorityText, { 
                color: incidence.priority === 'high' ? '#FF6600' : 
                       incidence.priority === 'critical' ? '#FF0000' : '#666' 
              }]}>
                Priority: {incidence.priority}
              </Text>
            )}
          </View>
          <Image
            source={require('../assets/warning.png')}
            style={styles.warningIcon}
          />
          <TouchableOpacity 
            onPress={() => handleExpandIncidence(incidence.id)}
            style={styles.expandButton}
          >
            <Image
              source={require('../assets/icons8-less-than-48.png')}
              style={[
                styles.expandIcon,
                isExpanded && styles.expandIconRotated
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* Status badge para collectors */}
        {isCollector && (
          <View style={[styles.statusBadge, { 
            backgroundColor: incidence.status === 'resolved' ? '#4CAF50' : '#FFA500' 
          }]}>
            <Text style={styles.statusText}>
              {incidence.status?.toUpperCase() || 'PENDING'}
            </Text>
          </View>
        )}

        {/* Descripción principal */}
        <Text style={styles.incidenceDescription}>
          {incidence.description}
        </Text>

        {/* Contenido expandido */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {incidence.additionalInfo && (
              <Text style={styles.additionalInfo}>
                {incidence.additionalInfo}
              </Text>
            )}
            
            {renderIncidenceImages(incidence.images)}
            
            {/* Botones solo para employees */}
            <View style={styles.expandedButtons}>
              <TouchableOpacity 
                style={styles.retractButton}
                onPress={() => setExpandedIncidence(null)}
              >
                <Text style={styles.retractButtonText}>Retract</Text>
              </TouchableOpacity>
              
              {!isCollector && (
                <TouchableOpacity 
                  style={[
                    styles.completeOneButton,
                    incidence.completed && styles.completeOneButtonDisabled
                  ]}
                  onPress={() => handleCompleteOne(incidence.id)}
                  disabled={incidence.completed}
                >
                  <Text style={styles.completeOneButtonText}>
                    {incidence.completed ? 'Completed' : 'Complete'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  const pendingIncidences = incidences.filter(inc => !inc.completed);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#158419" />
        <Text style={styles.loadingText}>Loading incidents...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Image
            source={require('../assets/icons8-less-than-48.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {userInfo?.role === 'collector' ? 'Assignment Incidents' : 'Incidences and reports'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {userInfo?.role === 'collector' 
              ? 'From assigned companies (View only)' 
              : companyName || 'Company incidents'
            }
          </Text>
        </View>
      </View>

      {/* Lista de incidencias */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.incidencesList}>
          {incidences.length > 0 ? (
            incidences.map(renderIncidenceItem)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No incidents found</Text>
              <Text style={styles.emptySubtext}>
                {userInfo?.role === 'collector' 
                  ? 'No incidents reported for your assigned companies'
                  : 'No incidents reported for this company'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Botón Complete All - Solo para employees */}
      {pendingIncidences.length > 0 && userInfo?.role !== 'collector' && (
        <TouchableOpacity 
          style={styles.completeAllButton}
          onPress={handleCompleteAll}
        >
          <Text style={styles.completeAllButtonText}>Complete All</Text>
        </TouchableOpacity>
      )}

      {/* Modales (solo para employees) */}
      {userInfo?.role !== 'collector' && (
        <>
          {/* Modal de confirmación para completar todas */}
          <Modal
            visible={showCompleteAllConfirmation}
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
                <Text style={styles.modalTitle}>Complete all incidences?</Text>
                <Text style={styles.modalMessage}>
                  Are you sure you want to mark all incidences as completed?
                </Text>
                
                <View style={styles.modalButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.modalCancelButton} 
                    onPress={() => setShowCompleteAllConfirmation(false)}
                  >
                    <Text style={styles.modalCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalConfirmButton} 
                    onPress={confirmCompleteAll}
                  >
                    <Text style={styles.modalConfirmButtonText}>Complete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Modal de confirmación para completar una */}
          <Modal
            visible={showCompleteOneConfirmation}
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
                <Text style={styles.modalTitle}>Complete incidence?</Text>
                <Text style={styles.modalMessage}>
                  Are you sure you want to mark this incidence as completed?
                </Text>
                
                <View style={styles.modalButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.modalCancelButton} 
                    onPress={() => setShowCompleteOneConfirmation(false)}
                  >
                    <Text style={styles.modalCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalConfirmButton} 
                    onPress={confirmCompleteOne}
                  >
                    <Text style={styles.modalConfirmButtonText}>Complete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Modal de éxito */}
          <Modal
            visible={showSuccessModal}
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
                <Text style={styles.modalTitle}>Incidence completed</Text>
                <Text style={styles.modalMessage}>
                  The incidence has been successfully marked as completed
                </Text>
                
                <TouchableOpacity 
                  style={styles.modalDoneButton} 
                  onPress={handleSuccessModalClose}
                >
                  <Text style={styles.modalDoneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

// ... (estilos idénticos al original)
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
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  incidencesList: {
    padding: 15,
  },
  incidenceItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  completedIncidence: {
    opacity: 0.6,
    backgroundColor: '#f0f0f0',
  },
  incidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  containerIcon: {
    width: 30,
    height: 30,
    marginRight: 12,
  },
  incidenceInfo: {
    flex: 1,
  },
  incidenceId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  incidenceDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  warningIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFA500',
    marginRight: 10,
  },
  expandButton: {
    padding: 5,
  },
  expandIcon: {
    width: 16,
    height: 16,
    tintColor: '#666',
    transform: [{ rotate: '90deg' }],
  },
  expandIconRotated: {
    transform: [{ rotate: '270deg' }],
  },
  incidenceDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 10,
  },
  expandedContent: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  additionalInfo: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  imagesContainer: {
    marginBottom: 15,
  },
  imagesList: {
    paddingHorizontal: 5,
  },
  incidenceImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  expandedButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  retractButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  retractButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  completeOneButton: {
    flex: 1,
    backgroundColor: '#158419',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  completeOneButtonDisabled: {
    backgroundColor: '#ccc',
  },
  completeOneButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  completeAllButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#158419',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  completeAllButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Estilos para modales
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
    backgroundColor: '#158419',
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
    backgroundColor: '#158419',
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
    backgroundColor: '#158419',
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