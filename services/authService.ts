import { User, ModelType } from "../types";
import { saveUser, loginUser } from "./sheetService";

const SESSION_KEY = 'resumate_session';
const AUTH_DB_KEY = 'resumate_auth_db'; // Stores email -> { hash, userId }

// Helper to create a consistent ID from email
const generateUserId = (email: string): string => {
  const cleanEmail = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `user_${cleanEmail}`;
};

// Simple hash for demo purposes (In production, use secure hashing libraries)
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

export const login = async (email: string, password: string): Promise<User> => {
  const passwordHash = simpleHash(password);
  const normalizedEmail = email.toLowerCase();
  
  // 1. Try Cloud Database (Google Sheet) FIRST
  // This ensures that even if you switch devices or clear cache, you can login.
  try {
    const response = await loginUser(email, passwordHash);
    
    if (response && response.status === 'success' && response.user) {
      const cloudUser = response.user;
      
      // Sync cloud data to local auth DB so subsequent checks are fast
      const authDb = JSON.parse(localStorage.getItem(AUTH_DB_KEY) || '{}');
      authDb[normalizedEmail] = {
        userId: cloudUser.user_id,
        hash: passwordHash,
        name: cloudUser.name,
        created_at: cloudUser.created_at
      };
      localStorage.setItem(AUTH_DB_KEY, JSON.stringify(authDb));
      
      // Set Session
      localStorage.setItem(SESSION_KEY, JSON.stringify(cloudUser));
      
      return cloudUser;
    } 
    // If specifically user not found or password incorrect, we might check local as backup
    // (e.g. if internet is down), but generally cloud is truth.
  } catch (err: any) {
    console.warn("Cloud login failed, attempting local fallback...", err);
  }

  // 2. Fallback to Local Storage 
  // Useful if offline or if cloud connection temporarily fails but user saved locally previously.
  const authDb = JSON.parse(localStorage.getItem(AUTH_DB_KEY) || '{}');
  const storedCreds = authDb[normalizedEmail];

  if (storedCreds && storedCreds.hash === passwordHash) {
    const user: User = {
      user_id: storedCreds.userId,
      email,
      name: storedCreds.name || email.split('@')[0], 
      model_choice: ModelType.FLASH,
      created_at: storedCreds.created_at || new Date().toISOString(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }

  throw new Error("Login failed. Please check your credentials.");
};

export const signup = async (email: string, name: string, password: string): Promise<User> => {
  const normalizedEmail = email.toLowerCase();
  const userId = generateUserId(email);
  const passwordHash = simpleHash(password);

  const newUser: User = {
    user_id: userId,
    email,
    name,
    model_choice: ModelType.FLASH,
    created_at: new Date().toISOString(),
  };

  // 1. Save to Google Sheet (Cloud)
  try {
    const response = await saveUser(newUser, passwordHash);
    if (response.status !== 'success' && response.message !== 'User exists') {
      console.warn("Cloud save warning:", response.message);
    }
  } catch(err) {
    console.error("Failed to save user to cloud", err);
    // We continue to local save so the user isn't blocked, 
    // but they might have issues logging in from another device.
  }

  // 2. Store credentials locally
  const authDb = JSON.parse(localStorage.getItem(AUTH_DB_KEY) || '{}');
  authDb[normalizedEmail] = {
    userId,
    hash: passwordHash,
    name,
    created_at: newUser.created_at
  };
  localStorage.setItem(AUTH_DB_KEY, JSON.stringify(authDb));
  
  // 3. Set Session
  localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
  return newUser;
};

export const logout = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(SESSION_KEY);
  return stored ? JSON.parse(stored) : null;
};