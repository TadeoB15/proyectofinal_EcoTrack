import React, { useState } from 'react'; 
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, FlatList, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// Datos de historial de contenedores vaciados
const historyData = [
  { 
    id: 'CNT-001', 
    company: 'Medtronic', 
    time: '3:07 p.m.', 
    date: '26-06-2024',
    icon: require('../assets/trashcanMenu.png')
  },
  { 
    id: 'CNT-002', 
    company: 'Medtronic', 
    time: '2:15 p.m.', 
    date: '26-06-2024',
    icon: require('../assets/trashcanMenu.png')
  },
  { 
    id: 'CNT-003', 
    company: 'Tech Solutions', 
    time: '1:45 p.m.', 
    date: '25-06-2024',
    icon: require('../assets/trashcanMenu.png')
  },
  { 
    id: 'CNT-004', 
    company: 'Green Industries', 
    time: '11:30 a.m.', 
    date: '25-06-2024',
    icon: require('../assets/toxictrash.png')
  },
  { 
    id: 'CNT-005', 
    company: 'Medtronic', 
    time: '9:20 a.m.', 
    date: '24-06-2024',
    icon: require('../assets/trashcanMenu.png')
  },
];

export default function HistoryScreen() {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState(historyData);
  const [selectedDateFilter, setSelectedDateFilter] = useState('By date');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('By company');

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleSearch = (text) => {
    setSearchText(text);
    if (text.trim() === '') {
      setFilteredData(historyData);
    } else {
      const filtered = historyData.filter(item => 
        item.id.toLowerCase().includes(text.toLowerCase()) ||
        item.company.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredData(filtered);
    }
  };

  const handleDateFilter = () => {
    // Aquí puedes implementar la lógica del filtro por fecha
    alert('Filtro por fecha - Funcionalidad pendiente');
  };

  const handleCompanyFilter = () => {
    // Aquí puedes implementar la lógica del filtro por compañía
    alert('Filtro por compañía - Funcionalidad pendiente');
  };

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <Image
        source={item.icon}
        style={styles.historyIcon}
      />
      <View style={styles.historyTextContent}>
        <Text style={styles.historyId}>{item.id}</Text>
        <Text style={styles.historyCompany}>{item.company}</Text>
      </View>
      <View style={styles.historyTimeDate}>
        <Text style={styles.historyTime}>{item.time}</Text>
        <Text style={styles.historyDate}>{item.date}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header con título y buscador */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
            <Image
              source={require('../assets/less.png')} 
              style={styles.headerIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>History</Text>
          <TouchableOpacity style={styles.searchButton}>
            <Image
              source={require('../assets/search.png')} 
              style={styles.searchIcon}
            />
          </TouchableOpacity>
        </View>
        
        {/* Barra de búsqueda */}
        <View style={styles.searchContainer}>
          <Image
            source={require('../assets/search.png')} 
            style={styles.searchInputIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID..."
            value={searchText}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.filterButton} onPress={handleDateFilter}>
          <Text style={styles.filterButtonText}>{selectedDateFilter}</Text>
          <Image 
            source={require('../assets/flecha.png')} 
            style={styles.filterArrowIcon} 
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton} onPress={handleCompanyFilter}>
          <Text style={styles.filterButtonText}>{selectedCompanyFilter}</Text>
          <Image 
            source={require('../assets/flecha.png')} 
            style={styles.filterArrowIcon} 
          />
        </TouchableOpacity>
      </View>

      {/* Lista de historial */}
      <FlatList
        data={filteredData}
        renderItem={renderHistoryItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContentContainer}
        showsVerticalScrollIndicator={false}
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
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
    marginHorizontal: 15,
  },
  searchButton: {
    padding: 5,
  },
  searchIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginTop: 5,
  },
  searchInputIcon: {
    width: 18,
    height: 18,
    tintColor: '#fff',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#158419',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: width * 0.4,
    justifyContent: 'center',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#fff',
    marginRight: 8,
    fontWeight: '500',
  },
  filterArrowIcon: {
    width: 12,
    height: 12,
    tintColor: '#fff',
  },
  listContentContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  historyIcon: {
    width: 35,
    height: 35,
    marginRight: 15,
    tintColor: '#333',
  },
  historyTextContent: {
    flex: 1,
  },
  historyId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  historyCompany: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  historyTimeDate: {
    alignItems: 'flex-end',
  },
  historyTime: {
    fontSize: 14,
    color: '#158419',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
});