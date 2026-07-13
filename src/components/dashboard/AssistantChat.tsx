"use client";

/**
 * Assistant conversationnel de l'espace client.
 *
 * Petit panneau de discussion qui interroge l'assistant IA (Claude) via
 * `askAssistant`. L'historique est conservé côté composant et renvoyé à chaque
 * question pour garder le contexte de la conversation.
 */
import { useEffect, useRef, useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { askAssistant } from "@/lib/api";

type Msg = { role: "user" | "assistant"; content: string };

/** Composant du panneau assistant (props : `clientId`, `firstName`). */
export default function AssistantChat({
  clientId,
  firstName,
}: {
  clientId: string;
  firstName?: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fait défiler vers le bas à chaque nouveau message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setError("");
    setLoading(true);
    try {
      const { reply } = await askAssistant(clientId, next);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (err: any) {
      setError(err.message || "L'assistant est indisponible.");
    }
    setLoading(false);
  };

  const suggestions = [
    "Quel est mon solde total ?",
    "Comment faire un virement Interac ?",
    "Combien ai-je sur mon épargne ?",
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-brand-950 text-white">
          <Sparkles className="w-5 h-5" strokeWidth={1.75} />
        </span>
        <div>
          <p className="font-semibold text-slate-900">Assistant Libéo</p>
          <p className="text-xs text-slate-400">
            Posez une question sur vos comptes
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="max-h-72 overflow-y-auto space-y-3 mb-4 pr-1"
      >
        {messages.length === 0 && (
          <div className="text-sm text-slate-500">
            <p className="mb-3">
              Bonjour{firstName ? ` ${firstName}` : ""}, comment puis-je vous
              aider ?
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInput(s)}
                  className="text-xs border border-slate-200 rounded-full px-3 py-1.5 text-brand-800 hover:border-brand-300 transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-brand-950 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-500 rounded-2xl px-4 py-2.5 text-sm">
              L'assistant réfléchit…
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg mb-3">
          {error}
        </p>
      )}

      <form onSubmit={send} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écrivez votre question…"
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-600 focus:ring-2 focus:ring-brand-50 outline-none text-sm"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary px-4 py-2.5 disabled:opacity-50"
          aria-label="Envoyer"
        >
          <Send className="w-4 h-4" strokeWidth={2} />
        </button>
      </form>
    </div>
  );
}
