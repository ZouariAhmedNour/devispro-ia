export type ChatMessage = { role: "system" | "user"; content: string };

/** Un client LLM = une fonction. Facile à remplacer par un faux dans les tests. */
export type LlmClient = (
  messages: ChatMessage[],
  jsonSchema: Record<string, unknown>,
) => Promise<string>;

export class LlmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmError";
  }
}

export function createOpenAiCompatibleClient(config: {
  baseUrl: string;
  apiKey: string;
  model: string;
}): LlmClient {
  return async (messages, jsonSchema) => {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0,
        response_format: {
          type: "json_schema",
          json_schema: { name: "quote_draft", strict: true, schema: jsonSchema },
        },
      }),
    });

    if (!response.ok) {
      throw new LlmError(`LLM HTTP ${response.status} : ${await response.text()}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new LlmError("Réponse du LLM vide");
    return content;
  };
}