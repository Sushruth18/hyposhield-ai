import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  hover?: boolean;
}

export function GlassCard({ children, className, glow, hover = true }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={cn(
        'glass rounded-2xl p-6',
        glow && 'animate-pulse-glow',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
