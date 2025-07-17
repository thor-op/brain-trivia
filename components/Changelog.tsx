import React from 'react';

const changelogEntries = [
  {
    date: '2025-07-15',
    title: 'Useful Answers & Ratings',
    details: [
      'Users can now rate the usefulness of each answer (1-10).',
      'Questions with highly-rated answers (average ≥ 7) appear in the Useful Answers area.',
      'Answer flow improved: 5-second pause after answering to allow rating.',
    ],
  },
  {
    date: '2025-07-15',
    title: 'Bug Fixes & UI Improvements',
    details: [
      'Fixed answer progression bugs.',
      'Improved animations and feedback.',
    ],
  },
  {
    date: '2025-07-15',
    title: 'Initial Release',
    details: [
      'Endless and Daily Challenge trivia modes.',
      'Leaderboards, power-ups, and Google authentication.',
    ],
  },
];

changelogEntries.unshift({
  date: '2025-07-17',
  title: 'Real Life Category',
  details: [
    'Added a new "Real Life" category for practical, real-world, and everyday knowledge questions.',
    'AI prompt improved to generate more real-life and practical trivia when this category is selected.'
  ],
});

changelogEntries.unshift({
  date: '2025-07-17',
  title: 'Useful Answers Quiz Leaderboard & UI Improvement',
  details: [
    'Added a leaderboard for the Quiz Me on Useful Answers mode, showing top scores.',
    'Moved the Quiz Me on Useful Answers button to the main button stack for better UX.'
  ],
});

const Changelog: React.FC<{ onBack?: () => void }> = ({ onBack }) => (
  <div className="w-full max-w-2xl mx-auto p-6 bg-brand-white text-brand-black border-4 border-black shadow-hard rounded-lg mt-8">
    <h2 className="text-4xl font-display mb-4 text-brand-magenta">Changelog</h2>
    <ul className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {changelogEntries.map((entry, idx) => (
        <li key={idx} className="border-b border-gray-300 pb-4">
          <div className="flex items-center mb-1">
            <span className="font-bold text-lg mr-2">{entry.title}</span>
            <span className="text-xs text-gray-500">({entry.date})</span>
          </div>
          <ul className="list-disc list-inside ml-4 text-base text-gray-800">
            {entry.details.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </li>
      ))}
    </ul>
    {onBack && (
      <button
        onClick={onBack}
        className="mt-8 w-full bg-brand-cyan text-brand-black font-display text-2xl py-3 px-6 border-4 border-black shadow-hard transition-all hover:bg-cyan-300 active:shadow-none active:translate-x-1 active:translate-y-1"
      >
        Back
      </button>
    )}
  </div>
);

export default Changelog; 