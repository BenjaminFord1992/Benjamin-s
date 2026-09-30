import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Search, 
  HelpCircle, 
  Cpu, 
  ExternalLink, 
  Monitor, 
  BookMarked,
  Layers,
  MapPin,
  RefreshCw,
  Terminal,
  Clock,
  Menu,
  X,
  Plus,
  Compass,
  Zap,
  Bot
} from "lucide-react";

import { GrokSidebar } from "./components/GrokSidebar";
import { GrokInput } from "./components/GrokInput";
import { GrokHTMLRenderer } from "./components/GrokHTMLRenderer";
import { GrokMindmap } from "./components/GrokMindmap";
import { ChatSession, ChatMessage, UserProfile, QuickSuggestion } from "./types";

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // App Config States
  const [mode, setMode] = useState<"fun" | "regular">("fun");
  const [deepSearch, setDeepSearch] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Active generation log tracking
  const [currentThoughtSteps, setCurrentThoughtSteps] = useState<string[]>([]);
  const [partialStreamText, setPartialStreamText] = useState<string>("");

  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Quick Starter suggestions grid
  const initialSuggestions: QuickSuggestion[] = [
    { text: "Roast the current developer job market with savage wit", icon: "🔥", category: "roast" },
    { text: "Explain quantum computing using an interactive monospaced diagram", icon: "⚛️", category: "research" },
    { text: "Write high-performance collision code in Rust with visual guidelines", icon: "🦀", category: "creative" },
    { text: "Critique the design trend of over-using purple-to-blue gradients in modern AI apps", icon: "🎨", category: "roast" },
    { text: "Map the future timeline of fusion energy commercialization", icon: "⚡", category: "research" },
  ];

  // 1. Initial configuration and cache loading
  useEffect(() => {
    // A. Fetch current profile
    fetch("/api/user-info")
      .then((res) => res.json())
      .then((data) => setUserProfile(data))
      .catch((err) => {
        console.warn("Could not load user profile, using fallback profile");
        setUserProfile({
          email: "benjaminford831@gmail.com",
          name: "Benjamin Ford",
          avatarColor: "#00ff66",
          role: "Human Explorer",
          subscription: "Grok Premium"
        });
      });

    // B. Synchronize local storage discussions
    const cached = localStorage.getItem("grok_chat_sessions");
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as ChatSession[];
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        } else {
          introduceWelcomeSession();
        }
      } catch (e) {
        introduceWelcomeSession();
      }
    } else {
      introduceWelcomeSession();
    }
  }, []);

  // Write session cache updates safely
  const saveSessions = (updatedList: ChatSession[]) => {
    setSessions(updatedList);
    localStorage.setItem("grok_chat_sessions", JSON.stringify(updatedList));
  };

  const introduceWelcomeSession = () => {
    const welcomeSessionId = `session_${Date.now()}`;
    const initialWelcome: ChatSession = {
      id: welcomeSessionId,
      title: "Grok Initial Matrix",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: "welcome_msg",
          role: "assistant",
          content: "Welcome to Grok. Powered by the Gemini API, I operate with two distinct logical profiles:\n\n- **Fun Mode (Active)**: A spicy, witty, rebellious intellect loaded with healthy cynicism and comprehensive detail.\n- **Regular Mode**: A professional, structured, and completely direct objective analyzer.\n\nUse **Deep Search** below to activate Google Search Grounding to check live real-time web instances, or type `/` to pull up quick diagnostic controller shortcuts.",
          timestamp: new Date().toISOString(),
          modeUsed: "fun",
        },
      ],
    };
    saveSessions([initialWelcome]);
    setActiveSessionId(welcomeSessionId);
  };

  // 2. Clear Active chat or open new thread
  const handleNewChat = () => {
    const newId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: "New Discussion thread",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    saveSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
    setMobileMenuOpen(false);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = sessions.filter((s) => s.id !== id);
    saveSessions(filtered);
    
    if (activeSessionId === id) {
      if (filtered.length > 0) {
        setActiveSessionId(filtered[0].id);
      } else {
        introduceWelcomeSession();
      }
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setMobileMenuOpen(false);
    setCurrentThoughtSteps([]);
    setPartialStreamText("");
  };

  // Smooth scroll helper
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeSessionId, partialStreamText, currentThoughtSteps, isLoading]);

  // Retrieve current messages safely
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const activeMessages = activeSession?.messages || [];

  // 3. Command Send Handler
  const handleSendMessage = async (text: string, image?: string) => {
    if (isLoading) return;

    const payloadText = text.trim();
    if (!payloadText && !image) return;

    // Detect if this is an explicit image request (slash-input or direct text)
    const isExplicitImageReq = payloadText.startsWith("/image ") || 
                               /^(generate image|create image|draw me|make a picture of|make an image)/i.test(payloadText);

    // Save user dialog
    const userMsgId = `msg_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: payloadText,
      timestamp: new Date().toISOString(),
      image: image,
    };

    // Update session
    let updatedMsgs = [...activeMessages, userMessage];
    
    // Auto-update thread title on first user dialogue
    let titleStr = activeSession?.title || "Discussion Thread";
    if (activeMessages.length === 0) {
      titleStr = payloadText.length > 25 ? `${payloadText.substring(0, 25)}...` : payloadText;
    }

    const updatedSession: ChatSession = {
      ...activeSession!,
      title: titleStr,
      messages: updatedMsgs,
      updatedAt: new Date().toISOString(),
    };

    const nextSessions = sessions.map((s) => (s.id === activeSessionId ? updatedSession : s));
    saveSessions(nextSessions);
    setIsLoading(true);

    // Clear buffer loggers
    setCurrentThoughtSteps([]);
    setPartialStreamText("");

    // Handling Image generation requests separately for rich canvas integrations
    if (isExplicitImageReq) {
      const generatedMsgId = `msg_gen_${Date.now()}`;
      
      // Inject visual placeholder loader
      const visualPlaceholder: ChatMessage = {
        id: generatedMsgId,
        role: "assistant",
        content: `Initializing visual schematic layout for query: "${payloadText}"...`,
        timestamp: new Date().toISOString(),
        isGeneratingImage: true,
      };

      const withGenMsg = [...updatedMsgs, visualPlaceholder];
      saveSessions(
        sessions.map((s) => 
          s.id === activeSessionId ? { ...s, messages: withGenMsg } : s
        )
      );

      try {
        const response = await fetch("/api/image/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: payloadText.replace(/^\/image\s+/i, "") }),
        });
        const result = await response.json();

        if (result.success && result.imageUrl) {
          // Real image generation succeed!
          const imgSuccess: ChatMessage = {
            id: generatedMsgId,
            role: "assistant",
            content: `Generative visual matrix aligned perfectly. Behold your requested canvas.`,
            timestamp: new Date().toISOString(),
            generatedImageUrl: result.imageUrl,
          };
          saveSessions(
            sessions.map((s) => 
              s.id === activeSessionId ? { ...s, messages: [...updatedMsgs, imgSuccess] } : s
            )
          );
        } else {
          // Falls back to customized procedural mental coordinate vector hud
          const vectorFallbackMsg: ChatMessage = {
            id: generatedMsgId,
            role: "assistant",
            content: `Generative visual API restriction detected. Initiating local high-fidelity Procedural Vector Engine to map the structural physics schema recursively...`,
            timestamp: new Date().toISOString(),
            generatedImageUrl: "fallback_procedural", // Signal to show Canvas hud
          };
          saveSessions(
            sessions.map((s) => 
              s.id === activeSessionId ? { ...s, messages: [...updatedMsgs, vectorFallbackMsg] } : s
            )
          );
        }
      } catch (err) {
        console.error("Visual generation failed:", err);
        const vectorFallbackMsg: ChatMessage = {
          id: generatedMsgId,
          role: "assistant",
          content: `Generative graphic interface returned structural latency. Local Procedural Vector Layout compiled instead:`,
          timestamp: new Date().toISOString(),
          generatedImageUrl: "fallback_procedural",
        };
        saveSessions(
          sessions.map((s) => 
            s.id === activeSessionId ? { ...s, messages: [...updatedMsgs, vectorFallbackMsg] } : s
          )
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 4. Standard TEXT SSE stream fetch
    try {
      const resp = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMsgs,
          mode: mode,
          deepSearch: deepSearch,
          imageFile: image ? { data: image, mimeType: "image/jpeg" } : undefined
        }),
      });

      if (!resp.ok) throw new Error("Connection failed to stream data from Grok.");

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) throw new Error("ReadableStream not available.");

      let finished = false;
      let accumulatedText = "";
      let modelCitations: any[] = [];
      let stepsArray: string[] = [];

      while (!finished) {
        const { value, done } = await reader.read();
        if (done) {
          finished = true;
          break;
        }

        const chunkText = decoder.decode(value);
        const lines = chunkText.split("\n");

        for (const line of lines) {
          if (!line.trim() || !line.startsWith("data: ")) continue;
          
          try {
            const rawJSON = line.replace("data: ", "").trim();
            const parsed = JSON.parse(rawJSON);

            if (parsed.type === "step") {
              // Add simulated thinking step
              stepsArray = [...stepsArray, parsed.text];
              setCurrentThoughtSteps([...stepsArray]);
            } else if (parsed.type === "text") {
              // Append delta text word by word
              accumulatedText += parsed.text;
              setPartialStreamText(accumulatedText);
            } else if (parsed.type === "done") {
              modelCitations = parsed.citations || [];
            } else if (parsed.type === "error") {
              accumulatedText += `\n\n[Fatal Matrix Exception: ${parsed.message}]`;
              setPartialStreamText(accumulatedText);
              finished = true;
            }
          } catch (e) {
            // Partial JSON boundaries or chunk splice warnings
            // Ignore parse errors on split boundaries
          }
        }
      }

      // Save complete synced text
      const finalMsgId = `model_${Date.now()}`;
      const finalModelResponse: ChatMessage = {
        id: finalMsgId,
        role: "assistant",
        content: accumulatedText,
        timestamp: new Date().toISOString(),
        citations: modelCitations,
        modeUsed: mode,
        deepSearchSteps: stepsArray.length > 0 ? stepsArray : undefined
      };

      saveSessions(
        sessions.map((s) => 
          s.id === activeSessionId 
            ? { ...s, messages: [...updatedMsgs, finalModelResponse] } 
            : s
        )
      );

    } catch (error: any) {
      console.error("Stream reader exception:", error);
      const errId = `model_err_${Date.now()}`;
      const errResponse: ChatMessage = {
        id: errId,
        role: "assistant",
        content: `[Grok link interrupted: ${error.message || "Offline boundary hit. Verify your SECRETS panel has a valid GEMINI_API_KEY value."}]`,
        timestamp: new Date().toISOString(),
        modeUsed: mode
      };
      saveSessions(
        sessions.map((s) => 
          s.id === activeSessionId ? { ...s, messages: [...updatedMsgs, errResponse] } : s
        )
      );
    } finally {
      setIsLoading(false);
      setPartialStreamText("");
      setCurrentThoughtSteps([]);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#070709] text-zinc-100 overflow-hidden font-sans">
      
      {/* 1. Left Sidebar Panels */}
      <GrokSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        userProfile={userProfile}
      />

      {/* Mobile Drawer Slide and menu controls */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="w-72 h-full bg-[#060608]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end p-4 border-b border-zinc-900">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded bg-zinc-900 text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <GrokSidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={handleSelectSession}
                onNewChat={handleNewChat}
                onDeleteSession={handleDeleteSession}
                userProfile={userProfile}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Terminal Content Area */}
      <main className="flex-1 flex flex-col h-full bg-[#070709] border-l border-zinc-900/60 overflow-hidden relative">
        
        {/* Upper HUD Header controls */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-[#121215]/85 bg-[#08080A]/95 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white"
            >
              <Menu className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#00ff66]" />
              <div>
                <span className="font-display font-black text-sm text-white tracking-wide uppercase">
                  ACTIVE MATRIX
                </span>
                <span className="text-[10px] font-mono block text-[#00ff66]">
                  {mode === "fun" ? "Witty roast engines toggled" : "Factual objective vectors active"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick HUD status indicators */}
          <div className="flex items-center gap-5 text-xs text-zinc-400 font-mono">
            <div className="max-sm:hidden flex items-center gap-1.5 bg-[#00ff66]/5 px-2.5 py-1 rounded border border-[#00ff66]/10 text-[#00ff66]">
              <span className="w-1.5 h-1.5 bg-[#00ff66] rounded-full animate-ping" />
              <span>Grok AI Terminal: Online</span>
            </div>

            <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1 rounded border border-zinc-850">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>UTC:{new Date().toISOString().substring(11, 16)}</span>
            </div>
          </div>
        </header>

        {/* 3. Messages Sandbox Container */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-thin scrollbar-zinc">
          {activeMessages.length === 0 ? (
            /* Splash page suggestion grid */
            <div className="h-full max-w-3xl mx-auto flex flex-col justify-center items-center space-y-8 py-10">
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-16 h-16 bg-white text-black font-display font-black text-4xl flex items-center justify-center rounded-2xl mx-auto border-2 border-[#00ff66] grok-glow"
                >
                  g
                </motion.div>
                <h2 className="text-2xl font-display font-bold tracking-tight text-white mt-4">
                  What should we synthesize today?
                </h2>
                <p className="text-xs text-zinc-400 font-sans max-w-md mx-auto">
                  I am Grok, designed to be helpful with standard wit & healthy curiosity. Ask me tech reviews, prompt images, or trigger deep search.
                </p>
              </div>

              {/* Suggestions grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                {initialSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.text)}
                    className="flex items-start text-left p-4 rounded-xl border border-[#121215] bg-[#09090C] hover:bg-[#121215] hover:border-zinc-800 transition-all duration-300 group cursor-pointer"
                  >
                    <span className="text-xl mr-3 bg-zinc-950 p-2 rounded-lg border border-zinc-900 group-hover:bg-zinc-900 transition-colors">
                      {item.icon}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-zinc-200 group-hover:text-white line-clamp-2 leading-relaxed">
                        {item.text}
                      </p>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-1 block group-hover:text-zinc-400">
                        {item.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active message logs list */
            <div className="max-w-4xl mx-auto space-y-8">
              {activeMessages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <div key={msg.id} className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}>
                    
                    {/* Bot avatar representing Grok */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-lg bg-white text-black font-display font-black text-sm flex items-center justify-center border-l-2 border-[#00ff66] flex-shrink-0 mt-1">
                        g
                      </div>
                    )}

                    <div className={`max-w-[85%] space-y-2.5 ${isUser ? "order-1" : "order-2"}`}>
                      {/* Message header details */}
                      <div className={`flex items-center gap-2 text-[10px] font-mono ${isUser ? "justify-end" : "justify-start"}`}>
                        <span className="text-zinc-500 font-semibold uppercase">
                          {isUser ? "Human Operator" : `Grok (${msg.modeUsed || mode})`}
                        </span>
                        <span className="text-zinc-500">•</span>
                        <span className="text-zinc-650">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {!isUser && msg.deepSearchSteps && (
                          <span className="text-[9px] text-[#00ff66] bg-[#00ff66]/10 px-1.5 py-0.5 rounded border border-[#00ff66]/20 font-bold uppercase tracking-wider">
                            Deep Grounded
                          </span>
                        )}
                      </div>

                      {/* Content Core Box */}
                      <div className={`p-5 rounded-2xl border ${
                        isUser 
                          ? "bg-zinc-900 border-[#1c1c22] rounded-tr-none text-zinc-100" 
                          : "bg-[#0A0A0C]/90 border-zinc-900/80 rounded-tl-none"
                      }`}>
                        
                        {/* Display User Attached Image if present */}
                        {isUser && msg.image && (
                          <div className="mb-3 max-w-sm rounded border border-zinc-800 overflow-hidden bg-black/40">
                            <img
                              src={msg.image}
                              alt="Uploaded visual asset"
                              className="w-full h-auto object-contain max-h-[250px]"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        {/* Rendering dynamic code loading widgets */}
                        {msg.isGeneratingImage ? (
                          <div className="space-y-4">
                            <p className="text-xs text-zinc-300 font-sans italic">{msg.content}</p>
                            <div className="w-full h-52 bg-zinc-950 border border-zinc-900 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
                              <LoaderAnimation />
                              <span className="text-[10px] text-zinc-500 font-mono tracking-widest mt-4 animate-pulse uppercase">
                                Synthesizing orbital pixels...
                              </span>
                            </div>
                          </div>
                        ) : msg.generatedImageUrl ? (
                          <div className="space-y-4">
                            {msg.generatedImageUrl === "fallback_procedural" ? (
                              <GrokMindmap prompt={(activeMessages[idx - 1]?.content) || "Bespoke HUD Space Station Concept"} />
                            ) : (
                              <div className="max-w-md mx-auto aspect-square rounded-xl overflow-hidden border border-zinc-800 shadow-2xl">
                                <img
                                  src={msg.generatedImageUrl}
                                  alt="Generated Art"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                            <p className="text-xs text-gray-400 font-sans leading-relaxed mt-2 italic">
                              {msg.content}
                            </p>
                          </div>
                        ) : (
                          /* Standard rich-text formatted response */
                          <>
                            {/* If deep thought tracers exist, print them collapsible */}
                            {!isUser && msg.deepSearchSteps && (
                              <ThinkingCollapse steps={msg.deepSearchSteps} />
                            )}
                            
                            <GrokHTMLRenderer content={msg.content} />
                          </>
                        )}
                      </div>

                      {/* Grounding web sources links */}
                      {!isUser && msg.citations && msg.citations.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1.5 tracking-wider">
                            Grok Grounded Sources ({msg.citations.length}):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.citations.map((cite, cIdx) => (
                              <a
                                key={cIdx}
                                href={cite.uri}
                                target="_blank"
                                referrerPolicy="no-referrer"
                                className="inline-flex items-center gap-1.5 text-[10px] bg-zinc-950 text-zinc-400 hover:text-white px-2.5 py-1 rounded border border-zinc-900 hover:border-zinc-805 transition-all text-xs"
                              >
                                <span>{cite.title.length > 20 ? `${cite.title.substring(0, 20)}...` : cite.title}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-[#00ff66]" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}

              {/* Streaming placeholder indicator */}
              {isLoading && (partialStreamText || currentThoughtSteps.length > 0) && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-sm flex items-center justify-center select-none flex-shrink-0 mt-1 animate-pulse">
                    ?
                  </div>
                  
                  <div className="max-w-[85%] space-y-2.5 order-2">
                    <div className="text-[10px] font-mono text-zinc-550 flex items-center gap-1.5">
                      <span>Stream Connection Linked</span>
                      <span className="w-1.5 h-1.5 bg-[#00ff66] rounded-full animate-ping" />
                    </div>

                    <div className="p-5 rounded-2xl border bg-zinc-950/40 border-dashed border-zinc-900/60 rounded-tl-none space-y-4">
                      {/* Active thinking collapse tracers */}
                      {currentThoughtSteps.length > 0 && (
                        <ThinkingCollapse steps={currentThoughtSteps} isThinking={isLoading && !partialStreamText} />
                      )}

                      {/* Delta content stream readout */}
                      {partialStreamText ? (
                        <GrokHTMLRenderer content={partialStreamText} />
                      ) : (
                        <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00ff66]" />
                          <span>Streaming dynamic matrix...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div ref={conversationEndRef} />
        </div>

        {/* 4. Chat input panel container */}
        <GrokInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          mode={mode}
          onToggleMode={(m) => setMode(m)}
          deepSearch={deepSearch}
          onToggleDeepSearch={(v) => setDeepSearch(v)}
        />
      </main>

    </div>
  );
}

// Visual matrix layout animations loaders
function LoaderAnimation() {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border border-zinc-800 border-t-[#00ff66] animate-spin" />
      <div className="absolute inset-2 rounded-full border border-dashed border-zinc-700 border-b-[#00ff66] animate-spin animate-reverse" style={{ animationDuration: "2s" }} />
      <Cpu className="w-5 h-5 text-zinc-600 animate-pulse" />
    </div>
  );
}

// Collapsible thinking traces component
function ThinkingCollapse({ steps, isThinking }: { steps: string[]; isThinking?: boolean }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border border-zinc-900 bg-[#060608] rounded-lg overflow-hidden text-xs my-2 font-mono">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-[#0A0A0C] hover:bg-zinc-900 text-zinc-400 font-semibold cursor-pointer border-b border-zinc-950"
      >
        <span className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#00ff66]" />
          <span>Grok Search Agent Thoughts ({steps.length})</span>
        </span>
        <span className="text-[10px] text-zinc-600">
          {isOpen ? "CLOSE" : "EXPAND"}
        </span>
      </button>

      {isOpen && (
        <div className="p-3.5 space-y-1.5 bg-[#050555]/5 text-zinc-500 border-t border-zinc-950">
          {steps.map((st, sidx) => (
            <div key={sidx} className="flex items-start gap-1.5">
              <span className="text-[#00ff66] font-bold">â€º</span>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                {st}
              </p>
            </div>
          ))}
          {isThinking && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 text-[#00ff66] text-[9px] animate-pulse">
              <span>Mapping Web Grounding Indexes...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
