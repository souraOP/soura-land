# SouraLand! - A Retro Pip-Boy Themed Chat App

Welcome to **SouraLand!**, a real-time chat application with a unique, immersive UI inspired by the Pip-Boy from the Fallout video game series. This isn't just a messaging app; it's a retro-futuristic experience complete with a phosphor screen aesthetic, scanlines, goofy sound effects, and a chaotic personality.

## Features

* **Chat in Real-Time!** Thanks to Google's Firestore, your messages show up instantly for everyone. No more hitting the refresh button!

* **Know Who's Hanging Out!** The online user list updates right away when your friends hop on or off the chat. It's all live, adding to the fun.

* **Pick Your Own Name!** You can set a custom username to show off your personality. The app will even remember it for next time, so you don't have to set it again.

* **Get That Awesome Pip-Boy Feel!** We went all out to make the UI look and feel just like the real thing:
    * **Authentic Theme:** It's got that classic green-on-black screen that's easy on the eyes and super nostalgic.
    * **CRT Effects:** We've added animated scanlines and glowing text to give it that old-school CRT monitor vibe.
    * **Interactive Elements:** You can click on tabs, see system lights blink, and check out the fun HP/AP bars at the bottom. It really feels like you're using a piece of retro tech!
    * **Boot-Up Sequence:** When you first open the app, you'll get a cool boot-up sequence with sound effects to get you right into the mood.

* **Hear the Beeps and Boops!** We've added retro sound effects for everything—sending messages, getting new ones, clicking buttons, and even starting up the app. It makes everything feel more fun and interactive.

* **Get Ready for Some Chaos!** There's a "System Anomaly" panel that shows random, hilarious Bengali slang jokes. It's our little way of keeping things interesting and a bit troll-worthy!

* **Chat Anywhere!** The app works great on both your computer and your phone. The layout changes to fit your screen, so it's always easy to use, no matter where you are.

* **Easy Cleanup for the Owner!** If you're running the app, you can easily delete all the messages from the Firebase console if you ever need to start fresh.

## Tech Stack

* **Frontend:** [React](https://reactjs.org/)
* **Backend & Database:** [Firebase](https://firebase.google.com/) (Firestore, Realtime Database, Authentication)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) for utility-first styling.
* **Sound:** [Tone.js](https://tonejs.github.io/) for web audio.

## Setup and Installation

To get this project running on your local machine, follow these steps.

### Prerequisites

* [Node.js](https://nodejs.org/) (which includes npm) installed on your computer.
* A code editor like [Visual Studio Code](https://code.visualstudio.com/).

### Installation Steps

1. **Clone the repository** (or download the source code) to your local machine.

2. **Navigate to the project directory** in your terminal:

    ```bash
    cd your-project-folder
    ```

3. **Install dependencies:**

    ```bash
    npm install
    ```

4. **Set up your Firebase Configuration:**
    * Follow the **Firebase Configuration** guide below to create your own Firebase project.
    * Once you have your Firebase config keys, open the `src/App.js` file.
    * Find the `firebaseConfig` object and replace the placeholder values with your own keys.

5. **Run the application:**

    ```bash
    npm start
    ```

    This will start the development server and open the app in your browser at `http://localhost:3000`.

## Firebase Configuration

This project requires a Firebase project to handle the backend functionality.

1. **Create a Firebase Project:**
    * Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
    * Give it a name (e.g., "my-retro-chat").

2. **Create a Web App:**
    * In your project dashboard, click the web icon (`</>`) to add a web app.
    * Register the app and Firebase will provide you with a `firebaseConfig` object. **Copy this object.**

3. **Enable Authentication:**
    * Go to **Build > Authentication**.
    * Click "Get started".
    * Under the "Sign-in method" tab, enable the **Anonymous** provider.

4. **Set up Firestore Database:**
    * Go to **Build > Firestore Database**.
    * Click "Create database" and start in **production mode**.
    * Go to the **Rules** tab and paste the following rules to allow authenticated users to read/write:

    ```
    rules_version = '2';
    service cloud.firestore {
        match /databases/{database}/documents {
        // Allow anyone with an account to read and write to the public data
        match /artifacts/{appId}/public/data/{document=**} {
            allow read, write: if request.auth != null;
        }
        }
    }
    ```

    * Publish the rules.

5. **Set up Realtime Database (for presence):**
    * Go to **Build > Realtime Database**.
    * Click "Create database" and start in **locked mode**.
    * Go to the **Rules** tab and paste the following rules:
  
        ```json
        {
          "rules": {
            "status": {
              "$uid": {
                ".read": "auth != null",
                ".write": "auth.uid === $uid"
              }
            }
          }
        }
        ```

    * Publish the rules.

## Deployment

The easiest way to deploy this app for free is with **Firebase Hosting**.

1. **Install Firebase Tools** (if you haven't already):

    ```bash
    npm install -g firebase-tools
    ```

2. **Login to Firebase:**

    ```bash
    firebase login
    ```

3. **Initialize Hosting:**
    * In your project's root directory, run: `firebase init`
    * Choose **Hosting**.
    * Connect it to your existing Firebase project.
    * Set your public directory to **`build`**.
    * Configure as a **single-page app**.
    * Decline to set up GitHub Action deploys for now.

4. **Build the App:**

    ```bash
    npm run build
    ```

5. **Deploy:**

    ```bash
    firebase deploy
    ```

    Firebase will provide you with a live URL where your app is hosted.

## How to Use

* **Chat:** Simply type your message in the command line at the bottom and press Enter or click the "SEND" button.
* **Change Username:** On desktop, the username editor is in the left sidebar. On mobile, open the "USERS" panel to find it.
* **View Online Users:** The user list is always visible on desktop. On mobile, tap the "USERS" button to open the system modal.
* **Enjoy the Chaos:** Let the "SYSTEM ANOMALY" panel entertain you with random Bengali slang while you chat.

---

Enjoy the retro vibes of **SouraLand!**
