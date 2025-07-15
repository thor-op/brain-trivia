import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, TriviaQuestion, Category, CATEGORIES, PlayerStats, POWER_UPS, PowerUpType, User, GameMode } from './types';
import { generateTriviaQuestion, generateDailyQuizSet } from './services/geminiService';
import { getDailyQuiz, submitScore } from './services/firestoreService';
import Scoreboard from './components/Scoreboard';
import QuestionCard from './components/QuestionCard';
import LoadingSpinner from './components/LoadingSpinner';
import HomeScreen from './components/HomeScreen';
import GameOverScreen from './components/GameOverScreen';
import LeaderboardView from './components/LeaderboardView';
import PowerUps from './components/PowerUps';
import { useAuth } from './hooks/useAuth';
import { AnimatePresence, motion } from 'framer-motion';

const TIME_LIMIT = 15;
const XP_PER_LEVEL_BASE = 250;
const DAILY_CHALLENGE_KEY_PREFIX = 'dailyChallengeCompletionDate';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const App: React.FC = () => {
  const { user, loading: authLoading, login, logout } = useAuth();
  const [view, setView] = useState<'HOME' | 'GAME' | 'LEADERBOARD'>('HOME');
  
  // Game State
  const [gameState, setGameState] = useState<GameState>(GameState.HOME);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.ENDLESS);
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [dailyQuiz, setDailyQuiz] = useState<TriviaQuestion[]>([]);
  const [displayOptions, setDisplayOptions] = useState<string[] | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<string[]>([]);
  
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const timerRef = useRef<number | null>(null);
  
  const [playerStats, setPlayerStats] = useState<PlayerStats>({ level: 1, xp: 0, xpToNextLevel: XP_PER_LEVEL_BASE });
  const [powerUps, setPowerUps] = useState<Record<PowerUpType, number>>({ 'FIFTY_FIFTY': 1, 'SKIP': 1, 'EXTRA_TIME': 1 });
  const [showLevelUp, setShowLevelUp] = useState(false);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleTimeUp = useCallback(() => {
    stopTimer();
    setStreak(0);
    setGameState(GameState.GAME_OVER);
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(TIME_LIMIT);
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if(timerRef.current) clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleTimeUp]);
  
  const fetchNewQuestion = useCallback(async () => {
    setGameState(GameState.LOADING);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setError(null);
    setDisplayOptions(null);
    
    try {
      let question: TriviaQuestion;
      if (gameMode === GameMode.ENDLESS) {
        question = await generateTriviaQuestion(category, answeredQuestions);
      } else {
        if (questionNumber >= dailyQuiz.length) {
            setGameState(GameState.GAME_OVER);
            return;
        }
        question = dailyQuiz[questionNumber];
      }
      setCurrentQuestion(question);
      setAnsweredQuestions(prev => [...prev.slice(-10), question.question]);
      setGameState(GameState.PLAYING);
      startTimer();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      setGameState(GameState.GAME_OVER);
    }
  }, [category, answeredQuestions, startTimer, gameMode, dailyQuiz, questionNumber]);
  
  useEffect(() => {
    if(gameState === GameState.PLAYING) {
       setQuestionNumber(prev => prev + 1);
    }
  },[gameState]);


  const handleStartGame = useCallback(async (selectedMode: GameMode, selectedCategory: Category) => {
    if (selectedMode === GameMode.DAILY) {
      const today = getTodayDateString();
      const dailyChallengeKey = `${DAILY_CHALLENGE_KEY_PREFIX}_${selectedCategory}`;
      if (localStorage.getItem(dailyChallengeKey) === today) {
          alert("You have already completed the Daily Challenge for this category today. Try another category or come back tomorrow!");
          return;
      }
      setGameState(GameState.LOADING);
      setView('GAME');
      const questions = await getDailyQuiz(selectedCategory);
      setDailyQuiz(questions);
    } else {
        setDailyQuiz([]);
    }
    
    setGameMode(selectedMode);
    setCategory(selectedCategory);
    setScore(0);
    setStreak(0);
    setAnsweredQuestions([]);
    setQuestionNumber(0);
    setPlayerStats({ level: 1, xp: 0, xpToNextLevel: XP_PER_LEVEL_BASE });
    setPowerUps({ 'FIFTY_FIFTY': 1, 'SKIP': 1, 'EXTRA_TIME': 1 });
    setView('GAME');
    fetchNewQuestion();
  }, [fetchNewQuestion]);

  const handleGameOver = useCallback(async () => {
    if (user && score > 0) {
      await submitScore(user, score, gameMode, category);
    }
    if (gameMode === GameMode.DAILY) {
      const dailyChallengeKey = `${DAILY_CHALLENGE_KEY_PREFIX}_${category}`;
      localStorage.setItem(dailyChallengeKey, getTodayDateString());
    }
  }, [user, score, gameMode, category]);

  useEffect(() => {
    if (gameState === GameState.GAME_OVER) {
        handleGameOver();
    }
  }, [gameState, handleGameOver]);

  const handlePlayAgain = () => {
    setGameState(GameState.HOME);
    setView('HOME');
  }

  const handleAnswerSelect = (answer: string) => {
    if (gameState !== GameState.PLAYING) return;
    
    stopTimer();
    const correct = answer === currentQuestion?.answer;
    setSelectedAnswer(answer);
    setIsCorrect(correct);
    setGameState(GameState.ANSWERED);

    if (correct) {
      const points = 10 + Math.floor(streak * 1.5) + (timeLeft * 2);
      setScore(prev => prev + points);
      
      const newXp = playerStats.xp + points;
      if (newXp >= playerStats.xpToNextLevel) {
          const newLevel = playerStats.level + 1;
          setPlayerStats({
              level: newLevel,
              xp: newXp - playerStats.xpToNextLevel,
              xpToNextLevel: Math.floor(XP_PER_LEVEL_BASE * Math.pow(1.2, newLevel - 1))
          });
          setShowLevelUp(true);
          setTimeout(() => setShowLevelUp(false), 2500);
      } else {
          setPlayerStats(prev => ({ ...prev, xp: newXp }));
      }
      
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > 0 && newStreak % 5 === 0) {
        const powerUpKeys = Object.keys(POWER_UPS) as PowerUpType[];
        const randomPowerUp = powerUpKeys[Math.floor(Math.random() * powerUpKeys.length)];
        setPowerUps(prev => ({...prev, [randomPowerUp]: prev[randomPowerUp] + 1}));
      }

      setTimeout(fetchNewQuestion, 1500);
    } else {
      setStreak(0);
      setTimeout(() => setGameState(GameState.GAME_OVER), 1500);
    }
  };

  const handleUsePowerUp = (type: PowerUpType) => {
      if (powerUps[type] <= 0 || gameState !== GameState.PLAYING) return;
      setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));

      if (type === 'SKIP') {
          stopTimer();
          fetchNewQuestion();
      } else if (type === 'EXTRA_TIME') {
          setTimeLeft(prev => Math.min(prev + 10, TIME_LIMIT));
      } else if (type === 'FIFTY_FIFTY' && currentQuestion) {
          const correctAnswer = currentQuestion.answer;
          const incorrectOptions = currentQuestion.options.filter(o => o !== correctAnswer);
          const randomIncorrect = incorrectOptions.sort(() => 0.5 - Math.random()).slice(0, 1);
          setDisplayOptions([correctAnswer, ...randomIncorrect].sort(() => Math.random() - 0.5));
      }
  };
  
  const renderGameContent = () => {
    switch (gameState) {
      case GameState.LOADING:
        return <LoadingSpinner />;
      case GameState.PLAYING:
      case GameState.ANSWERED:
        return currentQuestion ? (
          <>
            <QuestionCard
              key={questionNumber}
              question={currentQuestion}
              onAnswer={handleAnswerSelect}
              selectedAnswer={selectedAnswer}
              isCorrect={isCorrect}
              questionNumber={questionNumber}
              timeLeft={timeLeft}
              timeLimit={TIME_LIMIT}
              displayOptions={displayOptions || currentQuestion.options}
            />
            <PowerUps powerUps={powerUps} onUse={handleUsePowerUp} disabled={selectedAnswer !== null} />
          </>
        ) : <LoadingSpinner />;
      case GameState.GAME_OVER:
          return <GameOverScreen score={score} error={error} onPlayAgain={handlePlayAgain} user={user} />;
      default:
        return null;
    }
  };
  
  const renderView = () => {
    if (authLoading) return <div className="flex items-center justify-center h-screen"><LoadingSpinner /></div>

    switch(view) {
        case 'LEADERBOARD':
            return <LeaderboardView onBack={() => setView('HOME')} />;
        case 'GAME':
            return (
                 <div className="w-full max-w-2xl mx-auto space-y-4">
                    {(gameState === GameState.PLAYING || gameState === GameState.ANSWERED) && (
                         <Scoreboard score={score} playerStats={playerStats}/>
                    )}
                    <main className="flex justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={gameState}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="w-full space-y-4"
                            >
                                {renderGameContent()}
                            </motion.div>
                        </AnimatePresence>
                    </main>
                </div>
            );
        case 'HOME':
        default:
            return <HomeScreen 
                user={user} 
                onLogin={login} 
                onLogout={logout} 
                onStartGame={handleStartGame}
                onShowLeaderboard={() => setView('LEADERBOARD')}
                />
    }
  }

  return (
    <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center p-4 font-mono overflow-hidden relative">
        <AnimatePresence>
            {showLevelUp && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 10 } }}
                    exit={{ opacity: 0, y: 50, scale: 0.5, transition: { duration: 0.3 } }}
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 p-6 bg-brand-cyan border-4 border-black shadow-hard"
                >
                    <h2 className="font-display text-5xl text-black">LEVEL UP!</h2>
                </motion.div>
            )}
        </AnimatePresence>
        
        {renderView()}

        <footer className="absolute bottom-4 text-slate-500 text-xs">
            Powered by Gemini & Firebase | THORXOP
        </footer>
    </div>
  );
};

export default App;