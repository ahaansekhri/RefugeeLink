import { Ionicons } from "@expo/vector-icons";
import {
    arrayRemove,
    collection,
    doc,
    getDocs,
    increment,
    updateDoc
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../../config/firebase";
import { Colors } from "../../constants/Colors";
import { useColorScheme } from "../../hooks/useColorScheme";

const { width } = Dimensions.get('window');

// Utility function to check if event is completed
const isEventCompleted = (eventDate) => {
  if (!eventDate) return false;
  
  const eventDateObj = new Date(eventDate);
  const currentDate = new Date();
  
  // Reset time to start of day for accurate comparison
  eventDateObj.setHours(0, 0, 0, 0);
  currentDate.setHours(0, 0, 0, 0);
  
  return eventDateObj < currentDate;
};

const EventCard = ({ event, onPress, onUnregister }) => {
  const colorScheme = useColorScheme();
  const isCompleted = isEventCompleted(event.date);
  const isClosed = event.status === 'closed';
  
  const getStatusInfo = () => {
    if (isClosed) {
      return { text: 'Registration Closed', color: '#ff9800' };
    } else if (isCompleted) {
      return { text: 'Event Completed', color: '#6c757d' };
    } else {
      return { text: 'Upcoming', color: '#4caf50' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity onPress={() => onPress(event)} style={styles.cardContainer}>
      <View style={[styles.card, isCompleted && styles.completedCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={[styles.eventTitle, { color: Colors[colorScheme ?? 'light'].text }]} numberOfLines={2}>
              {event.name}
            </Text>
            <Text style={[styles.ngoName, { color: Colors[colorScheme ?? 'light'].text }]}>
              by {event.ngoName}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusText}>{statusInfo.text}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={16} color={Colors[colorScheme ?? 'light'].text} />
              <Text style={[styles.detailText, { color: Colors[colorScheme ?? 'light'].text }]}>
                {event.date}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time" size={16} color={Colors[colorScheme ?? 'light'].text} />
              <Text style={[styles.detailText, { color: Colors[colorScheme ?? 'light'].text }]}>
                {event.time}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={16} color={Colors[colorScheme ?? 'light'].text} />
              <Text style={[styles.detailText, { color: Colors[colorScheme ?? 'light'].text }]} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="people" size={16} color={Colors[colorScheme ?? 'light'].text} />
              <Text style={[styles.detailText, { color: Colors[colorScheme ?? 'light'].text }]}>
                {event.activityType}
              </Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.viewButton]}
              onPress={() => onPress(event)}
            >
              <Ionicons name="eye" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>View Details</Text>
            </TouchableOpacity>
            
            {!isCompleted && !isClosed && (
              <TouchableOpacity
                style={[styles.actionButton, styles.unregisterButton]}
                onPress={() => onUnregister(event)}
              >
                <Ionicons name="close-circle" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Unregister</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const MyEventsScreen = () => {
  const colorScheme = useColorScheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showUnregisterModal, setShowUnregisterModal] = useState(false);
  const [eventToUnregister, setEventToUnregister] = useState(null);

  const fetchMyEvents = async () => {
    if (!auth.currentUser) {
      console.log('No current user found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching events for user:', auth.currentUser.uid);

      // Get all events where the user is registered
      const eventsRef = collection(db, 'events');
      const eventsSnapshot = await getDocs(eventsRef);
      
      const allEvents = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter events where current user is in registeredUsers array
      const myEvents = allEvents.filter(event => 
        event.registeredUsers && event.registeredUsers.includes(auth.currentUser.uid)
      );

      // Sort by date (upcoming first)
      myEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

      console.log('Found my events:', myEvents.length);
      setEvents(myEvents);
    } catch (error) {
      console.error('Error fetching my events:', error);
      Alert.alert('Error', 'Failed to fetch your events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchMyEvents();
      // Add a small delay to show the refresh animation
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error refreshing events:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const handleEventPress = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleUnregisterClick = (event) => {
    setEventToUnregister(event);
    setShowUnregisterModal(true);
  };

  const confirmUnregister = async () => {
    if (!eventToUnregister || !auth.currentUser) return;

    try {
      const eventRef = doc(db, 'events', eventToUnregister.id);
      
      // Update Firestore
      await updateDoc(eventRef, {
        enrolledCount: increment(-1),
        registeredUsers: arrayRemove(auth.currentUser.uid),
      });

      // Update local state
      setEvents(prev => prev.filter(event => event.id !== eventToUnregister.id));
      
      Alert.alert('Success', 'You have been unregistered from the event.');
      setShowUnregisterModal(false);
      setEventToUnregister(null);
    } catch (error) {
      console.error('Error unregistering from event:', error);
      Alert.alert('Error', 'Failed to unregister from event. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const renderEventCard = ({ item }) => (
    <EventCard
      event={item}
      onPress={handleEventPress}
      onUnregister={handleUnregisterClick}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color={Colors[colorScheme ?? 'light'].text} />
      <Text style={[styles.emptyTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
        No Events Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
        You haven't registered for any events yet. Browse available events to get started!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>
          Loading your events...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              My Events
            </Text>
            <Text style={[styles.headerSubtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              {events.length} event{events.length !== 1 ? 's' : ''} registered
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.refreshButton, 
              { 
                backgroundColor: refreshing 
                  ? Colors[colorScheme ?? 'light'].tint + '80' 
                  : Colors[colorScheme ?? 'light'].tint 
              }
            ]}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Ionicons 
              name={refreshing ? "refresh" : "refresh-outline"} 
              size={20} 
              color="#fff" 
              style={refreshing ? styles.refreshingIcon : null}
            />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={events}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors[colorScheme ?? 'light'].tint}
            colors={[Colors[colorScheme ?? 'light'].tint]}
            progressBackgroundColor={Colors[colorScheme ?? 'light'].background}
            title="Pull to refresh"
            titleColor={Colors[colorScheme ?? 'light'].text}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Event Details Modal */}
      <Modal
        visible={showEventModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEventModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Event Details
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowEventModal(false)}
            >
              <Ionicons name="close" size={24} color={Colors[colorScheme ?? 'light'].text} />
            </TouchableOpacity>
          </View>

          {selectedEvent && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.eventHeader}>
                <Text style={[styles.eventTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {selectedEvent.name}
                </Text>
                <Text style={[styles.ngoName, { color: Colors[colorScheme ?? 'light'].text }]}>
                  by {selectedEvent.ngoName}
                </Text>
              </View>

              <View style={styles.eventInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={20} color={Colors[colorScheme ?? 'light'].tint} />
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: Colors[colorScheme ?? 'light'].text }]}>Date</Text>
                    <Text style={[styles.infoValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                      {formatDate(selectedEvent.date)}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="time" size={20} color={Colors[colorScheme ?? 'light'].tint} />
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: Colors[colorScheme ?? 'light'].text }]}>Time</Text>
                    <Text style={[styles.infoValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                      {formatTime(selectedEvent.time)}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="location" size={20} color={Colors[colorScheme ?? 'light'].tint} />
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: Colors[colorScheme ?? 'light'].text }]}>Location</Text>
                    <Text style={[styles.infoValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                      {selectedEvent.location}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="people" size={20} color={Colors[colorScheme ?? 'light'].tint} />
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoLabel, { color: Colors[colorScheme ?? 'light'].text }]}>Activity Type</Text>
                    <Text style={[styles.infoValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                      {selectedEvent.activityType}
                    </Text>
                  </View>
                </View>

                {selectedEvent.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={[styles.descriptionLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                      Description
                    </Text>
                    <Text style={[styles.descriptionText, { color: Colors[colorScheme ?? 'light'].text }]}>
                      {selectedEvent.description}
                    </Text>
                  </View>
                )}

                {selectedEvent.requirements && selectedEvent.requirements.length > 0 && (
                  <View style={styles.requirementsContainer}>
                    <Text style={[styles.requirementsLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                      Requirements
                    </Text>
                    {selectedEvent.requirements.map((req, index) => (
                      <Text key={index} style={[styles.requirementItem, { color: Colors[colorScheme ?? 'light'].text }]}>
                        • {req}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Unregister Confirmation Modal */}
      <Modal
        visible={showUnregisterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUnregisterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.confirmationTitle}>Unregister from Event</Text>
            <Text style={styles.confirmationMessage}>
              Are you sure you want to unregister from "{eventToUnregister?.name}"? This action cannot be undone.
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowUnregisterModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.unregisterConfirmButton]}
                onPress={confirmUnregister}
              >
                <Text style={styles.unregisterConfirmButtonText}>Unregister</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshingIcon: {
    transform: [{ rotate: '360deg' }],
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
  },
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedCard: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ngoName: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    gap: 12,
  },
  eventDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  viewButton: {
    backgroundColor: '#007AFF',
  },
  unregisterButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  eventHeader: {
    marginBottom: 24,
  },
  eventInfo: {
    gap: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 16,
  },
  descriptionContainer: {
    marginTop: 8,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  requirementsContainer: {
    marginTop: 8,
  },
  requirementsLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmationMessage: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.7,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  unregisterConfirmButton: {
    backgroundColor: '#FF3B30',
  },
  unregisterConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyEventsScreen;
