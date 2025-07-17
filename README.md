# Never-Ending Brain Trivia

A modern, endlessly fun trivia game powered by Gemini AI and Firebase. Challenge your knowledge with a continuous stream of unique questions, compete for high scores, and climb the leaderboards!

## Features
- Endless and Daily Challenge trivia modes
- AI-generated, unique trivia questions
- Multiple categories and difficulty levels
- Leaderboards for both Endless and Daily modes
- Google authentication
- Power-ups and streak bonuses
- Beautiful, responsive UI

## Recent Updates

- **2025-07-17**
  - Added a new "Real Life" category for practical, real-world, and everyday knowledge questions.
  - AI prompt improved to generate more real-life and practical trivia when this category is selected.
  - **2025-07-15**
  - Users can now rate the usefulness of each answer (1-10).
  - Questions with highly-rated answers (average ≥ 7) appear in the Useful Answers area.
  - Answer flow improved: 5-second pause after answering to allow rating.
  - Added a Changelog page accessible from the Home screen.

## Tech Stack
- React + TypeScript
- Vite
- Firebase (Auth, Firestore)
- Gemini AI (Google GenAI)
- Framer Motion (animations)

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/thor-op/brain-trivia.git
cd brain-trivia
```

### 2. Install Dependencies
```bash
yarn install
# or
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the project root with the following content:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```
- Get Firebase config from your Firebase Console (Project Settings > General > Your apps).
- Get Gemini API key from Google AI Studio or Google Cloud Console.

### 4. Start the Development Server
```bash
yarn dev
# or
npm run dev
```
Visit [http://localhost:5173](http://localhost:5173) in your browser.

## Usage
- Sign in with Google to play.
- Choose a category and mode (Endless or Daily Challenge).
- Answer trivia questions, use power-ups, and try to get the highest score!
- Check the leaderboard to see how you rank.

## Deployment
You can deploy this app to Vercel, Netlify, Firebase Hosting, or any static hosting provider. Make sure to set the same environment variables in your deployment settings.

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

## License
This project is licensed under the [GNU GPLv3](https://www.gnu.org/licenses/gpl-3.0.html).

---

**Enjoy playing Never-Ending Brain Trivia and may your knowledge never end!**
