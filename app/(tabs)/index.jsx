// AuthPage.jsx
import { useColorScheme } from '@/hooks/useColorScheme';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getFirestore, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../../config/firebase';

const { width: screenWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function AuthPage() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [user, loading, error] = useAuthState(auth);

  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [role, setRole] = useState('refugee');

  // Error states for validation
  const [errors, setErrors] = useState({});

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'success', 'error', 'warning', 'info'
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalAction, setModalAction] = useState(null);

  const db = getFirestore();

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validateName = (name) => {
    return name.trim().length >= 2;
  };

  // Function to show modal
  const showModalMessage = (type, title, message, action = null) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalAction(action);
    setShowModal(true);
  };

  const hideModal = () => {
    setShowModal(false);
    setModalType('');
    setModalTitle('');
    setModalMessage('');
    setModalAction(null);
  };

  // Enhanced validation functions
  const validatePasswordStrength = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: password.length >= 8 && hasUpperCase && hasLowerCase && hasNumbers,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      length: password.length
    };
  };

  const validateLoginForm = () => {
    const newErrors = {};
    
    if (!loginEmail.trim()) {
      newErrors.loginEmail = 'Email is required';
    } else if (!validateEmail(loginEmail)) {
      newErrors.loginEmail = 'Please enter a valid email address';
    }
    
    if (!loginPassword) {
      newErrors.loginPassword = 'Password is required';
    } else if (!validatePassword(loginPassword)) {
      newErrors.loginPassword = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      showModalMessage('warning', 'Validation Error', 'Please fix the errors below before continuing.');
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const validateRegisterForm = () => {
    const newErrors = {};
    
    if (!registerName.trim()) {
      newErrors.registerName = 'Full name is required';
    } else if (!validateName(registerName)) {
      newErrors.registerName = 'Name must be at least 2 characters';
    } else if (registerName.trim().length > 50) {
      newErrors.registerName = 'Name must be less than 50 characters';
    }
    
    if (!registerEmail.trim()) {
      newErrors.registerEmail = 'Email is required';
    } else if (!validateEmail(registerEmail)) {
      newErrors.registerEmail = 'Please enter a valid email address';
    } else if (registerEmail.length > 100) {
      newErrors.registerEmail = 'Email must be less than 100 characters';
    }
    
    if (!registerPassword) {
      newErrors.registerPassword = 'Password is required';
    } else {
      const passwordStrength = validatePasswordStrength(registerPassword);
      if (!passwordStrength.isValid) {
        if (registerPassword.length < 8) {
          newErrors.registerPassword = 'Password must be at least 8 characters';
        } else if (!passwordStrength.hasUpperCase) {
          newErrors.registerPassword = 'Password must contain at least one uppercase letter';
        } else if (!passwordStrength.hasLowerCase) {
          newErrors.registerPassword = 'Password must contain at least one lowercase letter';
        } else if (!passwordStrength.hasNumbers) {
          newErrors.registerPassword = 'Password must contain at least one number';
        }
      }
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      showModalMessage('warning', 'Registration Error', 'Please fix the errors below before creating your account.');
    }
    
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (user) {
      navigation.replace('Drawer');
    }
  }, [user]);

  const handleLogin = async () => {
    if (!validateLoginForm()) {
      return;
    }
    
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      setIsLoading(false);
      showModalMessage('success', 'Login Successful', 'Welcome back! You have been successfully logged in.');
    } catch (error) {
      setIsLoading(false);
      let errorMessage = 'Login failed. Please try again.';
      let errorTitle = 'Login Failed';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address. Please check your email or create a new account.';
        errorTitle = 'Account Not Found';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again or reset your password.';
        errorTitle = 'Incorrect Password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please enter a valid email.';
        errorTitle = 'Invalid Email';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later or reset your password.';
        errorTitle = 'Too Many Attempts';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
        errorTitle = 'Network Error';
      }
      
      showModalMessage('error', errorTitle, errorMessage);
    }
  };

  const handleRegister = async () => {
    if (!validateRegisterForm()) {
      return;
    }
    
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registerEmail.trim(), registerPassword);
      await updateProfile(userCredential.user, {
        displayName: registerName.trim(),
      });
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: registerName.trim(),
        email: registerEmail.trim(),
        role: role,
      });
      setIsLoading(false);
      showModalMessage('success', 'Registration Successful', `Welcome to RefugeeLink, ${registerName.trim()}! Your account has been created successfully.`);
    } catch (error) {
      setIsLoading(false);
      let errorMessage = 'Registration failed. Please try again.';
      let errorTitle = 'Registration Failed';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please use a different email or try logging in.';
        errorTitle = 'Email Already in Use';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please enter a valid email.';
        errorTitle = 'Invalid Email';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password with at least 8 characters, including uppercase, lowercase, and numbers.';
        errorTitle = 'Weak Password';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
        errorTitle = 'Network Error';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Registration is currently disabled. Please contact support.';
        errorTitle = 'Registration Disabled';
      }
      
      showModalMessage('error', errorTitle, errorMessage);
    }
  };

  // Helper functions for modal
  const getModalIcon = () => {
    switch (modalType) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  };

  const getModalIconColor = () => {
    switch (modalType) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      case 'info':
        return '#2196f3';
      default:
        return '#2196f3';
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={[styles.container, isDarkMode && { backgroundColor: '#121212' }]} 
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={!isWeb}
      {...(isWeb && {
        style: { 
          minHeight: '100vh',
          width: '100%',
        },
        contentContainerStyle: [
          styles.container, 
          isDarkMode && { backgroundColor: '#121212' }, 
          { 
            minHeight: '100vh',
            justifyContent: 'center',
            alignItems: 'center',
          }
        ]
      })}
    >
      <View style={styles.contentWrapper}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Image 
              source={require('../../assets/images/icon.png')} 
              style={styles.icon}
              resizeMode="contain"
            />
          </View>
        </View>
        <Text style={[styles.title, isDarkMode && { color: '#fff' }]}>RefugeeLink</Text>
        <Text style={[styles.subtitle, isDarkMode && { color: '#ccc' }]}>Connecting refugees with support services</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            onPress={() => {
              setMode('login');
              setErrors({});
            }} 
            style={[styles.tab, mode === 'login' && styles.activeTabBackground]}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              setMode('register');
              setErrors({});
            }} 
            style={[styles.tab, mode === 'register' && styles.activeTabBackground]}
          >
            <Text style={[styles.tabText, mode === 'register' && styles.activeTabText]}>Register</Text>
          </TouchableOpacity>
        </View>

        {mode === 'login' ? (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDarkMode && { color: '#fff' }]}>Email</Text>
              <TextInput 
                placeholder="name@example.com" 
                style={[
                  styles.input, 
                  errors.loginEmail && styles.inputError,
                  isDarkMode && styles.inputDark
                ]} 
                value={loginEmail} 
                onChangeText={(text) => {
                  setLoginEmail(text);
                  if (errors.loginEmail) {
                    setErrors(prev => ({ ...prev, loginEmail: '' }));
                  }
                }} 
                keyboardType="email-address" 
                autoCapitalize="none"
                {...(isWeb && { autoComplete: 'email' })}
              />
              {errors.loginEmail && <Text style={styles.errorText}>{errors.loginEmail}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDarkMode && { color: '#fff' }]}>Password</Text>
              <TextInput 
                placeholder="••••••••" 
                secureTextEntry 
                style={[
                  styles.input, 
                  errors.loginPassword && styles.inputError,
                  isDarkMode && styles.inputDark
                ]} 
                value={loginPassword} 
                onChangeText={(text) => {
                  setLoginPassword(text);
                  if (errors.loginPassword) {
                    setErrors(prev => ({ ...prev, loginPassword: '' }));
                  }
                }}
                {...(isWeb && { autoComplete: 'current-password' })}
              />
              {errors.loginPassword && <Text style={styles.errorText}>{errors.loginPassword}</Text>}
            </View>

            <TouchableOpacity 
              onPress={handleLogin} 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDarkMode && { color: '#fff' }]}>Full Name</Text>
              <TextInput 
                placeholder="John Doe" 
                style={[
                  styles.input, 
                  errors.registerName && styles.inputError,
                  isDarkMode && styles.inputDark
                ]} 
                value={registerName} 
                onChangeText={(text) => {
                  setRegisterName(text);
                  if (errors.registerName) {
                    setErrors(prev => ({ ...prev, registerName: '' }));
                  }
                }}
                {...(isWeb && { autoComplete: 'name' })}
              />
              {errors.registerName && <Text style={styles.errorText}>{errors.registerName}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDarkMode && { color: '#fff' }]}>Email</Text>
              <TextInput 
                placeholder="name@example.com" 
                style={[
                  styles.input, 
                  errors.registerEmail && styles.inputError,
                  isDarkMode && styles.inputDark
                ]} 
                value={registerEmail} 
                onChangeText={(text) => {
                  setRegisterEmail(text);
                  if (errors.registerEmail) {
                    setErrors(prev => ({ ...prev, registerEmail: '' }));
                  }
                }} 
                keyboardType="email-address" 
                autoCapitalize="none"
                {...(isWeb && { autoComplete: 'email' })}
              />
              {errors.registerEmail && <Text style={styles.errorText}>{errors.registerEmail}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDarkMode && { color: '#fff' }]}>Password</Text>
              <TextInput 
                placeholder="••••••••" 
                secureTextEntry 
                style={[
                  styles.input, 
                  errors.registerPassword && styles.inputError,
                  isDarkMode && styles.inputDark
                ]} 
                value={registerPassword} 
                onChangeText={(text) => {
                  setRegisterPassword(text);
                  if (errors.registerPassword) {
                    setErrors(prev => ({ ...prev, registerPassword: '' }));
                  }
                }}
                {...(isWeb && { autoComplete: 'new-password' })}
              />
              {errors.registerPassword && <Text style={styles.errorText}>{errors.registerPassword}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDarkMode && { color: '#fff' }]}>Select Role</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity 
                  onPress={() => setRole('refugee')} 
                  style={[styles.roleOption, role === 'refugee' && styles.selectedRole]}
                >
                  <Text style={[styles.roleText, role === 'refugee' && styles.selectedRoleText]}>Refugee</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setRole('ngo')} 
                  style={[styles.roleOption, role === 'ngo' && styles.selectedRole]}
                >
                  <Text style={[styles.roleText, role === 'ngo' && styles.selectedRoleText]}>NGO</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleRegister} 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create account</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modal Component */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={hideModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalIcon, { backgroundColor: getModalIconColor() }]}>
              <Text style={styles.modalIconText}>{getModalIcon()}</Text>
            </View>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonSecondary]} 
                onPress={hideModal}
              >
                <Text style={styles.modalButtonSecondaryText}>Close</Text>
              </TouchableOpacity>
              {modalAction && (
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonPrimary]} 
                  onPress={() => {
                    modalAction();
                    hideModal();
                  }}
                >
                  <Text style={styles.modalButtonPrimaryText}>Continue</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
    minHeight: '100%',
    ...(isWeb && {
      minHeight: '100vh',
      maxWidth: 480,
      marginHorizontal: 'auto',
      width: '100%',
      paddingTop: 24,
      paddingLeft: 20,
      paddingRight: 20,
      // Responsive breakpoints
      '@media (max-width: 768px)': {
        maxWidth: '100%',
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 16,
      },
      '@media (min-width: 1200px)': {
        maxWidth: 420,
        paddingTop: 32,
      },
    }),
  },
  contentWrapper: {
    ...(isWeb && {
      maxWidth: 380,
      marginHorizontal: 'auto',
      width: '100%',
      // Responsive adjustments
      '@media (max-width: 768px)': {
        maxWidth: '100%',
        paddingLeft: 0,
        paddingRight: 0,
      },
      '@media (min-width: 1200px)': {
        maxWidth: 360,
      },
    }),
  },
  iconContainer: { 
    alignItems: 'center', 
    marginBottom: isWeb ? 12 : 16 
  },
  iconCircle: { 
    backgroundColor: '#e6f0ff', 
    padding: isWeb ? 8 : 12, 
    borderRadius: 999 
  },
  icon: { 
    width: isWeb ? 24 : 32, 
    height: isWeb ? 24 : 32,
  },
  title: { 
    fontSize: isWeb ? 24 : 24, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: isWeb ? 6 : 8,
    ...(isWeb && {
      '@media (max-width: 768px)': {
        fontSize: 22,
      },
      '@media (min-width: 1200px)': {
        fontSize: 26,
      },
    }),
  },
  subtitle: {
    fontSize: isWeb ? 13 : 12,
    textAlign: 'center',
    color: '#666',
    marginBottom: isWeb ? 20 : 30,
    lineHeight: isWeb ? 18 : 18,
    ...(isWeb && {
      '@media (max-width: 768px)': {
        fontSize: 12,
        lineHeight: 16,
        marginBottom: 16,
      },
      '@media (min-width: 1200px)': {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 24,
      },
    }),
  },
  tabContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginBottom: isWeb ? 16 : 24, 
    backgroundColor: '#f0f0f0', 
    borderRadius: 12,
    ...(isWeb && {
      '@media (max-width: 768px)': {
        marginBottom: 14,
      },
    }),
  },
  tab: { 
    flex: 1, 
    paddingVertical: isWeb ? 10 : 12, 
    alignItems: 'center', 
    borderRadius: 12,
    minHeight: isWeb ? 40 : 44,
    ...(isWeb && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
      },
      '@media (max-width: 768px)': {
        paddingVertical: 10,
        minHeight: 40,
      },
    }),
  },
  activeTabBackground: { 
    backgroundColor: '#e6f0ff' 
  },
  tabText: { 
    fontSize: isWeb ? 14 : 16, 
    color: '#6c757d', 
    fontWeight: '600' 
  },
  activeTabText: { 
    color: '#007bff' 
  },
  label: { 
    marginBottom: isWeb ? 4 : 6, 
    fontWeight: '500', 
    color: '#212529',
    fontSize: isWeb ? 13 : 14
  },
  form: { 
    marginBottom: isWeb ? 20 : 30,
    ...(isWeb && {
      width: '100%',
      '@media (max-width: 768px)': {
        marginBottom: 16,
      },
    }),
  },
  inputGroup: {
    marginBottom: isWeb ? 14 : 16,
    ...(isWeb && {
      '@media (max-width: 768px)': {
        marginBottom: 12,
      },
    }),
  },
  input: { 
    backgroundColor: '#fff', 
    padding: isWeb ? 12 : 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#ced4da', 
    fontSize: isWeb ? 14 : 16,
    minHeight: isWeb ? 40 : 44,
    ...(isWeb && {
      outline: 'none',
      transition: 'all 0.2s ease',
      width: '100%',
      boxSizing: 'border-box',
      '&:focus': {
        borderColor: '#007bff',
        boxShadow: '0 0 0 3px rgba(0, 123, 255, 0.1)',
      },
      '@media (max-width: 768px)': {
        padding: 12,
        minHeight: 40,
      },
    }),
  },
  inputError: {
    borderColor: '#dc3545',
    ...(isWeb && {
      '&:focus': {
        borderColor: '#dc3545',
      },
    }),
  },
  inputDark: {
    backgroundColor: '#2d2d2d',
    borderColor: '#555',
    color: '#fff',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  button: { 
    backgroundColor: '#007bff', 
    padding: isWeb ? 12 : 14, 
    borderRadius: 8, 
    alignItems: 'center',
    minHeight: isWeb ? 44 : 48,
    ...(isWeb && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      width: '100%',
      boxSizing: 'border-box',
      '&:hover': {
        backgroundColor: '#0056b3',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
      },
      '&:active': {
        transform: 'translateY(0)',
      },
      '@media (max-width: 768px)': {
        padding: 12,
        minHeight: 44,
      },
    }),
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
    ...(isWeb && {
      cursor: 'not-allowed',
      '&:hover': {
        backgroundColor: '#6c757d',
      },
    }),
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: isWeb ? 14 : 16 
  },
  roleContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: isWeb ? 8 : 12, 
    gap: isWeb ? 12 : 12,
    ...(isWeb && {
      '@media (max-width: 768px)': {
        gap: 10,
      },
    }),
  },
  roleOption: { 
    flex: 1, 
    padding: isWeb ? 10 : 10, 
    borderWidth: 1, 
    borderColor: '#ced4da', 
    borderRadius: 8, 
    alignItems: 'center',
    minHeight: isWeb ? 40 : 44,
    ...(isWeb && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        borderColor: '#007bff',
        backgroundColor: '#f8f9fa',
        transform: 'translateY(-1px)',
      },
      '@media (max-width: 768px)': {
        padding: 8,
        minHeight: 40,
      },
    }),
  },
  selectedRole: { 
    backgroundColor: '#e6f0ff', 
    borderColor: '#007bff' 
  },
  roleText: { 
    fontSize: isWeb ? 12 : 14, 
    fontWeight: '500' 
  },
  selectedRoleText: {
    color: '#007bff',
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    alignItems: 'center',
  },
  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#007bff',
  },
  modalButtonSecondary: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSecondaryText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
});
