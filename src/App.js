import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent } from "firebase/analytics";
import {
    getAuth,
    onAuthStateChanged,
    signInAnonymously
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    addDoc,
    query,
    onSnapshot,
    serverTimestamp,
    doc,
    setDoc,
    updateDoc
} from 'firebase/firestore';
import { getDatabase, ref, onValue, set, onDisconnect } from "firebase/database";
import * as Tone from 'tone';

// --- Secure Firebase Configuration ---
// Keys are now read from environment variables (.env file)
const firebaseConfig = {
    apiKey: process.env.REACT_APP_API_KEY,
    authDomain: process.env.REACT_APP_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_PROJECT_ID,
    storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_APP_ID,
    databaseURL: process.env.REACT_APP_DATABASE_URL,
    measurementId: process.env.REACT_APP_MEASUREMENT_ID
};


// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

let realTimeDb = null;
try {
    realTimeDb = getDatabase(app);
} catch (error) {
    console.error("Could not initialize Firebase Realtime Database. Presence feature will be disabled.", error);
}

const khistiJokes = [
    "I would love to invite you to a diddy party !",
    "It's a shame cannibalism is illegal Cause you're a snacc",
    "Wassup Broke Boy 👦",
    "তুমি কি ফ্রীজ কারন তোমাকে আমি খুলে খেতে চাই",
    "I'm no photographer, but I can definitely picture you and me together.",
    "Hey girl are you mexican, 'cause you illegally came into my mind.",
    "Ja reply dili, Google o search kore peto na.",
    "Tor logic er pashe ami ekta bari banabo, tar naam debo 'Illogical'.",
];

