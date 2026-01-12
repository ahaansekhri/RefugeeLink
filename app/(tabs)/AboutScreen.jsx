import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const AboutScreen = () => {
  const navigation = useNavigation();

  const features = [
    {
      icon: '🎓',
      title: 'Free Education',
      description: 'Access to free skill-building classes and workshops'
    },
    {
      icon: '🤝',
      title: 'NGO Network',
      description: 'Connect with trusted organizations in Hong Kong'
    },
    {
      icon: '🌐',
      title: 'Multi-language',
      description: 'Support for multiple languages and communities'
    },
    {
      icon: '📱',
      title: 'Easy Access',
      description: 'Simple registration and event booking process'
    }
  ];


  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroBrand}>Justice Link</Text>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Discover Learning Opportunities for Refugees and Asylum Seekers</Text>
          <Text style={styles.heroDescription}>
            Connect with NGOs offering free skill-building classes, workshops, and training programs. Build your future, one skill at a time.
          </Text>
        </View>
      </View>


      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Why Choose JusticeLink?</Text>
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* About Section */}
      <View style={styles.aboutSection}>
        <Text style={styles.sectionTitle}>About JusticeLink</Text>
        <Text style={styles.aboutText}>
          JusticeLink is a comprehensive platform designed to bridge the gap between refugees, asylum seekers, and the community services available in Hong Kong. Our mission is to empower individuals through education, skill development, and community integration.
        </Text>
        <Text style={styles.aboutText}>
          We partner with trusted NGOs across Hong Kong to provide free access to educational programs, vocational training, language classes, and community support services. Our platform makes it easy to discover, register for, and participate in programs that can help build a brighter future.
        </Text>
      </View>

      {/* How It Works Section */}
      <View style={styles.howItWorksSection}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Browse Events</Text>
              <Text style={styles.stepDescription}>Explore available classes and workshops by category, location, or language</Text>
            </View>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Register</Text>
              <Text style={styles.stepDescription}>Create a free account and register for events that interest you</Text>
            </View>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Learn & Grow</Text>
              <Text style={styles.stepDescription}>Attend events, build skills, and connect with your community</Text>
            </View>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Ready to Start Your Journey?</Text>
        <Text style={styles.ctaDescription}>
          Join thousands of participants who are already building their future with JusticeLink
        </Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => navigation.navigate('Event')}>
          <Text style={styles.ctaButtonText}>Explore Events</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 JusticeLink. Empowering communities through education.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  


  heroSection: {
    backgroundColor: '#e3f2fd',
    paddingVertical: isWeb ? 100 : 80,
    paddingHorizontal: isWeb ? 40 : 20,
    alignItems: 'center',
    ...(isWeb && {
      minHeight: '60vh',
      justifyContent: 'center',
    }),
  },
  heroContent: {
    maxWidth: isWeb ? 800 : '100%',
    alignItems: 'center',
  },
  heroBrand: {
    position: 'absolute',
    top: isWeb ? 20 : 12,
    alignSelf: 'center',
    fontSize: isWeb ? 72 : 48,
    color: '#1a365d',
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: 2,
    zIndex: 2,
  },
  heroTitle: {
    marginTop: isWeb ? 48 : 36,
    fontSize: isWeb ? 32 : 22,
    fontWeight: '700',
    color: '#1a365d',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: isWeb ? 40 : 30,
    ...(isWeb && {
      maxWidth: 600,
    }),
  },
  heroDescription: {
    fontSize: isWeb ? 18 : 16,
    color: '#4a5568',
    textAlign: 'center',
    lineHeight: isWeb ? 28 : 24,
    maxWidth: isWeb ? 600 : '100%',
  },

  // Features Section
  featuresSection: {
    paddingVertical: 60,
    paddingHorizontal: isWeb ? 40 : 20,
    backgroundColor: '#f8f9fa',
  },
  sectionTitle: {
    fontSize: isWeb ? 28 : 24,
    fontWeight: 'bold',
    color: '#1a365d',
    textAlign: 'center',
    marginBottom: 40,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    maxWidth: isWeb ? 1000 : '100%',
    alignSelf: 'center',
  },
  featureCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    width: isWeb ? '48%' : '100%',
    ...(isWeb && {
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s ease',
      cursor: 'pointer',
    }),
  },
  featureIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: isWeb ? 18 : 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: isWeb ? 14 : 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: isWeb ? 20 : 18,
  },

  // About Section
  aboutSection: {
    paddingVertical: 60,
    paddingHorizontal: isWeb ? 40 : 20,
    backgroundColor: '#fff',
  },
  aboutText: {
    fontSize: isWeb ? 16 : 14,
    color: '#4a5568',
    lineHeight: isWeb ? 26 : 22,
    marginBottom: 20,
    textAlign: 'justify',
    maxWidth: isWeb ? 800 : '100%',
    alignSelf: 'center',
  },

  // How It Works Section
  howItWorksSection: {
    paddingVertical: 60,
    paddingHorizontal: isWeb ? 40 : 20,
    backgroundColor: '#f8f9fa',
  },
  stepsContainer: {
    maxWidth: isWeb ? 800 : '100%',
    alignSelf: 'center',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  stepNumberText: {
    fontSize: isWeb ? 18 : 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: isWeb ? 18 : 16,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: isWeb ? 14 : 12,
    color: '#666',
    lineHeight: isWeb ? 22 : 20,
  },

  // CTA Section
  ctaSection: {
    paddingVertical: 60,
    paddingHorizontal: isWeb ? 40 : 20,
    backgroundColor: '#2196f3',
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: isWeb ? 28 : 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  ctaDescription: {
    fontSize: isWeb ? 16 : 14,
    color: '#e3f2fd',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: isWeb ? 600 : '100%',
    lineHeight: isWeb ? 24 : 20,
  },
  ctaButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    ...(isWeb && {
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      transition: 'transform 0.2s ease',
      cursor: 'pointer',
    }),
  },
  ctaButtonText: {
    fontSize: isWeb ? 16 : 14,
    fontWeight: 'bold',
    color: '#2196f3',
  },

  // Footer
  footer: {
    paddingVertical: 40,
    paddingHorizontal: isWeb ? 40 : 20,
    backgroundColor: '#1a365d',
    alignItems: 'center',
  },
  footerText: {
    fontSize: isWeb ? 14 : 12,
    color: '#a0aec0',
    textAlign: 'center',
  },
});

export default AboutScreen;
