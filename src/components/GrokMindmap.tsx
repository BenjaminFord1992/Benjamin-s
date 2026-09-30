import React, { useEffect, useRef, useState } from "react";
import { 
  Cpu, 
  Orbit, 
  Eye, 
  RefreshCw, 
  ShieldCheck, 
  Layers, 
  Compass,
  Download
} from "lucide-react";

interface GrokMindmapProps {
  prompt: string;
  onRegenerate?: () => void;
}

export function GrokMindmap({ prompt, onRegenerate }: GrokMindmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeLayer, setActiveLayer] = useState<"schematic" | "particles" | "telemetry">("schematic");
  const [rotationSpeed, setRotationSpeed] = useState(0.8);
  const [inspectedNode, setInspectedNode] = useState<string>("Core Synthesis Node");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = 500);
    let height = (canvas.height = 500);

    // Parse keywords in prompt to change active procedural geometry style
    const isNeural = /neural|brain|ai|learning|concept/i.test(prompt);
    const isSpace = /space|orbit|star|mars|galaxy|planet|orbit/i.test(prompt);
    const isCircuit = /circuit|chip|hardware|computer|processor|crypto/i.test(prompt);

    // Setup base entities
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }> = [];

    const nodes: Array<{
      x: number;
      y: number;
      label: string;
      value: string;
      radius: number;
    }> = [];

    // Initialize particles
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? "#00ff66" : "#ffffff",
      });
    }

    // Initialize nodes
    if (isNeural) {
      nodes.push(
        { x: 150, y: 150, label: "Input Layer Alpha", value: "Signal: 0.892", radius: 6 },
        { x: 150, y: 350, label: "Input Layer Beta", value: "Signal: 0.104", radius: 6 },
        { x: 250, y: 250, label: "Weights Tensor Gate", value: "Synapse: Wx+B", radius: 8 },
        { x: 350, y: 150, label: "Output Prediction", value: "Certainty: 98.4%", radius: 10 },
        { x: 350, y: 350, label: "Entropy feedback Loop", value: "Loss: 0.003", radius: 8 }
      );
    } else if (isSpace) {
      nodes.push(
        { x: 250, y: 250, label: "Solar Nucleus Alpha", value: "Mass: 1.98M+", radius: 16 },
        { x: 120, y: 250, label: "Orbital Probe Helix", value: "Dist: 1.48 AU", radius: 5 },
        { x: 380, y: 250, label: "Outer Belt Vector", value: "Velocity: 24km/s", radius: 7 },
        { x: 250, y: 100, label: "Stellar Cloud Horizon", value: "Density: high", radius: 6 }
      );
    } else {
      // Default: Grid system or Circuit style
      nodes.push(
        { x: 100, y: 100, label: "Grid Origin A1", value: "Volt: 5V", radius: 5 },
        { x: 400, y: 100, label: "Crossover Gate B2", value: "Status: LOCKED", radius: 6 },
        { x: 100, y: 400, label: "Quantum bus C1", value: "Hz: 4.8Ghz", radius: 6 },
        { x: 400, y: 400, label: "Ground Rail Zero", value: "Low bias", radius: 5 },
        { x: 250, y: 250, label: "Universal Core Processor", value: "Executing logic", radius: 12 }
      );
    }

    let angle = 0;

    // Drawing loops
    const draw = () => {
      ctx.fillStyle = "#060608";
      ctx.fillRect(0, 0, width, height);

      // 1. Draw scientific background radar matrix
      ctx.strokeStyle = "rgba(40, 40, 45, 0.4)";
      ctx.lineWidth = 1;

      // Circular ranges
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 80, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 160, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 230, 0, Math.PI * 2);
      ctx.stroke();

      // Horizontal / vertical guidelines
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();

      angle += 0.002 * rotationSpeed;

      // 2. Process active visualization layers
      if (activeLayer === "particles") {
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;

          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();

          // Connect nearby particles
          particles.forEach((p2) => {
            const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
            if (dist < 80) {
              ctx.strokeStyle = `rgba(0, 255, 102, ${1 - dist / 80})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          });
        });
      } else if (activeLayer === "schematic") {
        // Draw orbital trajectories / node connectivity
        nodes.forEach((n, idx) => {
          // Add complex rotating rings around keys
          ctx.strokeStyle = idx % 2 === 0 ? "rgba(0, 255, 102, 0.5)" : "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius * 2, angle * (idx % 2 === 0 ? 1 : -1.5), angle * 2 + Math.PI);
          ctx.stroke();

          // Nodes interconnect strings
          nodes.forEach((n2, idx2) => {
            if (idx !== idx2 && idx2 > idx) {
              ctx.strokeStyle = "rgba(0, 255, 102, 0.15)";
              ctx.beginPath();
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(n2.x, n2.y);
              ctx.stroke();
            }
          });

          // Draw Core Node Circle
          ctx.fillStyle = idx % 2 === 0 ? "#00ff66" : "#ffffff";
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // Telemetry mapping view
        nodes.forEach((n, idx) => {
          // Plot coordinates box
          ctx.strokeStyle = "rgba(0, 255, 102, 0.3)";
          ctx.strokeRect(n.x - 30, n.y - 25, 60, 5);

          ctx.fillStyle = "rgba(0, 255, 102, 0.05)";
          ctx.fillRect(n.x - 30, n.y - 20, 60, 25);

          ctx.fillStyle = "#ffffff";
          ctx.font = "8px monospace";
          ctx.fillText(`X:${Math.round(n.x)} Y:${Math.round(n.y)}`, n.x - 26, n.y - 12);
          ctx.fillText(`VAL:${n.value.slice(0, 6)}`, n.x - 26, n.y - 2);

          ctx.strokeStyle = "rgba(0, 255, 102, 0.6)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
          ctx.stroke();
        });

        // Add telemetry sweeping line
        const sweepY = (Math.sin(angle * 5) * height) / 2 + height / 2;
        ctx.strokeStyle = "rgba(0, 255, 102, 0.15)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, sweepY);
        ctx.lineTo(width, sweepY);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [activeLayer, rotationSpeed, prompt]);

  return (
    <div className="border border-zinc-800 rounded-xl bg-[#08080A] overflow-hidden flex flex-col items-stretch max-w-lg mx-auto my-4 font-mono text-xs">
      {/* Title Bar Details */}
      <div className="px-4 py-3 bg-[#0B0B0C] border-b border-zinc-950 flex items-center justify-between text-zinc-300">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#00ff66] animate-spin" style={{ animationDuration: "10s" }} />
          <div>
            <span className="text-white block font-bold text-xs">GROK VECTOR CANVAS</span>
            <span className="text-[9px] text-zinc-500 uppercase">Procedural Schematic Generation</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#00ff66] bg-[#00ff66]/10 px-1.5 py-0.5 rounded border border-[#00ff66]/15">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Interactive Vector Engine</span>
        </div>
      </div>

      {/* Actual Render Canvas */}
      <div className="relative flex items-center justify-center bg-black/40 py-2 border-b border-zinc-900">
        <canvas ref={canvasRef} className="max-w-full aspect-square" />
        
        {/* Overlay Telemetry Box */}
        <div className="absolute top-4 left-4 p-2 bg-black/80 border border-zinc-800 rounded text-[9px] text-zinc-400 space-y-1 backdrop-blur pointer-events-none">
          <div><span className="text-zinc-500 pr-1">PROMPT:</span> "{prompt.substring(0, 30)}..."</div>
          <div><span className="text-zinc-500 pr-1">ANGULAR:</span> {rotationSpeed.toFixed(2)} rad/s</div>
          <div><span className="text-zinc-500 pr-1">INSPECT:</span> {inspectedNode}</div>
        </div>
      </div>

      {/* Visual Tuning Control Panel */}
      <div className="p-4 bg-[#09090C] space-y-4">
        {/* Layer Switches */}
        <div className="flex items-center justify-between">
          <span className="text-zinc-400 font-sans font-medium text-[11px]">ACTIVE VECTOR VIEWPORTS</span>
          <div className="flex items-center gap-1.5 bg-black p-0.5 rounded-lg border border-zinc-850">
            {(["schematic", "particles", "telemetry"] as const).map((layer) => (
              <button
                key={layer}
                onClick={() => {
                  setActiveLayer(layer);
                  setInspectedNode(
                    layer === "schematic"
                      ? "Schematic Node Synthesis"
                      : layer === "particles"
                      ? "Particle Field Acceleration"
                      : "Direct Telemetry Stream"
                  );
                }}
                className={`px-2.5 py-1 text-[10px] rounded capitalize transition-all cursor-pointer ${
                  activeLayer === layer
                    ? "bg-[#00ff66]/10 text-[#00ff66] font-bold"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {layer}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders and actions */}
        <div className="grid grid-cols-2 gap-4 text-[10px] items-center">
          <div className="space-y-1">
            <span className="text-zinc-500">ROTATION FREQUENCY</span>
            <input
              type="range"
              min="0.1"
              max="2.5"
              step="0.1"
              value={rotationSpeed}
              onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
              className="w-full accent-[#00ff66] cursor-pointer"
            />
          </div>

          <div className="flex flex-col items-end gap-1 font-sans">
            <span className="text-[10px] text-zinc-500 font-mono uppercase">IMAGE RECOVERY HELPER</span>
            
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1 py-1 px-3 text-[10px] font-medium text-white hover:text-black border border-zinc-850 hover:bg-[#00ff66] hover:border-[#00ff66] rounded.lg transition-all rounded"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retransmit Model Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
