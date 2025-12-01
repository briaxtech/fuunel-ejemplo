import { AIAnalysisResult, UserProfile } from "../types";

const WEBHOOK_URL =
  (import.meta as any).env?.VITE_N8N_WEBHOOK_URL ||
  (typeof process !== "undefined" ? process.env.N8N_WEBHOOK_URL : undefined);

export interface WebhookPayload {
  profile: UserProfile;
  analysis: AIAnalysisResult;
  contact: {
    email: string;
    phone?: string;
  };
  action: string;
  timestamp: string;
}

export const sendToWebhook = async (payload: WebhookPayload) => {
  if (!WEBHOOK_URL) {
    throw new Error("Falta configurar VITE_N8N_WEBHOOK_URL con la URL del webhook de n8n.");
  }

  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`n8n webhook devolvió estado ${response.status}: ${text || "sin cuerpo"}`);
  }
};
