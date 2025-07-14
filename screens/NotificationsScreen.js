import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native'; 

const { width, height } = Dimensions.get('window');

// Datos de ejemplo para las notificaciones
const notificationsData = [
  {
    id: '1',
    icon: require('../assets/verified.png'), 
    title: 'System',
    snippet: 'Your route has been successfully saved',
    type: 'success',
  },
  {
    id: '2',
    icon: require('../assets/system.png'), 
    title: 'System',
    snippet: 'Thank you! Your user manual is ready',
    type: 'info',
  },

];

export default function NotificationsScreen() {
  const navigation = useNavigation();


  const handleGoBack = () => {
    navigation.goBack();
  };


  const handleClearNotifications = () => {
    alert('Funcionalidad para eliminar notificaciones (no implementada).');
  };

  // Renderiza cada elemento de notificación
  const renderNotificationItem = ({ item }) => (
    <View style={styles.notificationItem}>
      <View style={[styles.notificationIconContainer, item.type === 'success' ? styles.successIconBg : styles.infoIconBg]}>
        <Image
          source={item.icon || require('../assets/city.png')} 
          style={styles.notificationIcon}
        />
      </View>
      <View style={styles.notificationTextContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationSnippet}>{item.snippet}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
          <Image
            source={require('../assets/less.png')} 
            style={styles.headerIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleClearNotifications} style={styles.headerButton}>
          <Image
            source={require('../assets/trashcanMenu.png')} 
            style={styles.headerIcon}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notificationsData}
        renderItem={renderNotificationItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.notificationList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#158419', 
    paddingTop: 50, 
    paddingHorizontal: 20,
    paddingBottom: 15,
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerButton: {
    padding: 5,
  },
  headerIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff', 
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  notificationList: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  successIconBg: {
    backgroundColor: '#e6f7ed', 
  },
  infoIconBg: {
    backgroundColor: '#e0f2f7', 
  },
  notificationIcon: {
    width: 24,
    height: 24,
    tintColor: '#158419', 
  },
  notificationTextContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  notificationSnippet: {
    fontSize: 14,
    color: '#666',
  },
});
