import React from "react";
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  ShieldCheck, 
  Compass, 
  Sparkles, 
  User, 
  History,
  TrendingUp,
  ExternalLink
} from "lucide-react";
import { ChatSession, UserProfile } from "../types";

interface GrokSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  userProfile: UserProfile | null;
}

export function GrokSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  userProfile,
}: GrokSidebarProps) {
  return (
    <aside className="w-64 max-md:hidden h-full flex flex-col bg-[#060608] border-r border-[#151518]/90 text-zinc-300">
      
      {/* Product Brand Identifier */}
      <div className="p-5 flex items-center justify-between border-b border-[#121215]/80">
        <div className="flex items-center gap-3">
          {/* Futuristic minimalist 'G' glyph resembling Grok / xAI */}
          <div className="w-7 h-7 bg-white text-black font-display font-black text-lg flex items-center justify-center rounded">
            g
          </div>
          <div>
            <h1 className="font-display font-bold text-sm tracking-wide text-white">
              GROK
            </h1>
            <p className="text-[10px] font-mono font-medium text-[#00ff66]/80 tracking-widest uppercase">
              beta access
            </p>
          </div>
        </div>
        
        <div className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-850 text-[9px] text-zinc-400 font-mono tracking-wider">
          X-LINKED
        </div>
      </div>

      {/* Action Center: Quick New Chat */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-zinc-800 bg-[#0B0B0C] hover:bg-zinc-900 hover:border-zinc-700 hover:text-white transition-all text-xs font-display font-medium group cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#00ff66] group-hover:scale-110 transition-transform" />
            New Thread
          </span>
          <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-1 py-0.5 rounded group-hover:bg-zinc-850">
            â K
          </span>
        </button>
      </div>

      {/* Thread History List Container */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-zinc">
        <div className="flex items-center justify-between px-2 py-1.5 text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-semibold">
          <span className="flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-zinc-500" />
            Active Threads
          </span>
          <span>{sessions.length}</span>
        </div>

        {sessions.length === 0 ? (
          <div className="p-4 text-center text-[11px] text-zinc-600 font-sans border border-dashed border-zinc-900/40 rounded-lg">
            No active discussions. Strike a conversation.
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-sans transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#151518] text-white border-l-2 border-[#00ff66]"
                    : "text-zinc-400 hover:bg-[#0c0c0e] hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                  <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                    isActive ? "text-[#00ff66]" : "text-zinc-500 group-hover:text-zinc-400"
                  }`} />
                  <span className="truncate font-medium">{session.title}</span>
                </div>
                
                {/* Delete Trigger */}
                <button
                  onClick={(e) => onDeleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-900/85 rounded transition-all ml-1.5 cursor-pointer"
                  title="Remove Thread"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Features Showcase Panel */}
      <div className="p-4 mx-3 mb-3 bg-zinc-950/85 border border-zinc-900/60 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="w-3.5 h-3.5 text-[#00ff66]" />
          <span className="text-[11px] font-display font-medium tracking-wide">Fun Engine Active</span>
        </div>
        <p className="text-[10px] text-zinc-400 leading-relaxed">
          Grok answers with healthy wit, playful banter, spicy roasts & complete details.
        </p>
        <div className="flex items-center gap-1.5 text-[9px] text-[#00ff66] bg-[#00ff66]/5 py-1 px-1.5 rounded border border-[#00ff66]/10 font-mono">
          <TrendingUp className="w-3 h-3" />
          <span>Real-time web search ready</span>
        </div>
      </div>

      {/* User Premium Profile Info */}
      <div className="p-4 border-t border-[#121215]/80 bg-[#09090b]">
        {userProfile ? (
          <div className="flex items-center gap-3">
            <div 
              style={{ backgroundColor: userProfile.avatarColor }}
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-black font-display text-sm relative"
            >
              {userProfile.name.charAt(0)}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00ff66] border-2 border-[#09090b] rounded-full" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white truncate max-w-[120px]">
                  {userProfile.name}
                </h4>
                <ShieldCheck className="w-3.5 h-3.5 text-[#00ff66] flex-shrink-0" />
              </div>
              <p className="text-[10px] text-zinc-400 truncate max-w-[140px]">
                {userProfile.email}
              </p>
              <div className="text-[9px] font-mono text-[#00ff66] font-semibold mt-0.5 tracking-wider">
                {userProfile.subscription}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono animate-pulse">
            <User className="w-4 h-4" />
            Synchronizing Explorer...
          </div>
        )}
      </div>

    </aside>
  );
}
