import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Authenticates admin user with Firebase Auth email & password.
 */
export const loginAdmin = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Firebase Auth Login Error:', error);
    let errorMessage = 'Invalid email or password. Please try again.';
    
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      errorMessage = 'Invalid admin email or password.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Access blocked due to multiple failed attempts. Please try again later.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network connection failed. Please check your internet connection.';
    }

    throw new Error(errorMessage);
  }
};

/**
 * Logs out current admin user.
 */
export const logoutAdmin = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    throw new Error('Failed to log out. Please try again.');
  }
};

/**
 * Subscribes to Firebase Auth state updates.
 */
export const subscribeToAuth = (callback) => {
  return onAuthStateChanged(auth, callback);
};
