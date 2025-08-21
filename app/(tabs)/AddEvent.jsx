import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { db } from "../../config/firebase";
import { collection, addDoc } from "firebase/firestore";

const clientGroups = ["Refugees", "Asylum Seekers", "General Public"];
const activityClasses = ["Education", "Skill Building", "Legal", "Health & Wellbeing", "Tech Skills"];
const languages = ["English", "Cantonese", "Urdu", "Arabic", "Mandarin", "Somali", "French"];
const districts = ["Wan Chai", "Causeway Bay", "Tsim Tsa Tsui", "Mong Kok"];
const transportOptions = [
  "Provided to all immigration paper (Form 8) holders",
  "Registered members of the NGO",
  "No transportation allowance is provided"
];

const NGOEventForm = () => {
  const [eventData, setEventData] = useState({
    name: "",
    date: "",
    time: "",
    duration: "",
    slots: "",
    location: "",
    ngoName: "",
    description: "",
    materials: "",
    clientGroup: [],
    languages: [],
    activityType: "",
    district: "",
    transport: "",
  });

  const handleChange = (field, value) => {
    setEventData({ ...eventData, [field]: value });
  };

  const handleMultiSelect = (field, option) => {
    setEventData((prev) => {
      if (prev[field].includes(option)) {
        return { ...prev, [field]: prev[field].filter((i) => i !== option) };
      } else {
        return { ...prev, [field]: [...prev[field], option] };
      }
    });
  };

  const handleSubmit = async () => {
    try {
      await addDoc(collection(db, "events"), eventData);
      Alert.alert("Success", "Event created successfully!");
      setEventData({
        name: "",
        date: "",
        time: "",
        duration: "",
        slots: "",
        location: "",
        ngoName: "",
        description: "",
        materials: "",
        clientGroup: [],
        languages: [],
        activityType: "",
        district: "",
        transport: "",
      });
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Create NGO Event</Text>

      <TextInput style={styles.input} placeholder="Event Name" value={eventData.name} onChangeText={(v) => handleChange("name", v)} />
      <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={eventData.date} onChangeText={(v) => handleChange("date", v)} />
      <TextInput style={styles.input} placeholder="Time (e.g. 3:00 PM)" value={eventData.time} onChangeText={(v) => handleChange("time", v)} />
      <TextInput style={styles.input} placeholder="Duration" value={eventData.duration} onChangeText={(v) => handleChange("duration", v)} />
      <TextInput style={styles.input} placeholder="Total Slots" value={eventData.slots} onChangeText={(v) => handleChange("slots", v)} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Location" value={eventData.location} onChangeText={(v) => handleChange("location", v)} />
      <TextInput style={styles.input} placeholder="NGO Name" value={eventData.ngoName} onChangeText={(v) => handleChange("ngoName", v)} />
      <TextInput style={[styles.input, { height: 80 }]} placeholder="Activity Description" multiline value={eventData.description} onChangeText={(v) => handleChange("description", v)} />
      <TextInput style={styles.input} placeholder="Materials Required" value={eventData.materials} onChangeText={(v) => handleChange("materials", v)} />

      {/* Multi-select Client Groups */}
      <Text style={styles.label}>Who is it available to?</Text>
      <View style={styles.optionsContainer}>
        {clientGroups.map((cg) => (
          <TouchableOpacity
            key={cg}
            style={[styles.option, eventData.clientGroup.includes(cg) && styles.selected]}
            onPress={() => handleMultiSelect("clientGroup", cg)}
          >
            <Text>{cg}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Multi-select Languages */}
      <Text style={styles.label}>Languages</Text>
      <View style={styles.optionsContainer}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang}
            style={[styles.option, eventData.languages.includes(lang) && styles.selected]}
            onPress={() => handleMultiSelect("languages", lang)}
          >
            <Text>{lang}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Activity Type */}
      <Text style={styles.label}>Activity Type</Text>
      <View style={styles.optionsContainer}>
        {activityClasses.map((a) => (
          <TouchableOpacity
            key={a}
            style={[styles.option, eventData.activityType === a && styles.selected]}
            onPress={() => handleChange("activityType", a)}
          >
            <Text>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* District */}
      <Text style={styles.label}>District</Text>
      <View style={styles.optionsContainer}>
        {districts.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.option, eventData.district === d && styles.selected]}
            onPress={() => handleChange("district", d)}
          >
            <Text>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transport */}
      <Text style={styles.label}>Transportation vouchers</Text>
      <View style={styles.optionsContainer}>
        {transportOptions.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.option, eventData.transport === t && styles.selected]}
            onPress={() => handleChange("transport", t)}
          >
            <Text>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Save Event</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default NGOEventForm;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8, marginBottom: 12 },
  label: { fontWeight: "bold", marginTop: 12, marginBottom: 6 },
  optionsContainer: { flexDirection: "row", flexWrap: "wrap" },
  option: { borderWidth: 1, borderColor: "#aaa", borderRadius: 20, padding: 8, margin: 4 },
  selected: { backgroundColor: "#cce5ff", borderColor: "#3399ff" },
  button: { backgroundColor: "#007BFF", padding: 14, borderRadius: 10, marginTop: 20, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
