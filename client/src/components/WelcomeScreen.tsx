import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/Blue and Black Minimalist Brand Logo-2_1764297034491.png";
import avatarImage from "@assets/generated_images/mr._bright_avatar_no_text.png";

interface WelcomeScreenProps {
  onStartChat: () => void;
}

export default function WelcomeScreen({ onStartChat }: WelcomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 max-w-2xl mx-auto"
    >
      <motion.img
        src={logoImage}
        alt="BrightCoast Insurance"
        className="w-[40%] h-auto mb-0"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      />
      
      <motion.h1
        className="text-4xl md:text-5xl font-extrabold text-primary mb-8 tracking-tight font-sans"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Get Your Personalized Quote
      </motion.h1>
      
      <motion.div
        className="bg-[#e8f0f8] border border-white/60 rounded-[20px] p-6 shadow-[0_4px_6px_rgba(30,58,95,0.08),0_12px_24px_rgba(30,58,95,0.12),0_24px_48px_rgba(30,58,95,0.08)] max-w-[420px] mx-auto mb-10 space-y-4 text-left"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 flex items-center justify-center shrink-0">
            <MessageCircle className="w-[22px] h-[22px] text-primary stroke-[1.5]" />
          </div>
          <span className="text-base font-medium text-gray-700">Answer a few quick questions</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 flex items-center justify-center shrink-0">
            <Clock className="w-[22px] h-[22px] text-primary stroke-[1.5]" />
          </div>
          <span className="text-base font-medium text-gray-700">
            Takes <span className="underline decoration-accent decoration-2 underline-offset-4 font-semibold text-gray-900">less than 2 minutes</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-11 h-11 flex items-center justify-center shrink-0">
            <Phone className="w-[22px] h-[22px] text-primary stroke-[1.5]" />
          </div>
          <span className="text-base font-medium text-gray-700">Our team follows up with your best options</span>
        </div>
      </motion.div>
      
      <motion.div
        className="relative mb-4 group"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="absolute -inset-1 bg-accent/30 rounded-full blur-md group-hover:bg-accent/50 transition-all duration-500" />
        <img
          src={avatarImage}
          alt="Mr. Bright"
          className="relative w-32 h-32 rounded-full object-cover shadow-[0_0_0_4px_rgba(255,255,255,0.9),0_0_24px_rgba(212,168,75,0.2),0_0_48px_rgba(30,58,95,0.12)]"
        />
        <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-white rounded-full" />
      </motion.div>

      <motion.div
        className="text-[#1e3a5f] font-semibold text-base tracking-[0.5px] mb-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        Mr. Bright
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-sm"
      >
        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all rounded-full group"
          onClick={onStartChat}
          data-testid="button-start-chat"
        >
          Start Conversation
          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
        <p className="text-sm text-muted-foreground/80 mt-4 font-medium">
          Free • No commitment
        </p>
      </motion.div>

      <motion.div
        className="mt-12 flex items-center gap-2 text-sm text-muted-foreground/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <span>Powered by Bright Coast Insurance</span>
      </motion.div>
    </motion.div>
  );
}
