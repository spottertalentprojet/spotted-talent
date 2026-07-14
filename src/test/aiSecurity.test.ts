import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("AI credential isolation", () => {
  it("does not expose the Groq endpoint or key in browser pages", () => {
    const browserCode = [
      readProjectFile("src/pages/EntrepriseDashboard.tsx"),
      readProjectFile("src/pages/TalentDashboard.tsx"),
    ].join("\n");

    expect(browserCode).not.toContain("VITE_GROQ_API_KEY");
    expect(browserCode).not.toContain("api.groq.com");
    expect(browserCode).toContain("requestAiContent");
  });

  it("keeps the provider credential in the authenticated Supabase function", () => {
    const serverCode = readProjectFile("supabase/functions/ai-assistant/index.ts");
    expect(serverCode).toContain('Deno.env.get("GROQ_API_KEY")');
    expect(serverCode).toContain("auth.getUser()");
    expect(serverCode).toContain("ai_usage_events");
  });
});
