import { addDoc, collection } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../config/firebase";

const clientGroups = ["Refugees", "Asylum Seekers", "General Public", "Clients Only"];
const activityClasses = ["Education", "Skill Building", "Legal", "Health & Wellbeing", "Tech Skills"];
const languages = ["English", "Cantonese", "Urdu", "Arabic", "Mandarin", "Somali", "French"];
const districts = ["Wan Chai", "Causeway Bay", "Tsim Tsa Tsui", "Mong Kok"];
const transportOptions = [
  "Provided to all immigration paper (Form 8) holders",
  "Registered members of the NGO",
  "No transportation allowance is provided"
];
const difficultyLevels = ["Beginner", "Intermediate", "Advanced"];

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
    difficulty: "Beginner",
    ngoInfo: "",
    ngoContact: "",
    enrolledCount: 0,
    registeredUsers: [],
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

  const validateForm = () => {
    const requiredFields = [
      'name', 'date', 'time', 'duration', 'slots', 'location', 
      'ngoName', 'description', 'activityType', 'district', 'transport'
    ];
    
    for (const field of requiredFields) {
      if (!eventData[field]) {
        Alert.alert("Validation Error", `Please fill in the ${field} field`);
        return false;
      }
    }
    
    if (eventData.clientGroup.length === 0) {
      Alert.alert("Validation Error", "Please select at least one client group");
      return false;
    }
    
    if (eventData.languages.length === 0) {
      Alert.alert("Validation Error", "Please select at least one language");
      return false;
    }
    
    if (isNaN(eventData.slots) || parseInt(eventData.slots) <= 0) {
      Alert.alert("Validation Error", "Please enter a valid number of slots");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      const eventToSave = {
        ...eventData,
        slots: parseInt(eventData.slots),
        enrolledCount: 0,
        registeredUsers: [],
        createdAt: new Date().toISOString(),
      };
      
      await addDoc(collection(db, "events"), eventToSave);
      Alert.alert("Success", "Event created successfully!");
      
      // Reset form
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
        difficulty: "Beginner",
        ngoInfo: "",
        ngoContact: "",
        enrolledCount: 0,
        registeredUsers: [],
      });
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer}>
      <Text style={styles.header}>Create NGO Event</Text>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Event Name *" 
            value={eventData.name} 
            onChangeText={(v) => handleChange("name", v)} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="NGO Name *" 
            value={eventData.ngoName} 
            onChangeText={(v) => handleChange("ngoName", v)} 
          />
          <TextInput 
            style={[styles.input, { height: 80 }]} 
            placeholder="Activity Description *" 
            multiline 
            value={eventData.description} 
            onChangeText={(v) => handleChange("description", v)} 
          />
        </View>

        {/* Event Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Details</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Date (YYYY-MM-DD) *" 
            value={eventData.date} 
            onChangeText={(v) => handleChange("date", v)} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Time (e.g. 14:00) *" 
            value={eventData.time} 
            onChangeText={(v) => handleChange("time", v)} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Duration (e.g. 2 hours) *" 
            value={eventData.duration} 
            onChangeText={(v) => handleChange("duration", v)} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Total Slots *" 
            value={eventData.slots} 
            onChangeText={(v) => handleChange("slots", v)} 
            keyboardType="numeric" 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Location *" 
            value={eventData.location} 
            onChangeText={(v) => handleChange("location", v)} 
          />
        </View>

        {/* Materials and Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Materials and Requirements</Text>
          <TextInput 
            style={[styles.input, { height: 80 }]} 
            placeholder="Materials Required" 
            multiline 
            value={eventData.materials} 
            onChangeText={(v) => handleChange("materials", v)} 
          />
        </View>

        {/* NGO Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NGO Information</Text>
          <TextInput 
            style={[styles.input, { height: 80 }]} 
            placeholder="NGO Description" 
            multiline 
            value={eventData.ngoInfo} 
            onChangeText={(v) => handleChange("ngoInfo", v)} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="NGO Contact (e.g. +852 2802 0021)" 
            value={eventData.ngoContact} 
            onChangeText={(v) => handleChange("ngoContact", v)} 
          />
        </View>

        {/* Client Groups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who is it available to? *</Text>
      <View style={styles.optionsContainer}>
        {clientGroups.map((cg) => (
          <TouchableOpacity
            key={cg}
            style={[styles.option, eventData.clientGroup.includes(cg) && styles.selected]}
            onPress={() => handleMultiSelect("clientGroup", cg)}
          >
                <Text style={[styles.optionText, eventData.clientGroup.includes(cg) && styles.selectedText]}>{cg}</Text>
          </TouchableOpacity>
        ))}
          </View>
      </View>

        {/* Languages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Languages *</Text>
      <View style={styles.optionsContainer}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang}
            style={[styles.option, eventData.languages.includes(lang) && styles.selected]}
            onPress={() => handleMultiSelect("languages", lang)}
          >
                <Text style={[styles.optionText, eventData.languages.includes(lang) && styles.selectedText]}>{lang}</Text>
          </TouchableOpacity>
        ))}
          </View>
      </View>

        {/* Activity Type and Difficulty */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Type *</Text>
      <View style={styles.optionsContainer}>
        {activityClasses.map((a) => (
          <TouchableOpacity
            key={a}
            style={[styles.option, eventData.activityType === a && styles.selected]}
            onPress={() => handleChange("activityType", a)}
          >
                <Text style={[styles.optionText, eventData.activityType === a && styles.selectedText]}>{a}</Text>
          </TouchableOpacity>
        ))}
          </View>
          
          <Text style={styles.label}>Difficulty Level</Text>
          <View style={styles.optionsContainer}>
            {difficultyLevels.map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.option, eventData.difficulty === level && styles.selected]}
                onPress={() => handleChange("difficulty", level)}
              >
                <Text style={[styles.optionText, eventData.difficulty === level && styles.selectedText]}>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>
      </View>

      {/* District */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>District *</Text>
      <View style={styles.optionsContainer}>
        {districts.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.option, eventData.district === d && styles.selected]}
            onPress={() => handleChange("district", d)}
          >
                <Text style={[styles.optionText, eventData.district === d && styles.selectedText]}>{d}</Text>
          </TouchableOpacity>
        ))}
          </View>
      </View>

      {/* Transport */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transportation Vouchers *</Text>
      <View style={styles.optionsContainer}>
        {transportOptions.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.option, eventData.transport === t && styles.selected]}
            onPress={() => handleChange("transport", t)}
          >
                <Text style={[styles.optionText, eventData.transport === t && styles.selectedText]}>{t}</Text>
          </TouchableOpacity>
        ))}
          </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Create Event</Text>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default NGOEventForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#333",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  label: {
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
    fontSize: 16,
    color: "#333",
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  option: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  selected: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196f3",
  },
  optionText: {
    fontSize: 14,
    color: "#666",
  },
  selectedText: {
    color: "#2196f3",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#2196f3",
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
