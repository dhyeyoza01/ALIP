"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Compass, Code, BarChart2, Users,
  Settings, Sun, Moon, MessageSquare, Play, CheckCircle,
  XCircle, Lock, Trophy, Flame, ChevronRight, Zap, Loader2, Send, RotateCcw, Menu
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { SUBJECTS } from "@/lib/data";

type Role = "student" | "teacher";
type View = "dashboard" | "diagnostics" | "roadmap" | "sandbox" | "analytics" | "roster";

interface Question {
  concept: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RoadmapStep {
  title: string;
  description: string;
  status: "completed" | "current" | "locked";
  estimatedTime: string;
}

interface UserProfile {
  name: string;
  role: Role;
  xp: number;
  streak: number;
  lastActiveDate: string;
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  
  const [role, setRole] = useState<Role>("student"); // kept for fallback/legacy logic
  const [view, setView] = useState<View | "settings">("dashboard");
  const [isDark, setIsDark] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");

  // Onboarding state
  const [onboardingName, setOnboardingName] = useState("");
  const [onboardingRole, setOnboardingRole] = useState<Role>("student");

  // Quiz State
  const [quizActive, setQuizActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);

  // Roadmap State
  const [roadmapGenerated, setRoadmapGenerated] = useState(false);
  const [roadmapSteps, setRoadmapSteps] = useState<RoadmapStep[]>([]);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [activeLessonText, setActiveLessonText] = useState("");
  const [isLoadingLesson, setIsLoadingLesson] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem("alip_profile");
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      
      // Streak Calculation
      const today = new Date().toDateString();
      if (parsed.lastActiveDate !== today) {
        if (parsed.lastActiveDate) {
          const lastDate = new Date(parsed.lastActiveDate);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (lastDate.toDateString() === yesterday.toDateString()) {
            parsed.streak = (parsed.streak || 0) + 1;
          } else {
            parsed.streak = 0;
          }
        }
        parsed.lastActiveDate = today;
        localStorage.setItem("alip_profile", JSON.stringify(parsed));
      }
      
      setProfile(parsed);
      setRole(parsed.role);
    }
    const savedTheme = localStorage.getItem("alip_theme");
    if (savedTheme === "dark") {
      setIsDark(true);
    }

    // Hydrate learning progress
    const savedRoadmap = localStorage.getItem("alip_roadmap");
    if (savedRoadmap) {
      try {
        const parsedRoadmap = JSON.parse(savedRoadmap);
        if (parsedRoadmap.steps && parsedRoadmap.steps.length > 0) {
          setRoadmapSteps(parsedRoadmap.steps);
          setRoadmapGenerated(true);
          if (parsedRoadmap.subject) {
            setSelectedSubject(parsedRoadmap.subject);
          }
        }
      } catch (e) {
        console.error("Error parsing saved roadmap", e);
      }
    }

