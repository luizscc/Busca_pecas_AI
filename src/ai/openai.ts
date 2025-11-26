// src/ai/openai.ts
import type { Env } from "../types";
import { fetchWithTimeout, retry } from "../lib/fetch-utils";

type CallOpenAIJSONParams = {
  system: string;
  user: string;
};

export async function callOpenAIJSON(
  env: Env,
  { system, user }: CallOpenAIJSONParams
): Promise<any> {
  // Validate API key presence without logging sensitive values
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY não está configurada no ambiente.");
  }

  const body = {
    model: "gpt-4.1-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };

  const res = await retry(() => fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  }, 15000));

  if (!res.ok) {
    const txt = await res.text();
    console.error("Erro OpenAI:", res.status, txt);
    throw new Error(`Erro OpenAI: ${res.status}`);
  }

  const data: any = await res.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Resposta da OpenAI veio sem conteúdo.");
  }

  // Em response_format: json_object, o modelo devolve JSON EM STRING
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error("Falha ao fazer JSON.parse na resposta da OpenAI:", content);
    throw e;
  }
}
