import React from 'react';
import { motion } from 'framer-motion';
import { User } from '../types';

interface GameOverScreenProps {
    score: number;
    error: string | null;
    onPlayAgain: () => void;
    user: User | null;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, error, onPlayAgain, user }) => {
    
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="text-center p-8 bg-brand-white text-brand-black border-4 border-black shadow-hard w-full max-w-md mx-auto"
        >
            <h2 className="text-5xl font-display text-brand-black">
              {error ? 'An Error Occurred' : 'Game Over'}
            </h2>
            
            {error ? (
                <p className="mt-4 text-lg text-incorrect font-bold">{error}</p>
            ) : (
                <>
                  <p className="mt-4 text-lg text-gray-700">Your final score is:</p>
                  <p className="font-display text-8xl text-brand-black my-4">{score}</p>
                  {user && score > 0 && <p className="text-gray-600 mb-2">Your score has been submitted to the leaderboard!</p>}
                </>
            )}
            
            <button 
                onClick={onPlayAgain}
                className="mt-8 w-full bg-brand-yellow text-brand-black font-display text-2xl py-3 px-6 border-4 border-black shadow-hard transition-all hover:bg-yellow-400 active:shadow-none active:translate-x-1 active:translate-y-1"
            >
                Play Again
            </button>
        </motion.div>
    );
}

export default GameOverScreen;