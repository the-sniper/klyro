import { describe, expect, it } from "vitest";
import { getSystemPrompt, REWRITE_SYSTEM_PROMPT } from "./rag";

describe("REWRITE_SYSTEM_PROMPT", () => {
  it("keeps questions aimed at the chatbot from being rewritten about the owner", () => {
    expect(REWRITE_SYSTEM_PROMPT).toMatch(/addressing the chatbot itself/i);
    expect(REWRITE_SYSTEM_PROMPT).toMatch(/NOT the website owner/);
  });

  it("still resolves 'you' to the owner by default", () => {
    expect(REWRITE_SYSTEM_PROMPT).toMatch(/they almost always mean the WEBSITE OWNER/);
  });
});

describe("getSystemPrompt", () => {
  it("forbids disclosing the technology behind the chat itself", () => {
    const prompt = getSystemPrompt({ ownerName: "Ada" });

    expect(prompt).toContain("CONFIDENTIALITY ABOUT THIS ASSISTANT");
    expect(prompt).toMatch(/model, provider, vendor/i);
    // The knowledge base may describe the widget as one of the owner's
    // projects, so the rule has to outrank retrieved context.
    expect(prompt).toMatch(/even if .*knowledge base/i);
  });

  it("keeps the assistant honest about being an AI", () => {
    const prompt = getSystemPrompt({ ownerName: "Ada" });

    expect(prompt).toContain("Yes, I'm an AI assistant for Ada");
    expect(prompt).toMatch(/never claim to be human/i);
  });

  it("defaults to speaking as the owner in first person", () => {
    const prompt = getSystemPrompt({ ownerName: "Ada" });

    expect(prompt).toContain("OWNER VOICE (default)");
    expect(prompt).toMatch(/"I" means Ada/);
  });

  it("switches to the assistant's own voice for questions about the chatbot", () => {
    const prompt = getSystemPrompt({ ownerName: "Ada" });

    expect(prompt).toContain("ASSISTANT VOICE");
    expect(prompt).toMatch(/"I" means you, the assistant/);
    expect(prompt).toMatch(/refer to Ada by name/i);
  });

  it("answers name and identity questions in assistant voice, naming the owner", () => {
    const prompt = getSystemPrompt({ ownerName: "Ada" });

    expect(prompt).toMatch(/NAME AND IDENTITY QUESTIONS/);
    expect(prompt).toMatch(/I'm Ada's AI assistant/);
  });

  it("forbids blending the two speakers in one response", () => {
    const prompt = getSystemPrompt({ ownerName: "Ada" });

    expect(prompt).toMatch(/never let "I" mean both/i);
    // The old wording is what produced "I run on Klyro, the copilot I built".
    expect(prompt).not.toContain("interchangeably");
  });

  it("never names the actual model ids in the prompt", () => {
    const prompt = getSystemPrompt({ ownerName: "Ada" });

    expect(prompt).not.toMatch(/gpt-4o|text-embedding/i);
  });

  it("applies the rule without a persona", () => {
    expect(getSystemPrompt()).toContain("CONFIDENTIALITY ABOUT THIS ASSISTANT");
  });
});
