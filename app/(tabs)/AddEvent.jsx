import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  PermissionsAndroid,
  Picker,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../config/firebase";

const isWeb = Platform.OS === 'web';

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
const slotsOptions = [
  ...Array.from({ length: 200 }, (_, i) => i + 1), // 1 to 200 slots
  { label: 'Unlimited', value: 'unlimited' }
];
const hoursOptions = Array.from({ length: 24 }, (_, i) => i); // 0 to 23 hours
const minutesOptions = Array.from({ length: 60 }, (_, i) => i); // 0 to 59 minutes

const NGOEventForm = () => {
  const navigation = useNavigation();
  const [user, loading, error] = useAuthState(auth);
  
  const [eventData, setEventData] = useState({
    name: "",
    date: "",
    time: "",
    duration: "",
    durationHours: 1,
    durationMinutes: 0,
    slots: 1, // Ensure this is a number
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

  // Picker modal states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSlotsPicker, setShowSlotsPicker] = useState(false);
  const [showHoursPicker, setShowHoursPicker] = useState(false);
  const [showMinutesPicker, setShowMinutesPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Location tracking state
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Profile checking state
  const [hasProfile, setHasProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Check if user has NGO profile
  const checkProfile = async () => {
    if (!user) {
      setProfileLoading(false);
      return;
    }
    
    try {
      const profileRef = doc(db, 'ngoProfiles', user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        setHasProfile(true);
        // Pre-fill NGO name from profile
        const profileData = profileSnap.data();
        setEventData(prev => ({
          ...prev,
          ngoName: profileData.name || '',
          ngoInfo: profileData.description || '',
          ngoContact: profileData.contact || '',
        }));
      } else {
        setHasProfile(false);
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      setHasProfile(false);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    checkProfile();
  }, [user]);

  // Reload profile data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        checkProfile();
      }
    }, [user])
  );

  const handleChange = (field, value) => {
    // Handle slots field (can be number or 'unlimited')
    if (field === 'slots') {
      if (value === 'unlimited') {
        setEventData({ ...eventData, [field]: 'unlimited' });
      } else {
        setEventData({ ...eventData, [field]: parseInt(value) || 1 });
      }
    } else {
      setEventData({ ...eventData, [field]: value });
    }
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

  // Date picker handlers
  const handleDateChange = (event, selectedDate) => {
    if (isWeb) {
      // For web, the event.target.value contains the date string
      const dateValue = event.target.value;
      if (dateValue) {
        const date = new Date(dateValue);
        setSelectedDate(date);
        handleChange('date', dateValue);
      }
    } else {
      setShowDatePicker(false);
      if (selectedDate) {
        setSelectedDate(selectedDate);
        const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        handleChange('date', formattedDate);
      }
    }
  };

  // Time picker handlers
  const handleTimeChange = (event, selectedTime) => {
    if (isWeb) {
      // For web, the event.target.value contains the time string
      const timeValue = event.target.value;
      if (timeValue) {
        setSelectedTime(new Date(`2000-01-01T${timeValue}`));
        handleChange('time', timeValue);
      }
    } else {
      setShowTimePicker(false);
      if (selectedTime) {
        setSelectedTime(selectedTime);
        const formattedTime = selectedTime.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
        handleChange('time', formattedTime);
      }
    }
  };

  // Duration handlers
  const handleDurationChange = (field, value) => {
    const newData = { ...eventData, [field]: value };
    // Update the duration string when hours or minutes change
    const durationString = `${newData.durationHours}h ${newData.durationMinutes}m`;
    newData.duration = durationString;
    setEventData(newData);
  };

  // Format display values
  const formatDate = (dateString) => {
    if (!dateString) return 'Select Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Select Time';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Location tracking functions
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'RefugeeLink needs access to your location to help you set the event location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    
    try {
      // Request permission first
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to get your current location.'
        );
        return;
      }

      // Get current position
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocoding to get address
      const address = await reverseGeocode(latitude, longitude);
      
      // Update location field
      handleChange('location', address);
      
      Alert.alert(
        'Location Found',
        `Your current location has been set: ${address}`
      );
      
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please enter the location manually.'
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      // Using a free geocoding service
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await response.json();
      
      if (data.locality && data.principalSubdivision) {
        return `${data.locality}, ${data.principalSubdivision}, ${data.countryName}`;
      } else if (data.city && data.principalSubdivision) {
        return `${data.city}, ${data.principalSubdivision}, ${data.countryName}`;
      } else {
        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Required field validations
    if (!eventData.name?.trim()) {
      errors.name = 'Event name is required';
    } else if (eventData.name.trim().length < 3) {
      errors.name = 'Event name must be at least 3 characters';
    } else if (eventData.name.trim().length > 100) {
      errors.name = 'Event name must be less than 100 characters';
    }
    
    if (!eventData.date) {
      errors.date = 'Event date is required';
    } else {
      const eventDate = new Date(eventData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (eventDate < today) {
        errors.date = 'Event date cannot be in the past';
      }
      
      // Check if date is too far in the future (e.g., more than 2 years)
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 2);
      if (eventDate > maxDate) {
        errors.date = 'Event date cannot be more than 2 years in the future';
      }
    }
    
    if (!eventData.time) {
      errors.time = 'Event time is required';
    } else {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(eventData.time)) {
        errors.time = 'Please enter a valid time format (HH:MM)';
      }
    }
    
    if (!eventData.duration) {
      errors.duration = 'Event duration is required';
    } else if (eventData.durationHours === 0 && eventData.durationMinutes === 0) {
      errors.duration = 'Event duration must be at least 1 minute';
    } else if (eventData.durationHours > 12) {
      errors.duration = 'Event duration cannot exceed 12 hours';
    }
    
    // Handle slots validation (including unlimited option)
    console.log('Slots validation - eventData.slots:', eventData.slots, 'type:', typeof eventData.slots);
    
    if (eventData.slots === undefined || eventData.slots === null || eventData.slots === '') {
      errors.slots = 'Please select a valid number of slots (1-200 or unlimited)';
    } else if (eventData.slots === 'unlimited') {
      // Unlimited slots is valid
    } else {
      const slotsNumber = parseInt(eventData.slots);
      if (isNaN(slotsNumber) || slotsNumber <= 0) {
        errors.slots = 'Please select a valid number of slots (1-200 or unlimited)';
      } else if (slotsNumber > 200) {
        errors.slots = 'Maximum 200 slots allowed (use unlimited for more)';
      }
    }
    
    if (!eventData.location?.trim()) {
      errors.location = 'Event location is required';
    } else if (eventData.location.trim().length < 5) {
      errors.location = 'Please provide a more specific location';
    } else if (eventData.location.trim().length > 200) {
      errors.location = 'Location description is too long';
    }
    
    if (!eventData.ngoName?.trim()) {
      errors.ngoName = 'NGO name is required';
    }
    
    if (!eventData.description?.trim()) {
      errors.description = 'Event description is required';
    } else if (eventData.description.trim().length < 20) {
      errors.description = 'Description must be at least 20 characters';
    } else if (eventData.description.trim().length > 1000) {
      errors.description = 'Description must be less than 1000 characters';
    }
    
    if (!eventData.activityType) {
      errors.activityType = 'Activity type is required';
    }
    
    if (!eventData.district) {
      errors.district = 'District is required';
    }
    
    if (!eventData.transport) {
      errors.transport = 'Transportation option is required';
    }
    
    if (eventData.clientGroup.length === 0) {
      errors.clientGroup = 'Please select at least one client group';
    }
    
    if (eventData.languages.length === 0) {
      errors.languages = 'Please select at least one language';
    }
    
    // Validate materials field if provided
    if (eventData.materials && eventData.materials.trim().length > 500) {
      errors.materials = 'Materials description is too long (max 500 characters)';
    }
    
    // Validate NGO info fields if provided
    if (eventData.ngoInfo && eventData.ngoInfo.trim().length > 1000) {
      errors.ngoInfo = 'NGO description is too long (max 1000 characters)';
    }
    
    if (eventData.ngoContact && eventData.ngoContact.trim().length > 100) {
      errors.ngoContact = 'Contact information is too long (max 100 characters)';
    }
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      Alert.alert("Validation Error", firstError);
      return false;
    }
    
    return true;
  };

  const resetForm = () => {
    // Reset form data
    setEventData({
      name: "",
      date: "",
      time: "",
      duration: "",
      durationHours: 1,
      durationMinutes: 0,
      slots: 1, // Ensure this is a number
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

    // Reset picker states
    setShowDatePicker(false);
    setShowTimePicker(false);
    setShowSlotsPicker(false);
    setShowHoursPicker(false);
    setShowMinutesPicker(false);
    setSelectedDate(new Date());
    setSelectedTime(new Date());

    // Reset validation errors and submission state
    setValidationErrors({});
    setIsSubmitting(false);

    // Refresh NGO profile data
    if (user) {
      checkProfile();
    }
  };

  const handleSubmit = async () => {
    // Prevent double submission
    if (isSubmitting) {
      return;
    }
    
    // Check if user has profile first
    if (!hasProfile) {
      setShowProfileModal(true);
      return;
    }
    
    // Clear previous validation errors
    setValidationErrors({});
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      const eventToSave = {
        ...eventData,
        ngoId: auth.currentUser.uid,
        slots: eventData.slots === 'unlimited' ? 'unlimited' : parseInt(eventData.slots),
        enrolledCount: 0,
        registeredUsers: [],
        status: 'active', // Set initial status
        createdAt: new Date().toISOString(),
      };
      
      console.log('Saving event with ngoId:', auth.currentUser.uid);
      console.log('Event data:', eventToSave);
      
      await addDoc(collection(db, "events"), eventToSave);
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Reset form after a short delay to allow modal to show
      setTimeout(() => {
        resetForm();
      }, 100);
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert("Error", "Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking profile
  if (profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Create NGO Event</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={checkProfile}
            disabled={profileLoading}
          >
            <Ionicons 
              name="refresh" 
              size={24} 
              color={profileLoading ? "#ccc" : "#2196f3"} 
            />
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <TextInput 
            style={[styles.input, validationErrors.name && styles.inputError]} 
            placeholder="Event Name *" 
            value={eventData.name} 
            onChangeText={(v) => {
              handleChange("name", v);
              // Clear validation error when user starts typing
              if (validationErrors.name) {
                setValidationErrors(prev => ({ ...prev, name: undefined }));
              }
            }} 
          />
          {validationErrors.name && (
            <Text style={styles.errorText}>{validationErrors.name}</Text>
          )}
          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyLabel}>NGO Name *</Text>
            <View style={styles.ngoNameContainer}>
              <TextInput 
                style={[styles.input, styles.readOnlyInput]} 
                value={eventData.ngoName || (profileLoading ? "Loading from profile..." : "No profile found")} 
                editable={false}
                placeholder="Loading from profile..."
              />
              {profileLoading && (
                <ActivityIndicator 
                  size="small" 
                  color="#2196f3" 
                  style={styles.loadingIndicator}
                />
              )}
            </View>
            {!profileLoading && !eventData.ngoName && (
              <Text style={styles.profileHint}>
                Please create your NGO profile first or refresh to load it
              </Text>
            )}
          </View>
          <TextInput 
            style={[styles.input, { height: 80 }, validationErrors.description && styles.inputError]} 
            placeholder="Activity Description *" 
            multiline 
            value={eventData.description} 
            onChangeText={(v) => {
              handleChange("description", v);
              if (validationErrors.description) {
                setValidationErrors(prev => ({ ...prev, description: undefined }));
              }
            }} 
          />
          {validationErrors.description && (
            <Text style={styles.errorText}>{validationErrors.description}</Text>
          )}
        </View>

        {/* Event Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Details</Text>
          
          {/* Date Picker */}
          {isWeb ? (
            <View style={styles.webInputContainer}>
              <Text style={styles.webInputLabel}>📅 Event Date *</Text>
              <input
                type="date"
            value={eventData.date} 
                onChange={handleDateChange}
                min={new Date().toISOString().split('T')[0]}
                style={styles.webDateInput}
              />
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.pickerButton} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.pickerButtonText, !eventData.date && styles.placeholderText]}>
                📅 {formatDate(eventData.date)}
              </Text>
            </TouchableOpacity>
          )}

          {/* Time Picker */}
          {isWeb ? (
            <View style={styles.webInputContainer}>
              <Text style={styles.webInputLabel}>🕐 Event Time *</Text>
              <input
                type="time"
            value={eventData.time} 
                onChange={handleTimeChange}
                style={styles.webTimeInput}
              />
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.pickerButton} 
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={[styles.pickerButtonText, !eventData.time && styles.placeholderText]}>
                🕐 {formatTime(eventData.time)}
              </Text>
            </TouchableOpacity>
          )}

          {/* Duration - Hours and Minutes */}
          <View style={styles.durationContainer}>
            <Text style={styles.durationLabel}>Duration *</Text>
            <View style={styles.durationRow}>
              <TouchableOpacity 
                style={styles.durationButton} 
                onPress={() => setShowHoursPicker(true)}
              >
                <Text style={styles.durationButtonText}>
                  {eventData.durationHours}h
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.durationButton} 
                onPress={() => setShowMinutesPicker(true)}
              >
                <Text style={styles.durationButtonText}>
                  {eventData.durationMinutes}m
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Slots Picker */}
          <Text style={styles.label}>Number of Slots *</Text>
          <TouchableOpacity 
            style={[styles.pickerButton, validationErrors.slots && styles.inputError]} 
            onPress={() => setShowSlotsPicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              👥 {eventData.slots === 'unlimited' ? 'Unlimited slots' : `${eventData.slots} slot${eventData.slots !== 1 ? 's' : ''}`}
            </Text>
          </TouchableOpacity>
          {validationErrors.slots && (
            <Text style={styles.errorText}>{validationErrors.slots}</Text>
          )}

          <View style={styles.locationContainer}>
          <TextInput 
              style={[styles.locationInput, validationErrors.location && styles.inputError]} 
            placeholder="Location *" 
            value={eventData.location} 
            onChangeText={(v) => {
              handleChange("location", v);
              if (validationErrors.location) {
                setValidationErrors(prev => ({ ...prev, location: undefined }));
              }
            }} 
          />
            <TouchableOpacity 
              style={[styles.locationButton, isGettingLocation && styles.locationButtonDisabled]} 
              onPress={getCurrentLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.locationButtonText}>📍</Text>
              )}
            </TouchableOpacity>
          </View>
          {validationErrors.location && (
            <Text style={styles.errorText}>{validationErrors.location}</Text>
          )}

          {/* District */}
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
          {validationErrors.district && (
            <Text style={styles.errorText}>{validationErrors.district}</Text>
          )}
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
          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyLabel}>NGO Description</Text>
            <TextInput 
              style={[styles.input, styles.readOnlyInput, { height: 80 }]} 
              placeholder="Loading from profile..." 
              multiline 
              value={eventData.ngoInfo || (profileLoading ? "Loading from profile..." : "No profile found")} 
              editable={false}
            />
          </View>
          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyLabel}>NGO Contact</Text>
            <TextInput 
              style={[styles.input, styles.readOnlyInput]} 
              placeholder="Loading from profile..." 
              value={eventData.ngoContact || (profileLoading ? "Loading from profile..." : "No profile found")} 
              editable={false}
            />
          </View>
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
          {validationErrors.clientGroup && (
            <Text style={styles.errorText}>{validationErrors.clientGroup}</Text>
          )}
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
          {validationErrors.languages && (
            <Text style={styles.errorText}>{validationErrors.languages}</Text>
          )}
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
          {validationErrors.activityType && (
            <Text style={styles.errorText}>{validationErrors.activityType}</Text>
          )}
          
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
          {validationErrors.transport && (
            <Text style={styles.errorText}>{validationErrors.transport}</Text>
          )}
      </View>

      <TouchableOpacity 
        style={[styles.button, isSubmitting && styles.buttonDisabled]} 
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <View style={styles.buttonLoading}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.buttonText}>Creating Event...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Create Event</Text>
        )}
      </TouchableOpacity>
    </ScrollView>

    {/* Date Picker Modal */}
    {showDatePicker && (
      <DateTimePicker
        value={selectedDate}
        mode="date"
        display="default"
        onChange={handleDateChange}
        minimumDate={new Date()}
      />
    )}

    {/* Time Picker Modal */}
    {showTimePicker && (
      <DateTimePicker
        value={selectedTime}
        mode="time"
        display="default"
        onChange={handleTimeChange}
      />
    )}

    {/* Slots Picker Modal */}
    <Modal visible={showSlotsPicker} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Number of Slots</Text>
          <Picker
            selectedValue={eventData.slots}
            onValueChange={(value) => {
              handleChange('slots', value);
              // Clear validation error when user selects a value
              if (validationErrors.slots) {
                setValidationErrors(prev => ({ ...prev, slots: undefined }));
              }
              setShowSlotsPicker(false);
            }}
            style={styles.picker}
          >
            {slotsOptions.map((slot, index) => (
              <Picker.Item 
                key={index} 
                label={typeof slot === 'object' ? slot.label : `${slot} slot${slot !== 1 ? 's' : ''}`} 
                value={typeof slot === 'object' ? slot.value : slot} 
              />
            ))}
          </Picker>
          <TouchableOpacity 
            style={styles.modalButton} 
            onPress={() => setShowSlotsPicker(false)}
          >
            <Text style={styles.modalButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    {/* Hours Picker Modal */}
    <Modal visible={showHoursPicker} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Hours</Text>
          <Picker
            selectedValue={eventData.durationHours}
            onValueChange={(value) => {
              handleDurationChange('durationHours', value);
              setShowHoursPicker(false);
            }}
            style={styles.picker}
          >
            {hoursOptions.map((hour) => (
              <Picker.Item key={hour} label={`${hour} hour${hour !== 1 ? 's' : ''}`} value={hour} />
            ))}
          </Picker>
          <TouchableOpacity 
            style={styles.modalButton} 
            onPress={() => setShowHoursPicker(false)}
          >
            <Text style={styles.modalButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    {/* Minutes Picker Modal */}
    <Modal visible={showMinutesPicker} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Minutes</Text>
          <Picker
            selectedValue={eventData.durationMinutes}
            onValueChange={(value) => {
              handleDurationChange('durationMinutes', value);
              setShowMinutesPicker(false);
            }}
            style={styles.picker}
          >
            {minutesOptions.map((minute) => (
              <Picker.Item key={minute} label={`${minute} minute${minute !== 1 ? 's' : ''}`} value={minute} />
            ))}
          </Picker>
          <TouchableOpacity 
            style={styles.modalButton} 
            onPress={() => setShowMinutesPicker(false)}
          >
            <Text style={styles.modalButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    {/* Success Modal */}
    <Modal visible={showSuccessModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.successModalContent}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Event Created Successfully!</Text>
          <Text style={styles.successMessage}>
            Your event has been registered and is now available for refugees to join.
          </Text>
          <TouchableOpacity 
            style={styles.successButton} 
            onPress={() => {
              setShowSuccessModal(false);
              resetForm();
            }}
          >
            <Text style={styles.successButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    {/* Profile Required Modal */}
    <Modal visible={showProfileModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.profileModalContent}>
          <Text style={styles.profileModalIcon}>👤</Text>
          <Text style={styles.profileModalTitle}>Profile Required</Text>
          <Text style={styles.profileModalMessage}>
            You need to create your NGO profile before you can add events. This helps us verify your organization and provide better services.
          </Text>
          <View style={styles.profileModalButtons}>
            <TouchableOpacity 
              style={styles.profileModalCancelButton} 
              onPress={() => setShowProfileModal(false)}
            >
              <Text style={styles.profileModalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileModalCreateButton} 
              onPress={() => {
                setShowProfileModal(false);
                navigation.navigate('Profile');
              }}
            >
              <Text style={styles.profileModalCreateText}>Create Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
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
  buttonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.7,
  },
  buttonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Picker Styles
  pickerButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
  },
  pickerButtonText: {
    fontSize: 16,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  durationContainer: {
    marginBottom: 12,
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  durationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  durationButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginHorizontal: 4,
    alignItems: "center",
  },
  durationButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#333",
  },
  picker: {
    height: 200,
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },

  // Web Input Styles
  webInputContainer: {
    marginBottom: 12,
  },
  webInputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  webDateInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: "#fff",
    width: "100%",
    boxSizing: "border-box",
  },
  webTimeInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: "#fff",
    width: "100%",
    boxSizing: "border-box",
  },

  // Success Modal Styles
  successModalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  successButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Location Tracking Styles
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: "#fff",
    marginRight: 8,
  },
  locationButton: {
    backgroundColor: "#2196f3",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 48,
    shadowColor: "#2196f3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  locationButtonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
    elevation: 0,
  },
  locationButtonText: {
    fontSize: 20,
    color: "#fff",
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },

  // Profile Modal Styles
  profileModalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileModalIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  profileModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
    textAlign: "center",
  },
  profileModalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  profileModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  profileModalCancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  profileModalCancelText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  profileModalCreateButton: {
    flex: 1,
    backgroundColor: "#2196f3",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: "center",
    shadowColor: "#2196f3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  profileModalCreateText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },

  // Read-only Field Styles
  readOnlyContainer: {
    marginBottom: 12,
  },
  readOnlyLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: "#666",
  },
  readOnlyInput: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e9ecef",
    color: "#495057",
    flex: 1,
  },
  ngoNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  profileHint: {
    fontSize: 12,
    color: '#ff6b6b',
    marginTop: 4,
    fontStyle: 'italic',
  },

  // Validation Styles
  inputError: {
    borderColor: '#ff6b6b',
    borderWidth: 2,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
