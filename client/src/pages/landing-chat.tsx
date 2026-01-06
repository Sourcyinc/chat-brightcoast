import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WelcomeScreen from "@/components/WelcomeScreen";
import ChatInterface from "@/components/ChatInterface";

export default function LandingChat() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#c9ddf0_0%,#f0d9b8_100%)] flex flex-col relative overflow-hidden font-sans">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full">
        <AnimatePresence mode="wait">
          {!isChatOpen ? (
            <WelcomeScreen key="welcome" onStartChat={() => setIsChatOpen(true)} />
          ) : (
            <motion.div
              key="chat"
              className="w-full px-4 py-6 flex items-center justify-center h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ChatInterface />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
