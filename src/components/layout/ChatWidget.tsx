"use client";

import { useState, useRef, useEffect } from "react";
import { FiMessageCircle, FiX, FiSend, FiSmile } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { cn } from "@/lib/utils";

const WHATSAPP_URL =
  "https://api.whatsapp.com/send/?phone=5521998792729&text&type=phone_number&app_absent=0";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  time: string;
}

const initialMessages: Message[] = [
  {
    id: "1",
    text: "Olá! 👋 Sou a atendente virtual da C7 Drop. Como posso te ajudar hoje?",
    sender: "bot",
    time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  },
];

const quickReplies = [
  "Rastrear pedido",
  "Trocas e devoluções",
  "Formas de pagamento",
  "Falar com atendente",
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: "user",
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Obrigada pela mensagem! Em breve um atendente irá te responder. Nosso horário de atendimento é de Seg-Sex, 8h às 18h. 😊",
        sender: "bot",
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* WhatsApp Floating Button (above chat) */}
      {!isOpen && (
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Falar no WhatsApp"
          className="fixed z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#1EBE5D] hover:shadow-xl bottom-[10.25rem] right-4 md:bottom-[6.25rem] md:right-8"
        >
          <FaWhatsapp className="h-7 w-7" />
        </a>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl",
          "bottom-24 right-4 md:bottom-8 md:right-8",
          isOpen
            ? "bg-gray-700 text-white"
            : "bg-primary text-white"
        )}
      >
        {isOpen ? (
          <FiX className="h-6 w-6" />
        ) : (
          <FiMessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Pulse ring when closed */}
      {!isOpen && (
        <span className="fixed z-40 h-14 w-14 rounded-full bg-primary/30 animate-ping bottom-24 right-4 md:bottom-8 md:right-8" />
      )}

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed z-50 w-[360px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-border bg-white shadow-2xl animate-fade-in-up bottom-40 right-4 md:bottom-24 md:right-8">
          {/* Header */}
          <div className="bg-primary px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <span className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-playfair)" }}>
                  H
                </span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white">C7drop Atendente</h4>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-white/80">Online agora</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[340px] overflow-y-auto bg-gray-50 px-4 py-4">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      msg.sender === "user"
                        ? "rounded-br-md bg-primary text-white"
                        : "rounded-bl-md bg-white text-gray-800 shadow-sm border border-gray-100"
                    )}
                  >
                    <p>{msg.text}</p>
                    <span
                      className={cn(
                        "mt-1 block text-[10px]",
                        msg.sender === "user" ? "text-white/60" : "text-gray-400"
                      )}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length <= 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => sendMessage(reply)}
                    className="rounded-full border border-primary/20 bg-white px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary hover:text-white"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-gray-100 bg-white px-4 py-3"
          >
            <button type="button" className="shrink-0 text-gray-400 hover:text-gray-600">
              <FiSmile className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-all hover:bg-primary-dark disabled:opacity-40"
            >
              <FiSend className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
