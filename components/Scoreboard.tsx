import React from 'react';
import { motion } from 'framer-motion';
import { PlayerStats } from '../types';

interface ScoreboardProps {
  score: number;
  playerStats: PlayerStats;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ score, playerStats }) => {
  const { level, xp, xpToNextLevel } = playerStats;
  const xpPercentage = xpToNextLevel > 0 ? (xp / xpToNextLevel) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto p-3 bg-brand-white text-brand-black border-4 border-black shadow-hard"
    >
      <div className="flex justify-between items-center text-center gap-4">
        {/* Level */}
        <div className="flex-shrink-0">
          <h2 className="font-display text-xs sm:text-sm tracking-widest text-gray-600">LEVEL</h2>
          <p className="font-display text-3xl sm:text-4xl">{level}</p>
        </div>

        {/* XP Bar & Score */}
        <div className="flex-grow">
            <div className="w-full bg-gray-300 border-2 border-black">
                <motion.div 
                    className="h-4 bg-brand-yellow border-r-2 border-black"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPercentage}%`}}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>
            <div className="text-center mt-1">
                 <p className="font-display text-3xl sm:text-4xl">{score}</p>
                 <h2 className="font-display text-xs sm:text-sm tracking-widest text-gray-600">SCORE</h2>
            </div>
        </div>

      </div>
    </motion.div>
  );
};

export default Scoreboard;