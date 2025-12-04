export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
}

export interface User {
  user_id: string;
  email: string;
  name: string;
  model_choice: ModelType;
  created_at: string;
}

export interface ResumeInput {
  type: 'text' | 'file';
  content: string; // The text content OR the Base64 string of the file
  mimeType?: string; // e.g., 'application/pdf'
  fileName?: string;
}

export interface ResumeEntry {
  resume_id: string;
  user_id: string;
  job_id: string;
  original_resume_link: string; // Renamed from content to link to match DB
  updated_resume_content: string;
  company_name: string;
  job_title: string;
  date: string;
}

export interface AnswerEntry {
  answer_id: string;
  user_id: string;
  job_id: string;
  question_text: string;
  answer_text: string;
  date: string;
}

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface JobContext {
  jobDescription: string;
  baseResume: string;
  companyName?: string;
  jobTitle?: string;
}