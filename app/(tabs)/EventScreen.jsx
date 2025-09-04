import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { auth, db } from "../../config/firebase";

const { width } = Dimensions.get('window');

const EventCard = ({ event, onPress }) => {
  const getSpotsLeft = () => {
    const enrolled = event.enrolledCount || 0;
    const total = parseInt(event.slots) || 0;
    return total - enrolled;
  };

  const getSpotsBadgeColor = () => {
    const spotsLeft = getSpotsLeft();
    if (spotsLeft <= 2) return '#ff4444';
    if (spotsLeft <= 5) return '#ffaa00';
    return '#44aa44';
  };

  return (
    <TouchableOpacity onPress={() => onPress(event)} style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>{event.difficulty || 'Beginner'}</Text>
          </View>
          <View style={[styles.spotsBadge, { backgroundColor: getSpotsBadgeColor() }]}>
            <Text style={styles.spotsText}>{getSpotsLeft()} spots left</Text>
          </View>
        </View>
        
        <Text style={styles.eventTitle}>{event.name}</Text>
        <Text style={styles.providerText}>Offered by {event.ngoName}</Text>
        
        <View style={styles.eventDetails}>
          <Text style={styles.detailText}>📅 {event.date} at {event.time}</Text>
          <Text style={styles.detailText}>📍 {event.location}</Text>
          <Text style={styles.detailText}>👥 {event.enrolledCount || 0}/{event.slots} enrolled</Text>
          <Text style={styles.detailText}>🌐 {event.languages?.join(", ") || 'English'}</Text>
          <Text style={styles.detailText}>🎯 {event.clientGroup?.join(", ") || 'General Public'}</Text>
        </View>
        
        <Text style={styles.briefDesc}>
          {event.description?.slice(0, 80)}...
        </Text>
        
        <TouchableOpacity style={styles.viewDetailsBtn} onPress={() => onPress(event)}>
          <Text style={styles.viewDetailsText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    clientGroup: "",
    activityType: "",
    language: "",
    district: "",
    transport: "",
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const snapshot = await getDocs(collection(db, "events"));
        const eventList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEvents(eventList);
      } catch (error) {
        console.log("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const toggleFilter = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: prev[field] === value ? "" : value,
    }));
  };

  const applyFilters = () => {
    return events.filter((ev) => {
      const matchesSearch = !searchQuery || 
        ev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.ngoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.activityType.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilters = (
        (!filters.clientGroup || ev.clientGroup?.includes(filters.clientGroup)) &&
        (!filters.activityType || ev.activityType === filters.activityType) &&
        (!filters.language || ev.languages?.includes(filters.language)) &&
        (!filters.district || ev.district === filters.district) &&
        (!filters.transport || ev.transport === filters.transport)
      );
      
      return matchesSearch && matchesFilters;
    });
  };

  // ✅ Firestore registration logic
  const registerForEvent = async (eventId) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert("Error", "You must be logged in to register.");
        return;
      }

      const eventRef = doc(db, "events", eventId);
      const eventSnap = await getDoc(eventRef);

      if (!eventSnap.exists()) {
        Alert.alert("Error", "Event not found.");
        return;
      }

      const eventData = eventSnap.data();

      // Check if already registered
      if (eventData.registeredUsers?.includes(userId)) {
        Alert.alert("Notice", "You have already registered for this event.");
        return;
      }

      // Check if slots available
      if (eventData.enrolledCount >= eventData.slots) {
        Alert.alert("Full", "No spots left.");
        return;
      }

      // Update Firestore
      await updateDoc(eventRef, {
        enrolledCount: increment(1),
        registeredUsers: arrayUnion(userId),
      });

      Alert.alert("Success", "You have registered for the event.");
      setSelectedEvent(null);
    } catch (error) {
      console.error("Error registering:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  if (loading)
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <View style={styles.container}>
      {/* Header */}
      

      {/* Main Content */}
      <View style={styles.mainContent}>
        <Text style={styles.browseTitle}>Browse All Classes</Text>
        
        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search classes, skills, or NGOs..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity 
            style={styles.filtersBtn}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={styles.filtersIcon}>🔽</Text>
            <Text style={styles.filtersText}>Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sortBtn}>
            <Text style={styles.sortText}>Sort by Date</Text>
          </TouchableOpacity>
        </View>

        {/* Filters Panel */}
        {showFilters && (
          <View style={styles.filtersPanel}>
            <ScrollView style={styles.filtersScroll}>
              {[
                {
                  label: "Client Group",
                  options: ["Refugees", "Asylum Seekers", "General Public", "Clients Only"],
            field: "clientGroup",
          },
          {
                  label: "Activity Class",
                  options: ["Education", "Skill Building", "Legal", "Health & Wellbeing", "Tech Skills"],
            field: "activityType",
          },
          {
                  label: "Languages",
                  options: ["English", "Cantonese", "Urdu", "Arabic", "Mandarin", "Somali", "French"],
            field: "language",
          },
          {
            label: "District",
            options: ["Wan Chai", "Causeway Bay", "Tsim Tsa Tsui", "Mong Kok"],
            field: "district",
          },
          {
                  label: "Transportation",
            options: [
              "Provided to all immigration paper (Form 8) holders",
              "Registered members of the NGO",
                    "No transportation allowance is provided"
            ],
            field: "transport",
          },
        ].map((f) => (
                <View key={f.field} style={styles.filterGroup}>
                  <Text style={styles.filterGroupLabel}>{f.label}</Text>
                  <View style={styles.filterOptions}>
              {f.options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                          styles.filterOption,
                          filters[f.field] === opt && styles.activeFilterOption,
                  ]}
                  onPress={() => toggleFilter(f.field, opt)}
                >
                        <Text style={[
                          styles.filterOptionText,
                          filters[f.field] === opt && styles.activeFilterOptionText
                        ]}>{opt}</Text>
                </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
              <TouchableOpacity 
                style={styles.clearFiltersBtn}
                onPress={() => setFilters({
                  clientGroup: "",
                  activityType: "",
                  language: "",
                  district: "",
                  transport: "",
                })}
              >
                <Text style={styles.clearFiltersText}>Clear All Filters</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Events Grid */}
        <View style={styles.eventsContainer}>
          <Text style={styles.eventsCount}>Showing {applyFilters().length} classes</Text>
      <FlatList
        data={applyFilters()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard event={item} onPress={setSelectedEvent} />
        )}
            numColumns={2}
            contentContainerStyle={styles.eventsGrid}
        ListEmptyComponent={
              <Text style={styles.emptyText}>No events found</Text>
        }
      />
        </View>
      </View>

      {/* Modal */}
      <Modal
        visible={!!selectedEvent}
        animationType="slide"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <ScrollView style={styles.modalContainer}>
          {selectedEvent && (
            <>
              {/* Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setSelectedEvent(null)}>
                  <Text style={styles.backButton}>← Back to Classes</Text>
                </TouchableOpacity>
                
              </View>

              {/* Event Details */}
              <View style={styles.modalContent}>
                <View style={styles.modalTags}>
                  <View style={styles.modalTag}>
                    <Text style={styles.modalTagText}>{selectedEvent.difficulty || 'Beginner'}</Text>
                  </View>
                  <View style={styles.modalTag}>
                    <Text style={styles.modalTagText}>{selectedEvent.activityType}</Text>
                  </View>
                </View>

                <Text style={styles.modalEventTitle}>{selectedEvent.name}</Text>
                <Text style={styles.modalProvider}>Offered by {selectedEvent.ngoName}</Text>

                {/* Class Information Card */}
                <View style={styles.modalCard}>
                  <Text style={styles.modalCardTitle}>Class Information</Text>
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoIcon}>📅</Text>
                    <Text style={styles.modalInfoText}>{selectedEvent.date}</Text>
                  </View>
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoIcon}>📍</Text>
                    <Text style={styles.modalInfoText}>{selectedEvent.location}</Text>
                  </View>
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoIcon}>⏰</Text>
                    <Text style={styles.modalInfoText}>{selectedEvent.time} ({selectedEvent.duration})</Text>
                  </View>
                  <View style={styles.modalInfoItem}>
                    <Text style={styles.modalInfoIcon}>👥</Text>
                    <Text style={styles.modalInfoText}>
                      {selectedEvent.enrolledCount || 0} spots available ({selectedEvent.enrolledCount || 0}/{selectedEvent.slots} enrolled)
              </Text>
                  </View>
                </View>

                {/* About This Class Card */}
                <View style={styles.modalCard}>
                  <Text style={styles.modalCardTitle}>About This Class</Text>
                  <Text style={styles.modalCardText}>{selectedEvent.description}</Text>
                </View>

                {/* What You Need Card */}
                <View style={styles.modalCard}>
                  <Text style={styles.modalCardTitle}>What You Need</Text>
                  <Text style={styles.modalCardText}>
                    <Text style={styles.modalCardSubtitle}>Materials Required:</Text> {selectedEvent.materials || "Notebook, pen, and a positive attitude! All learning materials will be provided."}
              </Text>
                  <Text style={styles.modalCardText}>
                    <Text style={styles.modalCardSubtitle}>Prerequisites:</Text> No prior knowledge required. Open to all levels.
              </Text>
                </View>

                {/* About NGO Card */}
                <View style={styles.modalCard}>
                  <Text style={styles.modalCardTitle}>❤️ About {selectedEvent.ngoName}</Text>
                  <Text style={styles.modalCardText}>
                    {selectedEvent.ngoInfo || `${selectedEvent.ngoName} has been serving the community for over 100 years, providing humanitarian services and educational programs.`}
              </Text>
                  <Text style={styles.modalCardText}>
                    Contact: {selectedEvent.ngoContact || "+852 2802 0021"}
              </Text>
                </View>

                {/* Registration Card */}
                <View style={styles.registrationCard}>
                  <Text style={styles.registrationTitle}>Ready to Join?</Text>
                  <Text style={styles.registrationSubtitle}>Registration is free and takes less than 2 minutes</Text>
                  
                  <View style={styles.availabilityContainer}>
                    <Text style={styles.availabilityText}>
                      {(selectedEvent.slots - (selectedEvent.enrolledCount || 0))} spots left
              </Text>
                    <Text style={styles.availabilitySubtext}>out of {selectedEvent.slots} total</Text>
                  </View>

                  <View style={styles.progressBar}>
                    <View style={[
                      styles.progressFill, 
                      { width: `${((selectedEvent.enrolledCount || 0) / selectedEvent.slots) * 100}%` }
                    ]} />
                  </View>

                  <TouchableOpacity 
                    style={styles.registerButton}
                onPress={() => registerForEvent(selectedEvent.id)}
                  >
                    <Text style={styles.registerButtonText}>Register for This Class</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.registrationNote}>You'll need to create a free account to register</Text>
                </View>

                {/* Need Help Card */}
                <View style={styles.helpCard}>
                  <Text style={styles.helpTitle}>Need Help?</Text>
                  <TouchableOpacity style={styles.helpButton}>
                    <Text style={styles.helpIcon}>📍</Text>
                    <Text style={styles.helpText}>Get Directions</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.helpButton}>
                    <Text style={styles.helpIcon}>📅</Text>
                    <Text style={styles.helpText}>Add to Calendar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.helpButton}>
                    <Text style={styles.helpIcon}>🌐</Text>
                    <Text style={styles.helpText}>Contact NGO</Text>
                  </TouchableOpacity>
                </View>

                {/* Similar Classes Card */}
                <View style={styles.similarCard}>
                  <Text style={styles.similarTitle}>Similar Classes</Text>
                  <View style={styles.similarClass}>
                    <Text style={styles.similarClassName}>Intermediate English</Text>
                    <Text style={styles.similarClassProvider}>{selectedEvent.ngoName}</Text>
                    <Text style={styles.similarClassDate}>Jan 20, 2025</Text>
                  </View>
                  <View style={styles.similarClass}>
                    <Text style={styles.similarClassName}>English for Work</Text>
                    <Text style={styles.similarClassProvider}>YMCA Hong Kong</Text>
                    <Text style={styles.similarClassDate}>Jan 25, 2025</Text>
                  </View>
                  <TouchableOpacity style={styles.viewAllButton}>
                    <Text style={styles.viewAllText}>View All English Classes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </Modal>
    </View>
  );
};

