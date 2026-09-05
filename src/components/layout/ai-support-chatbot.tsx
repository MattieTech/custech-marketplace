'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, X, Send, MessageSquare, 
  HelpCircle, ShieldCheck, ChevronDown, RotateCcw, ExternalLink
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: string;
}

export function AiSupportChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am your CUSTECH Campus AI Assistant. How can I help you with buying, selling, student verification, hostel accommodation, or campus trade safety today?',
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  // Listen for global custom event to trigger AI support from banners
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-ai-support', handleOpen);
    return () => window.removeEventListener('open-ai-support', handleOpen);
  }, []);

  const quickPrompts = [
    'How do I buy & sell safely on campus?',
    'How does student ID verification work?',
    'What are the official safe meeting zones?',
    'How do I spot fake bank alert scams?',
  ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });

      const data = await res.json();
      const replyText = data.reply || 'I am ready to help! Please ensure you only trade in public, daylight campus safe zones.';

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: 'CUSTECH AI Assistant is temporarily optimizing its connection. Remember: Never pay for items or hostels in advance before physical inspection!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        text: 'Conversation reset. What campus marketplace question can I answer for you?',
        timestamp: 'Just now',
      },
    ]);
  };

  return (
    <>
      {/* Floating Pill Trigger Button - Matches exact user screenshot sample */}
      <aside 
        aria-label="AI Customer Support Assistance"
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="group flex items-center gap-2.5 bg-[#032b1b] hover:bg-[#064e3b] text-white px-5 py-2.5 rounded-full shadow-2xl hover:shadow-emerald-950/50 transition-all duration-300 font-bold text-xs sm:text-sm border border-emerald-600/40 active:scale-95 select-none"
          aria-label="Open CUSTECH AI Customer Support"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="tracking-wide">Help</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </aside>

      {/* Floating Interactive Chatbot Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-50 w-[92vw] sm:w-96 max-w-sm h-[530px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
          >
            {/* Chatbot Header */}
            <div className="bg-[#032b1b] text-white px-4 py-3.5 flex items-center justify-between shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-center gap-2.5 z-10">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#032b1b]" />
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs sm:text-sm font-bold leading-none">CUSTECH AI Helpdesk</h3>
                    <span className="bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase">
                      Gemini
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80 leading-none">
                    Instant Campus Trade & Safety Answers
                  </p>
                </div>
              </div>

              {/* Action Buttons: Reset & Close */}
              <div className="flex items-center gap-1 z-10">
                <button
                  type="button"
                  onClick={resetChat}
                  title="Reset conversation"
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                  aria-label="Reset chat"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close support"
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="bg-emerald-50/70 border-b border-emerald-100/80 px-3 py-2 overflow-x-auto scrollbar-none flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-emerald-900 shrink-0 uppercase tracking-wider">
                Quick:
              </span>
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading}
                  className="shrink-0 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-2xs transition-colors truncate max-w-[200px]"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Thread Messages */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-gray-50/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                      msg.role === 'user'
                        ? 'bg-emerald-700 text-white rounded-tr-none font-medium'
                        : 'bg-white text-gray-800 border border-gray-200/80 rounded-tl-none font-normal'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <span className="text-[9.5px] text-gray-400 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex items-center gap-2 text-emerald-700 bg-white border border-emerald-100 px-3 py-2 rounded-2xl rounded-tl-none w-fit shadow-2xs">
                  <Bot className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
                  <span className="text-xs font-semibold text-gray-500">
                    CUSTECH AI is thinking...
                  </span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Human Support Escalation Link */}
            <div className="bg-emerald-50/50 border-t border-gray-100 px-3 py-1.5 flex items-center justify-between text-[11px] text-gray-600">
              <span className="font-medium text-emerald-950">Need human officer?</span>
              <a
                href="https://wa.me/2348000000000?text=Hello%20CUSTECH%20Support%2C%20I%20need%20human%20assistance"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
              >
                <span>WhatsApp Support</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Input Bar */}
            <div className="p-2.5 bg-white border-t border-gray-200 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about safety, verified badges, hostels..."
                disabled={isLoading}
                className="flex-1 text-xs sm:text-sm bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="w-9 h-9 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white flex items-center justify-center transition-all shadow-xs shrink-0"
                aria-label="Send message to AI support"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
