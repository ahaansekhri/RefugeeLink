import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { db } from "../../config/firebase";
import { collection, getDocs } from "firebase/firestore";

// Reusable Event Card
const EventCard = ({ event }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{event.name}</Text>
      <Text style={styles.subText}>📅 {event.date} | ⏰ {event.time} ({event.duration})</Text>
      <Text style={styles.subText}>📍 {event.location} | 🏢 {event.ngoName}</Text>
      <Text style={styles.subText}>👥 Slots: {event.slots}</Text>
      <Text style={styles.subText}>🌐 Languages: {event.languages?.join(", ")}</Text>
      <Text style={styles.subText}>🎯 Available to: {event.clientGroup?.join(", ")}</Text>
      <Text style={styles.subText}>📌 Type: {event.activityType}</Text>
      <Text style={styles.subText}>🚍 Transport: {event.transport}</Text>
      <Text style={styles.briefDesc}>{event.description?.slice(0, 60)}...</Text>
    </View>
  );
};

const clientGroups = ["Refugees", "Asylum Seekers", "General Public"];
const activityClasses = ["Education", "Skill Building", "Legal", "Health & Wellbeing", "Tech Skills"];
const languages = ["English", "Cantonese", "Urdu", "Arabic", "Mandarin", "Somali", "French"];
const districts = ["Wan Chai", "Causeway Bay", "Tsim Tsa Tsui", "Mong Kok"];
const transportOptions = [
  "Provided to all immigration paper (Form 8) holders",
  "Registered members of the NGO",
  "No transportation allowance is provided"
];

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
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
        const eventList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
      [field]: prev[field] === value ? "" : value, // toggle
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

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {[{ label: "Client", options: clientGroups, field: "clientGroup" },
          { label: "Activity", options: activityClasses, field: "activityType" },
          { label: "Language", options: languages, field: "language" },
          { label: "District", options: districts, field: "district" },
          { label: "Transport", options: transportOptions, field: "transport" },
        ].map((f) => (
          <View key={f.field} style={styles.filterSection}>
            <Text style={styles.filterLabel}>{f.label}</Text>
            <ScrollView horizontal>
              {f.options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.filterBtn, filters[f.field] === opt && styles.activeFilter]}
                  onPress={() => toggleFilter(f.field, opt)}
                >
                  <Text style={{ fontSize: 12 }}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      <FlatList
        data={applyFilters()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventCard event={item} />}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 30 }}>No events found</Text>}
      />
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
});
