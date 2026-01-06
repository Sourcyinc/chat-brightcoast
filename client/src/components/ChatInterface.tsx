import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MoreHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import avatarImage from "@assets/generated_images/mr._bright_avatar_no_text.png";

interface Message {
  id: string;
  text: string;
  sender: "agent" | "user";
  timestamp: Date;
}

interface ChatInterfaceProps {
  onClose?: () => void;
}

// Generate a unique chat session ID
const generateChatId = (): string => {
  // Try to use crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
};

// Get or create chat ID from localStorage
const getOrCreateChatId = (): string => {
  const STORAGE_KEY = "brightchat_session_id";
  let chatId = localStorage.getItem(STORAGE_KEY);
  if (!chatId) {
    chatId = generateChatId();
    localStorage.setItem(STORAGE_KEY, chatId);
  }
  return chatId;
};

// Render text with line breaks
const renderTextWithLineBreaks = (text: string) => {
  return text.split('\n').map((line, index, array) => (
    <span key={index}>
      {line}
      {index < array.length - 1 && <br />}
    </span>
  ));
};

export default function ChatInterface({ onClose }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi there! 👋 I'm Mr. Bright, your insurance assistant.",
      sender: "agent",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatIdRef = useRef<string>(getOrCreateChatId());

  // Add second part of welcome message after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: "2",
            text: "I'm here to help you find the right coverage for your needs. To get started, could you tell me a bit about what type of insurance you're looking for today?",
            sender: "agent",
            timestamp: new Date(),
          },
        ]);
      }, 1500);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    const messageText = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      // Get chat ID from localStorage (in case it was cleared, regenerate)
      const chatId = getOrCreateChatId();
      chatIdRef.current = chatId;
      
      // Send to backend API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          sender: "user",
          timestamp: new Date().toISOString(),
          chatId: chatId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      
      setIsTyping(false);
      
      // Add agent response if provided by n8n
      if (data.response || data.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            text: data.response || data.message || "Thanks for your message! Our team will get back to you shortly.",
            sender: "agent",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Sorry, there was an error sending your message. Please try again.",
          sender: "agent",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-full max-w-md md:max-w-lg mx-auto h-[80vh] md:h-[700px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border/50"
    >
      {/* Header */}
      <div className="bg-primary p-4 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={avatarImage}
              alt="Mr. Bright"
              className="w-10 h-10 rounded-full border-2 border-white/20 object-cover bg-white"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-primary rounded-full" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Mr. Bright</h3>
            <p className="text-blue-200 text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Online now
            </p>
          </div>
        </div>
        {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/10">
                <X className="w-5 h-5" />
            </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 bg-gray-50/50 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-2 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {msg.sender === "agent" && (
                  <img
                    src={avatarImage}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full self-end mb-1 border border-gray-200 bg-white object-cover"
                  />
                )}
                <div
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-line ${
                    msg.sender === "user"
                      ? "bg-primary text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start gap-2"
            >
              <img
                src={avatarImage}
                alt="Avatar"
                className="w-8 h-8 rounded-full self-end mb-1 border border-gray-200 bg-white object-cover"
              />
              <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none shadow-sm">
                <div className="flex gap-1">
                  <motion.div
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-border/40">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 bg-gray-50 border-gray-200 focus-visible:ring-primary/20 rounded-full px-4 py-6 shadow-inner"
            data-testid="input-message"
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg shrink-0"
            data-testid="button-send"
            disabled={!inputValue.trim()}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
