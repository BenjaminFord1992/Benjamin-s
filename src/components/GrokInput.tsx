import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Sparkles, 
  Zap, 
  Search, 
  Image as ImageIcon, 
  X, 
  Terminal,
  ChevronDown,
  Info
} from "lucide-react";

interface GrokInputProps {
  onSendMessage: (text: string, image?: string) => void;
  isLoading: boolean;
  mode: "fun" | "regular";
  onToggleMode: (mode: "fun" | "regular") => void;
  deepSearch: boolean;
  onToggleDeepSearch: (val: boolean) => void;
}

export function GrokInput({
  onSendMessage,
  isLoading,
  mode,
  onToggleMode,
  deepSearch,
  onToggleDeepSearch,
}: GrokInputProps) {
  const [inputText, setInputText] = useState("");
  const [imageBuffer, setImageBuffer] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Slash commands data
  const slashCommands = [
    { command: "/fun", desc: "Toggle Witty & Sarcastic Fun Mode", action: () => onToggleMode("fun") },
    { command: "/regular", desc: "Toggle Objective & Structured Regular Mode", action: () => onToggleMode("regular") },
    { command: "/search", desc: "Enable Deep Web Search Grounding", action: () => onToggleDeepSearch(!deepSearch) },
    { command: "/image", desc: "Insert standard prompt for generative visual arts", action: () => setInputText("Generate an image of ") },
  ];

  // Monitor slash trigger
  useEffect(() => {
    if (inputText.endsWith("/")) {
      setShowSlashMenu(true);
    } else if (!inputText.includes("/")) {
      setShowSlashMenu(false);
    }
  }, [inputText]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleCommandClick = (cmd: typeof slashCommands[0]) => {
    cmd.action();
    setShowSlashMenu(false);
    // Remove the trailing slash if we just clicked a command that modifies state
    if (cmd.command !== "/image") {
      setInputText(inputText.replace(/\/$/, ""));
    }
    textareaRef.current?.focus();
  };

  // Convert uploaded image file to base64
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload standard image formats only.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageBuffer(e.target.result as string);
        setImageMime(file.type);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Drag and Drop callbacks
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Submit trigger
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !imageBuffer) return;
    if (isLoading) return;

    onSendMessage(inputText, imageBuffer || undefined);
    setInputText("");
    setImageBuffer(null);
    setImageMime("");
    setShowSlashMenu(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // Auto-grow textarea
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [inputText]);

  // Handle enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // If slash menu is visible, navigate it or select first option
      if (showSlashMenu) {
        e.preventDefault();
        handleCommandClick(slashCommands[0]);
        return;
      }
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-6 relative z-10">
      <form
        onSubmit={handleSubmit}
        className={`relative rounded-xl border transition-all duration-300 bg-[#0B0B0C] ${
          isDragOver
            ? "border-[#00ff66] ring-1 ring-[#00ff66]/20 bg-zinc-950"
            : "border-[#151518] focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-800"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag and drop full HUD block */}
        {isDragOver && (
          <div className="absolute inset-0 bg-[#050505]/95 flex flex-col items-center justify-center rounded-xl pointer-events-none z-20 border-2 border-dashed border-[#00ff66]">
            <Zap className="w-8 h-8 text-[#00ff66] animate-bounce mb-2" />
            <p className="text-xs font-mono font-medium text-white uppercase tracking-wider">
              Drop File To Transmit to Grok
            </p>
          </div>
        )}

        {/* Slash Command dropdown portal */}
        {showSlashMenu && (
          <div className="absolute bottom-full left-0 mb-2 w-72 rounded-lg bg-[#0E0E10] border border-zinc-800/80 shadow-2xl p-2 z-35 space-y-0.5">
            <div className="px-2 py-1 flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono uppercase tracking-wider border-b border-zinc-900/40 pb-1.5 mb-1">
              <Terminal className="w-3 h-3" />
              Grok Keyboard Shortcuts
            </div>
            {slashCommands.map((item) => (
              <button
                type="button"
                key={item.command}
                onClick={() => handleCommandClick(item)}
                className="w-full flex items-center justify-between text-left px-2 py-1.5 rounded hover:bg-zinc-900 transition-colors text-xs font-sans group text-zinc-300"
              >
                <span className="font-mono text-[#00ff66] text-xs font-bold">
                  {item.command}
                </span>
                <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 font-medium">
                  {item.desc}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Added Image attachment layout indicator */}
        {imageBuffer && (
          <div className="flex items-center gap-2 p-3 bg-zinc-900/40 border-b border-zinc-900/60 rounded-t-xl">
            <div className="relative w-12 h-12 rounded border border-zinc-800 overflow-hidden bg-black flex items-center justify-center">
              <img
                src={imageBuffer}
                alt="Upload thumbnail"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => {
                  setImageBuffer(null);
                  setImageMime("");
                }}
                className="absolute top-0.5 right-0.5 p-0.5 bg-black/80 rounded hover:bg-black text-rose-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="text-[10px] font-mono">
              <span className="text-zinc-200 block truncate max-w-[200px]">
                Image Attached (Size optimized)
              </span>
              <span className="text-zinc-500 uppercase">{imageMime}</span>
            </div>
          </div>
        )}

        {/* Input Text Area block */}
        <div className="flex items-start p-3 gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder='Ask Grok anything, type "/" for terminal shortcut toggles...'
            className="flex-1 resize-none bg-transparent outline-none border-none text-zinc-100 placeholder-zinc-550 text-xs py-1 px-1.5 min-h-[22px] font-sans scrollbar-none"
            rows-adaptive="true"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* HUD control bar (Deep Search, Mode Swapper, Attachments, Send) */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-[#121215]/80 bg-[#08080A]/65 rounded-b-xl text-xs">
          <div className="flex items-center gap-4 text-zinc-400">
            {/* Direct Image Attachment Trigger */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded hover:bg-zinc-900 hover:text-[#00ff66] transition-colors cursor-pointer"
              title="Attach visual payload (Image)"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Deep Search Switch with real googleSearch capability */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleDeepSearch(!deepSearch)}
                className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg border text-[11px] font-medium font-display transition-all cursor-pointer ${
                  deepSearch
                    ? "bg-[#00ff66]/10 text-[#00ff66] border-[#00ff66]/30 font-semibold"
                    : "border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-300"
                }`}
              >
                <Search className={`w-3.5 h-3.5 ${deepSearch ? "animate-pulse" : ""}`} />
                Deep Search
              </button>
              <span className="max-sm:hidden text-[10px] text-zinc-550">
                Ground answers live online
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Core Mode Toggles : Fun vs. Regular */}
            <div className="flex items-center bg-zinc-950 p-0.5 rounded-full border border-zinc-850">
              <button
                type="button"
                onClick={() => onToggleMode("regular")}
                className={`px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider transition-all cursor-pointer uppercase ${
                  mode === "regular"
                    ? "bg-[#18181B] text-white font-bold"
                    : "text-zinc-500 hover:text-zinc-350"
                }`}
              >
                Regular
              </button>

              <button
                type="button"
                onClick={() => onToggleMode("fun")}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider transition-all cursor-pointer uppercase ${
                  mode === "fun"
                    ? "bg-[#00ff66] text-black font-extrabold"
                    : "text-zinc-500 hover:text-zinc-350"
                }`}
              >
                <Sparkles className="w-3 h-3" />
                Fun Mode
              </button>
            </div>

            {/* Submit Arrow button */}
            <button
              type="submit"
              disabled={isLoading || (!inputText.trim() && !imageBuffer)}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                inputText.trim() || imageBuffer
                  ? "bg-white text-black hover:scale-105"
                  : "bg-zinc-900 text-zinc-650 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
