import { User, ResumeEntry, AnswerEntry } from "../types";

// ============================================================================
// CONFIGURATION
// ============================================================================

// HARDCODED SYSTEM URL - Automatically connects the DB
// Updated to the latest URL provided by the user.
const SYSTEM_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzzbAh9jwMdrfQmUBEc1DXT4tVfoPgqWLKrnhOQv_FUMJaN1rMLEHKBMyr0Vxa02QpY/exec";
                          
const STORAGE_KEY_URL = 'resumate_script_url';

export const getScriptUrl = () => {
  // Always prioritize the hardcoded system URL
  if (SYSTEM_SCRIPT_URL) return SYSTEM_SCRIPT_URL;
  return localStorage.getItem(STORAGE_KEY_URL) || '';
};

export const setScriptUrl = (url: string) => {
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
};

export const isUsingSystemUrl = () => {
  return !!SYSTEM_SCRIPT_URL;
};

/**
 * Sends a POST request to the Google Apps Script.
 */
async function postToSheet(action: string, payload: any) {
  const scriptUrl = getScriptUrl();

  if (!scriptUrl) {
    console.warn("Google Sheet Sync is disabled. Configure URL in Profile.");
    return mockLocalStorageFallback(action, payload);
  }

  try {
    // We use text/plain to avoid CORS preflight issues with Google Apps Script
    const response = await fetch(scriptUrl, {
      method: 'POST',
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({ action, ...payload }),
    });
    
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn("Received non-JSON response from Sheet:", text);
      return { status: 'error', message: 'Invalid server response' }; 
    }

  } catch (error) {
    console.error("Sheet API Network Error:", error);
    return mockLocalStorageFallback(action, payload);
  }
}

/**
 * Sends a GET request to the Google Apps Script.
 */
async function getFromSheet(action: string, params: Record<string, string>) {
  const scriptUrl = getScriptUrl();

  if (!scriptUrl) {
    return mockLocalStorageFallback('get_history', params);
  }

  const query = new URLSearchParams({ action, ...params }).toString();
  try {
    const response = await fetch(`${scriptUrl}?${query}`, {
        method: "GET",
        redirect: "follow"
    });
    return await response.json();
  } catch (error) {
    console.error("Sheet API Error:", error);
    return mockLocalStorageFallback('get_history', params);
  }
}

// ============================================================================
// API METHODS
// ============================================================================

export const saveUser = async (user: User, passwordHash?: string): Promise<any> => {
  return await postToSheet('save_user', { ...user, password_hash: passwordHash || '' });
};

// Verifies user credentials against the Google Sheet
export const loginUser = async (email: string, passwordHash: string): Promise<any> => {
  // This matches the 'login_user' action in your Apps Script
  return await postToSheet('login_user', { email, password_hash: passwordHash });
};

export const saveResume = async (resume: ResumeEntry, fileData?: { base64: string, mimeType: string, name: string }): Promise<any> => {
  // Returns the response so we can check for upload errors
  return await postToSheet('save_resume', { ...resume, fileData });
};

export const saveAnswer = async (answer: AnswerEntry): Promise<void> => {
  await postToSheet('save_answer', answer);
};

export const updateUserModel = async (userId: string, model: string): Promise<void> => {
  await postToSheet('update_user_model', { user_id: userId, model_choice: model });
};

export const getHistory = async (userId: string): Promise<{ resumes: ResumeEntry[], answers: AnswerEntry[] }> => {
  return await getFromSheet('get_history', { user_id: userId });
};


// ============================================================================
// FALLBACK MOCK (Offline Mode)
// ============================================================================
const STORAGE_KEYS = {
  USERS: 'resumate_users',
  RESUMES: 'resumate_resumes',
  ANSWERS: 'resumate_answers',
};

async function mockLocalStorageFallback(action: string, data: any) {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  await delay(300);

  if (action === 'save_user') {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    if (!users.find((u: any) => u.user_id === data.user_id)) {
      users.push(data);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    return { status: 'success' };
  } 
  // login_user mock
  else if (action === 'login_user') {
    return { status: 'error', message: 'Offline login not supported in fallback. Please use Cloud Mode.' };
  }
  else if (action === 'save_resume') {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESUMES) || '[]');
    list.push(data);
    localStorage.setItem(STORAGE_KEYS.RESUMES, JSON.stringify(list));
    return { status: 'success' };
  } 
  else if (action === 'save_answer') {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANSWERS) || '[]');
    list.push(data);
    localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(list));
    return { status: 'success' };
  }
  else if (action === 'update_user_model') {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const idx = users.findIndex((u: any) => u.user_id === data.user_id);
    if (idx !== -1) {
      users[idx].model_choice = data.model_choice;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    return { status: 'success' };
  }
  else if (action === 'get_history') {
    const allResumes = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESUMES) || '[]');
    const allAnswers = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANSWERS) || '[]');
    return {
      resumes: allResumes.filter((r: any) => r.user_id === data.user_id).reverse(),
      answers: allAnswers.filter((a: any) => a.user_id === data.user_id).reverse(),
    };
  }
  return { status: 'offline_success' };
}