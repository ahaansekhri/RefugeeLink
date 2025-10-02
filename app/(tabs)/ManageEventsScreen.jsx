import { Ionicons } from '@expo/vector-icons';
import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth, db } from '../../config/firebase';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

const ManageEventsScreen = () => {
  const colorScheme = useColorScheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [eventToClose, setEventToClose] = useState(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [eventToOpen, setEventToOpen] = useState(null);

  // Fetch events created by the current NGO
  const fetchEvents = async () => {
    if (!auth.currentUser) {
      console.log('No current user found');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching events for NGO ID:', auth.currentUser.uid);
      
      // First, let's check all events to see what's in the database
      const allEventsRef = collection(db, 'events');
      const allEventsSnapshot = await getDocs(allEventsRef);
      console.log('Total events in database:', allEventsSnapshot.docs.length);
      
      // Log all events to see their structure
      allEventsSnapshot.docs.forEach((doc, index) => {
        console.log(`Event ${index + 1}:`, {
          id: doc.id,
          ngoId: doc.data().ngoId,
          name: doc.data().name,
          createdBy: doc.data().createdBy || 'No createdBy field',
          ngoName: doc.data().ngoName || 'No ngoName field'
        });
      });
      
      // Now query for events with the specific ngoId
      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('ngoId', '==', auth.currentUser.uid),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Found events with matching ngoId:', eventsData.length);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', 'Failed to fetch events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendees for a specific event
  const fetchAttendees = async (eventId) => {
    try {
      setLoadingAttendees(true);
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      
      if (eventSnap.exists()) {
        const eventData = eventSnap.data();
        const registeredUsers = eventData.registeredUsers || [];
        
        // Fetch user details for each registered user
        const attendeePromises = registeredUsers.map(async (userId) => {
          try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              return {
                id: userId,
                ...userSnap.data()
              };
            }
            return null;
          } catch (error) {
            console.error('Error fetching user:', error);
            return null;
          }
        });
        
        const attendeesData = await Promise.all(attendeePromises);
        setAttendees(attendeesData.filter(attendee => attendee !== null));
      }
    } catch (error) {
      console.error('Error fetching attendees:', error);
      Alert.alert('Error', 'Failed to fetch attendees. Please try again.');
    } finally {
      setLoadingAttendees(false);
    }
  };

  // Handle event selection
  const handleEventPress = async (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
    await fetchAttendees(event.id);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Check if event is completed
  const isEventCompleted = (eventDate) => {
    if (!eventDate) return false;
    const eventDateObj = new Date(eventDate);
    const currentDate = new Date();
    eventDateObj.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    return eventDateObj < currentDate;
  };

  // Delete event
  const handleDeleteEvent = async (event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      const eventRef = doc(db, 'events', eventToDelete.id);
      await deleteDoc(eventRef);
      
      // Remove from local state
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventToDelete.id));
      
      Alert.alert('Success', 'Event deleted successfully');
      setShowDeleteModal(false);
      setEventToDelete(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      Alert.alert('Error', 'Failed to delete event. Please try again.');
    }
  };

  // Close event (mark as closed before expiry)
  const handleCloseEvent = async (event) => {
    setEventToClose(event);
    setShowCloseModal(true);
  };

  const confirmCloseEvent = async () => {
    if (!eventToClose) return;

    try {
      const eventRef = doc(db, 'events', eventToClose.id);
      await updateDoc(eventRef, {
        status: 'closed',
        closedAt: new Date().toISOString(),
        closedBy: auth.currentUser.uid
      });
      
      // Update local state
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventToClose.id 
            ? { ...event, status: 'closed', closedAt: new Date().toISOString() }
            : event
        )
      );
      
      Alert.alert('Success', 'Event closed successfully');
      setShowCloseModal(false);
      setEventToClose(null);
    } catch (error) {
      console.error('Error closing event:', error);
      Alert.alert('Error', 'Failed to close event. Please try again.');
    }
  };

  // Open event (reopen closed event)
  const handleOpenEvent = async (event) => {
    setEventToOpen(event);
    setShowOpenModal(true);
  };

  const confirmOpenEvent = async () => {
    if (!eventToOpen) return;

    try {
      const eventRef = doc(db, 'events', eventToOpen.id);
      await updateDoc(eventRef, {
        status: 'active',
        openedAt: new Date().toISOString(),
        openedBy: auth.currentUser.uid
      });
      
      // Update local state
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventToOpen.id 
            ? { ...event, status: 'active', openedAt: new Date().toISOString() }
            : event
        )
      );
      
      Alert.alert('Success', 'Event reopened successfully');
      setShowOpenModal(false);
      setEventToOpen(null);
    } catch (error) {
      console.error('Error opening event:', error);
      Alert.alert('Error', 'Failed to reopen event. Please try again.');
    }
  };

  // Refresh events
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const renderEventCard = ({ item }) => {
    const isCompleted = isEventCompleted(item.date);
    const isClosed = item.status === 'closed';
    const spotsLeft = item.slots === 'unlimited' ? 'unlimited' : (parseInt(item.slots) || 0) - (item.enrolledCount || 0);
    
    const getStatusInfo = () => {
      if (isClosed) {
        return { text: 'Closed', color: '#6c757d' };
      } else if (isCompleted) {
        return { text: 'Completed', color: '#ff6b6b' };
      } else {
        return { text: 'Active', color: '#4ecdc4' };
      }
    };

    const statusInfo = getStatusInfo();
    
    return (
      <View style={[
        styles.eventCard,
        { backgroundColor: Colors[colorScheme ?? 'light'].background }
      ]}>
        <TouchableOpacity
          style={styles.eventCardContent}
          onPress={() => handleEventPress(item)}
        >
          <View style={styles.eventHeader}>
            <Text style={[styles.eventTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              {item.name}
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: statusInfo.color }
            ]}>
              <Text style={styles.statusText}>
                {statusInfo.text}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.eventDate, { color: Colors[colorScheme ?? 'light'].text }]}>
            {formatDate(item.date)} at {item.time}
          </Text>
          
          <Text style={[styles.eventLocation, { color: Colors[colorScheme ?? 'light'].text }]}>
            📍 {item.location}
          </Text>
          
          <View style={styles.eventStats}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={16} color={Colors[colorScheme ?? 'light'].text} />
              <Text style={[styles.statText, { color: Colors[colorScheme ?? 'light'].text }]}>
                {item.enrolledCount || 0} enrolled
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="calendar" size={16} color={Colors[colorScheme ?? 'light'].text} />
            <Text style={[styles.statText, { color: Colors[colorScheme ?? 'light'].text }]}>
              {spotsLeft === 'unlimited' ? 'Unlimited spots' : `${spotsLeft} spots left`}
            </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.eventActions}>
          {!isClosed && !isCompleted && (
            <TouchableOpacity
              style={[styles.actionButton, styles.closeButton]}
              onPress={() => handleCloseEvent(item)}
            >
              <Ionicons name="lock-closed" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Close</Text>
            </TouchableOpacity>
          )}
          
          {isClosed && !isCompleted && (
            <TouchableOpacity
              style={[styles.actionButton, styles.openButton]}
              onPress={() => handleOpenEvent(item)}
            >
              <Ionicons name="lock-open" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Open</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteEvent(item)}
          >
            <Ionicons name="trash" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAttendeeItem = ({ item }) => (
    <View style={[styles.attendeeItem, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <View style={styles.attendeeInfo}>
        <Text style={[styles.attendeeName, { color: Colors[colorScheme ?? 'light'].text }]}>
          {item.name || 'No name provided'}
        </Text>
        <Text style={[styles.attendeeEmail, { color: Colors[colorScheme ?? 'light'].text }]}>
          {item.email || 'No email provided'}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
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
          <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Manage My Events
          </Text>
          <TouchableOpacity 
            style={[
              styles.refreshButton,
              refreshing && styles.refreshButtonDisabled
            ]}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Ionicons 
              name="refresh" 
              size={24} 
              color={refreshing ? Colors[colorScheme ?? 'light'].text + '80' : Colors[colorScheme ?? 'light'].tint} 
            />
          </TouchableOpacity>
        </View>
        <Text style={[styles.headerSubtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          {events.length} event{events.length !== 1 ? 's' : ''} created
        </Text>
      </View>

      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={Colors[colorScheme ?? 'light'].text} />
          <Text style={[styles.emptyTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            No events yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Create your first event to get started
          </Text>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.eventsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors[colorScheme ?? 'light'].tint}
            />
          }
        />
      )}

      {/* Event Details Modal */}
      <Modal
        visible={showEventModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowEventModal(false)}
            >
              <Ionicons name="close" size={24} color={Colors[colorScheme ?? 'light'].text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Event Details
            </Text>
          </View>

          {selectedEvent && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.eventDetails}>
                <Text style={[styles.detailTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {selectedEvent.name}
                </Text>
                
                <View style={styles.detailRow}>
                  <Ionicons name="calendar" size={20} color={Colors[colorScheme ?? 'light'].text} />
                  <Text style={[styles.detailText, { color: Colors[colorScheme ?? 'light'].text }]}>
                    {formatDate(selectedEvent.date)} at {selectedEvent.time}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="location" size={20} color={Colors[colorScheme ?? 'light'].text} />
                  <Text style={[styles.detailText, { color: Colors[colorScheme ?? 'light'].text }]}>
                    {selectedEvent.location}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="time" size={20} color={Colors[colorScheme ?? 'light'].text} />
                  <Text style={[styles.detailText, { color: Colors[colorScheme ?? 'light'].text }]}>
                    Duration: {selectedEvent.durationHours}h {selectedEvent.durationMinutes}m
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="people" size={20} color={Colors[colorScheme ?? 'light'].text} />
                  <Text style={[styles.detailText, { color: Colors[colorScheme ?? 'light'].text }]}>
                    {selectedEvent.enrolledCount || 0} / {selectedEvent.slots} enrolled
                  </Text>
                </View>
                
                {selectedEvent.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={[styles.descriptionLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                      Description:
                    </Text>
                    <Text style={[styles.descriptionText, { color: Colors[colorScheme ?? 'light'].text }]}>
                      {selectedEvent.description}
                    </Text>
                  </View>
                )}
              </View>

              {/* Attendees Section */}
              <View style={styles.attendeesSection}>
                <Text style={[styles.attendeesTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Attendees ({attendees.length})
                </Text>
                
                {loadingAttendees ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={Colors[colorScheme ?? 'light'].tint} />
                    <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>
                      Loading attendees...
                    </Text>
                  </View>
                ) : attendees.length === 0 ? (
                  <View style={styles.emptyAttendees}>
                    <Ionicons name="people-outline" size={32} color={Colors[colorScheme ?? 'light'].text} />
                    <Text style={[styles.emptyAttendeesText, { color: Colors[colorScheme ?? 'light'].text }]}>
                      No attendees yet
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={attendees}
                    renderItem={renderAttendeeItem}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                  />
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.confirmationTitle}>Delete Event</Text>
            <Text style={styles.confirmationMessage}>
              Are you sure you want to delete "{eventToDelete?.name}"? This action cannot be undone and will remove all event data including attendee registrations.
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteConfirmButton}
                onPress={confirmDeleteEvent}
              >
                <Text style={styles.deleteConfirmButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Close Event Confirmation Modal */}
      <Modal
        visible={showCloseModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCloseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.confirmationTitle}>Close Event</Text>
            <Text style={styles.confirmationMessage}>
              Are you sure you want to close "{eventToClose?.name}"? This will prevent new registrations but keep existing attendee data.
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowCloseModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.closeConfirmButton}
                onPress={confirmCloseEvent}
              >
                <Text style={styles.closeConfirmButtonText}>Close Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Open Event Confirmation Modal */}
      <Modal
        visible={showOpenModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOpenModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.confirmationTitle}>Reopen Event</Text>
            <Text style={styles.confirmationMessage}>
              Are you sure you want to reopen "{eventToOpen?.name}"? This will allow new registrations again.
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowOpenModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.openConfirmButton}
                onPress={confirmOpenEvent}
              >
                <Text style={styles.openConfirmButtonText}>Reopen Event</Text>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  eventsList: {
    padding: 20,
  },
  eventCard: {
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  eventCardContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  eventDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    marginBottom: 12,
  },
  eventStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  eventDetails: {
    marginBottom: 24,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    marginLeft: 12,
    fontSize: 16,
  },
  descriptionContainer: {
    marginTop: 16,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  attendeesSection: {
    marginTop: 24,
  },
  attendeesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyAttendees: {
    alignItems: 'center',
    padding: 40,
  },
  emptyAttendeesText: {
    marginTop: 12,
    fontSize: 16,
    opacity: 0.7,
  },
  attendeeItem: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  attendeeEmail: {
    fontSize: 14,
    opacity: 0.7,
  },

  // Action Buttons
  eventActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  closeButton: {
    backgroundColor: '#ff9800',
  },
  openButton: {
    backgroundColor: '#4caf50',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  confirmationModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmationMessage: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteConfirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  closeConfirmButton: {
    flex: 1,
    backgroundColor: '#ff9800',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeConfirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  openConfirmButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  openConfirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default ManageEventsScreen;
