import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ModelType, ResumeInput } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Tailors a resume based on the job description.
 * Enforces strict Markdown structure for the PDF renderer.
 */
export const tailorResume = async (
  resumeInput: ResumeInput,
  jobDescription: string,
  model: ModelType
): Promise<string> => {
  
  const isFile = resumeInput.type === 'file';

  const textPrompt = `
    Role: You are an expert Resume Writer and ATS Optimizer.
    Task: Rewrite the provided resume to perfectly match the Job Description (JD).
    
    CRITICAL FORMATTING INSTRUCTIONS (Must Follow):
    1. Start with the Candidate Name as a Heading 1 (# Name).
    2. Use Heading 2 (## Section Name) for sections like "Professional Summary", "Experience", "Skills", "Education".
    3. Use Heading 3 (### Role at Company) for job titles.
    4. Use Bullet points (- ) for all list items.
    5. Do NOT use code blocks. Return raw Markdown.
    6. Ensure the tone is formal, professional, and action-oriented.
    7. Integrate keywords from the JD naturally.
    8. Include a header section with contact info (Email | Phone | Location) in a single line if possible.

    ---
    JOB DESCRIPTION:
    ${jobDescription}

    ---
    ${isFile ? 'SOURCE RESUME: See attached PDF.' : `SOURCE RESUME CONTENT:\n${resumeInput.content}`}
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
      contents: { parts },
      config: {
        systemInstruction: "You are a top-tier career coach. Produce a resume that looks ready to print.",
        temperature: 0.35,
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
    Style: Professional, concise, and persuasive (STAR method where applicable).

    ---
    JOB DESCRIPTION:
    ${jobDescription}

    ---
    ${isFile ? 'MY RESUME: See attached PDF.' : `MY RESUME:\n${resumeInput.content}`}

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

export const extractJobDetails = async (jdText: string): Promise<{ company: string; title: string }> => {
  const model = ModelType.FLASH; 
  
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
