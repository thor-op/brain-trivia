import React, { useState } from 'react';
import { Category, CATEGORIES, User, GameMode } from '../types';
import { motion } from 'framer-motion';

interface HomeScreenProps {
    user: User | null;
    onLogin: () => void;
    onLogout: () => void;
    onStartGame: (mode: GameMode, category: Category) => void;
    onShowLeaderboard: () => void;
}

const TrophyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 inline" viewBox="0 0 20 20" fill="currentColor"><path d="M11.25 2.25a.75.75 0 00-1.5 0v1.135A4.001 4.001 0 006.375 7.5c0 .245.02.486.06.721A5.5 5.5 0 002.5 13.5V15a.75.75 0 00.75.75h13.5a.75.75 0 00.75-.75v-1.5a5.5 5.5 0 00-3.935-5.279a.06.06 0 01.06-.721 4.001 4.001 0 00-3.375-4.115V2.25zM10 8.625a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" /></svg>;
const GoogleIcon = () => <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.49 44 30.686 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>;

const HomeScreen: React.FC<HomeScreenProps> = ({ user, onLogin, onLogout, onStartGame, onShowLeaderboard }) => {
    const [selectedCategory, setSelectedCategory] = useState<Category>(CATEGORIES[0]);

    return (
        <div className="text-center p-4 md:p-8 flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 10 }}
            >
              <h1 className="text-8xl md:text-9xl font-display tracking-wider text-brand-white">BRAIN</h1>
              <h2 className="text-8xl md:text-9xl font-display tracking-wider text-brand-yellow -mt-6 md:-mt-8">TRIVIA</h2>
            </motion.div>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-8 w-full max-w-sm"
            >
              {user ? (
                <div className="space-y-4">
                  <div className='p-3 bg-brand-white text-brand-black border-4 border-black shadow-hard'>
                    <div className='flex items-center'>
                      <img src={user.photoURL!} alt={user.displayName!} className="w-10 h-10 rounded-full border-2 border-brand-black" />
                      <p className="ml-3 font-bold">Welcome, {user.displayName}!</p>
                    </div>
                  </div>
                  <label htmlFor="category" className="block text-sm font-bold text-slate-400 mb-2">SELECT A CATEGORY</label>
                  <select
                      id="category"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value as Category)}
                      className="w-full p-3 bg-brand-white text-brand-black font-bold border-4 border-black shadow-hard focus:outline-none"
                  >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  
                  <button
                      onClick={() => onStartGame(GameMode.ENDLESS, selectedCategory)}
                      className="w-full bg-brand-yellow text-brand-black font-display text-2xl py-3 px-6 border-4 border-black shadow-hard transition-all hover:bg-yellow-400 active:shadow-none active:translate-x-1 active:translate-y-1"
                  >
                      {GameMode.ENDLESS}
                  </button>
                   <button
                      onClick={() => onStartGame(GameMode.DAILY, selectedCategory)}
                      className="w-full bg-brand-cyan text-brand-black font-display text-2xl py-3 px-6 border-4 border-black shadow-hard transition-all hover:bg-cyan-300 active:shadow-none active:translate-x-1 active:translate-y-1"
                  >
                      {GameMode.DAILY}
                  </button>
                  <button
                      onClick={onShowLeaderboard}
                      className="w-full bg-brand-magenta text-brand-black font-display text-2xl py-3 px-6 border-4 border-black shadow-hard transition-all hover:bg-fuchsia-400 active:shadow-none active:translate-x-1 active:translate-y-1"
                  >
                     <TrophyIcon /> Leaderboards
                  </button>
                   <button onClick={onLogout} className="mt-4 text-sm text-slate-400 hover:text-brand-white">Logout</button>
                </div>
              ) : (
                <button
                    onClick={onLogin}
                    className="w-full bg-brand-white text-brand-black font-display text-2xl py-3 px-6 border-4 border-black shadow-hard transition-all hover:bg-gray-200 active:shadow-none active:translate-x-1 active:translate-y-1 flex items-center justify-center"
                >
                    <GoogleIcon /> Sign In with Google
                </button>
              )}
            </motion.div>
        </div>
    );
};

export default HomeScreen;