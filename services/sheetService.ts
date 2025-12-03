import { User, ResumeEntry, AnswerEntry } from "../types";

// ============================================================================
// CONFIGURATION
// ============================================================================

const STORAGE_KEY_URL = 'resumate_script_url';

export const getScriptUrl = () => {
  return localStorage.getItem(STORAGE_KEY_URL) || '';
};

export const setScriptUrl = (url: string) => {
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
};

/**
 * Sends a POST request to the Google Apps Script.
 * We use 'text/plain' as Content-Type to avoid CORS preflight issues with GAS.
 */
async function postToSheet(action: string, payload: any) {
  const scriptUrl = getScriptUrl();

  if (!scriptUrl) {
    console.warn("Google Sheet Sync is disabled. Configure URL in Profile.");
    return mockLocalStorageFallback(action, payload);
  }

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({ action, ...payload }),
    });
    
    // Attempt to parse JSON, but handle if response is not JSON (some GAS errors return HTML)
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn("Received non-JSON response from Sheet:", text);
      return { status: 'success' }; // Assume success if request didn't throw
    }

  } catch (error) {
    console.error("Sheet API Network Error:", error);
    // Fallback so app doesn't crash
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
    // Fallback so app doesn't crash
    return mockLocalStorageFallback('get_history', params);
  }
}

// ============================================================================
// API METHODS
// ============================================================================

export const saveUser = async (user: User, passwordHash?: string): Promise<void> => {
  await postToSheet('save_user', { ...user, password_hash: passwordHash || '' });
};

export const saveResume = async (resume: ResumeEntry): Promise<void> => {
  await postToSheet('save_resume', resume);
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
// FALLBACK MOCK (Used if SCRIPT_URL is empty or Network Fails)
// ============================================================================
const STORAGE_KEYS = {
  USERS: 'resumate_users',
  RESUMES: 'resumate_resumes',
  ANSWERS: 'resumate_answers',
};

async function mockLocalStorageFallback(action: string, data: any) {
  // console.log(`[Offline Mode] Action: ${action}`, data);
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  await delay(300);

  if (action === 'save_user') {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    // Avoid duplicates in local storage
    if (!users.find((u: any) => u.user_id === data.user_id)) {
      users.push(data);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  } 
  else if (action === 'save_resume') {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESUMES) || '[]');
    list.push(data);
    localStorage.setItem(STORAGE_KEYS.RESUMES, JSON.stringify(list));
  } 
  else if (action === 'save_answer') {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANSWERS) || '[]');
    list.push(data);
    localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(list));
  }
  else if (action === 'update_user_model') {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const idx = users.findIndex((u: any) => u.user_id === data.user_id);
    if (idx !== -1) {
      users[idx].model_choice = data.model_choice;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
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