export default EventList;

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
    borderRadius: 4,
  },
  headerBtnText: {
    fontSize: 14,
    color: "#666",
  },
  registerBtn: {
    backgroundColor: "#333",
  },
  registerBtnText: {
    color: "#fff",
  },

  // Main Content
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  browseTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 20,
    color: "#333",
  },

  // Search Container
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  filtersBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 10,
  },
  filtersIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  filtersText: {
    fontSize: 14,
    color: "#666",
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  sortText: {
    fontSize: 14,
    color: "#666",
  },

  // Filters Panel
  filtersPanel: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filtersScroll: {
    maxHeight: 300,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterGroupLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  activeFilterOption: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196f3",
  },
  filterOptionText: {
    fontSize: 12,
    color: "#666",
  },
  activeFilterOptionText: {
    color: "#2196f3",
    fontWeight: "bold",
  },
  clearFiltersBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
  },
  clearFiltersText: {
    fontSize: 14,
    color: "#666",
  },

  // Events Container
  eventsContainer: {
    flex: 1,
  },
  eventsCount: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  eventsGrid: {
    paddingBottom: 20,
  },
  cardContainer: {
    width: (width - 60) / 2,
    marginRight: 20,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  difficultyBadge: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    color: "#2196f3",
    fontWeight: "bold",
  },
  spotsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  spotsText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "bold",
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  providerText: {
    fontSize: 14,
    color: "#2196f3",
    marginBottom: 12,
  },
  eventDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  briefDesc: {
    fontSize: 12,
    color: "#333",
    marginBottom: 12,
    lineHeight: 16,
  },
  viewDetailsBtn: {
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  viewDetailsText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#666",
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    fontSize: 16,
    color: "#2196f3",
  },
  modalHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
    borderRadius: 4,
  },
  modalHeaderBtnText: {
    fontSize: 14,
    color: "#666",
  },
  modalRegisterBtn: {
    backgroundColor: "#333",
  },
  modalRegisterBtnText: {
    color: "#fff",
  },

  modalContent: {
    padding: 20,
  },
  modalTags: {
    flexDirection: "row",
    marginBottom: 16,
  },
  modalTag: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  modalTagText: {
    fontSize: 12,
    color: "#2196f3",
    fontWeight: "bold",
  },
  modalEventTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  modalProvider: {
    fontSize: 16,
    color: "#2196f3",
    marginBottom: 24,
  },

  // Modal Cards
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  modalCardText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  modalCardSubtitle: {
    fontWeight: "bold",
    color: "#333",
  },
  modalInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  modalInfoIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  modalInfoText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },

  // Registration Card
  registrationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  registrationTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  registrationSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  availabilityContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  availabilityText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4caf50",
  },
  availabilitySubtext: {
    fontSize: 14,
    color: "#666",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 20,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4caf50",
    borderRadius: 4,
  },
  registerButton: {
    backgroundColor: "#333",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  registrationNote: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },

  // Help Card
  helpCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  helpIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  helpText: {
    fontSize: 14,
    color: "#2196f3",
  },

  // Similar Classes Card
  similarCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  similarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  similarClass: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  similarClassName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  similarClassProvider: {
    fontSize: 12,
    color: "#666",
  },
  similarClassDate: {
    fontSize: 12,
    color: "#666",
  },
  viewAllButton: {
    marginTop: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: "#2196f3",
  },
});
