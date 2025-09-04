import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../../config/firebase';

const { width: screenWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const NGOProfile = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    description: '',
    location: '',
    contact: '',
    email: '',
    website: '',
    establishedYear: '',
    services: [],
    languages: []
  });

  const [newService, setNewService] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  const availableServices = ['Education', 'Health & Wellbeing', 'Emergency Relief', 'Legal Support', 'Job Skills', 'Community Services', 'Youth Development', 'Child Protection', 'Community Development'];
  const availableLanguages = ['English', 'Cantonese', 'Mandarin', 'Arabic', 'Urdu', 'French', 'Somali', 'Spanish', 'Hindi', 'Bengali'];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      const profileRef = doc(db, 'ngoProfiles', auth.currentUser.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        setProfile(profileSnap.data());
      } else {
        // Initialize with user's email if available
        setProfile(prev => ({
          ...prev,
          email: auth.currentUser.email || ''
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!auth.currentUser) return;

    // Validation
    if (!profile.name.trim()) {
      Alert.alert('Error', 'Please enter NGO name');
      return;
    }
    if (!profile.description.trim()) {
      Alert.alert('Error', 'Please enter description');
      return;
    }
    if (!profile.location.trim()) {
      Alert.alert('Error', 'Please enter location');
      return;
    }
    if (!profile.contact.trim()) {
      Alert.alert('Error', 'Please enter contact number');
      return;
    }
    if (!profile.email.trim()) {
      Alert.alert('Error', 'Please enter email');
      return;
    }
    if (!profile.establishedYear.trim()) {
      Alert.alert('Error', 'Please enter established year');
      return;
    }
    if (profile.services.length === 0) {
      Alert.alert('Error', 'Please select at least one service');
      return;
    }
    if (profile.languages.length === 0) {
      Alert.alert('Error', 'Please select at least one language');
      return;
    }

    setSaving(true);
    try {
      const profileRef = doc(db, 'ngoProfiles', auth.currentUser.uid);
      await setDoc(profileRef, {
        ...profile,
        lastUpdated: new Date(),
        userId: auth.currentUser.uid
      }, { merge: true });

      // Also update the main ngos collection for public display
      const ngoRef = doc(db, 'ngos', auth.currentUser.uid);
      await setDoc(ngoRef, {
        ...profile,
        type: 'NGO',
        volunteersCount: 0,
        eventsCount: 0,
        lastUpdated: new Date(),
        userId: auth.currentUser.uid
      }, { merge: true });

      Alert.alert('Success', 'Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addService = (service) => {
    if (service && !profile.services.includes(service)) {
      setProfile(prev => ({
        ...prev,
        services: [...prev.services, service]
      }));
    }
  };

  const removeService = (service) => {
    setProfile(prev => ({
      ...prev,
      services: prev.services.filter(s => s !== service)
    }));
  };

  const addLanguage = (language) => {
    if (language && !profile.languages.includes(language)) {
      setProfile(prev => ({
        ...prev,
        languages: [...prev.languages, language]
      }));
    }
  };

  const removeLanguage = (language) => {
    setProfile(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== language)
    }));
  };

  const addCustomService = () => {
    if (newService.trim() && !profile.services.includes(newService.trim())) {
      addService(newService.trim());
      setNewService('');
    }
  };

  const addCustomLanguage = () => {
    if (newLanguage.trim() && !profile.languages.includes(newLanguage.trim())) {
      addLanguage(newLanguage.trim());
      setNewLanguage('');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NGO Profile</Text>
        <Text style={styles.headerSubtitle}>Manage your organization's information</Text>
      </View>

      <View style={styles.form}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>NGO Name *</Text>
            <TextInput
              style={styles.input}
              value={profile.name}
              onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
              placeholder="Enter NGO name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={profile.description}
              onChangeText={(text) => setProfile(prev => ({ ...prev, description: text }))}
              placeholder="Describe your NGO's mission and activities"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              value={profile.location}
              onChangeText={(text) => setProfile(prev => ({ ...prev, location: text }))}
              placeholder="e.g., Hong Kong"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Established Year *</Text>
            <TextInput
              style={styles.input}
              value={profile.establishedYear}
              onChangeText={(text) => setProfile(prev => ({ ...prev, establishedYear: text }))}
              placeholder="e.g., 1950"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Number *</Text>
            <TextInput
              style={styles.input}
              value={profile.contact}
              onChangeText={(text) => setProfile(prev => ({ ...prev, contact: text }))}
              placeholder="e.g., +852 2802 0021"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={profile.email}
              onChangeText={(text) => setProfile(prev => ({ ...prev, email: text }))}
              placeholder="e.g., info@yourngo.org"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={profile.website}
              onChangeText={(text) => setProfile(prev => ({ ...prev, website: text }))}
              placeholder="e.g., https://www.yourngo.org"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services *</Text>
          <Text style={styles.sectionSubtitle}>Select services your NGO provides</Text>
          
          <View style={styles.tagsContainer}>
            {profile.services.map((service, index) => (
              <TouchableOpacity
                key={index}
                style={styles.selectedTag}
                onPress={() => removeService(service)}
              >
                <Text style={styles.selectedTagText}>{service}</Text>
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.optionsContainer}>
            {availableServices.map((service) => (
              <TouchableOpacity
                key={service}
                style={[
                  styles.optionButton,
                  profile.services.includes(service) && styles.selectedOption
                ]}
                onPress={() => 
                  profile.services.includes(service) 
                    ? removeService(service) 
                    : addService(service)
                }
              >
                <Text style={[
                  styles.optionText,
                  profile.services.includes(service) && styles.selectedOptionText
                ]}>
                  {service}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.customInputContainer}>
            <TextInput
              style={styles.customInput}
              value={newService}
              onChangeText={setNewService}
              placeholder="Add custom service"
            />
            <TouchableOpacity style={styles.addButton} onPress={addCustomService}>
              <Ionicons name="add" size={20} color="#2196f3" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Languages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Languages *</Text>
          <Text style={styles.sectionSubtitle}>Select languages your NGO supports</Text>
          
          <View style={styles.tagsContainer}>
            {profile.languages.map((language, index) => (
              <TouchableOpacity
                key={index}
                style={styles.selectedTag}
                onPress={() => removeLanguage(language)}
              >
                <Text style={styles.selectedTagText}>{language}</Text>
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.optionsContainer}>
            {availableLanguages.map((language) => (
              <TouchableOpacity
                key={language}
                style={[
                  styles.optionButton,
                  profile.languages.includes(language) && styles.selectedOption
                ]}
                onPress={() => 
                  profile.languages.includes(language) 
                    ? removeLanguage(language) 
                    : addLanguage(language)
                }
              >
                <Text style={[
                  styles.optionText,
                  profile.languages.includes(language) && styles.selectedOptionText
                ]}>
                  {language}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.customInputContainer}>
            <TextInput
              style={styles.customInput}
              value={newLanguage}
              onChangeText={setNewLanguage}
              placeholder="Add custom language"
            />
            <TouchableOpacity style={styles.addButton} onPress={addCustomLanguage}>
              <Ionicons name="add" size={20} color="#2196f3" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Profile</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    ...(isWeb && {
      maxWidth: 800,
      marginHorizontal: 'auto',
      width: '100%',
    }),
  },
  scrollContent: {
    paddingBottom: 40,
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
  form: {
    paddingHorizontal: isWeb ? 40 : 20,
    paddingVertical: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    ...(isWeb && {
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }),
  },
  sectionTitle: {
    fontSize: isWeb ? 16 : 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: isWeb ? 12 : 14,
    color: '#666',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: isWeb ? 12 : 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: isWeb ? 12 : 14,
    color: '#333',
    backgroundColor: '#fff',
    ...(isWeb && {
      outline: 'none',
    }),
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  selectedTag: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedTagText: {
    color: '#fff',
    fontSize: isWeb ? 10 : 12,
    marginRight: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  selectedOption: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  optionText: {
    fontSize: isWeb ? 10 : 12,
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: isWeb ? 12 : 14,
    color: '#333',
    backgroundColor: '#fff',
    marginRight: 8,
    ...(isWeb && {
      outline: 'none',
    }),
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196f3',
    backgroundColor: '#f0f8ff',
  },
  saveButton: {
    backgroundColor: '#2196f3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: isWeb ? 14 : 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default NGOProfile;
