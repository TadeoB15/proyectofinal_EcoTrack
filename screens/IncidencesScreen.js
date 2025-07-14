import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Dimensions,
  Modal,
  FlatList 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// Datos de incidencias por empresa
const incidencesData = {
  'COMP-001': [
    {
      id: 'CNT-001',
      type: 'biohazard',
      date: '26-06-2024',
      description: 'There is a rather unhealthy smell coming out of the container.',
      additionalInfo: 'Apparently, it is some bottles with dangerous chemicals according to what my supervisor told me.',
      images: [
        require('../assets/incidences1.png')
      ],
      completed: false
    }
  ],
  'COMP-002': [
    {
      id: 'CNT-002',
      type: 'normal',
      date: '25-06-2024',
      description: 'There are five heavy sacks of debris outside the container.',
      additionalInfo: 'The sacks appear to contain construction debris and need special handling.',
      images: [
        require('../assets/incidences1.png')
      ],
      completed: false
    }
  ],
  'COMP-003': [
    {
      id: 'CNT-003',
      type: 'normal',
      date: '24-06-2024',
      description: 'There are three platforms outside the container.',
      additionalInfo: 'Wooden platforms blocking access to the container entrance.',
      images: [
        require('../assets/incidences1.png')
      ],
      completed: false
    }
  ]
};

export default function IncidencesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { companyId, companyName } = route.params || {};

  const [expandedIncidence, setExpandedIncidence] = useState(null);
  const [showCompleteAllConfirmation, setShowCompleteAllConfirmation] = useState(false);
  const [showCompleteOneConfirmation, setShowCompleteOneConfirmation] = useState(false);
  const [selectedIncidenceId, setSelectedIncidenceId] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [incidences, setIncidences] = useState(incidencesData[companyId] || []);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleExpandIncidence = (incidenceId) => {
    setExpandedIncidence(expandedIncidence === incidenceId ? null : incidenceId);
  };

  const handleCompleteAll = () => {
    setShowCompleteAllConfirmation(true);
  };

  const handleCompleteOne = (incidenceId) => {
    setSelectedIncidenceId(incidenceId);
    setShowCompleteOneConfirmation(true);
  };

  const confirmCompleteAll = () => {
    setShowCompleteAllConfirmation(false);
    // Marcar todas las incidencias como completadas
    const updatedIncidences = incidences.map(inc => ({ ...inc, completed: true }));
    setIncidences(updatedIncidences);
    setShowSuccessModal(true);
  };

  const confirmCompleteOne = () => {
    setShowCompleteOneConfirmation(false);
    // Marcar solo una incidencia como completada
    const updatedIncidences = incidences.map(inc => 
      inc.id === selectedIncidenceId ? { ...inc, completed: true } : inc
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
        return require('../assets/toxictrash.png');
      case 'normal':
        return require('../assets/trashcanMenu.png');
      default:
        return require('../assets/trashcanMenu.png');
    }
  };

  const renderIncidenceImages = (images) => (
    <View style={styles.imagesContainer}>
      <FlatList
        data={images}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Image source={item} style={styles.incidenceImage} />
        )}
        contentContainerStyle={styles.imagesList}
      />
    </View>
  );

  const renderIncidenceItem = (incidence) => {
    const isExpanded = expandedIncidence === incidence.id;
    
    return (
      <View key={incidence.id} style={[styles.incidenceItem, incidence.completed && styles.completedIncidence]}>
        {/* Header de la incidencia */}
        <View style={styles.incidenceHeader}>
          <Image
            source={getContainerIcon(incidence.type)}
            style={styles.containerIcon}
          />
          <View style={styles.incidenceInfo}>
            <Text style={styles.incidenceId}>{incidence.id}</Text>
            <Text style={styles.incidenceDate}>{incidence.date}</Text>
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
              source={require('../assets/arrow.webp')}
              style={[
                styles.expandIcon,
                isExpanded && styles.expandIconRotated
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* Descripción principal */}
        <Text style={styles.incidenceDescription}>
          {incidence.description}
        </Text>

        {/* Contenido expandido */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.additionalInfo}>
              {incidence.additionalInfo}
            </Text>
            
            {incidence.images && incidence.images.length > 0 && renderIncidenceImages(incidence.images)}
            
            {/* Botones para incidencia expandida */}
            <View style={styles.expandedButtons}>
              <TouchableOpacity 
                style={styles.retractButton}
                onPress={() => setExpandedIncidence(null)}
              >
                <Text style={styles.retractButtonText}>Retract</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.completeOneButton}
                onPress={() => handleCompleteOne(incidence.id)}
                disabled={incidence.completed}
              >
                <Text style={styles.completeOneButtonText}>
                  {incidence.completed ? 'Completed' : 'Complete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const pendingIncidences = incidences.filter(inc => !inc.completed);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Image
            source={require('../assets/less.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Incidences and reports</Text>
          <Text style={styles.headerSubtitle}>{companyName}</Text>
        </View>
      </View>

      {/* Lista de incidencias */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.incidencesList}>
          {incidences.map(renderIncidenceItem)}
        </View>
      </ScrollView>

      {/* Botón Complete All */}
      {pendingIncidences.length > 0 && (
        <TouchableOpacity 
          style={styles.completeAllButton}
          onPress={handleCompleteAll}
        >
          <Text style={styles.completeAllButtonText}>Complete</Text>
        </TouchableOpacity>
      )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  completeOneButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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