import React, { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

interface GrokHTMLRendererProps {
  content: string;
}

export function GrokHTMLRenderer({ content }: GrokHTMLRendererProps) {
  if (!content) return null;

  // Split string by code blocks (three backticks ```)
  // Even indexes will be normal text, odd indexes will be code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-4 text-gray-200 text-sm leading-relaxed overflow-hidden">
      {parts.map((part, partIdx) => {
        if (part.startsWith("```")) {
          // This is a code block
          const lines = part.split("\n");
          // Extract language if present
          const header = lines[0].replace("```", "").trim();
          const language = header || "code";
          const code = lines.slice(1, lines.length - 1).join("\n");

          return <CodeBlock key={partIdx} code={code} language={language} />;
        } else {
          // Render normal formatting block
          return <TextBlock key={partIdx} text={part} />;
        }
      })}
    </div>
  );
}

// Interactive Code Block Component with Copy Actions
function CodeBlock({ code, language }: { code: string; language: string; key?: React.Key }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard write failed", err);
    }
  };

  return (
    <div className="my-4 border border-zinc-800/80 rounded-lg overflow-hidden bg-[#0A0A0C] font-mono text-xs">
      {/* Code Header Control Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/50">
        <span className="text-zinc-400 capitalize text-[10px] tracking-wider font-semibold">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors py-0.5 px-2 rounded hover:bg-zinc-800"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="text-[10px]">Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div className="p-4 overflow-x-auto text-zinc-300 whitespace-pre scrollbar-thin scrollbar-zinc">
        <code>{code}</code>
      </div>
    </div>
  );
}

// Inline formatting wrapper for bold, italic, and backticks inline code
function TextBlock({ text }: { text: string; key?: React.Key }) {
  // Split block by lines to process paragraphs and lists
  const lines = text.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Check for lists
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const listContent = trimmed.slice(2);
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1 text-gray-300 my-1">
              <li>
                <InlineFormatter text={listContent} />
              </li>
            </ul>
          );
        }

        if (/^\d+\.\s/.test(trimmed)) {
          const match = trimmed.match(/^(\d+)\.\s(.*)/);
          if (match) {
            const num = match[1];
            const listContent = match[2];
            return (
              <ol key={idx} className="list-decimal pl-5 space-y-1 text-gray-300 my-1">
                <li value={parseInt(num)}>
                  <InlineFormatter text={listContent} />
                </li>
              </ol>
            );
          }
        }

        // Empty line represents paragraph break
        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        // Standard text paragraph
        return (
          <p key={idx} className="text-gray-300 font-sans leading-relaxed text-[13.5px]">
            <InlineFormatter text={line} />
          </p>
        );
      })}
    </div>
  );
}

// Parse inline markup (bold, inline-code, links, sources)
function InlineFormatter({ text }: { text: string }) {
  if (!text) return null;

  // Regex rules
  // 1. **bold**
  // 2. `inline code`
  // 3. [text](url)
  // Let's tokenise the string
  const tokens: React.ReactNode[] = [];
  let currentStr = text;

  // Temporary container to iterate through tokens
  let keyIndex = 0;

  while (currentStr.length > 0) {
    const boldIndex = currentStr.indexOf("**");
    const codeIndex = currentStr.indexOf("`");
    const linkMatch = currentStr.match(/\[([^\]]+)\]\(([^)]+)\)/);
    const linkIndex = linkMatch ? currentStr.indexOf(linkMatch[0]) : -1;

    // Find closest token type
    const indices = [
      { type: "bold", index: boldIndex },
      { type: "code", index: codeIndex },
      { type: "link", index: linkIndex },
    ].filter((item) => item.index !== -1);

    if (indices.length === 0) {
      tokens.push(<span key={keyIndex++}>{currentStr}</span>);
      break;
    }

    // Sort by earliest appearance
    indices.sort((a, b) => a.index - b.index);
    const earliest = indices[0];

    // Push preceding text as plain text
    if (earliest.index > 0) {
      tokens.push(<span key={keyIndex++}>{currentStr.substring(0, earliest.index)}</span>);
    }

    if (earliest.type === "bold") {
      const rest = currentStr.substring(earliest.index + 2);
      const endBold = rest.indexOf("**");
      if (endBold !== -1) {
        const boldText = rest.substring(0, endBold);
        tokens.push(
          <strong key={keyIndex++} className="font-bold text-white tracking-wide">
            {boldText}
          </strong>
        );
        currentStr = rest.substring(endBold + 2);
      } else {
        tokens.push(<span key={keyIndex++}>**</span>);
        currentStr = rest;
      }
    } else if (earliest.type === "code") {
      const rest = currentStr.substring(earliest.index + 1);
      const endCode = rest.indexOf("`");
      if (endCode !== -1) {
        const codeText = rest.substring(0, endCode);
        tokens.push(
          <code
            key={keyIndex++}
            className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[#00ff66] font-mono text-[12px]"
          >
            {codeText}
          </code>
        );
        currentStr = rest.substring(endCode + 1);
      } else {
        tokens.push(<span key={keyIndex++}>`</span>);
        currentStr = rest;
      }
    } else if (earliest.type === "link" && linkMatch) {
      const linkFull = linkMatch[0];
      const linkLabel = linkMatch[1];
      const linkUrl = linkMatch[2];

      tokens.push(
        <a
          key={keyIndex++}
          href={linkUrl}
          target="_blank"
          referrerPolicy="no-referrer"
          className="inline-flex items-center gap-0.5 text-[#00ff66] hover:underline hover:text-emerald-400 font-medium font-sans"
        >
          {linkLabel}
          <ExternalLink className="w-3 h-3" />
        </a>
      );
      currentStr = currentStr.substring(earliest.index + linkFull.length);
    }
  }

  return <>{tokens}</>;
}
