import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { PRE_VISIT_SUMMARY_PROMPT, POST_VISIT_SUMMARY_PROMPT } from "./prompts";
import type { UrgencyLevel } from "@/types";

// ==============================================
// AI Response Schemas (Zod validation)
// ==============================================

const preVisitSummarySchema = z.object({
  urgency: z.enum(["LOW", "MEDIUM", "HIGH"]),
  chiefComplaint: z.string(),
  suggestedQuestions: z.array(z.string()).length(3),
});

const postVisitSummarySchema = z.object({
  summary: z.string(),
  medications: z.array(z.object({
    name: z.string(),
    instructions: z.string(),
  })),
  followUpSteps: z.array(z.string()),
});

export type PreVisitSummary = z.infer<typeof preVisitSummarySchema>;
export type PostVisitSummary = z.infer<typeof postVisitSummarySchema>;

// ==============================================
// AI Service Interface (swappable provider)
// ==============================================

export interface AIServiceProvider {
  generatePreVisitSummary(input: {
    chiefComplaint: string;
    symptoms: string;
    duration: string;
    severity: string;
    additionalInformation?: string;
  }): Promise<PreVisitSummary | null>;

  generatePostVisitSummary(input: {
    clinicalNotes: string;
    treatmentPlan: string;
    prescriptions: string;
    followUpInstructions: string;
  }): Promise<PostVisitSummary | null>;
}

// ==============================================
// Gemini AI Provider
// ==============================================

class GeminiProvider implements AIServiceProvider {
  private genai: GoogleGenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not set — AI features will be unavailable");
    }
    this.genai = new GoogleGenAI({ apiKey: apiKey || "" });
    this.model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  }

  async generatePreVisitSummary(input: {
    chiefComplaint: string;
    symptoms: string;
    duration: string;
    severity: string;
    additionalInformation?: string;
  }): Promise<PreVisitSummary | null> {
    try {
      const prompt = PRE_VISIT_SUMMARY_PROMPT
        .replace("{chiefComplaint}", input.chiefComplaint)
        .replace("{symptoms}", input.symptoms)
        .replace("{duration}", input.duration || "Not specified")
        .replace("{severity}", input.severity || "Not specified")
        .replace("{additionalInformation}", input.additionalInformation || "None");

      const response = await this.genai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const text = response.text;
      if (!text) return null;

      const parsed = JSON.parse(text);
      const validated = preVisitSummarySchema.safeParse(parsed);

      if (!validated.success) {
        console.error("AI response validation failed:", validated.error);
        return null;
      }

      return validated.data;
    } catch (error) {
      console.error("Gemini pre-visit summary failed:", error);
      return null;
    }
  }

  async generatePostVisitSummary(input: {
    clinicalNotes: string;
    treatmentPlan: string;
    prescriptions: string;
    followUpInstructions: string;
  }): Promise<PostVisitSummary | null> {
    try {
      const prompt = POST_VISIT_SUMMARY_PROMPT
        .replace("{clinicalNotes}", input.clinicalNotes)
        .replace("{treatmentPlan}", input.treatmentPlan || "Not specified")
        .replace("{prescriptions}", input.prescriptions || "None prescribed")
        .replace("{followUpInstructions}", input.followUpInstructions || "None specified");

      const response = await this.genai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const text = response.text;
      if (!text) return null;

      const parsed = JSON.parse(text);
      const validated = postVisitSummarySchema.safeParse(parsed);

      if (!validated.success) {
        console.error("AI response validation failed:", validated.error);
        return null;
      }

      return validated.data;
    } catch (error) {
      console.error("Gemini post-visit summary failed:", error);
      return null;
    }
  }
}

// ==============================================
// Factory — swap providers here
// ==============================================

let _aiService: AIServiceProvider | null = null;

export function getAIService(): AIServiceProvider {
  if (!_aiService) {
    _aiService = new GeminiProvider();
  }
  return _aiService;
}
