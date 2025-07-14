import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';

const { width } = Dimensions.get('window');

export default function CustomDrawerContent(props) {
  const userName = "Larry Davis";
  const userRole = "Collector";

  return (
    <DrawerContentScrollView
      {...props}
      style={styles.drawerScrollView}
      contentContainerStyle={styles.drawerContentContainer}
    >
      
      <View style={styles.profileHeader}>
        <Image
          source={require('../assets/user.jpg')} 
          style={styles.profileImage}
        />
        <Text style={styles.userName}>{userName}</Text>
        <View style={styles.userRoleContainer}>
          <Text style={styles.userRole}>{userRole}</Text>
        </View>
      </View>

      
      <View style={styles.drawerItemsContainer}>
        <DrawerItemList {...props} />
      </View>

    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerScrollView: {
    flex: 1,
    backgroundColor: '#fff', 
  },
  drawerContentContainer: {
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  profileHeader: {
    backgroundColor: '#fff', 
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 0,
    paddingTop: 50,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#158419', 
    marginBottom: 10,
  },
  userName: {
    color: '#333', 
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userRoleContainer: {
    backgroundColor: '#158419', 
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  userRole: {
    color: '#fff', 
    fontSize: 14,
    fontWeight: '600',
  },
  drawerItemsContainer: {
    paddingLeft: 20, 
  },
});