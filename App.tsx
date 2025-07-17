import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, TriviaQuestion, Category, CATEGORIES, PlayerStats, POWER_UPS, PowerUpType, User, GameMode } from './types';
import { generateTriviaQuestion, generateDailyQuizSet } from './services/geminiService';
import { getDailyQuiz, submitScore, setAnswerRating, getAverageAnswerRating, getAnswerRatings, getUsefulAnswers, setQuestionInCentralCollection, getQuestionById, submitUsefulQuizScore, getUsefulQuizLeaderboard } from './services/firestoreService';
import { collection, getDoc, doc } from 'firebase/firestore';
import { db } from './components/firebase';
import Scoreboard from './components/Scoreboard';
import QuestionCard from './components/QuestionCard';
import LoadingSpinner from './components/LoadingSpinner';
import HomeScreen from './components/HomeScreen';
import GameOverScreen from './components/GameOverScreen';
import LeaderboardView from './components/LeaderboardView';
import PowerUps from './components/PowerUps';
import { useAuth } from './hooks/useAuth';
import { AnimatePresence, motion } from 'framer-motion';
import Changelog from './components/Changelog';
import { LeaderboardEntry } from './types';

const TIME_LIMIT = 15;
const XP_PER_LEVEL_BASE = 250;
const DAILY_CHALLENGE_KEY_PREFIX = 'dailyChallengeCompletionDate';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const App: React.FC = () => {
  const { user, loading: authLoading, login, logout } = useAuth();
  const [view, setView] = useState<'HOME' | 'GAME' | 'LEADERBOARD' | 'USEFUL_QUESTIONS' | 'CHANGELOG' | 'USEFUL_QUIZ' | 'USEFUL_QUIZ_LEADERBOARD'>('HOME');
  
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
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const timerRef = useRef<number | null>(null);
  
  const [playerStats, setPlayerStats] = useState<PlayerStats>({ level: 1, xp: 0, xpToNextLevel: XP_PER_LEVEL_BASE });
  const [powerUps, setPowerUps] = useState<Record<PowerUpType, number>>({ 'FIFTY_FIFTY': 1, 'SKIP': 1, 'EXTRA_TIME': 1 });
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [answerAverageRating, setAnswerAverageRating] = useState<number | undefined>(undefined);
  const [userAnswerRating, setUserAnswerRating] = useState<number | undefined>(undefined);
  const [usefulQuestions, setUsefulQuestions] = useState<TriviaQuestion[]>([]);
  const [usefulQuizQuestions, setUsefulQuizQuestions] = useState<TriviaQuestion[]>([]);
  const [usefulQuizIndex, setUsefulQuizIndex] = useState(0);
  const [notEnoughUseful, setNotEnoughUseful] = useState(false);
  const [usefulQuizLeaderboard, setUsefulQuizLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingUsefulQuizLeaderboard, setLoadingUsefulQuizLeaderboard] = useState(false);

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
  
  // In fetchNewQuestion, after setting currentQuestion, store it in central collection
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
      // Store question in central collection and ensure it has an id
      const id = await setQuestionInCentralCollection(question);
      question.id = id;
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

  // Fetch average and user rating when question changes
  useEffect(() => {
    const fetchRatings = async () => {
      if (currentQuestion && currentQuestion.id && user) {
        const avg = await getAverageAnswerRating(currentQuestion.id);
        setAnswerAverageRating(avg);
        const ratings = await getAnswerRatings(currentQuestion.id);
        const userRating = ratings.find(r => r.userId === user.uid)?.rating;
        setUserAnswerRating(userRating);
      } else {
        setAnswerAverageRating(undefined);
        setUserAnswerRating(undefined);
      }
    };
    fetchRatings();
  }, [currentQuestion, user]);

  // After answering, wait 5 seconds, then proceed
  useEffect(() => {
    if (gameState === GameState.ANSWERED) {
      const timeout = setTimeout(() => {
        if (view === 'USEFUL_QUIZ') {
          if (isCorrect) {
            fetchNextUsefulQuizQuestion();
          } else {
            setGameState(GameState.GAME_OVER);
          }
          return;
        }
        if (isCorrect) {
          fetchNewQuestion();
        } else {
          setGameState(GameState.GAME_OVER);
        }
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [gameState, isCorrect, fetchNewQuestion, view]);

  // Handler for rating
  const handleRateAnswer = async (rating: number) => {
    if (currentQuestion && currentQuestion.id && user) {
      await setAnswerRating(currentQuestion.id, user.uid, rating);
      setUserAnswerRating(rating);
      const avg = await getAverageAnswerRating(currentQuestion.id);
      setAnswerAverageRating(avg);
      setRatingSubmitted(true);
    }
  };

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

  // In handleAnswerSelect, use the correct current question for Useful Quiz mode
  const handleAnswerSelect = (answer: string) => {
    if (gameState !== GameState.PLAYING) return;
    
    stopTimer();
    let questionToCheck = currentQuestion;
    if (view === 'USEFUL_QUIZ') {
      questionToCheck = usefulQuizQuestions[usefulQuizIndex];
    }
    const correct = answer === questionToCheck?.answer;
    setSelectedAnswer(answer);
    setIsCorrect(correct);
    setGameState(GameState.ANSWERED);
    setRatingSubmitted(false);
    // Remove setTimeout for next question/game over
    // Progression will be handled after rating
    if (view === 'USEFUL_QUIZ') {
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
      } else {
        setStreak(0);
      }
      return;
    }
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
      // Do not auto-advance
    } else {
      setStreak(0);
      // Do not auto-advance
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
              userId={user?.uid}
              answerId={currentQuestion.id}
              averageRating={answerAverageRating}
              userRating={userAnswerRating}
              onRateAnswer={handleRateAnswer}
              ratingSubmitted={ratingSubmitted}
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
  
  // Handler to show useful questions
  const handleShowUsefulQuestions = async () => {
    // Get answerIds with average rating >= 7
    const answerIds = await getUsefulAnswers(7);
    // Fetch each question by id from central 'questions' collection
    const questions: TriviaQuestion[] = [];
    for (const id of answerIds) {
      const q = await getQuestionById(id);
      if (q) questions.push(q);
    }
    setUsefulQuestions(questions);
    setView('USEFUL_QUESTIONS');
  };

  // Handler to start Useful Answers Quiz
  const handleStartUsefulQuiz = async () => {
    const answerIds = await getUsefulAnswers(7);
    const questions: TriviaQuestion[] = [];
    for (const id of answerIds) {
      const q = await getQuestionById(id);
      if (q) questions.push(q);
    }
    if (questions.length < 5) {
      setNotEnoughUseful(true);
      setTimeout(() => setNotEnoughUseful(false), 3000);
      return;
    }
    setUsefulQuizQuestions(questions);
    setUsefulQuizIndex(0);
    setView('USEFUL_QUIZ');
    setGameState(GameState.PLAYING);
    setScore(0);
    setStreak(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setAnsweredQuestions([]);
    setPlayerStats({ level: 1, xp: 0, xpToNextLevel: XP_PER_LEVEL_BASE });
    setPowerUps({ 'FIFTY_FIFTY': 1, 'SKIP': 1, 'EXTRA_TIME': 1 });
    setTimeLeft(TIME_LIMIT);
    startTimer();
  };

  // Useful Quiz flow
  const fetchNextUsefulQuizQuestion = () => {
    if (usefulQuizIndex + 1 >= usefulQuizQuestions.length) {
      setGameState(GameState.GAME_OVER);
      return;
    }
    setUsefulQuizIndex(usefulQuizIndex + 1);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setGameState(GameState.PLAYING);
    setTimeLeft(TIME_LIMIT);
    startTimer();
  };

  // Handler to show Useful Quiz Leaderboard
  const handleShowUsefulQuizLeaderboard = async () => {
    setLoadingUsefulQuizLeaderboard(true);
    const leaderboard = await getUsefulQuizLeaderboard();
    setUsefulQuizLeaderboard(leaderboard);
    setLoadingUsefulQuizLeaderboard(false);
    setView('USEFUL_QUIZ_LEADERBOARD');
  };

  // On finishing Useful Quiz, submit score
  useEffect(() => {
    if (view === 'USEFUL_QUIZ' && gameState === GameState.GAME_OVER && user && score > 0) {
      submitUsefulQuizScore(user, score);
    }
  }, [view, gameState, user, score]);

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
        case 'USEFUL_QUESTIONS':
            return (
              <div className="w-full max-w-2xl mx-auto p-4">
                <h2 className="text-3xl font-display mb-4">Questions with Useful Answers</h2>
                {usefulQuestions.length === 0 ? (
                  <div className="text-gray-500">No highly-rated answers yet.</div>
                ) : (
                  <ul className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {usefulQuestions.map(q => (
                      <li key={q.id} className="p-4 border-2 border-black bg-brand-white text-brand-black rounded shadow-hard">
                        <div className="font-bold mb-2">{q.question}</div>
                        <div className="text-sm text-gray-700">Answer: <span className="font-bold">{q.answer}</span></div>
                      </li>
                    ))}
                  </ul>
                )}
                <button onClick={() => setView('HOME')} className="mt-6 w-full bg-brand-cyan text-brand-black font-display text-2xl py-3 px-6 border-4 border-black shadow-hard transition-all hover:bg-cyan-300 active:shadow-none active:translate-x-1 active:translate-y-1">Back to Home</button>
              </div>
            );
        case 'USEFUL_QUIZ':
          const currentUseful = usefulQuizQuestions[usefulQuizIndex];
          return (
            <div className="w-full max-w-2xl mx-auto space-y-4">
              <Scoreboard score={score} playerStats={playerStats}/>
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
                    {gameState === GameState.PLAYING || gameState === GameState.ANSWERED ? (
                      <>
                        <QuestionCard
                          key={usefulQuizIndex}
                          question={currentUseful}
                          onAnswer={handleAnswerSelect}
                          selectedAnswer={selectedAnswer}
                          isCorrect={isCorrect}
                          questionNumber={usefulQuizIndex + 1}
                          timeLeft={timeLeft}
                          timeLimit={TIME_LIMIT}
                          displayOptions={currentUseful.options}
                          userId={user?.uid}
                          answerId={currentUseful.id}
                          averageRating={answerAverageRating}
                          userRating={userAnswerRating}
                          onRateAnswer={handleRateAnswer}
                          ratingSubmitted={ratingSubmitted}
                        />
                        <PowerUps powerUps={powerUps} onUse={handleUsePowerUp} disabled={selectedAnswer !== null} />
                      </>
                    ) : gameState === GameState.GAME_OVER ? (
                      <>
                        <GameOverScreen score={score} error={error} onPlayAgain={() => setView('HOME')} user={user} />
                        {gameState === GameState.GAME_OVER && (
                          <button
                            onClick={handleShowUsefulQuizLeaderboard}
                            className="mt-4 w-full bg-brand-cyan text-brand-black font-display text-2xl py-3 px-6 border-4 border-black shadow-hard transition-all hover:bg-cyan-300 active:shadow-none active:translate-x-1 active:translate-y-1"
                          >
                            View Useful Answers Quiz Leaderboard
                          </button>
                        )}
                      </>
                    ) : <LoadingSpinner />}
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>
          );
        case 'USEFUL_QUIZ_LEADERBOARD':
          return (
            <div className="w-full max-w-md mx-auto p-4 md:p-6 bg-brand-black border-4 border-white shadow-hard-white text-brand-white">
              <div className="flex items-center justify-center mb-4">
                <span className="font-display text-4xl text-brand-cyan mr-2">🏆</span>
                <h2 className="text-4xl font-display">Useful Answers Quiz Leaderboard</h2>
              </div>
              <div className="h-96 overflow-y-auto pr-2">
                {loadingUsefulQuizLeaderboard ? <LoadingSpinner /> : (
                  usefulQuizLeaderboard.length > 0 ?
                    <ol className="space-y-2">
                      {usefulQuizLeaderboard.map((entry, index) => (
                        <li key={entry.userId} className="flex items-center p-2 bg-brand-black border-2 border-slate-600">
                          <span className="font-display text-lg text-slate-400 w-8 text-center">{index + 1}</span>
                          <img src={entry.photoURL} alt={entry.name} className="w-10 h-10 rounded-full mx-2 border-2 border-brand-cyan" />
                          <div className="font-bold text-slate-200 flex-grow">
                            {entry.name}
                          </div>
                          <span className="font-bold text-brand-cyan text-lg">{entry.score}</span>
                        </li>
                      ))}
                    </ol>
                  : <p className="text-center text-slate-400 mt-10">No scores yet. Be the first!</p>
                )}
              </div>
              <button
                onClick={() => setView('HOME')}
                className="mt-6 w-full bg-brand-cyan text-brand-black font-display text-2xl py-3 px-6 border-4 border-black shadow-hard transition-all hover:bg-cyan-300 active:shadow-none active:translate-x-1 active:translate-y-1"
              >
                Back to Home
              </button>
            </div>
          );
        case 'CHANGELOG':
          return <Changelog onBack={() => setView('HOME')} />;
        case 'HOME':
        default:
            return <HomeScreen 
                user={user} 
                onLogin={login} 
                onLogout={logout} 
                onStartGame={handleStartGame}
                onShowLeaderboard={() => setView('LEADERBOARD')}
                onStartUsefulQuiz={handleStartUsefulQuiz}
            />;
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
        {/* Add button to show useful questions on home screen */}
        {view === 'HOME' && (
          <>
            <button
              onClick={handleShowUsefulQuestions}
              className="absolute top-4 right-4 bg-brand-yellow text-brand-black font-display text-lg py-2 px-4 border-4 border-black shadow-hard transition-all hover:bg-yellow-400 active:shadow-none active:translate-x-1 active:translate-y-1 z-10"
            >
              Useful Answers
            </button>
            <button
              onClick={() => setView('CHANGELOG')}
              className="absolute top-4 left-4 bg-brand-magenta text-brand-black font-display text-lg py-2 px-4 border-4 border-black shadow-hard transition-all hover:bg-fuchsia-400 active:shadow-none active:translate-x-1 active:translate-y-1 z-10"
            >
              Changelog
            </button>
            {notEnoughUseful && (
              <div className="absolute top-32 right-4 bg-red-600 text-white font-bold px-4 py-2 rounded shadow-hard z-20">
                Not enough useful questions yet! (Need at least 5)
              </div>
            )}
          </>
        )}
        {renderView()}

        <footer className="absolute bottom-4 text-slate-500 text-xs">
            Powered by Gemini & Firebase | THORXOP
        </footer>
    </div>
  );
};

export default App;