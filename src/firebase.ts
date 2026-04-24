import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, getDocFromServer, enableNetwork, disableNetwork, getCountFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase with safety
let app: any;
let authInstance: any;
let dbInstance: any;

try {
  app = initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export const auth = authInstance;
export const db = dbInstance;

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/user.gender.read');

// Error Handling Helper
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  userFriendlyMessage?: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Custom user-friendly messages
  let userFriendlyMessage = "Something went wrong with our records.";
  if (errorMessage.toLowerCase().includes('offline') || errorMessage.toLowerCase().includes('unreachable')) {
    userFriendlyMessage = "No internet connection detected. Please check your connectivity.";
  } else if (errorMessage.toLowerCase().includes('permission-denied')) {
    userFriendlyMessage = "Access denied. Please check your account permissions.";
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    userFriendlyMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };

  console.error(`[Firestore ${operationType.toUpperCase()}] error:`, errInfo);
  
  // We throw a descriptive error so the ErrorBoundary can catch it
  throw new Error(JSON.stringify(errInfo));
}

// Check Connection Status with retry logic
export async function checkConnection(retries = 3, delay = 1000): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      // Try to get a non-existent document from server to check real connectivity
      await getDocFromServer(doc(db, '_internal_', 'health_check'));
      return true;
    } catch (error: any) {
      const message = error?.message || '';
      const code = error?.code || '';
      
      // Permission denied still means we reached the server
      if (
        code === 'permission-denied' || 
        message.includes('permission-denied') || 
        message.includes('Missing or insufficient permissions')
      ) {
        return true;
      }
      
      // If it's the last retry, log and return false
      if (i === retries - 1) {
        console.warn("Firestore connection check failed after retries:", { code, message, error });
        return false;
      }
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

export { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  enableNetwork,
  disableNetwork,
  getCountFromServer,
  getDocFromServer
};
