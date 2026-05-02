import { Construction } from "lucide-react";
import { motion } from "motion/react";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  const itemAnim: any = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 70, damping: 15 } }
  };

  return (
    <motion.div 
      initial="hidden" animate="show" variants={itemAnim}
      className="crystal-card border-white/10 rounded-3xl p-12 text-center min-h-[400px] flex flex-col items-center justify-center"
    >
      <div className="w-16 h-16 rounded-3xl bg-[#1E293B] border border-zinc-800 flex items-center justify-center mb-6">
        <Construction className="w-8 h-8 text-[#7BA4BD]/80" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
      <p className="text-sm text-slate-500 max-w-[300px]">
        {description || "Este módulo está actualmente en desarrollo. Estará disponible en la próxima actualización."}
      </p>
    </motion.div>
  );
}
