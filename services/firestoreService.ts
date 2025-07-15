import { getDoc, setDoc, doc, collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../components/firebase';
import { TriviaQuestion, LeaderboardEntry, User, Category, GameMode } from '../types';
import { generateDailyQuizSet } from './geminiService';

const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getDailyQuiz = async (category: Category): Promise<TriviaQuestion[]> => {
    const dateString = getTodayDateString();
    const docId = `${dateString}_${category.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const quizDocRef = doc(db, 'dailyQuizzes', docId);
    
    const docSnap = await getDoc(quizDocRef);

    if (docSnap.exists()) {
        return docSnap.data().questions as TriviaQuestion[];
    } else {
        console.log("No daily quiz found, generating a new one for category:", category);
        const questions = await generateDailyQuizSet(category);
        await setDoc(quizDocRef, { questions, category, date: dateString });
        return questions;
    }
};

export const submitScore = async (user: User, score: number, gameMode: GameMode, category: Category): Promise<void> => {
    if (!user) return;

    const isDaily = gameMode === GameMode.DAILY;
    const leaderboardCollection = isDaily ? 'dailyLeaderboard' : 'endlessLeaderboard';
    
    const docId = isDaily ? `${user.uid}_${getTodayDateString()}_${category}` : user.uid;
    const userDocRef = doc(db, leaderboardCollection, docId);

    try {
        const docSnap = await getDoc(userDocRef);
        // For Endless mode, only update if the new score is higher.
        // For Daily mode, always update to allow score improvement during the day, but check against the specific daily doc.
        if (docSnap.exists() && docSnap.data().score >= score) {
            console.log('New score is not higher, not updating.');
            return;
        }

        const leaderboardEntry: LeaderboardEntry = {
            userId: user.uid,
            name: user.displayName || 'Anonymous',
            photoURL: user.photoURL || '',
            score: score,
        };
        
        if (isDaily) {
            leaderboardEntry.date = getTodayDateString();
        }
        
        await setDoc(userDocRef, leaderboardEntry, { merge: !isDaily }); // Merge for endless, overwrite for daily
    } catch (error) {
        console.error("Error submitting score:", error);
    }
};

export const getLeaderboard = async (gameMode: GameMode): Promise<LeaderboardEntry[]> => {
    const leaderboardCollection = gameMode === GameMode.DAILY ? 'dailyLeaderboard' : 'endlessLeaderboard';
    
    let q;
    if (gameMode === GameMode.DAILY) {
        // Query for today's scores
        q = query(
            collection(db, leaderboardCollection), 
            where('date', '==', getTodayDateString()),
            orderBy('score', 'desc'), 
            limit(10)
        );
    } else {
        // Query for all-time high scores
        q = query(
            collection(db, leaderboardCollection), 
            orderBy('score', 'desc'), 
            limit(10)
        );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as LeaderboardEntry);
};