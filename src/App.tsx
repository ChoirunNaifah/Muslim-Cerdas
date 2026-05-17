/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReactNode, FormEvent } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { 
  Home, 
  Moon, 
  Sun, 
  CheckCircle2, 
  RotateCcw, 
  Calendar as CalendarIcon, 
  BookOpen, 
  Plus, 
  Flame,
  User,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Constants & Types ---

const DZIKIR_LIST = [
  { 
    id: 'subhanallah', 
    arabic: 'سُبْحَانَ اللَّهِ', 
    latin: 'Subhanallah', 
    translation: 'Maha Suci Allah',
    target: 33 
  },
  { 
    id: 'alhamdulillah', 
    arabic: 'الْحَمْدُ لِلَّهِ', 
    latin: 'Alhamdulillah', 
    translation: 'Segala puji bagi Allah',
    target: 33 
  },
  { 
    id: 'allahuakbar', 
    arabic: 'اللَّهُ أَكْبَرُ', 
    latin: 'Allahu Akbar', 
    translation: 'Allah Maha Besar',
    target: 33 
  },
  { 
    id: 'istighfar', 
    arabic: 'أَسْتَغْفِرُ اللَّهَ', 
    latin: 'Astaghfirullah', 
    translation: 'Aku memohon ampun kepada Allah',
    target: 100 
  },
  { 
    id: 'tahlil', 
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', 
    latin: 'La ilaha illallah', 
    translation: 'Tiada Tuhan selain Allah',
    target: 100 
  }
];

const QUOTES = [
  "Barangsiapa yang menempuh jalan untuk mencari ilmu, maka Allah akan mudahkan baginya jalan menuju surga.",
  "Sesungguhnya sesudah kesulitan itu ada kemudahan.",
  "Jadikanlah sabar dan sholat sebagai penolongmu.",
  "Maka nikmat Tuhanmu yang manakah yang kamu dustakan?",
  "Amalan yang paling dicintai Allah adalah yang berkelanjutan meskipun sedikit.",
  "Senyummu di hadapan saudaramu adalah sedekah.",

];

type Habit = {
  id: string;
  name: string;
  completed: boolean;
};

type JournalEntry = {
  date: string;
  text: string;
};

type AppState = {
  habits: Habit[];
  tasbihCount: number;
  journalEntries: JournalEntry[];
  lastCompletedDate: string | null;
  streak: number;
  history: string[]; // dates of completion
  xp: number;
  level: number;
};

type UserData = {
  username: string;
  name: string;
  state: AppState;
};

const INITIAL_HABITS: Habit[] = [
  { id: 'sholat', name: 'Sholat 5 Waktu', completed: false },
  { id: 'sedekah', name: 'Sedekah Harian', completed: false },
  { id: 'dzikir', name: 'Dzikir Pagi/Petang', completed: false },
  { id: 'quran', name: 'Membaca Al-Qur\'an', completed: false },
];

const INITIAL_USER_STATE: AppState = {
  habits: INITIAL_HABITS,
  tasbihCount: 0,
  journalEntries: [],
  lastCompletedDate: null,
  streak: 0,
  history: [],
  xp: 0,
  level: 1,
};

// --- Utilities ---

const getTodayDate = () => new Date().toISOString().split('T')[0];

const getUsers = (): Record<string, UserData> => {
  return JSON.parse(localStorage.getItem('muslim_cerdas_users') || '{}');
};

const saveUsers = (users: Record<string, UserData>) => {
  localStorage.setItem('muslim_cerdas_users', JSON.stringify(users));
};

const getCurrentUser = (): UserData | null => {
  const username = localStorage.getItem('muslim_cerdas_current_user');
  if (!username) return null;
  const users = getUsers();
  return users[username] || null;
};

// --- Components ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(getCurrentUser());
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<'home' | 'tasbih' | 'journal'>('home');
  const [selectedDzikirIndex, setSelectedDzikirIndex] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [state, setState] = useState<AppState>(INITIAL_USER_STATE);
  const [greeting, setGreeting] = useState('');
  const [randomQuote, setRandomQuote] = useState('');

  // Sync state when user logs in
  useEffect(() => {
    if (currentUser) {
      setState(currentUser.state);
    }
  }, [currentUser]);

  // Initialization
  useEffect(() => {
    // Set greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Selamat Pagi');
    else if (hour < 17) setGreeting('Selamat Siang');
    else if (hour < 20) setGreeting('Selamat Sore');
    else setGreeting('Selamat Malam');

    // Set quote
    setRandomQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

    // Check for new day to reset habits if user is logged in
    if (currentUser) {
      const today = getTodayDate();
      if (currentUser.state.lastCompletedDate !== today) {
        const resetHabits = currentUser.state.habits.map(h => ({ ...h, completed: false }));
        const newState = { ...currentUser.state, habits: resetHabits, lastCompletedDate: today };
        updateUserState(newState);
      }
    }
  }, [currentUser?.username]);

  // Theme toggle
  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  // Derived Values
  const progress = useMemo(() => {
    const completed = state.habits.filter(h => h.completed).length;
    return (completed / state.habits.length) * 100;
  }, [state.habits]);

  const levelInfo = useMemo(() => {
    const xpPerLevel = 100;
    const currentLevel = Math.floor(state.xp / xpPerLevel) + 1;
    const progressInCurrentLevel = (state.xp % xpPerLevel);
    let rank = 'Pemula';
    if (currentLevel > 5) rank = 'Penyemangat';
    if (currentLevel > 10) rank = 'Istiqomah';
    if (currentLevel > 20) rank = 'Teladan';
    
    return { level: currentLevel, xpProgress: progressInCurrentLevel, rank };
  }, [state.xp]);

  // User Actions
  const addXP = (amount: number) => {
    updateUserState({ ...state, xp: state.xp + amount });
  };

  const updateUserState = (newState: AppState) => {
    if (!currentUser) return;
    const users = getUsers();
    const updatedUser = { ...currentUser, state: newState };
    users[currentUser.username] = updatedUser;
    saveUsers(users);
    setCurrentUser(updatedUser);
    setState(newState);
  };

  const handleAuth = (username: string, name?: string) => {
    const users = getUsers();
    if (authMode === 'register') {
      if (users[username]) {
        alert('Username sudah terdaftar!');
        return;
      }
      const newUser: UserData = {
        username,
        name: name || username,
        state: INITIAL_USER_STATE,
      };
      users[username] = newUser;
      saveUsers(users);
      localStorage.setItem('muslim_cerdas_current_user', username);
      setCurrentUser(newUser);
    } else {
      const user = users[username];
      if (!user) {
        alert('User tidak ditemukan!');
        return;
      }
      localStorage.setItem('muslim_cerdas_current_user', username);
      setCurrentUser(user);
    }
  };

  const logout = () => {
    localStorage.removeItem('muslim_cerdas_current_user');
    setCurrentUser(null);
  };

  // Actions
  const toggleHabit = (id: string) => {
    const newHabits = state.habits.map(h => 
      h.id === id ? { ...h, completed: !h.completed } : h
    );
    
    // Check if target (e.g. 3 tasks) met for streak
    const completedCount = newHabits.filter(h => h.completed).length;
    let newStreak = state.streak;
    let newHistory = [...state.history];
    const today = getTodayDate();

    if (completedCount >= 3 && !state.history.includes(today)) {
      newHistory.push(today);
      newStreak += 1;
    } else if (completedCount < 3 && state.history.includes(today)) {
      newHistory = newHistory.filter(d => d !== today);
      newStreak = Math.max(0, newStreak - 1);
    }
    
    // Reward logic
    const wasCompleted = state.habits.find(h => h.id === id)?.completed;
    const xpReward = !wasCompleted ? 20 : -20;

    const newState = { 
      ...state, 
      habits: newHabits, 
      streak: newStreak, 
      history: newHistory,
      xp: Math.max(0, state.xp + xpReward)
    };
    updateUserState(newState);
  };

  const incrementTasbih = () => {
    const newCount = state.tasbihCount + 1;
    const xpBonus = newCount % 33 === 0 ? 10 : 1;
    updateUserState({ ...state, tasbihCount: newCount, xp: state.xp + xpBonus });
  };

  const resetTasbih = () => {
    updateUserState({ ...state, tasbihCount: 0 });
  };

  const addJournalEntry = (text: string) => {
    const today = getTodayDate();
    const newEntries = [
      { date: today, text },
      ...state.journalEntries.filter(e => e.date !== today)
    ];
    updateUserState({ ...state, journalEntries: newEntries, xp: state.xp + 50 });
  };

  if (!currentUser) {
    return (
      <div className="mobile-container flex items-center justify-center p-6 bg-sage overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full card-soft bg-white dark:bg-charcoal p-8 space-y-6 relative z-10"
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-display font-bold text-sage">Muslim Cerdas</h1>
            <p className="text-sm text-gray-400">Mulailah kebiasaan baik sekarang.</p>
          </div>

          <AuthForm 
            mode={authMode} 
            onSwitch={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            onAuth={handleAuth}
          />
        </motion.div>
        
        {/* Background blobs for auth */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-apricot/20 rounded-full blur-3xl"></div>
      </div>
    );
  }

  return (
    <div className="mobile-container pb-24 px-6 pt-10 min-h-[720px]">
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-white dark:bg-charcoal/50 rounded-b-2xl shadow-sm z-[60]"></div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">17 Zulkaidah 1447 H</p>
          <div className="flex items-baseline gap-2">
            <h1 className="text-2xl font-bold text-charcoal font-display">
              {greeting}, <span className="text-sage-light">{currentUser.name}!</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-sage/10 text-sage text-[10px] font-bold px-2 py-0.5 rounded-full">
              LVL {levelInfo.level} {levelInfo.rank}
            </div>
            <div className="flex-1 w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${levelInfo.xpProgress}%` }}
                 className="h-full bg-sage"
               />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-3 bg-white dark:bg-charcoal/40 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 active:scale-90 transition-transform"
          >
            {isDark ? <Sun className="w-5 h-5 text-apricot" /> : <Moon className="w-5 h-5 text-sage" />}
          </button>
          <button 
            onClick={logout}
            className="p-3 bg-white dark:bg-charcoal/40 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 active:scale-90 transition-transform"
          >
            <User className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Quote Card */}
            <div className="card-soft bg-sage/10 dark:bg-sage/5 border-sage/20 text-sage/80 relative overflow-hidden">
               <div className="absolute top-[-10px] right-[-10px] opacity-10">
                  <User size={80} />
               </div>
               <p className="italic text-lg font-medium leading-relaxed relative z-10 text-sage-dark dark:text-sage">
                 "{randomQuote}"
               </p>
               <p className="text-[10px] font-bold mt-4 uppercase tracking-[0.2em] opacity-60">— Motivasi Hari Ini</p>
            </div>

            {/* Progress Card */}
            <div className="bg-sage rounded-[2.5rem] p-6 text-white shadow-xl shadow-sage/20 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest">Target Hari Ini</span>
                  <div className="flex items-center gap-1 bg-apricot px-2 py-1 rounded-full shadow-sm">
                    <Flame className="w-3 h-3 fill-white text-white" />
                    <span className="text-[10px] font-bold">{state.streak} Hari</span>
                  </div>
                </div>
                <h2 className="text-4xl font-light leading-none font-display">
                  {Math.round(progress)}<span className="text-xl opacity-70">%</span>
                </h2>
                <p className="text-xs opacity-80 mt-1">Cerdas Ibadah Tercapai</p>
                <div className="w-full bg-black/10 h-1.5 rounded-full mt-6 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="bg-white h-full rounded-full"
                  />
                </div>
              </div>
              <div className="absolute -right-6 -bottom-6 opacity-10">
                <LayoutDashboard size={140} />
              </div>
            </div>

            {/* Prayer Schedule */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-2 font-display">Waktu Sholat</h3>
              <div className="grid grid-cols-5 gap-2 px-1">
                <PrayerTime name="Subuh" time="04:32" />
                <PrayerTime name="Dzuhur" time="11:45" active />
                <PrayerTime name="Ashar" time="15:02" />
                <PrayerTime name="Maghrib" time="17:54" />
                <PrayerTime name="Isya" time="19:08" />
              </div>
            </div>

            {/* Habit List */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-2 font-display">Habit Tracker</h3>
              <div className="space-y-2">
                {state.habits.map((habit) => (
                  <button
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    className="w-full flex items-center justify-between bg-white dark:bg-charcoal/20 p-4 rounded-[1.8rem] border border-black/[0.03] dark:border-white/5 shadow-sm active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                        habit.completed ? 'bg-sage border-sage' : 'border-sage/30'
                      }`}>
                        {habit.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <span className={`text-sm font-semibold ${habit.completed ? 'text-charcoal dark:text-cream' : 'text-gray-400'}`}>
                        {habit.name}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                      habit.completed 
                      ? 'bg-sage/10 text-sage' 
                      : 'bg-gray-100 dark:bg-charcoal/30 text-gray-400'
                    }`}>
                      {habit.completed ? 'Selesai' : 'Nanti'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mini Reflection Prompt */}
            <div className="bg-apricot/5 dark:bg-apricot/10 p-5 rounded-[2.2rem] border border-apricot/20 text-center space-y-2">
              <p className="text-xs italic text-charcoal/70 dark:text-cream/70 leading-relaxed">
                "Apa yang kamu syukuri hari ini?"
              </p>
              <button 
                onClick={() => setActiveTab('journal')}
                className="text-[10px] text-gray-400 font-medium underline underline-offset-4"
              >
                Tulis di jurnal refleksi...
              </button>
            </div>

            {/* Weekly Insights */}
            <div className="card-soft space-y-4">
               <h3 className="text-sm font-bold opacity-60">Insight Mingguan</h3>
               <div className="flex items-end justify-between h-24 px-2 gap-3">
                  {[40, 70, 45, 90, 65, 30, 80].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        className={`w-full rounded-t-lg transition-colors ${h > 60 ? 'bg-sage' : 'bg-gray-200 dark:bg-charcoal/40 group-hover:bg-sage/40'}`}
                      />
                      <span className="text-[8px] font-bold opacity-40">{['M', 'S', 'S', 'R', 'K', 'J', 'S'][i]}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* Calendar Mini View */}
            <div className="card-soft">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-sage" />
                Jejak Kebaikan
              </h3>
              <CalendarHeatmap history={state.history} />
            </div>
          </motion.div>
        )}

        {activeTab === 'tasbih' && (
          <motion.div 
            key="tasbih"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center pt-4 space-y-8"
          >
            {/* Dzikir Selection */}
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Pilih Dzikir</h3>
                <span className="text-[10px] font-bold text-sage bg-sage/10 px-2 py-0.5 rounded-full">Target: {DZIKIR_LIST[selectedDzikirIndex].target}</span>
              </div>
              <div className="flex overflow-x-auto gap-3 pb-2 px-1 scrollbar-hide no-scrollbar">
                {DZIKIR_LIST.map((dzikir, idx) => (
                  <button
                    key={dzikir.id}
                    onClick={() => { setSelectedDzikirIndex(idx); resetTasbih(); }}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl border transition-all text-xs font-bold ${
                      selectedDzikirIndex === idx 
                      ? 'bg-sage text-white border-sage' 
                      : 'bg-white dark:bg-charcoal/20 text-charcoal/40 border-black/5 dark:border-white/5'
                    }`}
                  >
                    {dzikir.latin}
                  </button>
                ))}
              </div>
            </div>

            {/* Dzikir Display */}
            <div className="text-center space-y-2 py-4">
               <motion.h2 
                 key={DZIKIR_LIST[selectedDzikirIndex].arabic}
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="text-4xl font-bold text-charcoal dark:text-cream leading-loose"
                 style={{ fontFamily: 'serif' }}
               >
                 {DZIKIR_LIST[selectedDzikirIndex].arabic}
               </motion.h2>
               <p className="text-sage font-bold tracking-wide">{DZIKIR_LIST[selectedDzikirIndex].latin}</p>
               <p className="text-xs opacity-40 italic">{DZIKIR_LIST[selectedDzikirIndex].translation}</p>
            </div>

            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={incrementTasbih}
                className="w-56 h-56 rounded-full bg-white dark:bg-slate-dark shadow-2xl border-8 border-sage flex flex-col items-center justify-center space-y-2 btn-playful"
              >
                <span className="text-6xl font-display font-bold text-charcoal dark:text-cream">
                  {state.tasbihCount}
                </span>
                <span className="text-[10px] font-bold opacity-30 uppercase tracking-[0.3em]">Ketuk</span>
              </motion.button>
              
              <div className="absolute top-0 right-0 w-12 h-12 bg-apricot rounded-full border-4 border-white dark:border-slate-dark flex items-center justify-center text-white font-bold shadow-lg">
                {Math.floor(state.tasbihCount / DZIKIR_LIST[selectedDzikirIndex].target)}
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={resetTasbih}
                className="flex items-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full font-bold active:scale-95 transition-transform text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'journal' && (
          <motion.div 
            key="journal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <div className="card-soft">
              <h2 className="text-xl font-display font-bold mb-2">Refleksi Hari Ini</h2>
              <p className="text-sm opacity-60 mb-6">Apa yang kamu syukuri hari ini?</p>
              
              <JournalForm onSave={addJournalEntry} />
            </div>

            <div className="space-y-4">
               <h3 className="font-display font-semibold text-lg px-2">Catatan Sebelumnya</h3>
               {state.journalEntries.length === 0 ? (
                 <div className="p-12 text-center opacity-40">
                   <BookOpen className="w-12 h-12 mx-auto mb-4" />
                   <p>Belum ada catatan refleksi.</p>
                 </div>
               ) : (
                 state.journalEntries.map((entry, idx) => (
                   <div key={idx} className="card-soft">
                     <p className="text-xs font-bold text-sage mb-2">{entry.date}</p>
                     <p className="text-charcoal/80 dark:text-cream/80">{entry.text}</p>
                   </div>
                 ))
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-charcoal/90 backdrop-blur-md border-t border-gray-100 dark:border-white/5 flex items-center justify-around px-8 z-50">
        <NavButton 
          active={activeTab === 'home'} 
          onClick={() => setActiveTab('home')}
          icon={<Home size={22} />}
          label="Utama"
        />
        <NavButton 
          active={activeTab === 'tasbih'} 
          onClick={() => setActiveTab('tasbih')}
          icon={<RotateCcw size={22} />}
          label="Tasbih"
        />
        <NavButton 
          active={activeTab === 'journal'} 
          onClick={() => setActiveTab('journal')}
          icon={<BookOpen size={22} />}
          label="Jurnal"
        />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-sage scale-105' : 'text-gray-300'}`}
    >
       <div className={`transition-colors ${active ? 'text-sage' : ''}`}>
         {icon}
       </div>
       <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function JournalForm({ onSave }: { onSave: (text: string) => void }) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSave(text);
    setText('');
  };

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tuliskan syukurmu..."
        className="w-full h-32 p-4 bg-cream dark:bg-charcoal/20 border border-black/5 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-sage focus:outline-none placeholder:opacity-30 dark:text-cream"
      />
      <button 
        onClick={handleSubmit}
        className="w-full py-4 bg-apricot text-white rounded-2xl font-bold flex items-center justify-center gap-2 btn-playful shadow-lg shadow-apricot/20"
      >
        <Plus className="w-5 h-5" />
        Simpan Refleksi
      </button>
    </div>
  );
}

function PrayerTime({ name, time, active }: { name: string, time: string, active?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
      active 
      ? 'bg-sage text-white border-sage shadow-lg shadow-sage/20 scale-105' 
      : 'bg-white dark:bg-charcoal/20 text-charcoal/60 dark:text-cream/60 border-black/[0.03] dark:border-white/5'
    }`}>
      <span className="text-[8px] font-bold uppercase tracking-tighter mb-1 opacity-60">{name}</span>
      <span className="text-[10px] font-bold">{time}</span>
      {active && <div className="mt-1 w-1 h-1 bg-white rounded-full animate-pulse" />}
    </div>
  );
}

function CalendarHeatmap({ history }: { history: string[] }) {
  // Generate days for current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const days = [];
  // Padding for start of month
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) {
    const curDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({ day: i, completed: history.includes(curDate) });
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, idx) => (
        <div key={`${d}-${idx}`} className="text-[10px] font-bold text-center opacity-30">{d}</div>
      ))}
      {days.map((d, i) => (
        <div 
          key={i} 
          className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold ${
            !d ? 'invisible' : (d.completed ? 'bg-sage text-white' : 'bg-cream dark:bg-charcoal/20 text-charcoal/40 dark:text-cream/40')
          }`}
        >
          {d?.day}
        </div>
      ))}
    </div>
  );
}

function AuthForm({ mode, onSwitch, onAuth }: { mode: 'login' | 'register', onSwitch: () => void, onAuth: (u: string, n?: string) => void }) {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    onAuth(username, name);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Username</label>
        <input 
          type="text" 
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          placeholder=" "
          className="w-full p-4 bg-cream dark:bg-charcoal/20 border border-black/5 rounded-2xl focus:ring-2 focus:ring-sage focus:outline-none"
        />
      </div>
      {mode === 'register' && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Panggilan</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder=""
            className="w-full p-4 bg-cream dark:bg-charcoal/20 border border-black/5 rounded-2xl focus:ring-2 focus:ring-sage focus:outline-none"
          />
        </div>
      )}
      <button 
        type="submit"
        className="w-full py-4 bg-sage text-white rounded-2xl font-bold btn-playful shadow-lg shadow-sage/20"
      >
        {mode === 'login' ? 'Masuk Sekarang' : 'Daftar Baru'}
      </button>
      <button 
        type="button"
        onClick={onSwitch}
        className="w-full text-xs font-bold text-sage opacity-60 hover:opacity-100 transition-opacity"
      >
        {mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
      </button>
    </form>
  );
}
