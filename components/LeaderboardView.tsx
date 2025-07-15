import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GameMode, LeaderboardEntry } from '../types';
import { getLeaderboard } from '../services/firestoreService';
import LoadingSpinner from './LoadingSpinner';

interface LeaderboardViewProps {
    onBack: () => void;
}

const TrophyIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 inline text-brand-yellow" viewBox="0 0 20 20" fill="currentColor"><path d="M11.25 2.25a.75.75 0 00-1.5 0v1.135A4.001 4.001 0 006.375 7.5c0 .245.02.486.06.721A5.5 5.5 0 002.5 13.5V15a.75.75 0 00.75.75h13.5a.75.75 0 00.75-.75v-1.5a5.5 5.5 0 00-3.935-5.279a.06.06 0 01.06-.721 4.001 4.001 0 00-3.375-4.115V2.25zM10 8.625a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" /></svg>;


const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onBack }) => {
    const [mode, setMode] = useState<GameMode>(GameMode.ENDLESS);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                const data = await getLeaderboard(mode);
                setLeaderboard(data);
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [mode]);

    const TabButton: React.FC<{ tabMode: GameMode; children: React.ReactNode }> = ({ tabMode, children }) => (
        <button
            onClick={() => setMode(tabMode)}
            className={`w-1/2 p-3 font-display text-xl transition-colors duration-200 ${mode === tabMode ? 'bg-brand-yellow text-brand-black' : 'bg-brand-black text-brand-white hover:bg-gray-800'}`}
        >
            {children}
        </button>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-md mx-auto p-4 md:p-6 bg-brand-black border-4 border-white shadow-hard-white text-brand-white"
        >
            <div className="flex items-center justify-center mb-4">
              <TrophyIcon />
              <h2 className="text-4xl font-display">Leaderboards</h2>
            </div>
            
            <div className="flex border-2 border-white mb-4">
                <TabButton tabMode={GameMode.ENDLESS}>Endless</TabButton>
                <TabButton tabMode={GameMode.DAILY}>Daily Challenge</TabButton>
            </div>

            <div className="h-96 overflow-y-auto pr-2">
                {loading ? <LoadingSpinner /> : (
                    leaderboard.length > 0 ? (
                         <ol className="space-y-2">
                            {leaderboard.map((entry, index) => (
                                <motion.li 
                                    key={entry.userId}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-center p-2 bg-brand-black border-2 border-slate-600"
                                >
                                    <span className="font-display text-lg text-slate-400 w-8 text-center">{index + 1}</span>
                                    <img src={entry.photoURL} alt={entry.name} className="w-10 h-10 rounded-full mx-2 border-2 border-brand-yellow" />
                                    <div className="font-bold text-slate-200 flex-grow">
                                        {entry.name}
                                        {entry.category && <span className="block text-xs text-slate-500 font-normal">{entry.category}</span>}
                                    </div>
                                    <span className="font-bold text-brand-yellow text-lg">{entry.score}</span>
                                </motion.li>
                            ))}
                        </ol>
                    ) : (
                        <p className="text-center text-slate-400 mt-10">The leaderboard is empty. Be the first!</p>
                    )
                )}
            </div>
            
            <button
                onClick={onBack}
                className="mt-6 w-full bg-brand-cyan text-brand-black font-display text-2xl py-3 px-6 border-4 border-black shadow-hard transition-all hover:bg-cyan-300 active:shadow-none active:translate-x-1 active:translate-y-1"
            >
                Back to Home
            </button>
        </motion.div>
    );
};

export default LeaderboardView;