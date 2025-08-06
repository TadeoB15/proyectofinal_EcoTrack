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
  TextInput,
  Modal,
  ActivityIndicator
} from 'react-native';
import ApiService from '../services/ApiService';

const { width, height } = Dimensions.get('window');

// Datos expandidos de historial
const expandedHistoryData = [
  // Ruta del 26-06-2024
  { 
    id: 'CNT-001', 
    company: 'Medtronic', 
    time: '3:07 p.m.', 
    date: '26-06-2024',
    route_id: 'ROUTE-2025-06-26-001',
    type: 'biohazard',
    fill_level_before: 85,
    fill_level_after: 5,
    icon: require('../assets/toxictrash.png')
  },
  { 
    id: 'CNT-002', 
    company: 'Medtronic', 
    time: '2:45 p.m.', 
    date: '26-06-2024',
    route_id: 'ROUTE-2025-06-26-001',
    type: 'biohazard',
    fill_level_before: 78,
    fill_level_after: 5,
    icon: require('../assets/toxictrash.png')
  },
  { 
    id: 'CNT-005', 
    company: 'Tech Solutions', 
    time: '2:15 p.m.', 
    date: '26-06-2024',
    route_id: 'ROUTE-2025-06-26-001',
    type: 'biohazard',
    fill_level_before: 92,
    fill_level_after: 8,
    icon: require('../assets/toxictrash.png')
  },
  
  // Ruta del 25-06-2024
  { 
    id: 'CNT-004', 
    company: 'Tech Solutions', 
    time: '1:45 p.m.', 
    date: '25-06-2024',
    route_id: 'ROUTE-2025-06-25-001',
    type: 'normal',
    fill_level_before: 87,
    fill_level_after: 3,
    icon: require('../assets/trashcanMenu.png')
  },
  { 
    id: 'CNT-008', 
    company: 'Green Industries', 
    time: '11:30 a.m.', 
    date: '25-06-2024',
    route_id: 'ROUTE-2025-06-25-001',
    type: 'normal',
    fill_level_before: 75,
    fill_level_after: 2,
    icon: require('../assets/trashcanMenu.png')
  },
  
  // Ruta del 24-06-2024
  { 
    id: 'CNT-007', 
    company: 'Green Industries', 
    time: '10:20 a.m.', 
    date: '24-06-2024',
    route_id: 'ROUTE-2025-06-24-001',
    type: 'biohazard',
    fill_level_before: 95,
    fill_level_after: 7,
    icon: require('../assets/toxictrash.png')
  },
  { 
    id: 'CNT-003', 
    company: 'Medtronic', 
    time: '9:20 a.m.', 
    date: '24-06-2024',
    route_id: 'ROUTE-2025-06-24-001',
    type: 'normal',
    fill_level_before: 82,
    fill_level_after: 4,
    icon: require('../assets/trashcanMenu.png')
  },
  
  // Ruta del 23-06-2024
  { 
    id: 'CNT-006', 
    company: 'Tech Solutions', 
    time: '3:15 p.m.', 
    date: '23-06-2024',
    route_id: 'ROUTE-2025-06-23-001',
    type: 'normal',
    fill_level_before: 79,
    fill_level_after: 6,
    icon: require('../assets/trashcanMenu.png')
  },
  { 
    id: 'CNT-009', 
    company: 'Green Industries', 
    time: '2:30 p.m.', 
    date: '23-06-2024',
    route_id: 'ROUTE-2025-06-23-001',
    type: 'normal',
    fill_level_before: 73,
    fill_level_after: 1,
    icon: require('../assets/trashcanMenu.png')
  },
];