// --- Custom Retro CSS ---
const RetroStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
    
    .font-press-start { font-family: 'Press Start 2P', cursive; }
    .font-vt323 { font-family: 'VT323', monospace; font-size: 1.3rem; }

    .text-glow {
        text-shadow: 0 0 5px rgba(45, 201, 55, 0.7), 0 0 10px rgba(45, 201, 55, 0.5);
    }
    
    .btn-pipboy {
      background-color: transparent;
      border: 2px solid #2dc937;
      color: #2dc937;
      padding: 5px 10px;
    }
    .btn-pipboy:active { background-color: rgba(45, 201, 55, 0.2); }
    
    .window-frame {
        border: 2px solid #2dc937;
        background-color: rgba(45, 201, 55, 0.05);
    }
    .window-title-bar {
        background-color: #2dc937;
        padding: 2px 5px;
        color: black;
        text-shadow: 1px 1px #88ff8d;
    }

    .scanlines {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      background: linear-gradient(to bottom, rgba(18, 18, 18, 0), rgba(18, 18, 18, 0) 50%, rgba(18, 18, 18, 0.2) 50%);
      background-size: 100% 2px;
      animation: scan 15s linear infinite;
    }
    
    @keyframes scan {
      0% { background-position: 0 0; }
      100% { background-position: 0 100px; }
    }
    
    .blinking-cursor {
        animation: blink 1s step-end infinite;
    }
    
    .blinking-rec {
        animation: blink-rec 2s step-end infinite;
    }

    @keyframes blink {
        0%, 100% { background-color: #2dc937; }
        50% { background-color: transparent; }
    }
    
    @keyframes blink-rec {
        0%, 100% { color: #ff4141; }
        50% { color: #822a2a; }
    }
    
    .pipboy-bg {
        background-color: #050805;
    }

    .pipboy-tab {
        border: 2px solid #2dc937;
        border-bottom: none;
        background-color: #0a0f0a;
        padding: 5px 10px;
        margin-right: 5px;
        opacity: 0.6;
        cursor: pointer;
    }
    .pipboy-tab.active {
        opacity: 1;
        background-color: rgba(45, 201, 55, 0.1);
    }
    
    .pipboy-frame-outer {
        padding: 10px;
        border: 2px solid #2dc937;
        background: #000;
        height: 100vh;
        width: 100vw;
    }
    
    .status-bar-container {
        display: flex;
        gap: 10px;
        width: 100%;
    }
    .status-bar {
        height: 20px;
        border: 2px solid #2dc937;
        padding: 2px;
        flex-grow: 1;
    }
    .status-bar-fill {
        height: 100%;
        background-color: #2dc937;
        width: 80%; /* Example fill */
    }
  `}</style>
);


// --- Main App Component ---
export default function App() {
    // --- State Management ---
    const [user, setUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [onlineUsers, setOnlineUsers] = useState({});
    const [userProfiles, setUserProfiles] = useState({});
    const [displayName, setDisplayName] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isUserModalVisible, setIsUserModalVisible] = useState(false);
    const [currentJoke, setCurrentJoke] = useState(khistiJokes[Math.floor(Math.random() * khistiJokes.length)]);
    const [isBooting, setIsBooting] = useState(true);
    const [activeTab, setActiveTab] = useState('STAT');
    const [currentTime, setCurrentTime] = useState(new Date());
    const messagesEndRef = useRef(null);
    const messageCountRef = useRef(0);
    const lastSoundPlayed = useRef(0);

    const appId = 'local-chat-app';
    
    // --- Sound Effects Setup ---
    const sounds = useRef(null);
    useEffect(() => {
        sounds.current = {
            click: new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 } }).toDestination(),
            receive: new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 } }).toDestination(),
            boot: new Tone.Synth({ oscillator: { type: 'sawtooth' } }).toDestination(),
            yeet: new Tone.MembraneSynth({
                pitchDecay: 0.05,
                octaves: 10,
                oscillator: { type: 'sine' },
                envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: 'exponential' }
            }).toDestination(),
        };
        const startAudio = () => Tone.start();
        window.addEventListener('click', startAudio, { once: true });
        return () => window.removeEventListener('click', startAudio);
    }, []);

    const playClick = () => sounds.current?.click.triggerAttackRelease('C4', '8n');
    const playYeetSound = () => {
        sounds.current?.yeet.triggerAttackRelease("C2", "8n");
    };
    const playReceive = () => {
        const now = Tone.now();
        if (now - lastSoundPlayed.current > 0.2 && sounds.current?.receive) {
            sounds.current.receive.triggerAttackRelease('G4', '8n');
            lastSoundPlayed.current = now;
        }
    };
    const playBootSound = () => {
        const now = Tone.now();
        sounds.current?.boot.triggerAttackRelease("C2", "8n", now);
        sounds.current?.boot.triggerAttackRelease("G2", "8n", now + 0.2);
        sounds.current?.boot.triggerAttackRelease("E3", "8n", now + 0.4);
    };

    // --- Boot Sequence & Clock Effect ---
    useEffect(() => {
        playBootSound();
        setTimeout(() => setIsBooting(false), 2000);
        const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(clockInterval);
    }, []);

    // --- Authentication & User Profile Setup ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                const savedName = localStorage.getItem('displayName');
                const initialName = savedName || `User-${user.uid.substring(0, 6)}`;
                setDisplayName(initialName);
                
                const userDocRef = doc(db, `/artifacts/${appId}/public/data/users/${user.uid}`);
                await setDoc(userDocRef, { name: initialName }, { merge: true });

            } else {
                await signInAnonymously(auth).catch(err => console.error(err));
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, [appId]);
    
    // --- Joke Cycling Effect ---
    useEffect(() => {
        const jokeInterval = setInterval(() => {
            setCurrentJoke(khistiJokes[Math.floor(Math.random() * khistiJokes.length)]);
        }, 15000);
        return () => clearInterval(jokeInterval);
    }, []);

    // --- Presence & User Profiles Listener ---
    useEffect(() => {
        if (!isAuthReady || !user || !realTimeDb) return;
        const userStatusRef = ref(realTimeDb, `/status/${user.uid}`);
        set(userStatusRef, { isOnline: true });
        onDisconnect(userStatusRef).set({ isOnline: false });
        
        const statusRef = ref(realTimeDb, '/status/');
        const unsubscribeStatus = onValue(statusRef, (snapshot) => {
            setOnlineUsers(snapshot.val() || {});
        });

        const usersColRef = collection(db, `/artifacts/${appId}/public/data/users`);
        const unsubscribeProfiles = onSnapshot(usersColRef, (snapshot) => {
            const profiles = {};
            snapshot.forEach(doc => {
                profiles[doc.id] = doc.data();
            });
            setUserProfiles(profiles);
        });

        return () => {
            unsubscribeStatus();
            unsubscribeProfiles();
        };
    }, [isAuthReady, user, appId]);

    // --- Message Fetching & Sound Effect ---
    useEffect(() => {
        if (!isAuthReady || !user) return;
        const q = query(collection(db, `/artifacts/${appId}/public/data/messages`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            msgs.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);
            if (msgs.length > messageCountRef.current && msgs[msgs.length - 1].uid !== user.uid) {
                playReceive();
            }
            messageCountRef.current = msgs.length;
            setMessages(msgs);
        });
        return () => unsubscribe();
    }, [isAuthReady, user, appId]);

    // --- Auto-scroll Effect ---
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, [messages]);

    // --- Send Message Handler ---
    const sendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === "" || !user) return;
        playYeetSound();
        try {
            await addDoc(collection(db, `/artifacts/${appId}/public/data/messages`), {
                text: newMessage,
                createdAt: serverTimestamp(),
                uid: user.uid,
            });
            logEvent(analytics, 'send_message', { length: newMessage.length });
            setNewMessage("");
        } catch (error) {
            console.error("Error sending message: ", error);
        }
    };
    
    // --- Handle Username Change ---
    const handleNameChange = async () => {
        if (!user || !displayName.trim()) return;
        playClick();
        const newName = displayName.trim();
        localStorage.setItem('displayName', newName);
        const userDocRef = doc(db, `/artifacts/${appId}/public/data/users/${user.uid}`);
        await updateDoc(userDocRef, { name: newName });
        setIsEditingName(false);
    };

    if (isBooting) {
        return (
            <div className="flex items-center justify-center h-screen bg-black text-green-500 font-vt323">
                <p className="text-glow text-2xl">INITIALIZING <b>SOURA</b> TECHNOLOGY (TM) PROTOCOLS...</p>
            </div>
        );
    }

    return (
        <div className="pipboy-frame-outer">
            <RetroStyles />
            {/* User List Modal for Mobile */}
            {isUserModalVisible && (
                <div className="absolute inset-0 bg-black bg-opacity-90 z-50 p-2 flex flex-col md:hidden font-vt323 text-green-500">
                    <div className="window-frame p-2 flex flex-col mb-2">
                        <div className="window-title-bar flex justify-between items-center">
                            <h2 className="font-press-start text-xs">SYSTEM</h2>
                            <button onClick={() => { playClick(); setIsUserModalVisible(false); }} className="p-1 btn-pipboy text-xs font-bold">X</button>
                        </div>
                        <div className="p-2">
                            <h3 className="font-bold mb-1">YOUR NAME:</h3>
                            {isEditingName ? (
                                <div className="flex">
                                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="flex-1 bg-black border border-green-500 p-1"/>
                                    <button onClick={handleNameChange} className="ml-2 btn-pipboy">Save</button>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center">
                                    <span>{displayName}</span>
                                    <button onClick={() => setIsEditingName(true)} className="btn-pipboy">Edit</button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="window-frame p-2 flex-grow flex flex-col mb-2">
                        <div className="window-title-bar font-press-start text-xs">ONLINE USERS</div>
                        <ul className="flex-grow overflow-y-auto pr-1 mt-2">
                            {Object.keys(onlineUsers).filter(uid => onlineUsers[uid]?.isOnline).map((uid) => (
                                <li key={uid} className="flex items-center p-1 my-1">
                                    <span className="w-2 h-2 bg-green-500 mr-2 flex-shrink-0 animate-pulse"></span>
                                    <span className="truncate text-sm" title={userProfiles[uid]?.name}>{userProfiles[uid]?.name || `User-${uid.substring(0, 6)}`}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="window-frame p-2 text-xs flex-grow">
                        <p className="font-bold text-red-500 font-press-start text-xs">:: SYSTEM ANOMALY ::</p>
                        <p className="break-words text-yellow-300 h-full overflow-y-auto text-lg">{currentJoke}</p>
                    </div>
                </div>
            )}

            <div className="relative flex h-full bg-black text-green-500 font-vt323 overflow-hidden pipboy-bg">
                <div className="scanlines"></div>
                
                {/* Static Sidebar for Desktop */}
                <div className="w-1/3 p-2 border-r-2 border-green-500 flex-col hidden md:flex space-y-2">
                     <div className="window-frame flex-grow flex flex-col min-h-0">
                        <div className="window-title-bar font-press-start text-xs">SYSTEM STATUS</div>
                        <div className="p-2 flex-grow flex flex-col">
                            <div className="text-center font-press-start text-2xl text-glow">{currentTime.toLocaleTimeString()}</div>
                            <div className="text-center text-sm mb-4">{currentTime.toDateString()}</div>
                            <h3 className="font-bold mb-1 font-press-start text-xs mt-2">YOUR NAME:</h3>
                            {isEditingName ? (
                                <div className="flex">
                                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="flex-1 bg-black border border-green-500 p-1"/>
                                    <button onClick={handleNameChange} className="ml-2 btn-pipboy">Save</button>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center">
                                    <span>{displayName}</span>
                                    <button onClick={() => setIsEditingName(true)} className="btn-pipboy">Edit</button>
                                </div>
                            )}
                            <div className="mt-auto">
                                <h3 className="font-bold mb-1 font-press-start text-xs">CONDITION</h3>
                                <div className="status-bar"><div className="status-bar-fill w-full"></div></div>
                                <p className="text-xs text-center mt-1">V.1.0.S</p>
                            </div>
                        </div>
                     </div>
                     <div className="window-frame h-48 flex flex-col">
                         <div className="window-title-bar font-press-start text-xs">SYSTEM ANOMALY</div>
                         <p className="break-words text-yellow-300 h-full overflow-y-auto p-2 text-base">{currentJoke}</p>
                     </div>
                </div>


                {/* Main Chat Area */}
                <div className="flex-col flex-1 flex min-w-0">
                    <header className="bg-black border-b-2 border-green-500 p-2 flex justify-between items-center">
                        <h1 className="text-lg font-press-start text-glow">Welcome to SouraLand!</h1>
                        <div className="flex items-center">
                             <div className="blinking-rec mr-2 text-red-500 font-bold">● REC</div>
                             <button onClick={() => { playClick(); setIsUserModalVisible(true); }} className="p-1 btn-pipboy font-bold md:hidden ml-2">USERS</button>
                        </div>
                    </header>

                    <div className="flex-1 p-2 overflow-y-auto m-2">
                        <div className="flex mb-2">
                            {['STAT', 'INV', 'DATA'].map(tab => (
                                <div key={tab} onClick={() => { playClick(); setActiveTab(tab); }} className={`pipboy-tab font-press-start text-xs ${activeTab === tab ? 'active' : ''}`}>{tab}</div>
                            ))}
                        </div>
                        {activeTab === 'STAT' && (
                             <div className="window-frame p-2 mb-2 md:hidden">
                                <div className="window-title-bar font-press-start text-xs">ONLINE USERS</div>
                                <ul className="p-2">
                                    {Object.keys(onlineUsers).filter(uid => onlineUsers[uid]?.isOnline).map((uid) => (
                                        <li key={uid} className="flex items-center p-1 my-1">
                                            <span className="w-2 h-2 bg-green-500 mr-2 flex-shrink-0 animate-pulse"></span>
                                            <span className="truncate" title={userProfiles[uid]?.name}>{userProfiles[uid]?.name || `User-${uid.substring(0, 6)}`}</span>
                                        </li>
                                    ))}
                                </ul>
                             </div>
                        )}
                        {messages.map((msg) => (
                            <div key={msg.id} className="my-1">
                                <p>
                                    <span className="text-gray-500">[{new Date(msg.createdAt?.seconds * 1000).toLocaleTimeString()}]</span>
                                    <span className={`font-bold ml-2 ${msg.uid === user.uid ? 'text-lime-400' : 'text-cyan-400'}`}>{userProfiles[msg.uid]?.name || `User-${msg.uid.substring(0,6)}`}:</span>
                                    <span className="ml-2 break-words text-white">{msg.text}</span>
                                </p>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-2 border-t-2 border-green-500">
                        <div className="status-bar-container mb-2">
                            <div className="flex items-center">
                                <span className="font-bold mr-2">HP</span>
                                <div className="status-bar"><div className="status-bar-fill"></div></div>
                            </div>
                            <div className="flex items-center">
                                <span className="font-bold mr-2">AP</span>
                                <div className="status-bar"><div className="status-bar-fill"></div></div>
                            </div>
                        </div>
                       <form onSubmit={sendMessage} className="flex items-center">
                          <span className="mr-2 text-green-500 font-bold">&gt;</span>
                          <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              className="flex-1 p-1 bg-transparent text-green-500 border-none focus:outline-none"
                              placeholder=""
                          />
                           <span className="w-2 h-5 bg-green-500 blinking-cursor"></span>
                          <button type="submit" className="ml-2 px-4 py-1 btn-pipboy font-bold" disabled={!newMessage.trim()}>YEET -&gt;</button>
                      </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
