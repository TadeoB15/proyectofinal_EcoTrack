import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function MyAccountScreen() {
  const navigation = useNavigation();

  const handleGoBack = () => {

    navigation.goBack();
  };


  const userData = {
    occupation: 'Collector',
    name: 'Larry Davis',
    email: 'freelab88@gmail.com',
    gender: 'Male',
    birthday: 'April 16, 1988',
    phoneNumber: '+84 905 07 00 17',
  };

  const renderDetailItem = (label, value, isLink = false) => (
    <TouchableOpacity
      style={styles.detailItem}
      onPress={() => {
        if (isLink) {
          alert(label); 
        }
      }}
      disabled={!isLink} 
    >
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueContainer}>
        <Text style={styles.detailValue}>{value}</Text>
        {isLink && (
          <Image
            source={require('../assets/bigger.png')} 
            style={styles.arrowRightIcon}
          />
        )}
      </View>
    </TouchableOpacity>
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
        <Text style={styles.headerTitle}>My Account</Text>
        <Image
          source={require('../assets/user.jpg')} 
          style={styles.headerUserPhoto}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Occupation</Text>
          <Text style={styles.sectionValue}>{userData.occupation}</Text>
        </View>


        <View style={styles.detailsGroup}>
          {renderDetailItem('Name', userData.name, true)}
          <View style={styles.separator} />
          {renderDetailItem('Email', userData.email, true)}
          <View style={styles.separator} />
          {renderDetailItem('Gender', userData.gender, true)}
          <View style={styles.separator} />
          {renderDetailItem('Birthday', userData.birthday, true)}
          <View style={styles.separator} />
          {renderDetailItem('Phone number', userData.phoneNumber, true)}
        </View>
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
    flex: 1, 
    textAlign: 'center',
    marginLeft: -24 - 10, 
  },
  headerUserPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fff',
  },
  scrollViewContent: {
    paddingVertical: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionValue: {
    fontSize: 16,
    color: '#666',
  },
  detailsGroup: {
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
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  detailLabel: {
    fontSize: 16,
    color: '#333',
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 16,
    color: '#666',
    marginRight: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 15,
  },
  arrowRightIcon: {
    width: 20,
    height: 20,
    tintColor: '#999',
  },
});