export default function HistoryScreen({ navigation, route }) {
  // Manejar route params de forma segura
  const routeParams = route?.params || {};
  
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState(expandedHistoryData);
  const [selectedDateFilter, setSelectedDateFilter] = useState('All dates');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('All companies');
  const [selectedRouteFilter, setSelectedRouteFilter] = useState('All routes');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    loadHistory();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await ApiService.getStoredUser();
      setUserInfo(user);
      console.log('✅ User loaded in HistoryScreen:', user?.username);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      
      // Intentar cargar historial real del backend
      const result = await ApiService.getCollectionHistory();
      
      if (result.success && result.history) {
        // Formatear datos del backend si están disponibles
        const formattedHistory = result.history.map(item => ({
          id: item.container_id,
          company: item.company_name,
          time: new Date(item.collected_at).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          date: new Date(item.collected_at).toLocaleDateString('en-GB'),
          route_id: item.route_id,
          type: item.container_type || 'normal',
          fill_level_before: item.fill_level_before || 0,
          fill_level_after: item.fill_level_after || 0,
          icon: item.container_type === 'biohazard' ? 
                require('../assets/toxictrash.png') : 
                require('../assets/trashcanMenu.png')
        }));
        setFilteredData(formattedHistory);
      } else {
        // Usar datos mock como fallback
        console.log('Using mock history data');
        setFilteredData(expandedHistoryData);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      // Usar datos mock como fallback
      setFilteredData(expandedHistoryData);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  const handleSearch = (text) => {
    setSearchText(text);
    applyFilters(text, selectedDateFilter, selectedCompanyFilter, selectedRouteFilter);
  };

  const applyFilters = (search, dateFilter, companyFilter, routeFilter) => {
    let filtered = expandedHistoryData;

    // Filtro de búsqueda
    if (search.trim() !== '') {
      filtered = filtered.filter(item => 
        item.id.toLowerCase().includes(search.toLowerCase()) ||
        item.company.toLowerCase().includes(search.toLowerCase()) ||
        item.route_id.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filtro por fecha
    if (dateFilter !== 'All dates') {
      filtered = filtered.filter(item => item.date === dateFilter);
    }

    // Filtro por empresa
    if (companyFilter !== 'All companies') {
      filtered = filtered.filter(item => item.company === companyFilter);
    }

    // Filtro por ruta
    if (routeFilter !== 'All routes') {
      filtered = filtered.filter(item => item.route_id === routeFilter);
    }

    setFilteredData(filtered);
  };

  const openFilterModal = (type) => {
    setFilterType(type);
    setShowFilterModal(true);
  };

  const getFilterOptions = () => {
    switch (filterType) {
      case 'date':
        const uniqueDates = ['All dates', ...new Set(expandedHistoryData.map(item => item.date))];
        return uniqueDates;
      case 'company':
        const uniqueCompanies = ['All companies', ...new Set(expandedHistoryData.map(item => item.company))];
        return uniqueCompanies;
      case 'route':
        const uniqueRoutes = ['All routes', ...new Set(expandedHistoryData.map(item => item.route_id))];
        return uniqueRoutes;
      default:
        return [];
    }
  };

  const selectFilterOption = (option) => {
    switch (filterType) {
      case 'date':
        setSelectedDateFilter(option);
        applyFilters(searchText, option, selectedCompanyFilter, selectedRouteFilter);
        break;
      case 'company':
        setSelectedCompanyFilter(option);
        applyFilters(searchText, selectedDateFilter, option, selectedRouteFilter);
        break;
      case 'route':
        setSelectedRouteFilter(option);
        applyFilters(searchText, selectedDateFilter, selectedCompanyFilter, option);
        break;
    }
    setShowFilterModal(false);
  };

  const clearAllFilters = () => {
    setSearchText('');
    setSelectedDateFilter('All dates');
    setSelectedCompanyFilter('All companies');
    setSelectedRouteFilter('All routes');
    setFilteredData(expandedHistoryData);
  };

  const getStatistics = () => {
    const totalContainers = filteredData.length;
    const biohazardCount = filteredData.filter(item => item.type === 'biohazard').length;
    const uniqueRoutes = new Set(filteredData.map(item => item.route_id)).size;
    const uniqueCompanies = new Set(filteredData.map(item => item.company)).size;
    
    return { totalContainers, biohazardCount, uniqueRoutes, uniqueCompanies };
  };

  const renderHistoryItem = ({ item }) => (
    <TouchableOpacity style={styles.historyItem}>
      <Image
        source={item.icon}
        style={[
          styles.historyIcon,
          { tintColor: item.type === 'biohazard' ? '#FF6600' : '#333' }
        ]}
      />
      <View style={styles.historyTextContent}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyId}>{item.id}</Text>
          <View style={[
            styles.typeBadge,
            { backgroundColor: item.type === 'biohazard' ? '#FF6600' : '#4CAF50' }
          ]}>
            <Text style={styles.typeBadgeText}>
              {item.type === 'biohazard' ? 'BIO' : 'NOR'}
            </Text>
          </View>
        </View>
        <Text style={styles.historyCompany}>{item.company}</Text>
        <Text style={styles.routeId}>Route: {item.route_id}</Text>
        <View style={styles.fillLevelInfo}>
          <Text style={styles.fillLevelText}>
            {item.fill_level_before}% → {item.fill_level_after}%
          </Text>
        </View>
      </View>
      <View style={styles.historyTimeDate}>
        <Text style={styles.historyTime}>{item.time}</Text>
        <Text style={styles.historyDate}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );

  const stats = getStatistics();

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#158419" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
            <Image
              source={require('../assets/icons8-less-than-48.png')} 
              style={styles.headerIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Collection History</Text>
          <TouchableOpacity style={styles.clearButton} onPress={clearAllFilters}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Image
            source={require('../assets/icons8-búsqueda-48.png')} 
            style={styles.searchInputIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID, company, or route..."
            value={searchText}
            onChangeText={handleSearch}
            placeholderTextColor="#fff"
          />
        </View>
      </View>

      {/* Statistics Bar */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.totalContainers}</Text>
          <Text style={styles.statLabel}>Containers</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.biohazardCount}</Text>
          <Text style={styles.statLabel}>Biohazard</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.uniqueRoutes}</Text>
          <Text style={styles.statLabel}>Routes</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.uniqueCompanies}</Text>
          <Text style={styles.statLabel}>Companies</Text>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => openFilterModal('date')}
        >
          <Text style={styles.filterButtonText}>
            {selectedDateFilter.length > 12 ? selectedDateFilter.substring(0, 12) + '...' : selectedDateFilter}
          </Text>
          <Image 
            source={require('../assets/flecha.png')} 
            style={styles.filterArrowIcon} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => openFilterModal('company')}
        >
          <Text style={styles.filterButtonText}>
            {selectedCompanyFilter.length > 12 ? selectedCompanyFilter.substring(0, 12) + '...' : selectedCompanyFilter}
          </Text>
          <Image 
            source={require('../assets/flecha.png')} 
            style={styles.filterArrowIcon} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => openFilterModal('route')}
        >
          <Text style={styles.filterButtonText}>
            {selectedRouteFilter.length > 12 ? selectedRouteFilter.substring(0, 12) + '...' : selectedRouteFilter}
          </Text>
          <Image 
            source={require('../assets/flecha.png')} 
            style={styles.filterArrowIcon} 
          />
        </TouchableOpacity>
      </View>

      {/* History List */}
      <FlatList
        data={filteredData}
        renderItem={renderHistoryItem}
        keyExtractor={item => `${item.id}-${item.date}-${item.time}`}
        contentContainerStyle={styles.listContentContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No history found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {filterType === 'date' ? 'Date' : filterType === 'company' ? 'Company' : 'Route'}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowFilterModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={getFilterOptions()}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.filterOption}
                  onPress={() => selectFilterOption(item)}
                >
                  <Text style={styles.filterOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
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
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 15,
  },
  clearButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statBox: {
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
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: width * 0.28,
    justifyContent: 'center',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#333',
    marginRight: 5,
    fontWeight: '500',
  },
  filterArrowIcon: {
    width: 10,
    height: 10,
    tintColor: '#666',
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
    width: 32,
    height: 32,
    marginRight: 15,
  },
  historyTextContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  historyCompany: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  routeId: {
    fontSize: 11,
    color: '#158419',
    fontWeight: '600',
    marginBottom: 4,
  },
  fillLevelInfo: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  fillLevelText: {
    fontSize: 11,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.6,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#666',
  },
  filterOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#333',
  },
});