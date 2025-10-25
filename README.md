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
  - Added a leaderboard for the Quiz Me on Useful Answers mode, showing top scores.
  - Moved the Quiz Me on Useful Answers button to the main button stack for better UX.
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

### 3. Firebase Setup

#### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "brain-trivia")
4. Choose whether to enable Google Analytics (recommended)
5. Select or create a Google Analytics account if enabled
6. Click "Create project"

#### Step 2: Enable Authentication
1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started" if it's your first time
3. Go to the "Sign-in method" tab
4. Click on "Google" provider
5. Toggle "Enable" to turn it on
6. Add your project's domain to "Authorized domains" (e.g., `localhost` for development)
7. Click "Save"

#### Step 3: Set Up Firestore Database
1. Go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (you can secure it later)
4. Select a location for your database (choose closest to your users)
5. Click "Done"

#### Step 4: Create Firestore Collections
Your app needs these collections. Firebase will create them automatically when data is first written:

**Required Collections:**

1. **leaderboards** - Stores user scores and rankings
   - Document structure: `{ userId, displayName, score, timestamp, mode }`

2. **daily-challenges** - Stores daily challenge data
   - Document structure: `{ date, questions, participants }`

3. **user-ratings** - Stores question ratings
   - Document structure: `{ questionId, userId, rating, timestamp }`

4. **useful-answers** - Stores highly-rated questions
   - Document structure: `{ question, answer, category, averageRating, ratingCount }`

#### Step 5: Firestore Indexes (Important!)
When you first run the app, you'll likely see red error messages in your browser console like:
```
Failed to fetch leaderboard FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/...
```

**Don't worry - this is normal!** Firebase automatically provides clickable links in these error messages to create the required indexes:

1. **Run your app first** and try to use features that query Firestore (like viewing leaderboards)
2. **Check your browser console** for red Firebase error messages
3. **Click the provided links** in the error messages - they'll take you directly to Firebase Console to create the needed indexes
4. **Click "Create Index"** on each page that opens
5. Wait for indexes to build (usually takes a few minutes)

This is the easiest way to set up indexes because Firebase generates the exact index configuration your app needs!

#### Step 6: Configure Firestore Security Rules
1. Go to "Firestore Database" > "Rules" tab
2. Replace the default rules with this simple rule (allows all read/write access):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click "Publish"

**Note:** This rule allows unrestricted access to your database. For production apps, consider implementing more secure rules based on authentication and user permissions.

#### Step 7: Get Firebase Configuration
1. Go to "Project Settings" (gear icon in left sidebar)
2. Scroll down to "Your apps" section
3. Click "Add app" and select the web icon (`</>`)
4. Enter an app nickname (e.g., "brain-trivia-web")
5. Check "Also set up Firebase Hosting" if you plan to deploy to Firebase
6. Click "Register app"
7. Copy the Firebase configuration object

#### Step 8: Set Up Environment Variables
Create a `.env` file in the project root with your Firebase configuration:

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

**Important Notes:**
- Replace `your_*` values with actual values from your Firebase config
- Never commit the `.env` file to version control
- Use `.env.example` as a template for other developers
- Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

#### Step 9: Configure OAuth (Optional but Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client IDs"
5. Choose "Web application"
6. Add authorized origins:
   - `http://localhost:5173` (for development)
   - Your production domain
7. Add authorized redirect URIs:
   - `http://localhost:5173/__/auth/handler` (for development)
   - `https://yourdomain.com/__/auth/handler` (for production)
8. Save the client ID and add it to your Firebase Authentication settings

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

### How to Contribute
1. Fork the repo
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

### Contributors

<a href="https://github.com/thor-op/brain-trivia/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=thor-op/brain-trivia" />
</a>



## License

This project is licensed under the **GNU General Public License v3.0** - see the [LICENSE](LICENSE) file for details.

### What this means:
- ✅ You can use, modify, and distribute this software
- ✅ You can use it for commercial purposes
- ✅ You must include the license and copyright notice
- ✅ You must disclose the source code of any modifications
- ❌ This software comes with no warranty

For more information about GPL v3, visit: https://www.gnu.org/licenses/gpl-3.0.html

---

**Enjoy playing Never-Ending Brain Trivia and may your knowledge never end!**
