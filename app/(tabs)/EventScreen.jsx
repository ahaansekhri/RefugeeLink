import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Button,
  Alert,
} from "react-native";
import { db, auth } from "../../config/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  increment,
  arrayUnion,
} from "firebase/firestore";

const EventCard = ({ event, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress(event)}>
      <View style={styles.card}>
        <Text style={styles.title}>{event.name}</Text>
        <Text style={styles.subText}>
          📅 {event.date} | ⏰ {event.time} ({event.duration})
        </Text>
        <Text style={styles.subText}>
          📍 {event.location} | 🏢 {event.ngoName}
        </Text>
        <Text style={styles.subText}>👥 Slots: {event.slots}</Text>
        <Text style={styles.subText}>
          🌐 Languages: {event.languages?.join(", ")}
        </Text>
        <Text style={styles.subText}>
          🎯 Available to: {event.clientGroup?.join(", ")}
        </Text>
        <Text style={styles.subText}>📌 Type: {event.activityType}</Text>
        <Text style={styles.subText}>🚍 Transport: {event.transport}</Text>
        <Text style={styles.briefDesc}>
          {event.description?.slice(0, 60)}...
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null); // modal state
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
      return (
        (!filters.clientGroup || ev.clientGroup?.includes(filters.clientGroup)) &&
        (!filters.activityType || ev.activityType === filters.activityType) &&
        (!filters.language || ev.languages?.includes(filters.language)) &&
        (!filters.district || ev.district === filters.district) &&
        (!filters.transport || ev.transport === filters.transport)
      );
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
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Filter Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
      >
        {[
          {
            label: "Client",
            options: ["Refugees", "Asylum Seekers", "General Public"],
            field: "clientGroup",
          },
          {
            label: "Activity",
            options: [
              "Education",
              "Skill Building",
              "Legal",
              "Health & Wellbeing",
              "Tech Skills",
            ],
            field: "activityType",
          },
          {
            label: "Language",
            options: [
              "English",
              "Cantonese",
              "Urdu",
              "Arabic",
              "Mandarin",
              "Somali",
              "French",
            ],
            field: "language",
          },
          {
            label: "District",
            options: ["Wan Chai", "Causeway Bay", "Tsim Tsa Tsui", "Mong Kok"],
            field: "district",
          },
          {
            label: "Transport",
            options: [
              "Provided to all immigration paper (Form 8) holders",
              "Registered members of the NGO",
              "No transportation allowance is provided",
            ],
            field: "transport",
          },
        ].map((f) => (
          <View key={f.field} style={styles.filterSection}>
            <Text style={styles.filterLabel}>{f.label}</Text>
            <ScrollView horizontal>
              {f.options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.filterBtn,
                    filters[f.field] === opt && styles.activeFilter,
                  ]}
                  onPress={() => toggleFilter(f.field, opt)}
                >
                  <Text style={{ fontSize: 12 }}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {/* Events */}
      <FlatList
        data={applyFilters()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard event={item} onPress={setSelectedEvent} />
        )}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 30 }}>
            No events found
          </Text>
        }
      />

      {/* Modal */}
      <Modal
        visible={!!selectedEvent}
        animationType="slide"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <ScrollView style={{ padding: 16, backgroundColor: "#fff" }}>
          {selectedEvent && (
            <>
              <Text style={styles.modalTitle}>{selectedEvent.name}</Text>
              <Text style={styles.modalSub}>
                📅 {selectedEvent.date} | ⏰ {selectedEvent.time} (
                {selectedEvent.duration})
              </Text>
              <Text style={styles.modalSub}>📍 {selectedEvent.location}</Text>
              <Text style={styles.modalSub}>🏢 {selectedEvent.ngoName}</Text>
              <Text style={styles.modalSub}>👥 Slots: {selectedEvent.slots}</Text>
              <Text style={styles.modalSub}>
                🌐 Languages: {selectedEvent.languages?.join(", ")}
              </Text>
              <Text style={styles.modalSub}>
                🎯 Available to: {selectedEvent.clientGroup?.join(", ")}
              </Text>
              <Text style={styles.modalSub}>
                📌 Type: {selectedEvent.activityType}
              </Text>
              <Text style={styles.modalSub}>
                🚍 Transport: {selectedEvent.transport}
              </Text>

              <Text style={styles.sectionTitle}>About This Class</Text>
              <Text style={styles.modalText}>{selectedEvent.description}</Text>

              <Text style={styles.sectionTitle}>What You Need</Text>
              <Text style={styles.modalText}>
                {selectedEvent.requirements ||
                  "Notebook, pen, and positive attitude"}
              </Text>

              <Text style={styles.sectionTitle}>
                About {selectedEvent.ngoName}
              </Text>
              <Text style={styles.modalText}>
                {selectedEvent.ngoInfo ||
                  "This NGO has been serving the community for years."}
              </Text>

              {/* ✅ Register Button */}
              <Button
                title="Register"
                onPress={() => registerForEvent(selectedEvent.id)}
              />

              <View style={{ marginTop: 10 }}>
                <Button title="Close" onPress={() => setSelectedEvent(null)} />
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
  card: {
    backgroundColor: "#f9f9f9",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 6 },
  subText: { fontSize: 13, color: "#555", marginBottom: 2 },
  briefDesc: { fontSize: 13, marginTop: 4, color: "#333" },
  filterBar: { padding: 8, borderBottomWidth: 1, borderColor: "#ddd" },
  filterSection: { marginRight: 14 },
  filterLabel: { fontWeight: "bold", marginBottom: 4 },
  filterBtn: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    backgroundColor: "#fff",
  },
  activeFilter: {
    backgroundColor: "#cce5ff",
    borderColor: "#3399ff",
  },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  modalSub: { fontSize: 14, marginBottom: 6, color: "#555" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 14,
    marginBottom: 6,
  },
  modalText: { fontSize: 14, color: "#333", marginBottom: 10 },
});
