import { useNavigation } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../config/firebase';

const { width: screenWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const NGOCard = ({ ngo, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.ngoCard} 
      onPress={() => onPress(ngo)}
      {...(isWeb && {
        onMouseEnter: () => {},
        onMouseLeave: () => {},
      })}
    >
      <View style={styles.ngoHeader}>
        <View style={styles.ngoIcon}>
          <Text style={styles.ngoIconText}>{ngo.name?.charAt(0) || 'N'}</Text>
        </View>
        <View style={styles.ngoInfo}>
          <Text style={styles.ngoName}>{ngo.name}</Text>
          <Text style={styles.ngoType}>{ngo.type || 'Non-Profit Organization'}</Text>
        </View>
      </View>
      
      <Text style={styles.ngoDescription} numberOfLines={3}>
        {ngo.description || 'Dedicated to serving the community through various programs and initiatives.'}
      </Text>
      
      <View style={styles.ngoStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{ngo.eventsCount || 0}</Text>
          <Text style={styles.statLabel}>Events</Text>
        </View>
      
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{ngo.establishedYear || 'N/A'}</Text>
          <Text style={styles.statLabel}>Established</Text>
        </View>
      </View>
      
      <View style={styles.ngoFooter}>
        <Text style={styles.ngoLocation}>📍 {ngo.location || 'Hong Kong'}</Text>
        <Text style={styles.ngoContact}>📞 {ngo.contact || 'Contact Available'}</Text>
      </View>
    </TouchableOpacity>
  );
};

const NGOScreen = () => {
  const navigation = useNavigation();
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNgos, setFilteredNgos] = useState([]);

  useEffect(() => {
    fetchNGOs();
  }, []);

  useEffect(() => {
    filterNGOs();
  }, [searchQuery, ngos]);

  const fetchNGOs = async () => {
    try {
      setLoading(true);
      
      // Fetch from Firebase
        const ngoSnapshot = await getDocs(collection(db, 'ngos'));
        const ngoList = ngoSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Also fetch events to count them per NGO
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        const eventsList = eventsSnapshot.docs.map(doc => doc.data());

        // Count events per NGO
        const ngoEventCounts = {};
        eventsList.forEach(event => {
          if (event.ngoName) {
            ngoEventCounts[event.ngoName] = (ngoEventCounts[event.ngoName] || 0) + 1;
          }
        });

        // Add event counts to NGOs
        const ngoListWithCounts = ngoList.map(ngo => ({
          ...ngo,
          eventsCount: ngoEventCounts[ngo.name] || 0
        }));

      // If we have NGO profiles from the database, use them
      if (ngoListWithCounts.length > 0) {
        setNgos(ngoListWithCounts);
      } else {
        // Try to fetch from ngoProfiles collection as well
        const profileSnapshot = await getDocs(collection(db, 'ngoProfiles'));
        const profileList = profileSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'NGO',
          volunteersCount: 0,
          eventsCount: 0
        }));

        setNgos(profileList);
      }
    } catch (error) {
      console.error('Error fetching NGOs:', error);
      Alert.alert('Error', 'Failed to load NGOs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterNGOs = () => {
    if (!searchQuery.trim()) {
      setFilteredNgos(ngos);
      return;
    }

    const filtered = ngos.filter(ngo =>
      ngo.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ngo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ngo.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ngo.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredNgos(filtered);
  };

  const handleNGOPress = (ngo) => {
    // Navigate to NGO details or show more information
    Alert.alert(
      ngo.name,
      `${ngo.description || 'No description available'}\n\nContact: ${ngo.contact || 'Not provided'}\nLocation: ${ngo.location || 'Not specified'}`,
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>Loading NGOs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Registered NGOs</Text>
        <Text style={styles.headerSubtitle}>Partner organizations providing services</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        scrollEventThrottle={16}
        {...(isWeb && {
          keyboardShouldPersistTaps: 'handled',
          scrollBehavior: 'smooth',
        })}
      >
        {/* Main Content */}
        <View style={styles.mainContent}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search NGOs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View>

      {/* NGO Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {filteredNgos.length} NGO{filteredNgos.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* NGO List */}
      <FlatList
        data={filteredNgos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NGOCard ngo={item} onPress={handleNGOPress} />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        numColumns={isWeb && screenWidth > 768 ? 2 : 1}
        key={isWeb && screenWidth > 768 ? 'grid' : 'list'}
        columnWrapperStyle={isWeb && screenWidth > 768 ? styles.row : null}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏢</Text>
            <Text style={styles.emptyTitle}>No NGOs Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try adjusting your search terms' : 'No NGOs are currently registered'}
            </Text>
          </View>
        }
      />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    ...(isWeb && {
      maxWidth: 1200,
      marginHorizontal: 'auto',
      width: '100%',
    }),
  },
  scrollContainer: {
    flex: 1,
    ...(isWeb && {
      scrollbarWidth: 'thin',
      scrollbarColor: '#ccc transparent',
    }),
  },
  scrollContent: {
    flexGrow: 1,
    ...(isWeb && {
      minHeight: '100vh',
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: isWeb ? 12 : 14,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: isWeb ? 40 : 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    ...(isWeb && {
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }),
  },
  headerTitle: {
    fontSize: isWeb ? 20 : 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: isWeb ? 12 : 14,
    color: '#666',
  },
  mainContent: {
    paddingHorizontal: isWeb ? 40 : 20,
    paddingVertical: 20,
    ...(isWeb && {
      paddingBottom: 40,
    }),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    ...(isWeb && {
      maxWidth: 400,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }),
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: isWeb ? 12 : 14,
    color: '#333',
    ...(isWeb && {
      outline: 'none',
      '&:focus': {
        outline: 'none',
      },
    }),
  },
  searchIcon: {
    fontSize: 16,
    color: '#666',
  },
  countContainer: {
    marginBottom: 8,
  },
  countText: {
    fontSize: isWeb ? 10 : 12,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ngoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    ...(isWeb && screenWidth > 768 && {
      flex: 1,
      marginHorizontal: 8,
      marginBottom: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'pointer',
    }),
    ...(isWeb && {
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      },
    }),
  },
  ngoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ngoIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ngoIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  ngoInfo: {
    flex: 1,
  },
  ngoName: {
    fontSize: isWeb ? 14 : 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  ngoType: {
    fontSize: isWeb ? 10 : 12,
    color: '#666',
  },
  ngoDescription: {
    fontSize: isWeb ? 10 : 12,
    color: '#666',
    lineHeight: isWeb ? 16 : 18,
    marginBottom: 16,
  },
  ngoStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: isWeb ? 14 : 16,
    fontWeight: 'bold',
    color: '#2196f3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: isWeb ? 8 : 10,
    color: '#666',
  },
  ngoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ngoLocation: {
    fontSize: isWeb ? 8 : 10,
    color: '#666',
    flex: 1,
  },
  ngoContact: {
    fontSize: isWeb ? 8 : 10,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: isWeb ? 16 : 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: isWeb ? 12 : 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default NGOScreen;
