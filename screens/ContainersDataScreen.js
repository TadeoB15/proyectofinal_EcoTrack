import React, { useState } from 'react'; 
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function ContainersDataScreen() {
  const navigation = useNavigation();
  const [currentView, setCurrentView] = useState('data');
  const [reportTitle, setReportTitle] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

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

  const handleCompletePress = () => {
    setCurrentView('completed');
    setIsCompleted(true);
  };

  const handleSendReport = () => {
    console.log('Reporte enviado:', { title: reportTitle, message: reportMessage });
    setCurrentView('success'); 
    setReportTitle(''); 
    setReportMessage('');
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

  // Renderizado condicional de las vistas
  const renderContent = () => {
    switch (currentView) {
      case 'data':
        return (
          <View style={styles.mainContainer}>
            <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.dataCard}>
                <View style={styles.dataHeader}>
                  <Image source={require('../assets/locationTrash.png')} style={styles.dataHeaderIcon} />
                  <Text style={styles.dataTitle}>Location</Text>
                </View>
                <Text style={styles.dataValue}>105 William St, Chicago, US</Text>
              </View>

              <View style={styles.dataCard}>
                <View style={styles.dataHeader}>
                  <Image source={require('../assets/temperature.png')} style={styles.dataHeaderIcon} />
                  <Text style={styles.dataTitle}>Temperature and humidity</Text>
                </View>
                <Text style={styles.dataValue}>Current temperature: 36.6°C</Text>
                <Text style={styles.dataValue}>Current humidity: 28.2</Text>
              </View>

              <View style={styles.dataCard}>
                <View style={styles.dataHeader}>
                  <Image source={require('../assets/co2.png')} style={styles.dataHeaderIcon} />
                  <Text style={styles.dataTitle}>Emission of gases</Text>
                </View>
                <Text style={styles.dataValue}>Current CO2: 703 ppm</Text>
              </View>
            </ScrollView>

            <View style={styles.bottomButtonContainer}>
              <TouchableOpacity style={styles.completeButton} onPress={handleCompletePress}>
                <Text style={styles.completeButtonText}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'completed':
        return (
          <View style={styles.completedContainer}>
            <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.dataCard}>
                <View style={styles.dataHeader}>
                  <Image source={require('../assets/locationTrash.png')} style={styles.dataHeaderIcon} />
                  <Text style={styles.dataTitle}>Location</Text>
                </View>
                <View style={styles.completedOverlay}>
                  <Image source={require('../assets/check.png')} style={styles.checkIcon} />
                  <Text style={styles.completedTitle}>Successful registration</Text>
                  <Text style={styles.completedSubtitle}>completed</Text>
                  <Text style={styles.completedMessage}>The container has been marked as empty.</Text>
                  <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.dataCard, styles.dimmedCard]}>
                <View style={styles.dataHeader}>
                  <Image source={require('../assets/temperature.png')} style={[styles.dataHeaderIcon, styles.dimmedIcon]} />
                  <Text style={[styles.dataTitle, styles.dimmedText]}>Temperature and humidity</Text>
                </View>
                <Text style={[styles.dataValue, styles.dimmedText]}>Current temperature: 36.6°C</Text>
                <Text style={[styles.dataValue, styles.dimmedText]}>Current humidity: 28.2</Text>
              </View>

              <View style={[styles.dataCard, styles.dimmedCard]}>
                <View style={styles.dataHeader}>
                  <Image source={require('../assets/co2.png')} style={[styles.dataHeaderIcon, styles.dimmedIcon]} />
                  <Text style={[styles.dataTitle, styles.dimmedText]}>Emission of gases</Text>
                </View>
                <Text style={[styles.dataValue, styles.dimmedText]}>Current CO2: 703 ppm</Text>
              </View>
            </ScrollView>

            <View style={styles.bottomButtonContainer}>
              <TouchableOpacity style={[styles.completeButton, styles.completedButton]} disabled>
                <Text style={[styles.completeButtonText, styles.completedButtonText]}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'reportForm':
        return (
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Value"
                value={reportTitle}
                onChangeText={setReportTitle}
              />

              <Text style={styles.formLabel}>Message</Text>
              <TextInput
                style={[styles.textInput, styles.messageInput]}
                placeholder="Value"
                multiline
                value={reportMessage}
                onChangeText={setReportMessage}
              />

              <TouchableOpacity style={styles.insertImageButton} onPress={handleInsertImage}>
                <Text style={styles.insertImageButtonText}>Insert Image</Text>
              </TouchableOpacity>

              <View style={styles.formButtonsContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancelReport}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sendReportButton} onPress={handleSendReport}>
                  <Text style={styles.sendReportButtonText}>Send report</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        );

      case 'success':
        return (
          <View style={styles.successContainer}>
            <Image source={require('../assets/city.png')} style={styles.successIcon} />
            <Text style={styles.successTitle}>Successful registration</Text>
            <Text style={styles.successMessage}>
              The report has been sent successfully
            </Text>
            <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
          <Image
            source={require('../assets/less.png')} 
            style={styles.headerIcon}
          />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerContainerId}>CNT-002</Text>
          <Text style={styles.headerPercentage}>78%</Text>
          <View style={styles.headerStatusContainer}>
            <Text style={styles.headerStatus}>Active</Text>
            <Image source={require('../assets/arrow.webp')} style={styles.headerArrow} />
          </View>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#158419',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#158419',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerButton: {
    padding: 5,
  },
  headerIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerContainerId: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerPercentage: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  headerStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 5,
  },
  headerStatus: {
    color: '#fff',
    fontSize: 12,
    marginRight: 5,
  },
  headerArrow: {
    width: 12,
    height: 12,
    tintColor: '#fff',
  },
  headerRight: {
    width: 34,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
    padding: 15,
  },
  dataCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  dataHeaderIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    tintColor: '#666',
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dataValue: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  bottomButtonContainer: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 30,
  },
  completeButton: {
    backgroundColor: '#158419',
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Estilos para la vista completada
  completedContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  completedOverlay: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  checkIcon: {
    width: 60,
    height: 60,
    marginBottom: 15,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#158419',
    marginBottom: 5,
  },
  completedSubtitle: {
    fontSize: 14,
    color: '#158419',
    fontWeight: '500',
    marginBottom: 10,
  },
  completedMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  doneButton: {
    backgroundColor: '#158419',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dimmedCard: {
    opacity: 0.5,
  },
  dimmedIcon: {
    opacity: 0.5,
  },
  dimmedText: {
    opacity: 0.5,
  },
  completedButton: {
    backgroundColor: '#ccc',
  },
  completedButtonText: {
    color: '#999',
  },
  // Estilos del formulario (mantienen su diseño original)
  scrollViewContent: {
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  messageInput: {
    height: 100, 
    textAlignVertical: 'top', 
  },
  insertImageButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  insertImageButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  formButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  sendReportButton: {
    flex: 1,
    backgroundColor: '#158419',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 10,
  },
  sendReportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#f5f5f5', 
  },
  successIcon: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#158419',
    marginBottom: 10,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
});