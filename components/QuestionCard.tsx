/// <reference types="react" />
import React from 'react';
import { TriviaQuestion } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import type { JSX } from 'react';

interface QuestionCardProps {
  question: TriviaQuestion;
  onAnswer: (answer: string) => void;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  questionNumber: number;
  timeLeft: number;
  timeLimit: number;
  displayOptions: string[];
  userId?: string;
  answerId?: string;
  averageRating?: number;
  userRating?: number;
  onRateAnswer?: (rating: number) => void;
  ratingSubmitted?: boolean;
}

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
);

const XIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
);

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onAnswer, selectedAnswer, isCorrect, questionNumber, timeLeft, timeLimit, displayOptions, userId, answerId, averageRating, userRating, onRateAnswer, ratingSubmitted }: QuestionCardProps) => {

  const getButtonClass = (option: string) => {
    let baseClass = "w-full text-left p-4 border-4 border-black shadow-hard text-black text-base md:text-lg font-bold transition-all duration-100 flex justify-between items-center";
    
    if (selectedAnswer === null) {
      return `${baseClass} bg-brand-yellow hover:bg-yellow-400 active:shadow-none active:translate-x-1 active:translate-y-1`;
    }
    
    if (option === question.answer) {
      return `${baseClass} bg-correct scale-105`;
    }
    
    if (option === selectedAnswer && !isCorrect) {
      return `${baseClass} bg-incorrect`;
    }

    return `${baseClass} bg-gray-500 text-gray-800 opacity-60 cursor-not-allowed`;
  };

  const getButtonIcon = (option: string) => {
    if (selectedAnswer === null) return null;
    if (option === question.answer) return <CheckIcon />;
    if (option === selectedAnswer && !isCorrect) return <XIcon />;
    return null;
  };

  const timerPercentage = (timeLeft / timeLimit) * 100;

  const [localRating, setLocalRating] = React.useState<number | null>(userRating ?? null);
  const [hasRated, setHasRated] = React.useState<boolean>(!!userRating);

  React.useEffect(() => {
    setHasRated(!!userRating);
    setLocalRating(userRating ?? null);
  }, [userRating]);

  const handleRate = (rating: number) => {
    setLocalRating(rating);
    setHasRated(true);
    if (onRateAnswer) onRateAnswer(rating);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={questionNumber}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="w-full max-w-2xl mx-auto p-6 md:p-8 bg-brand-white text-brand-black border-4 border-black shadow-hard"
      >
        <div className="relative mb-4 h-3 w-full bg-gray-300 border-2 border-black">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-brand-magenta"
              style={{ width: `${timerPercentage}%`}}
              animate={{ width: `${timerPercentage}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
        </div>
        <h2 className="text-xl md:text-2xl font-bold mb-6 text-center leading-tight">
          {question.question}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayOptions.map((option) => (
            <motion.button
              key={option}
              onClick={() => onAnswer(option)}
              disabled={selectedAnswer !== null}
              className={getButtonClass(option)}
              whileHover={selectedAnswer === null ? { x: -4, y: -4, boxShadow: '8px 8px 0px #000000' } : {}}
              whileTap={selectedAnswer === null ? { x: 0, y: 0, boxShadow: '4px 4px 0px #000000' } : {}}
            >
              <span>{option}</span>
              <AnimatePresence>
                {getButtonIcon(option) && (
                   <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                   >
                     {getButtonIcon(option)}
                   </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      </motion.div>
      {/* Rating UI */}
      {selectedAnswer && (
        <div className="mt-6 text-center">
          <div className="mb-2 font-bold text-lg">How useful was this answer?</div>
          <div className="flex justify-center gap-1 mb-2">
            {[...Array(10)].map((_, i) => (
              <button
                key={i+1}
                className={`w-8 h-8 rounded-full border-2 border-black font-bold transition-all ${localRating === i+1 ? 'bg-brand-yellow text-black scale-110' : 'bg-gray-200 text-gray-700 hover:bg-brand-yellow'}`}
                disabled={hasRated || ratingSubmitted}
                onClick={() => handleRate(i+1)}
                aria-label={`Rate ${i+1}`}
              >
                {i+1}
              </button>
            ))}
          </div>
          {hasRated && <div className="text-green-700 font-bold mb-1">Thank you for rating!</div>}
          {averageRating !== undefined && (
            <div className="text-sm text-gray-600">Average rating: <span className="font-bold">{averageRating.toFixed(1)}</span> / 10</div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};

export default QuestionCard;