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
    const context = (error as { context?: unknown }).context;

    if (context instanceof Response) {
      try {
        const errorBody = await context.clone().json();
        if (typeof errorBody?.error === "string") {
          throw new Error(errorBody.error);
        }
      } catch (readError) {
        if (readError instanceof Error && readError.message) {
          throw readError;
        }
      }
    }

    throw new Error("ai_service_unavailable");
  }

  if (!data?.content || typeof data.content !== "string") {
    throw new Error(typeof data?.error === "string" ? data.error : "ai_response_invalid");
  }

  return data.content.trim();
};
