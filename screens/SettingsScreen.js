import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function SettingsScreen() {
  const navigation = useNavigation();

  
  const handleGoBack = () => {
    navigation.goBack();
  };

 
  const navigateTo = (screenName) => {
    navigation.navigate(screenName);
  };


  const handleStaticOptionPress = (optionName) => {
    console.log(`Opción estática presionada: ${optionName}`);

  };


  const handleLogout = () => {
    console.log('Botón de Log out presionado. Redirigiendo a Login.');
    navigation.replace('Login'); 
  };

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>

          <Image
            source={require('../assets/less.png')} 
            style={styles.headerIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>

        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => navigateTo('MyAccount')} 
        >

          <Image
            source={require('../assets/user.jpg')} 
            style={styles.profileImage}
          />
          <View style={styles.profileTextContainer}>
            <Text style={styles.profileName}>Larry Davis</Text>
            <Text style={styles.profileRole}>Collector</Text>
          </View>
          <Image
            source={require('../assets/bigger.png')} 
            style={styles.arrowRightIcon}
          />
        </TouchableOpacity>

        <View style={styles.optionGroup}>
          <TouchableOpacity style={styles.optionItem} onPress={() => navigateTo('Notifications')}>
            <Text style={styles.optionText}>Notifications</Text>
            <Image
              source={require('../assets/bigger.png')} 
              style={styles.arrowRightIcon}
            />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.optionItem} onPress={() => handleStaticOptionPress('Security')}>
            <Text style={styles.optionText}>Security</Text>
            <Image
              source={require('../assets/bigger.png')} 
              style={styles.arrowRightIcon}
            />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.optionItem} onPress={() => handleStaticOptionPress('Language')}>
            <Text style={styles.optionText}>Language</Text>
            <Image
              source={require('../assets/bigger.png')}
              style={styles.arrowRightIcon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.optionGroup}>
          <TouchableOpacity style={styles.optionItem} onPress={() => handleStaticOptionPress('Clear cache')}>
            <Text style={styles.optionText}>Clear cache</Text>
            <Image
              source={require('../assets/bigger.png')} 
              style={styles.arrowRightIcon}
            />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.optionItem} onPress={() => handleStaticOptionPress('Terms & Privacy Policy')}>
            <Text style={styles.optionText}>Terms & Privacy Policy</Text>
            <Image
              source={require('../assets/bigger.png')} 
              style={styles.arrowRightIcon}
            />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.optionItem} onPress={() => handleStaticOptionPress('ContactUs')}>
            <Text style={styles.optionText}>Contact us</Text>
            <Image
              source={require('../assets/bigger.png')}
              style={styles.arrowRightIcon}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
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
  headerSpacer: {
    width: 24 + 10, 
  },
  scrollViewContent: {
    paddingVertical: 15,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  profileTextContainer: {
    flex: 1, 
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  profileRole: {
    fontSize: 14,
    color: '#666',
  },
  arrowRightIcon: {
    width: 20,
    height: 20,
    tintColor: '#999',
  },
  optionGroup: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden', 
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 15, 
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 15,
    marginHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginTop: 5, 
  },
  logoutButtonText: {
    color: '#158419', 
    fontSize: 16,
    fontWeight: '600',
  },
});
