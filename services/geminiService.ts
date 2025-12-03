import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ModelType } from "../types";

// Initialize Gemini Client
// The API key is obtained exclusively from process.env.API_KEY as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Tailors a resume based on the job description using the selected model.
 */
export const tailorResume = async (
  resumeText: string,
  jobDescription: string,
  model: ModelType
): Promise<string> => {
  const prompt = `
    Role: You are an expert ATS (Applicant Tracking System) optimizer and career coach.
    Task: Rewrite the provided resume to perfectly align with the job description. 
    Constraint: Keep the facts true, but highlight relevant skills, keywords, and experiences from the JD.
    Output: Provide the full rewritten resume in clean Markdown format.

    ---
    JOB DESCRIPTION:
    ${jobDescription}

    ---
    ORIGINAL RESUME:
    ${resumeText}
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: "You are a professional resume writer.",
        temperature: 0.3, // Lower temperature for more factual consistency
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
  resumeText: string,
  jobDescription: string,
  model: ModelType
): Promise<Array<{ question: string; answer: string }>> => {
  
  const questionsList = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');

  const prompt = `
    Role: You are a professional job applicant.
    Task: Answer the following job application questions based strictly on my resume and the job context.
    Style: Professional, concise, and persuasive.

    ---
    JOB DESCRIPTION:
    ${jobDescription}

    ---
    MY RESUME:
    ${resumeText}

    ---
    QUESTIONS:
    ${questionsList}
  `;

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
      contents: prompt,
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