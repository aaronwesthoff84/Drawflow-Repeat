import { Router } from "express";

const router = Router();

// POST /ai/proxy — forward chat completion to provider
router.post("/ai/proxy", async (req, res) => {
  const {
    provider,
    model,
    messages,
    apiKey,
    ollamaUrl = "http://localhost:11434",
  } = req.body as {
    provider: "ollama" | "openai" | "anthropic";
    model: string;
    messages: Array<{ role: string; content: string }>;
    apiKey?: string;
    ollamaUrl?: string;
  };

  try {
    let url: string;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    let body: unknown;

    if (provider === "ollama") {
      url = `${ollamaUrl}/api/chat`;
      body = { model, messages, stream: false };

    } else if (provider === "openai") {
      url = "https://api.openai.com/v1/chat/completions";
      headers["Authorization"] = `Bearer ${apiKey}`;
      body = { model, messages, stream: false };

    } else if (provider === "anthropic") {
      url = "https://api.anthropic.com/v1/messages";
      headers["x-api-key"] = apiKey ?? "";
      headers["anthropic-version"] = "2023-06-01";
      const systemMsg = messages.find((m) => m.role === "system");
      const chatMessages = messages.filter((m) => m.role !== "system");
      body = {
        model,
        max_tokens: 4096,
        ...(systemMsg ? { system: systemMsg.content } : {}),
        messages: chatMessages,
      };

    } else {
      res.status(400).json({ error: "Unknown provider" });
      return;
    }

    const upstream = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      res.status(upstream.status).json({ error: text });
      return;
    }

    const data = await upstream.json() as Record<string, unknown>;

    let content = "";
    if (provider === "ollama") {
      const msg = data["message"] as Record<string, string> | undefined;
      content = msg?.["content"] ?? (data["response"] as string) ?? "";
    } else if (provider === "openai") {
      const choices = data["choices"] as Array<{ message: { content: string } }>;
      content = choices?.[0]?.message?.content ?? "";
    } else if (provider === "anthropic") {
      const parts = data["content"] as Array<{ text: string }>;
      content = parts?.[0]?.text ?? "";
    }

    res.json({ content });
  } catch (err: unknown) {
    req.log.error({ err }, "AI proxy error");
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// GET /ai/models?provider=&ollamaUrl=&apiKey=
router.get("/ai/models", async (req, res) => {
  const { provider, ollamaUrl = "http://localhost:11434", apiKey } =
    req.query as Record<string, string>;

  try {
    if (provider === "ollama") {
      const r = await fetch(`${ollamaUrl}/api/tags`);
      if (!r.ok) throw new Error("Ollama not reachable");
      const data = await r.json() as { models?: Array<{ name: string }> };
      const models = data.models?.map((m) => m.name).sort() ?? [];
      res.json({ models });
      return;
    }

    if (provider === "openai") {
      const r = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!r.ok) throw new Error("OpenAI API error");
      const data = await r.json() as { data?: Array<{ id: string }> };
      const models = (data.data ?? [])
        .map((m) => m.id)
        .filter((id) => /^(gpt-|o1|o3|o4)/.test(id))
        .sort();
      res.json({ models });
      return;
    }

    if (provider === "anthropic") {
      res.json({
        models: [
          "claude-opus-4-5",
          "claude-sonnet-4-5",
          "claude-haiku-4-5",
          "claude-3-5-sonnet-20241022",
          "claude-3-5-haiku-20241022",
          "claude-3-opus-20240229",
          "claude-3-sonnet-20240229",
          "claude-3-haiku-20240307",
        ],
      });
      return;
    }

    res.status(400).json({ error: "Unknown provider" });
  } catch (err: unknown) {
    req.log.error({ err }, "Models fetch error");
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// POST /ai/pull — stream an Ollama model download
router.post("/ai/pull", async (req, res) => {
  const { model, ollamaUrl = "http://localhost:11434" } = req.body as {
    model: string;
    ollamaUrl?: string;
  };

  try {
    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Transfer-Encoding", "chunked");

    const upstream = await fetch(`${ollamaUrl}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: model, stream: true }),
    });

    if (!upstream.ok || !upstream.body) {
      res.status(500).json({ error: "Pull failed" });
      return;
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value));
    }
    res.end();
  } catch (err: unknown) {
    req.log.error({ err }, "Ollama pull error");
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});

export default router;
