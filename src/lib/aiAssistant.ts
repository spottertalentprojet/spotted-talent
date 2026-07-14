import { supabase } from "@/integrations/supabase/client";

export type AiAssistantTask =
  | "generate_offer"
  | "generate_bio"
  | "analyze_cv"
  | "cover_letter";

export const requestAiContent = async (
  task: AiAssistantTask,
  payload: Record<string, unknown>,
) => {
  const { data, error } = await supabase.functions.invoke("ai-assistant", {
    body: { task, payload },
  });

  if (error) {
    throw new Error("ai_service_unavailable");
  }

  if (!data?.content || typeof data.content !== "string") {
    throw new Error(typeof data?.error === "string" ? data.error : "ai_response_invalid");
  }

  return data.content.trim();
};
