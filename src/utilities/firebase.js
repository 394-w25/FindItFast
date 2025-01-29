import { initializeApp } from "firebase/app";

import {getDatabase,  onValue, ref, update, get,set} from "firebase/database"
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useCallback, useState, useEffect } from "react";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// https://firebase.google.com/docs/web/setup#available-libraries

// const firebaseConfig = {
//   apiKey: "AIzaSyDKsTRg9qfBah9ouYe5zNaiK2ZUU9t5dhY",
//   authDomain: "finditfast-c1f12.firebaseapp.com",
//   projectId: "finditfast-c1f12",
//   storageBucket: "finditfast-c1f12.firebasestorage.app",
//   messagingSenderId: "229477505258",
//   appId: "1:229477505258:web:7f33f6ff95f26c91b6df93",
//   measurementId: "G-SDYSN563FJ"
// };

const firebaseConfig = {
  apiKey: "AIzaSyDKsTRg9qfBah9ouYe5zNaiK2ZUU9t5dhY",
  authDomain: "finditfast-c1f12.firebaseapp.com",
  databaseURL: "https://finditfast-c1f12-default-rtdb.firebaseio.com",
  projectId: "finditfast-c1f12",
  storageBucket: "finditfast-c1f12.firebasestorage.app",
  messagingSenderId: "229477505258",
  appId: "1:229477505258:web:e3e12d6b27d3f34eb6df93",
  measurementId: "G-J4J0P6L5LN"
};

// Initialize Firebase
const firebase = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(firebase);  // Authentication
const database = getDatabase(firebase); // Realtime Database
const storage = getStorage(firebase);  // Storage

// Export services for use in other files
export { auth, database, storage };

// export const signInWithGoogle = async() => {
//   const result = await signInWithPopup(auth, new GoogleAuthProvider());
//   return result;
// };

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if the email is from Northwestern
    const emailDomain = user.email.split('@')[1];
    if (
      emailDomain !== 'northwestern.edu' &&
      emailDomain !== 'u.northwestern.edu'
    ) {
      throw new Error('Please use a Northwestern University email to sign in.');
    }

    // Continue with the authenticated user
    return user;
  } catch (error) {
    console.error('Google sign-in failed:', error.message);
    throw error;
  }
};

export const signOut = () => firebaseSignOut(auth);

export const getRef = async (path) => {
const snapshot = await get(ref(database, path));
return snapshot.exists();
};

/// User email-password login/signup function
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error during user login:", error.message);
    throw error;
  }
};

export const signUpWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error during user sign-up:", error.message);
    throw error;
  }
};

export const useAuthState = () => {
  const [user, setUser] = useState();
  useEffect(() => (
      onAuthStateChanged(auth, setUser)
  ), []);

  return [user];
};

export const useDbData = (path) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!path) {
      // Reset state when path is invalid or null
      setData(null);
      setError(null);
      return;
    }

    const dbRef = ref(database, path);
    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        setData(snapshot.val());
      },
      (err) => {
        setError(err);
      }
    );

    return () => unsubscribe(); // Cleanup listener on unmount or path change
  }, [path]);

  return [data, error];
};

const makeResult = (error) => {
  const timestamp = Date.now();
  const message = error?.message || `Updated: ${new Date(timestamp).toLocaleString()}`;
  return { timestamp, error, message };
};

export const useDbAdd = (path) => {
  const [result, setResult] = useState(null);


  const add = async (data, key) => {
    try {
      const newRef = ref(database, `${path}/${key}`); 
      await set(newRef, data); 
      setResult({ message: 'Request added successfully!', error: false });
    } catch (error) {
      setResult({ message: error.message, error: true });
    }
  };

  return [add, result];
};

export const useDbUpdate = (path) => {
  const [result, setResult] = useState();
  const updateData = useCallback(async (value) => {
      // console.log('Updating path:', path);
      // console.log('Value before update:', value);

      if (!value || typeof value !== 'object') {
          console.error("Invalid value passed to updateData:", value);
          return;
      }

      const dbRef = ref(database, path);
      update(dbRef, value)
          .then(() => setResult(makeResult()))
          .catch((error) => {
              console.error("Error during Firebase update:", error);
              setResult(makeResult(error));
          });
  }, [path]);

  return [updateData, result];
};

// Upload image to Firebase Storage and return the image URL
export const uploadImage = async (imageFile) => {
  try {
    const imageRef = storageRef(storage, `images/${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    const imageUrl = await getDownloadURL(imageRef);
    return imageUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};



