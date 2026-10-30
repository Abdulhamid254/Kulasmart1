import { generateChatCompletion } from "@lovable.dev/ai-gateway";

export async function askJson<T>(system: string, user: string): Promise<T> {
  const res = await generateChatCompletion({
    model: "openai/gpt-6-astra",
    messages: [
      { role: "system", content: `${system}\nReturn JSON only.` },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  });
  const content = res.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("AI returned no content");
  return JSON.parse(content) as T;
}