    setIsHydrated(true);
  }, []);

  // Sync roadmap state to local storage
  useEffect(() => {
    if (roadmapGenerated && roadmapSteps.length > 0) {
      localStorage.setItem("alip_roadmap", JSON.stringify({
        subject: selectedSubject,
        steps: roadmapSteps
      }));
    }
  }, [roadmapSteps, roadmapGenerated, selectedSubject]);

  // Teacher Material Generator State
  const [materialTopic, setMaterialTopic] = useState("");
  const [materialGrade, setMaterialGrade] = useState("Beginner (High School)");
  const [materialContent, setMaterialContent] = useState("");
  const [isGeneratingMaterial, setIsGeneratingMaterial] = useState(false);

  // Teacher Roster State
  const [roster, setRoster] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("alip_roster");
      if (saved) return JSON.parse(saved);
    }
    return [
      { id: 1, name: "Alice Chen", focus: "Python Basics", xp: 450, status: "Excelling" },
      { id: 2, name: "Marcus Johnson", focus: "Linear Algebra", xp: 320, status: "On Track" },
      { id: 3, name: "Sophia Martinez", focus: "Organic Chemistry", xp: 120, status: "Struggling" },
      { id: 4, name: "James Wilson", focus: "Microeconomics", xp: 280, status: "On Track" },
    ];
  });

  const saveRoster = (newRoster: any[]) => {
    setRoster(newRoster);
    localStorage.setItem("alip_roster", JSON.stringify(newRoster));
  };

  const [editingRosterId, setEditingRosterId] = useState<number | null>(null);

  // AI Chatbot State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sandbox State
  const [sandboxCode, setSandboxCode] = useState(`def calculate_fibonacci(n):
    if n <= 1:
        return n
    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)

print(calculate_fibonacci(10))`);
  const [sandboxOutput, setSandboxOutput] = useState("");
  const [sandboxLanguage, setSandboxLanguage] = useState("python");
  const [isRunningCode, setIsRunningCode] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("alip_theme", newTheme ? "dark" : "light");
  };

  const handleCreateProfile = () => {
    if (!onboardingName.trim()) return;
    const newProfile: UserProfile = { 
      name: onboardingName.trim(), 
      role: onboardingRole,
      xp: 0,
      streak: 0,
      lastActiveDate: new Date().toDateString()
    };
    setProfile(newProfile);
    setRole(onboardingRole);
    localStorage.setItem("alip_profile", JSON.stringify(newProfile));
  };

  const addXp = (amount: number) => {
    if (!profile) return;
    const updated = { ...profile, xp: (profile.xp || 0) + amount };
    setProfile(updated);
    localStorage.setItem("alip_profile", JSON.stringify(updated));
  };

  const navItems = role === "student" ? [
    { id: "dashboard", icon: Compass, label: "Dashboard" },
    { id: "diagnostics", icon: Zap, label: "Diagnostics" },
    { id: "roadmap", icon: BookOpen, label: "Learning Path" },
    { id: "sandbox", icon: Code, label: "Study Sandbox" },
    { id: "analytics", icon: BarChart2, label: "Weakness Analysis" },
  ] : [
    { id: "dashboard", icon: BarChart2, label: "Class Overview" },
    { id: "roster", icon: Users, label: "Student Roster" },
    { id: "roadmap", icon: BookOpen, label: "Material Generator" },
  ];

  // ========== QUIZ HANDLERS ==========
  const handleStartQuiz = async () => {
    if (!selectedSubject) return;
    setIsGenerating(true);
    setWeakTopics([]);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: selectedSubject }),
      });
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setQuizIndex(0);
        setQuizScore(0);
        setShowExplanation(false);
        setSelectedAnswer(null);
        setQuizActive(true);
      }
    } catch (error) {
      console.error("Network error generating quiz:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
    const isCorrect = index === questions[quizIndex].correct;
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
    } else {
      setWeakTopics((prev) => [...prev, questions[quizIndex].concept]);
    }
    setShowExplanation(true);
  };

  const handleNextQuestion = async () => {
    if (quizIndex < 4) {
      setQuizIndex((prev) => prev + 1);
      setShowExplanation(false);
      setSelectedAnswer(null);
    } else {
      // Quiz complete — generate roadmap
      setQuizActive(false);
      addXp(50);
      setRoadmapGenerated(true);
      setView("roadmap");
      await generateRoadmap();
    }
  };

  // ========== ROADMAP HANDLER ==========
  const generateRoadmap = async () => {
    setIsLoadingRoadmap(true);
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: selectedSubject,
          score: quizScore,
          weakTopics,
        }),
      });
      const data = await res.json();
      if (data.roadmap && data.roadmap.length > 0) {
        setRoadmapSteps(data.roadmap);
      }
    } catch (error) {
      console.error("Error generating roadmap:", error);
    } finally {
      setIsLoadingRoadmap(false);
    }
  };

  const handleStartLesson = async (index: number) => {
    const stepStatus = roadmapSteps[index].status;
    if (stepStatus === "current" || stepStatus === "completed") {
      setActiveLesson(index);
      setIsLoadingLesson(true);
      setActiveLessonText("");
      
      try {
        const res = await fetch("/api/lesson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: roadmapSteps[index].title,
            subject: selectedSubject || "General Knowledge"
          })
        });
        const data = await res.json();
        setActiveLessonText(data.content || "Lesson content failed to load.");
      } catch (err) {
        setActiveLessonText("An error occurred while fetching the lesson.");
      } finally {
        setIsLoadingLesson(false);
      }
    }
  };

  const handleCompleteLesson = () => {
    if (activeLesson === null) return;
    
    setRoadmapSteps((prev) => {
      const newSteps = [...prev];
      newSteps[activeLesson].status = "completed";
      if (activeLesson + 1 < newSteps.length) {
        newSteps[activeLesson + 1].status = "current";
      }
      return newSteps;
    });
    
    addXp(100);
    setActiveLesson(null);
  };

  // ========== CHAT HANDLER ==========
  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg: ChatMessage = { role: "user", content: chatInput.trim() };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          subject: selectedSubject || "General Knowledge",
        }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I had a connection issue. Please try again!" },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // ========== SANDBOX HANDLER ==========
  const handleRunCode = async () => {
    if (!sandboxCode.trim() || isRunningCode) return;
    setIsRunningCode(true);
    setSandboxOutput("Running code...");

    try {
      const res = await fetch("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: sandboxCode, language: sandboxLanguage }),
      });
      const data = await res.json();
      if (data.hasError) {
        setSandboxOutput(`Error: ${data.errorMessage}`);
      } else {
        setSandboxOutput(data.output);
      }
    } catch {
      setSandboxOutput("# Connection error. Please try again.");
    } finally {
      setIsRunningCode(false);
    }
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  if (!isHydrated) return null;

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-light dark:bg-surface-dark transition-colors font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-10 w-full max-w-md shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-brand-600" />
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-900/20 text-brand-500 mb-4">
              <Compass size={32} />
            </div>
            <h1 className="text-2xl font-bold font-display dark:text-white">Welcome to ALIP</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Let's set up your profile to get started.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 dark:text-slate-300">Your Name</label>
              <input 
                type="text" 
                value={onboardingName}
                onChange={(e) => setOnboardingName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-darkCard dark:text-white focus:ring-2 ring-brand-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 dark:text-slate-300">I am a...</label>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setOnboardingRole("student")}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                    onboardingRole === "student" 
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400" 
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-brand-300"
                  }`}
                >
                  <BookOpen size={24} />
                  <span className="font-bold text-sm">Student</span>
                </button>
                <button 
                  onClick={() => setOnboardingRole("teacher")}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                    onboardingRole === "teacher" 
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400" 
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-brand-300"
                  }`}
                >
                  <Users size={24} />
                  <span className="font-bold text-sm">Teacher</span>
                </button>
              </div>
            </div>

            <button 
              onClick={handleCreateProfile}
              disabled={!onboardingName.trim()}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:hover:bg-brand-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-4"
            >
              Enter ALIP
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 w-64 bg-surface-sidebar dark:bg-surface-darkSidebar border-r border-surface-border dark:border-surface-darkBorder flex flex-col transition-transform duration-300 z-30 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display gradient-text flex items-center gap-2">
              <Compass className="text-brand-500" /> ALIP
            </h1>
            <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Adaptive Learning Intelligence</p>
          </div>
          <button 
            className="md:hidden text-slate-500"
            onClick={() => setIsSidebarOpen(false)}
          >
            <XCircle size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                view === item.id
                  ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 shadow-sm border border-brand-100 dark:border-brand-900/30"
                  : "text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent"
              }`}
            >
              <item.icon size={18} className={view === item.id ? "text-brand-500" : ""} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Profile / Controls */}
        <div className="p-4 border-t border-surface-border dark:border-surface-darkBorder">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-400 to-brand-600 text-white flex items-center justify-center font-bold shadow-md uppercase">
              {profile.name.substring(0, 2)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold dark:text-white truncate">{profile.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-600 font-medium capitalize">{profile.role}</span>
                <button 
                  onClick={() => {
                    localStorage.removeItem("alip_profile");
                    setProfile(null);
                    setRole("student");
                  }}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {role === "student" && (
            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-xs dark:text-slate-400">
                <span>XP Progress</span>
                <span className="font-bold text-brand-500">{profile?.xp || 0} / 500</span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-400 to-brand-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${((profile?.xp || 0) / 500) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button onClick={() => setView("settings")} className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 dark:text-slate-300 transition-colors">
              <Settings size={18} /> Settings
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-surface-light dark:bg-surface-dark transition-colors">
        {/* Header */}
        <header className="h-16 border-b border-surface-border dark:border-surface-darkBorder flex items-center justify-between px-4 md:px-8 bg-white/50 dark:bg-surface-dark/50 backdrop-blur-xl z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden text-slate-500 dark:text-slate-400 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-semibold capitalize font-display dark:text-white">
              {view === "settings" ? "Settings" : navItems.find((i) => i.id === view)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-sm font-bold border border-orange-200 dark:border-orange-900/50">
              <Flame size={16} className="flame-flicker" /> {profile?.streak || 0} Day Streak
            </div>
            <button
              onClick={() => setIsAiOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <MessageSquare size={16} /> AI Tutor
            </button>
          </div>
        </header>

        {/* View Router */}
        <div className="flex-1 overflow-auto p-8 relative">
          <AnimatePresence mode="wait">
            {/* ========== SETTINGS ========== */}
            {view === "settings" && (
              <motion.div key="settings" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-2xl mx-auto space-y-6">
                <div className="glass-card p-8">
                  <h2 className="text-2xl font-bold font-display dark:text-white mb-6 flex items-center gap-2">
                    <Settings className="text-brand-500" /> Settings
                  </h2>
                    <div className="space-y-4">
                      <div className="p-4 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-darkCard rounded-2xl flex items-center justify-between">
                        <div>
                          <h3 className="font-bold dark:text-white flex items-center gap-2">
                            {isDark ? <Moon size={18} /> : <Sun size={18} />} Theme Preference
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Switch between Light and Dark mode</p>
                        </div>
                        <button 
                          onClick={toggleTheme}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-sm font-bold transition-colors dark:text-white"
                        >
                          {isDark ? "Enable Light Mode" : "Enable Dark Mode"}
                        </button>
                      </div>

                      <div className="p-4 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-darkCard rounded-2xl">
                        <h3 className="font-bold dark:text-white mb-4">Edit Profile</h3>
                        <div className="flex gap-4">
                          <input 
                            type="text" 
                            defaultValue={profile?.name}
                            id="settings-name-input"
                            className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 outline-none focus:border-brand-500 dark:text-white"
                          />
                          <button 
                            onClick={() => {
                              const input = document.getElementById("settings-name-input") as HTMLInputElement;
                              if (input && input.value.trim() && profile) {
                                const newProfile = { ...profile, name: input.value.trim() };
                                setProfile(newProfile);
                                localStorage.setItem("alip_profile", JSON.stringify(newProfile));
                                alert("Name updated!");
                              }
                            }}
                            className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                          >
                            Save Name
                          </button>
                        </div>
                      </div>

                      <div className="p-4 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-2xl">
                        <h3 className="text-red-600 dark:text-red-400 font-bold mb-2 flex items-center gap-2">
                          <Flame size={18} /> Reset Progress
                        </h3>
                        <p className="text-sm text-red-500/80 dark:text-red-400/80 mb-4">
                          This will reset your XP, streak, and learning path progress. Your profile name and role will be kept.
                        </p>
                        <button 
                          onClick={() => {
                            if (profile) {
                              const reset = { ...profile, xp: 0, streak: 0 };
                              setProfile(reset);
                              localStorage.setItem("alip_profile", JSON.stringify(reset));
                              setRoadmapGenerated(false);
                              setRoadmapSteps([]);
                              setActiveLesson(null);
                              alert("Progress reset!");
                            }
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
                        >
                          Reset Progress
                        </button>
                      </div>
                    </div>
                </div>
              </motion.div>
            )}

            {/* ========== DASHBOARD ========== */}
            {view === "dashboard" && role === "student" && (
              <motion.div key="dash" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-5xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div whileHover={{ y: -5 }} className="glass-card p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400"><Compass size={24} /></div>
                      <span className="text-xs font-bold text-green-500 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-900/50">Active</span>
                    </div>
                    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Current Subject</h3>
                    <p className="text-xl font-bold dark:text-white mt-1">{selectedSubject || "Take Diagnostic"}</p>
                  </motion.div>

                  <motion.div whileHover={{ y: -5 }} className="glass-card p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-xl text-brand-600 dark:text-brand-400"><BookOpen size={24} /></div>
                    </div>
                    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Path Completion</h3>
                    <p className="text-xl font-bold dark:text-white mt-1">{roadmapGenerated ? `${quizScore * 20}%` : "0%"}</p>
                  </motion.div>

                  <motion.div whileHover={{ y: -5 }} className="glass-card p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400"><Trophy size={24} /></div>
                    </div>
                    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total XP</h3>
                    <p className="text-xl font-bold dark:text-white mt-1">{profile?.xp || 0}</p>
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card p-8"
                  >
                    <h3 className="text-xl font-bold font-display dark:text-white mb-6 flex items-center gap-2">
                      <Flame className="text-orange-500" /> Learning Progress
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Concepts Mastered</span>
                        <span className="font-bold dark:text-white">{Math.floor((profile?.xp || 0) / 100)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Quizzes Completed</span>
                        <span className="font-bold dark:text-white">{roadmapGenerated ? 1 : 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Current Level</span>
                        <span className="font-bold text-brand-500 dark:text-brand-400 text-lg">Lvl {Math.floor((profile?.xp || 0) / 500) + 1}</span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card p-10 text-center relative overflow-hidden group flex flex-col justify-center"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600" />
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl group-hover:bg-brand-500/20 transition-all" />

                    <h3 className="text-2xl font-bold mb-3 font-display dark:text-white">Continue Your Journey</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                      {!roadmapGenerated 
                        ? "Take a diagnostic test to generate your custom learning path." 
                        : `You are currently mastering ${selectedSubject}.`}
                    </p>
                    <button
                      onClick={() => setView(roadmapGenerated ? "roadmap" : "diagnostics")}
                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-xl flex items-center justify-center gap-2 mx-auto"
                    >
                      {roadmapGenerated ? <Compass size={18} /> : <Zap size={18} className={isDark ? "text-brand-500" : "text-brand-400"} />}
                      {roadmapGenerated ? "Resume Path" : "Go to Diagnostics"}
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* ========== DIAGNOSTICS ========== */}
            {view === "diagnostics" && role === "student" && (
              <motion.div key="diag" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-3xl mx-auto">
                {!quizActive && !isGenerating ? (
                  <div className="glass-card p-8 md:p-10 relative overflow-hidden">
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />

                    <h2 className="text-3xl font-bold mb-2 font-display dark:text-white">AI Diagnostic Assessment</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">Select any subject below. Gemini AI will instantly generate a custom evaluation with unique questions every time.</p>

                    <div className="mb-8">
                      <label className="block text-sm font-bold mb-3 dark:text-slate-300">Select a Subject to Master</label>
                      <select
                        className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-darkCard dark:text-white focus:ring-2 ring-brand-500 outline-none text-lg transition-all shadow-sm"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                      >
                        <option value="">-- Choose Subject --</option>
                        {SUBJECTS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      disabled={!selectedSubject}
                      onClick={handleStartQuiz}
                      className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex justify-center items-center gap-2 transform disabled:hover:scale-100 hover:scale-[1.02]"
                    >
                      <Play size={20} fill="currentColor" /> Generate AI Diagnostic Quiz
                    </button>
                  </div>
                ) : isGenerating ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card p-12 flex flex-col items-center justify-center text-center min-h-[400px]"
                  >
                    <Loader2 size={48} className="text-brand-500 animate-spin mb-6" />
                    <h3 className="text-2xl font-bold font-display dark:text-white mb-2">Gemini AI is Thinking...</h3>
                    <p className="text-slate-500 dark:text-slate-400">Crafting personalized questions for {selectedSubject}</p>
                  </motion.div>
                ) : (
                  <div className="glass-card p-8 md:p-10">
                    <div className="flex justify-between items-center mb-8">
                      <span className="text-sm font-bold text-brand-500 bg-brand-50 dark:bg-brand-900/20 px-3 py-1 rounded-full border border-brand-100 dark:border-brand-900/30">
                        Question {quizIndex + 1} of 5
                      </span>
                      <span className="text-sm font-medium bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                        <Zap size={14} className="text-yellow-500" /> {questions[quizIndex]?.concept}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full mb-10 overflow-hidden">
                      <motion.div
                        className="bg-gradient-to-r from-brand-400 to-brand-600 h-full rounded-full"
                        initial={{ width: `${(quizIndex / 5) * 100}%` }}
                        animate={{ width: `${((quizIndex + 1) / 5) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>

                    <h3 className="text-2xl font-semibold mb-8 dark:text-white leading-relaxed">
                      {questions[quizIndex]?.question}
                    </h3>

                    <div className="space-y-4">
                      {questions[quizIndex]?.options.map((opt: string, i: number) => {
                        const isSelected = selectedAnswer === i;
                        const isCorrectOption = questions[quizIndex].correct === i;

                        let buttonStyle = "border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10";
                        let badgeStyle = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-brand-500 group-hover:text-white";

                        if (showExplanation) {
                          if (isCorrectOption) {
                            buttonStyle = "border-green-500 bg-green-50 dark:bg-green-900/20";
                            badgeStyle = "bg-green-500 text-white";
                          } else if (isSelected && !isCorrectOption) {
                            buttonStyle = "border-red-500 bg-red-50 dark:bg-red-900/20 opacity-70";
                            badgeStyle = "bg-red-500 text-white";
                          } else {
                            buttonStyle = "border-slate-200 dark:border-slate-700 opacity-50";
                          }
                        }

                        return (
                          <button
                            key={i}
                            disabled={showExplanation}
                            onClick={() => handleAnswer(i)}
                            className={`w-full text-left p-5 rounded-xl border-2 transition-all dark:text-slate-200 group flex items-center ${buttonStyle}`}
                          >
                            <span className={`flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg mr-4 font-bold transition-colors ${badgeStyle}`}>
                              {["A", "B", "C", "D"][i]}
                            </span>
                            <span className="text-lg">{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    <AnimatePresence>
                      {showExplanation && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto", marginTop: 32 }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-6"
                        >
                          <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                            {selectedAnswer === questions[quizIndex].correct ? (
                              <><CheckCircle size={18} className="text-green-500" /> Correct!</>
                            ) : (
                              <><XCircle size={18} className="text-red-500" /> Incorrect</>
                            )}
                          </h4>
                          <p className="text-blue-900 dark:text-blue-200">{questions[quizIndex].explanation}</p>

                          <button
                            onClick={handleNextQuestion}
                            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold transition-colors shadow-sm ml-auto block"
                          >
                            {quizIndex < 4 ? "Next Question" : "Complete & Generate Path"}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

            {/* ========== LEARNING PATH ========== */}
            {view === "roadmap" && role === "student" && (
              <motion.div key="road" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-3xl mx-auto">
                {!roadmapGenerated ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                    <Compass size={64} className="text-slate-300 dark:text-slate-700 mb-4" />
                    <h3 className="text-xl font-bold dark:text-white">No Learning Path Generated</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">Complete a diagnostic assessment first.</p>
                    <button onClick={() => setView("diagnostics")} className="text-brand-500 font-medium hover:underline">Go to Diagnostics</button>
                  </div>
                ) : isLoadingRoadmap ? (
                  <div className="glass-card p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                    <Loader2 size={48} className="text-brand-500 animate-spin mb-6" />
                    <h3 className="text-2xl font-bold font-display dark:text-white mb-2">Generating Your Learning Path...</h3>
                    <p className="text-slate-500 dark:text-slate-400">AI is creating a personalized roadmap for {selectedSubject}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="glass-card p-6 flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold font-display dark:text-white flex items-center gap-2">
                          <Zap className="text-brand-500" /> AI Learning Path
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                          Personalized for <span className="font-semibold text-brand-500">{selectedSubject}</span> &bull; Score: {quizScore}/5
                        </p>
                      </div>
                      <button
                        onClick={() => { setView("diagnostics"); setQuizActive(false); }}
                        className="flex items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-600 bg-brand-50 dark:bg-brand-900/20 px-4 py-2 rounded-xl border border-brand-100 dark:border-brand-900/30"
                      >
                        <RotateCcw size={14} /> Retake Quiz
                      </button>
                    </div>

                    <div className="relative">
                      {activeLesson !== null ? (
                        <div className="glass-card p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <div className="flex items-center gap-4 mb-8">
                            <button 
                              onClick={() => setActiveLesson(null)}
                              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                              <ChevronRight size={20} className="rotate-180 text-slate-500" />
                            </button>
                            <div>
                              <span className="text-sm font-bold text-brand-500 uppercase tracking-wider">Active Lesson</span>
                              <h3 className="text-2xl font-bold font-display dark:text-white">{roadmapSteps[activeLesson].title}</h3>
                            </div>
                          </div>
                          <div className="prose dark:prose-invert max-w-none">
                            {isLoadingLesson ? (
                              <div className="flex flex-col items-center justify-center py-16">
                                <Loader2 size={40} className="text-brand-500 animate-spin mb-4" />
                                <p className="text-slate-500 dark:text-slate-400 font-medium">Generating lesson content...</p>
                              </div>
                            ) : (
                              <div className="my-6 p-6 bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/30 rounded-2xl">
                                <h4 className="font-bold flex items-center gap-2 text-brand-700 dark:text-brand-400 mb-4">
                                  <Zap size={18} /> AI-Generated Lesson
                                </h4>
                                <div className="text-slate-700 dark:text-slate-300 leading-relaxed [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_code]:bg-slate-200 [&_code]:dark:bg-slate-700 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-slate-900 [&_pre]:text-green-300 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_strong]:text-brand-600 [&_strong]:dark:text-brand-400">
                                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{activeLessonText}</ReactMarkdown>
                                </div>
                              </div>
                            )}
                            <div className="flex justify-between items-center border-t border-surface-border dark:border-surface-darkBorder pt-8 mt-8">
                              <button onClick={() => setIsAiOpen(true)} className="text-brand-500 font-bold flex items-center gap-2 hover:text-brand-600 transition-colors">
                                <MessageSquare size={18} /> Ask AI Tutor
                              </button>
                              {activeLesson !== null && roadmapSteps[activeLesson]?.status === "completed" ? (
                                <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                                  <CheckCircle size={20} /> Already Completed
                                </span>
                              ) : (
                                <button 
                                  onClick={handleCompleteLesson}
                                  disabled={isLoadingLesson}
                                  className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
                                >
                                  <CheckCircle size={20} /> Mark Complete (+100 XP)
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                          <div className="space-y-6">
                            {roadmapSteps.map((step, idx) => {
                              const isCompleted = step.status === "completed";
                              const isCurrent = step.status === "current";
                              const isLocked = step.status === "locked";

                              return (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  className={`relative flex gap-6 ${isLocked ? "opacity-60" : ""}`}
                                >
                                  {/* Node */}
                                  <div className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                                    isCompleted ? "bg-green-500 text-white" :
                                    isCurrent ? "bg-brand-500 text-white ring-4 ring-brand-500/30" :
                                    "bg-slate-200 dark:bg-slate-700 text-slate-400"
                                  }`}>
                                    {isCompleted ? <CheckCircle size={28} /> :
                                     isCurrent ? <Play size={28} fill="currentColor" className="ml-0.5" /> :
                                     <Lock size={24} />}
                                  </div>

                                  {/* Content */}
                                  <div 
                                    onClick={() => handleStartLesson(idx)}
                                    className={`flex-1 glass-card p-6 ${isCurrent ? "ring-2 ring-brand-500/30 border-brand-200 dark:border-brand-900/50 cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition-all" : isCompleted ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all" : ""}`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-bold dark:text-white text-lg">{step.title}</h4>
                                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                        isCompleted ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" :
                                        isCurrent ? "bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400" :
                                        "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                      }`}>
                                        {isCompleted ? "✓ Revisit" : isCurrent ? "Click to Start" : "Locked"}
                                      </span>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">{step.description}</p>
                                    <p className="text-xs text-slate-400 mt-2">⏱ {step.estimatedTime}</p>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ========== STUDY SANDBOX ========== */}
            {view === "sandbox" && (
              <motion.div key="sand" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full flex flex-col">
                <div className="glass-card flex-1 flex flex-col overflow-hidden shadow-xl border border-surface-border dark:border-surface-darkBorder">
                  <div className="h-12 border-b border-surface-border dark:border-surface-darkBorder flex items-center px-4 bg-slate-100 dark:bg-[#1A1A1A]">
                    <div className="flex gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-inner"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 shadow-inner"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-green-500 shadow-inner"></div>
                    </div>
                    <select
                      value={sandboxLanguage}
                      onChange={(e) => {
                        setSandboxLanguage(e.target.value);
                        setSandboxOutput("");
                        const starters: Record<string, string> = {
                          python: 'def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(10))',
                          javascript: 'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nconsole.log(fibonacci(10));',
                          java: 'public class Main {\n    public static int fibonacci(int n) {\n        if (n <= 1) return n;\n        return fibonacci(n - 1) + fibonacci(n - 2);\n    }\n\n    public static void main(String[] args) {\n        System.out.println(fibonacci(10));\n    }\n}',
                          c: '#include <stdio.h>\n\nint fibonacci(int n) {\n    if (n <= 1) return n;\n    return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nint main() {\n    printf("%d\\n", fibonacci(10));\n    return 0;\n}',
                          cpp: '#include <iostream>\nusing namespace std;\n\nint fibonacci(int n) {\n    if (n <= 1) return n;\n    return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nint main() {\n    cout << fibonacci(10) << endl;\n    return 0;\n}',
                        };
                        setSandboxCode(starters[e.target.value] || '');
                      }}
                      className="ml-4 bg-white dark:bg-[#2A2A2A] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1 text-sm font-bold outline-none focus:border-brand-500 cursor-pointer"
                    >
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                      <option value="java">Java</option>
                      <option value="c">C</option>
                      <option value="cpp">C++</option>
                    </select>
                    <span className="ml-3 text-sm font-mono text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
                      {sandboxLanguage === 'python' ? 'workspace.py' : sandboxLanguage === 'javascript' ? 'workspace.js' : sandboxLanguage === 'java' ? 'Main.java' : sandboxLanguage === 'c' ? 'workspace.c' : 'workspace.cpp'}
                    </span>
                    <div className="ml-auto flex gap-2">
                      <button
                        onClick={() => { setSandboxCode(""); setSandboxOutput(""); }}
                        className="bg-slate-200 dark:bg-[#333] hover:bg-slate-300 dark:hover:bg-[#444] text-slate-700 dark:text-slate-300 px-4 py-1.5 rounded-md text-sm font-bold transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleRunCode}
                        disabled={isRunningCode}
                        className="bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:opacity-50 text-white px-5 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
                      >
                        {isRunningCode ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                        {isRunningCode ? "Running..." : "Run Code"}
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 flex">
                    <textarea
                      className="flex-1 bg-white dark:bg-[#1E1E1E] text-slate-800 dark:text-[#D4D4D4] p-6 font-mono text-base resize-none outline-none leading-relaxed"
                      spellCheck="false"
                      value={sandboxCode}
                      onChange={(e) => setSandboxCode(e.target.value)}
                      placeholder="Write your code here..."
                    />
                  </div>
                  <div className="h-56 border-t border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-[#0D0D0D] p-6 font-mono text-sm overflow-auto relative shadow-inner">
                    <div className="absolute top-3 right-4 text-xs text-slate-400 font-sans font-bold uppercase tracking-widest">Console Output</div>
                    <div className="text-green-600 dark:text-green-400 mt-2 whitespace-pre-wrap">
                      {sandboxOutput ? (
                        <>$ {sandboxLanguage === 'python' ? 'python workspace.py' : sandboxLanguage === 'javascript' ? 'node workspace.js' : sandboxLanguage === 'java' ? 'javac Main.java && java Main' : sandboxLanguage === 'c' ? 'gcc workspace.c -o a.out && ./a.out' : 'g++ workspace.cpp -o a.out && ./a.out'}{"\n"}{sandboxOutput}</>
                      ) : (
                        <span className="text-slate-400">Click &quot;Run Code&quot; to execute your code with AI...</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========== WEAKNESS ANALYSIS ========== */}
            {view === "analytics" && role === "student" && (
              <motion.div key="analytics" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-3xl mx-auto">
                <div className="glass-card p-8">
                  <h2 className="text-2xl font-bold font-display dark:text-white mb-6 flex items-center gap-2">
                    <BarChart2 className="text-brand-500" /> Weakness Analysis
                  </h2>

                  {weakTopics.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-slate-500 dark:text-slate-400 mb-6">Based on your latest diagnostic in <span className="font-semibold text-brand-500">{selectedSubject}</span>, here are the areas to focus on:</p>
                      {weakTopics.map((topic, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl">
                          <div className="w-10 h-10 rounded-lg bg-red-500 text-white flex items-center justify-center flex-shrink-0">
                            <XCircle size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold dark:text-white">{topic}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Needs more practice — review this concept in your learning path.</p>
                          </div>
                        </div>
                      ))}
                      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-xl">
                        <p className="text-green-700 dark:text-green-400 font-medium">
                          ✅ You scored <span className="font-bold">{quizScore}/5</span> — {quizScore >= 4 ? "Excellent work!" : quizScore >= 2 ? "Good foundation, keep practicing!" : "Don't worry, everyone starts somewhere!"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart2 size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                      <h3 className="font-bold dark:text-white text-lg">No Data Yet</h3>
                      <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">Complete a diagnostic quiz to see your weakness analysis.</p>
                      <button onClick={() => setView("diagnostics")} className="text-brand-500 font-medium hover:underline">Take a Diagnostic</button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ========== TEACHER VIEWS ========== */}
            {role === "teacher" && view === "dashboard" && (
              <motion.div key="t-dash" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-5xl mx-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass-card p-6 flex flex-col justify-between">
                    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-2"><BarChart2 size={16} /> Avg Class Score</h3>
                    <p className="text-4xl font-display font-bold mt-4 dark:text-white">82%</p>
                    <p className="text-xs text-green-500 mt-2 font-medium">↑ 4% from last week</p>
                  </div>
                  <div className="glass-card p-6 flex flex-col justify-between">
                    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-2"><Users size={16} /> Active Students</h3>
                    <p className="text-4xl font-display font-bold mt-4 dark:text-white">24 <span className="text-lg text-slate-400 font-normal">/ 25</span></p>
                    <p className="text-xs text-slate-500 mt-2 font-medium">1 student inactive</p>
                  </div>
                  <div className="glass-card p-6 flex flex-col justify-between">
                    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-2"><CheckCircle size={16} /> Avg Completion</h3>
                    <p className="text-4xl font-display font-bold mt-4 dark:text-white">64%</p>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-brand-500 h-full w-[64%]" />
                    </div>
                  </div>
                </div>

                <div className="glass-card p-8">
                  <h3 className="text-lg font-bold font-display mb-6 dark:text-white">Needs Attention</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-xl">
                      <div>
                        <p className="font-bold text-orange-800 dark:text-orange-400">Calculus Integration</p>
                        <p className="text-sm text-orange-600 dark:text-orange-500">6 students failed the diagnostic</p>
                      </div>
                      <button onClick={() => setView("roadmap")} className="px-4 py-2 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-lg text-sm font-bold transition-colors">
                        Generate Review Material
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {role === "teacher" && view === "roster" && (
              <motion.div key="t-roster" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-5xl mx-auto">
                <div className="glass-card overflow-hidden">
                  <div className="p-6 border-b border-surface-border dark:border-surface-darkBorder flex justify-between items-center bg-slate-50 dark:bg-[#1A1A1A]">
                    <h3 className="text-lg font-bold font-display dark:text-white">Student Roster</h3>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          const newStudent = { id: Date.now(), name: "New Student", focus: "General", xp: 0, status: "On Track" };
                          const newRoster = [...roster, newStudent];
                          saveRoster(newRoster);
                          setEditingRosterId(newStudent.id);
                        }}
                        className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
                      >
                        + Add Student
                      </button>
                      <div className="px-3 py-1 bg-white dark:bg-surface-dark border border-surface-border dark:border-surface-darkBorder rounded-lg text-sm text-slate-500 shadow-sm">
                        Spring 2026 Cohort
                      </div>
                    </div>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-surface-border dark:border-surface-darkBorder text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-surface-darkCard/30">
                        <th className="p-4 font-semibold">Student Name</th>
                        <th className="p-4 font-semibold">Current Focus</th>
                        <th className="p-4 font-semibold">XP</th>
                        <th className="p-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border dark:divide-surface-darkBorder text-sm dark:text-slate-200">
                      {roster.map((student: any, i: number) => {
                        const isEditing = editingRosterId === student.id;
                        return (
                        <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                          <td className="p-4 font-medium">
                            {isEditing ? (
                              <input 
                                autoFocus
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm outline-none focus:border-brand-500" 
                                defaultValue={student.name}
                                onBlur={(e) => {
                                  const newName = e.target.value;
                                  if (newName !== student.name) {
                                    const newRoster = [...roster];
                                    newRoster[i].name = newName;
                                    saveRoster(newRoster);
                                  }
                                }}
                              />
                            ) : (
                              <span onClick={() => setEditingRosterId(student.id)} className="cursor-pointer border-b border-transparent hover:border-slate-400">{student.name}</span>
                            )}
                          </td>
                          <td className="p-4 text-slate-500 dark:text-slate-400">
                            {isEditing ? (
                              <input 
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm outline-none focus:border-brand-500" 
                                defaultValue={student.focus}
                                onBlur={(e) => {
                                  const newFocus = e.target.value;
                                  if (newFocus !== student.focus) {
                                    const newRoster = [...roster];
                                    newRoster[i].focus = newFocus;
                                    saveRoster(newRoster);
                                  }
                                }}
                              />
                            ) : (
                              <span onClick={() => setEditingRosterId(student.id)} className="cursor-pointer border-b border-transparent hover:border-slate-400">{student.focus}</span>
                            )}
                          </td>
                          <td className="p-4 font-mono">
                            {isEditing ? (
                              <input 
                                type="number"
                                className="w-20 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm outline-none focus:border-brand-500" 
                                defaultValue={student.xp}
                                onBlur={(e) => {
                                  const newXp = parseInt(e.target.value) || 0;
                                  if (newXp !== student.xp) {
                                    const newRoster = [...roster];
                                    newRoster[i].xp = newXp;
                                    saveRoster(newRoster);
                                  }
                                }}
                              />
                            ) : (
                              <span onClick={() => setEditingRosterId(student.id)} className="cursor-pointer border-b border-transparent hover:border-slate-400">{student.xp}</span>
                            )}
                          </td>
                          <td className="p-4 flex items-center justify-between">
                            {isEditing ? (
                              <select 
                                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm outline-none focus:border-brand-500"
                                defaultValue={student.status}
                                onChange={(e) => {
                                  const newStatus = e.target.value;
                                  if (newStatus !== student.status) {
                                    const newRoster = [...roster];
                                    newRoster[i].status = newStatus;
                                    saveRoster(newRoster);
                                  }
                                  setEditingRosterId(null); // Close edit on status change or click away
                                }}
                                onBlur={() => setEditingRosterId(null)}
                              >
                                <option>Excelling</option>
                                <option>On Track</option>
                                <option>Struggling</option>
                              </select>
                            ) : (
                              <>
                                <span onClick={() => setEditingRosterId(student.id)} className={`cursor-pointer px-2.5 py-1 rounded-full text-xs font-bold ${
                                  student.status === "Excelling" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                  student.status === "Struggling" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                }`}>
                                  {student.status}
                                </span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newRoster = roster.filter((r: any) => r.id !== student.id);
                                    saveRoster(newRoster);
                                  }}
                                  className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {role === "teacher" && view === "roadmap" && (
              <motion.div key="t-material" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-3xl mx-auto space-y-6">
                <div className="glass-card p-10">
                  <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/20 text-brand-500 rounded-2xl flex items-center justify-center mb-6">
                    <BookOpen size={32} />
                  </div>
                  <h2 className="text-3xl font-bold mb-2 font-display dark:text-white">AI Material Generator</h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-8">Generate custom lesson plans and diagnostic quizzes for your class instantly using Gemini.</p>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold mb-2 dark:text-slate-300">Topic or Concept</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Introduction to Quantum Computing"
                        value={materialTopic}
                        onChange={(e) => setMaterialTopic(e.target.value)}
                        className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-darkCard dark:text-white focus:ring-2 ring-brand-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 dark:text-slate-300">Target Grade / Level</label>
                      <select 
                        value={materialGrade}
                        onChange={(e) => setMaterialGrade(e.target.value)}
                        className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-darkCard dark:text-white focus:ring-2 ring-brand-500 outline-none transition-all shadow-sm"
                      >
                        <option>Beginner (High School)</option>
                        <option>Intermediate (College)</option>
                        <option>Advanced (Post-grad)</option>
                      </select>
                    </div>
                    <button 
                      disabled={!materialTopic.trim() || isGeneratingMaterial}
                      onClick={async () => {
                        setIsGeneratingMaterial(true);
                        setMaterialContent("");
                        try {
                          const res = await fetch("/api/material", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ topic: materialTopic, gradeLevel: materialGrade })
                          });
                          const data = await res.json();
                          setMaterialContent(data.content || "Failed to generate.");
                        } catch {
                          setMaterialContent("An error occurred. Please try again.");
                        } finally {
                          setIsGeneratingMaterial(false);
                        }
                      }}
                      className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-4"
                    >
                      {isGeneratingMaterial ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} className="text-brand-400" />}
                      {isGeneratingMaterial ? "Generating..." : "Generate Curriculum"}
                    </button>
                  </div>
                </div>

                {isGeneratingMaterial && (
                  <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
                    <Loader2 size={48} className="text-brand-500 animate-spin mb-6" />
                    <h3 className="text-xl font-bold font-display dark:text-white mb-2">Generating Curriculum...</h3>
                    <p className="text-slate-500 dark:text-slate-400">Gemini AI is creating a lesson plan for &ldquo;{materialTopic}&rdquo;</p>
                  </div>
                )}

                {materialContent && !isGeneratingMaterial && (
                  <div className="glass-card p-10">
                    <h3 className="text-xl font-bold font-display dark:text-white mb-6 flex items-center gap-2">
                      <CheckCircle className="text-green-500" /> Generated Curriculum
                    </h3>
                    <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_code]:bg-slate-200 [&_code]:dark:bg-slate-700 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-slate-900 [&_pre]:text-green-300 [&_pre]:p-4 [&_pre]:rounded-xl">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{materialContent}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* AI Tutor Drawer Overlay */}
      {isAiOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsAiOpen(false)}
        />
      )}

      {/* AI Tutor Drawer */}
      <div className={`fixed top-0 right-0 h-full w-[400px] bg-white/95 dark:bg-surface-darkCard/95 backdrop-blur-xl border-l border-surface-border dark:border-surface-darkBorder shadow-2xl transition-transform duration-300 ease-out z-50 flex flex-col ${isAiOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="h-16 border-b border-surface-border dark:border-surface-darkBorder flex items-center justify-between px-6 bg-brand-50/50 dark:bg-brand-900/10">
          <h3 className="font-bold flex items-center gap-2 dark:text-white font-display text-lg">
            <div className="bg-brand-500 p-1.5 rounded-lg text-white">
              <MessageSquare size={16} />
            </div>
            Gemini AI Tutor
          </h3>
          <button onClick={() => setIsAiOpen(false)} className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <XCircle size={20} />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {/* Welcome message */}
          <div className="flex gap-3 max-w-[90%]">
            <div className="w-8 h-8 rounded-full bg-brand-500 flex-shrink-0 flex items-center justify-center text-white shadow-md">
              <Zap size={14} />
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none text-sm dark:text-slate-200 shadow-sm border border-slate-200 dark:border-slate-700">
              Hi there! I&apos;m your Gemini-powered AI Tutor. I can help you with {selectedSubject || "any subject"}. Ask me anything — concepts, problems, or explanations! 🎓
            </div>
          </div>

          {/* Dynamic messages */}
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-brand-500 flex-shrink-0 flex items-center justify-center text-white shadow-md">
                  <Zap size={14} />
                </div>
              )}
              <div
                className={`max-w-[80%] p-4 rounded-2xl text-sm shadow-sm border ${
                  msg.role === "user"
                    ? "bg-brand-500 text-white rounded-tr-none border-brand-600"
                    : "bg-slate-100 dark:bg-slate-800 dark:text-slate-200 rounded-tl-none border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="prose dark:prose-invert prose-sm max-w-none [&_p]:m-0 [&_pre]:p-2 [&_pre]:my-2 [&_pre]:bg-slate-900 [&_pre]:text-green-300 [&_pre]:rounded-md [&_code]:bg-black/10 [&_code]:dark:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded">
                  {msg.role === "assistant" ? (
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isChatLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-500 flex-shrink-0 flex items-center justify-center text-white shadow-md">
                <Zap size={14} />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none text-sm border border-slate-200 dark:border-slate-700">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-surface-border dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard">
          <div className="relative">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              placeholder="Ask a question..."
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-4 pr-12 text-sm outline-none dark:text-white focus:ring-2 ring-brand-500 transition-all shadow-inner"
            />
            <button
              onClick={handleSendChat}
              disabled={isChatLoading || !chatInput.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-brand-500 text-white rounded-lg flex items-center justify-center hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-md"
            >
              {isChatLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-3">Powered by Google Gemini AI</p>
        </div>
      </div>
    </div>
  );
}
