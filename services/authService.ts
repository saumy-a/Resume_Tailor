import { User, ModelType } from "../types";
import { saveUser } from "./sheetService";

const SESSION_KEY = 'resumate_session';
const AUTH_DB_KEY = 'resumate_auth_db'; // Stores email -> { hash, userId }

// Helper to create a consistent ID from email
const generateUserId = (email: string): string => {
  const cleanEmail = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `user_${cleanEmail}`;
};

// Simple hash for demo purposes (In production, never roll your own crypto)
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
  const authDb = JSON.parse(localStorage.getItem(AUTH_DB_KEY) || '{}');
  const storedCreds = authDb[email.toLowerCase()];

  // Check if user exists and password matches
  if (!storedCreds) {
    throw new Error("User not found. Please sign up.");
  }

  const passwordHash = simpleHash(password);
  if (storedCreds.hash !== passwordHash) {
    throw new Error("Invalid password.");
  }

  // Generate User Object
  const user: User = {
    user_id: storedCreds.userId,
    email,
    name: storedCreds.name || email.split('@')[0], 
    model_choice: ModelType.FLASH,
    created_at: storedCreds.created_at || new Date().toISOString(),
  };
  
  // Try to sync with sheet in background
  saveUser(user, passwordHash).catch(err => console.error("Background sync failed on login", err));

  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
};

export const signup = async (email: string, name: string, password: string): Promise<User> => {
  const authDb = JSON.parse(localStorage.getItem(AUTH_DB_KEY) || '{}');
  const normalizedEmail = email.toLowerCase();
  
  if (authDb[normalizedEmail]) {
    throw new Error("User already exists. Please log in.");
  }

  const userId = generateUserId(email);
  const passwordHash = simpleHash(password);

  const newUser: User = {
    user_id: userId,
    email,
    name,
    model_choice: ModelType.FLASH,
    created_at: new Date().toISOString(),
  };

  // Store credentials locally
  authDb[normalizedEmail] = {
    userId,
    hash: passwordHash,
    name,
    created_at: newUser.created_at
  };
  localStorage.setItem(AUTH_DB_KEY, JSON.stringify(authDb));

  // Save to Google Sheet (including password hash)
  await saveUser(newUser, passwordHash);
  
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