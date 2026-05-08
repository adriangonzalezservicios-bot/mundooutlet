import React from 'react';
import { motion } from 'framer-motion';

interface GeometricLoaderProps {
  size?: number;
  className?: string;
  color?: string;
}

export const GeometricLoader: React.FC<GeometricLoaderProps> = ({ 
  size = 40, 
  className = "",
  color = "#38bdf8" 
}) => {
  const isSmall = size < 24;
  
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Outer Hexagon/Ring */}
      <motion.div
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { duration: 3, repeat: Infinity, ease: "linear" },
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute inset-0 border-[1.5px] rounded-lg opacity-20"
        style={{ borderColor: color }}
      />
      
      {/* Middle Square */}
      {!isSmall && (
        <motion.div
          animate={{
            rotate: -360,
            scale: [1, 0.8, 1],
          }}
          transition={{
            rotate: { duration: 2.5, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute w-3/4 h-3/4 border-[1.5px] rounded-sm border-white opacity-40"
        />
      )}

      {/* Inner Diamond */}
      <motion.div
        animate={{
          rotate: 45,
          scale: [0.5, 1.2, 0.5],
          opacity: [0.2, 0.8, 0.2]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute w-1/2 h-1/2"
        style={{ backgroundColor: color, rotate: '45deg', borderRadius: '1px' }}
      />

      {/* Core Star */}
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute w-1 h-1 bg-white rounded-full blur-[0.5px] shadow-[0_0_5px_white]"
      />
      
      {!isSmall && [0, 120, 240].map((angle, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{ backgroundColor: color }}
          animate={{
            rotate: angle + 360,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <div 
            className="absolute" 
            style={{ 
              transform: `translateY(-${size/2}px)`,
              boxShadow: `0 0 3px ${color}`
            }} 
          />
        </motion.div>
      ))}
    </div>
  );
};

export default GeometricLoader;
