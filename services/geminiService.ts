import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ModelType, ResumeInput } from "../types";

// Initialize Gemini Client
// The API key is obtained exclusively from process.env.API_KEY as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Tailors a resume based on the job description using the selected model.
 * Supports both text paste and PDF file upload.
 */
export const tailorResume = async (
  resumeInput: ResumeInput,
  jobDescription: string,
  model: ModelType
): Promise<string> => {
  
  const isFile = resumeInput.type === 'file';

  // Construct the prompt. If file is attached, we reference it.
  const textPrompt = `
    Role: You are an expert ATS (Applicant Tracking System) optimizer and career coach.
    Task: Rewrite the resume to perfectly align with the job description.
    Constraint: Keep the facts true, but highlight relevant skills, keywords, and experiences from the JD.
    Output: Provide the full rewritten resume in clean Markdown format.

    ---
    JOB DESCRIPTION:
    ${jobDescription}

    ---
    ${isFile ? 'RESUME: Use the attached PDF document as the resume source.' : `ORIGINAL RESUME:\n${resumeInput.content}`}
  `;

  const parts: any[] = [{ text: textPrompt }];

  if (isFile && resumeInput.mimeType) {
    parts.unshift({
      inlineData: {
        mimeType: resumeInput.mimeType,
        data: resumeInput.content
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts }, // Pass parts array
      config: {
        systemInstruction: "You are a professional resume writer.",
        temperature: 0.3,
      }
    });

    return response.text || "Failed to generate resume. Please try again.";
  } catch (error) {
    console.error("Gemini Tailor Resume Error:", error);
    throw new Error("Failed to tailor resume via Gemini.");
  }
};

/**
 * Generates structured answers for job application questions.
 */
export const generateAnswers = async (
  questions: string[],
  resumeInput: ResumeInput,
  jobDescription: string,
  model: ModelType
): Promise<Array<{ question: string; answer: string }>> => {
  
  const questionsList = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
  const isFile = resumeInput.type === 'file';

  const textPrompt = `
    Role: You are a professional job applicant.
    Task: Answer the following job application questions based strictly on my resume and the job context.
    Style: Professional, concise, and persuasive.

    ---
    JOB DESCRIPTION:
    ${jobDescription}

    ---
    ${isFile ? 'MY RESUME: Use the attached PDF document.' : `MY RESUME:\n${resumeInput.content}`}

    ---
    QUESTIONS:
    ${questionsList}
  `;

  const parts: any[] = [{ text: textPrompt }];

  if (isFile && resumeInput.mimeType) {
    parts.unshift({
      inlineData: {
        mimeType: resumeInput.mimeType,
        data: resumeInput.content
      }
    });
  }

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        answer: { type: Type.STRING },
      },
      required: ["question", "answer"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.5,
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) return [];
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Answer Generation Error:", error);
    throw new Error("Failed to generate answers.");
  }
};

/**
 * Extract Company Name and Job Title from JD text to organize history.
 */
export const extractJobDetails = async (jdText: string): Promise<{ company: string; title: string }> => {
  const model = ModelType.FLASH; // Use Flash for quick extraction
  
  const prompt = `Extract the 'Company Name' and 'Job Title' from this text. Return JSON.`;
  
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      company: { type: Type.STRING },
      title: { type: Type.STRING },
    },
    required: ["company", "title"],
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `${prompt}\n\nTEXT: ${jdText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    if(!text) return { company: "Unknown Company", title: "Unknown Role" };
    return JSON.parse(text);
  } catch (e) {
    return { company: "Unknown Company", title: "Unknown Role" };
  }
};