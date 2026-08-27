/**
 * ============================================================================
 *  MeeChain MeeBot Sage — Frontend (React + @tanstack/react-query + Wagmi)
 * ============================================================================
 *  ใช้คู่กับ POST /api/magic/sage บน backend (server.js) ที่รองรับ 2 โหมด:
 *
 *    โหมด A (passive advice) — ส่งแค่ { address }
 *      -> Sage อ่าน Quest Log ของ address นี้แล้ววิเคราะห์ว่าควรทำ ritual ไหนต่อ
 *      -> ใช้สำหรับ "แนะนำอัตโนมัติ" ตอนเปิดหน้า Magic Hall (ไม่ต้องพิมพ์อะไรเลย)
 *
 *    โหมด B (chat) — ส่ง { message } (จะมี address แนบไปด้วยหรือไม่ก็ได้)
 *      -> Sage match ด้วย intent regex ตอบกลับตามข้อความที่ผู้ใช้พิมพ์
 *      -> ใช้สำหรับกล่องแชทที่ผู้ใช้พิมพ์คุยกับ Sage เอง
 *
 *  ไฟล์นี้มีทั้งสองแบบ: useMeeBotSage() (passive) และ useMeeBotSageChat() (chat)
 * ============================================================================
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useState } from "react";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_MEECHAIN_API_BASE) ||
  "http://localhost:5000";

async function askSage(body) {
  const res = await fetch(`${API_BASE}/api/magic/sage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to consult MeeBot Sage");
  return json; // { magic, action, result: { text, suggestedAction, reason }, questLog? }
}

// ---------------------------------------------------------------------------
// useMeeBotSage — โหมด passive advice: อ่าน Quest Log แล้วแนะนำ ritual ถัดไปเอง
// ---------------------------------------------------------------------------
export function useMeeBotSage(address) {
  return useQuery({
    queryKey: ["meeBotSage", address],
    queryFn: () => askSage({ address }),
    enabled: Boolean(address),
    refetchInterval: 20000, // รีเช็คทุก 20 วิ เผื่อผู้ใช้เพิ่งทำ ritual สำเร็จ
    select: (json) => json.result, // { text, suggestedAction, reason }
  });
}

// ---------------------------------------------------------------------------
// useMeeBotSageChat — โหมด chat: ผู้ใช้พิมพ์ถาม Sage เอง
// ---------------------------------------------------------------------------
export function useMeeBotSageChat() {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: (message) => askSage({ message, address }),
    onSuccess: () => {
      // เผื่อ backend มีการอัปเดต quest log ระหว่างคุย (เช่น Sage ชวนทำพิธี)
      queryClient.invalidateQueries({ queryKey: ["meeBotSage", address] });
    },
  });
}

// ---------------------------------------------------------------------------
// UI: MeeBotSageCard — โชว์คำแนะนำอัตโนมัติ + กล่องแชทถามเพิ่มได้
// ---------------------------------------------------------------------------
const ACTION_LABELS = {
  "create-relic": "🏺 สร้าง Relic",
  "ritual-of-growth": "🔥 เริ่ม Ritual of Growth",
  "send-blessing": "✨ ส่ง Blessing",
  "daily-quest": "🗓️ ดู Daily Quest",
  "activate-key": "🗝️ ปลุก Magic Key",
};

export function MeeBotSageCard({ onSuggestedAction }) {
  const { address, isConnected } = useAccount();
  const { data: advice, isLoading, error, refetch } = useMeeBotSage(address);
  const chat = useMeeBotSageChat();
  const [input, setInput] = useState("");
  const [chatLog, setChatLog] = useState([]); // [{ role: 'user'|'sage', text }]

  const handleAsk = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setChatLog((log) => [...log, { role: "user", text: userMsg }]);
    setInput("");
    try {
      const json = await chat.mutateAsync(userMsg);
      setChatLog((log) => [...log, { role: "sage", text: json.result.text, suggestedAction: json.result.suggestedAction }]);
    } catch (err) {
      setChatLog((log) => [...log, { role: "sage", text: `⚠️ ${err.message}` }]);
    }
  };

  if (!isConnected) {
    return (
      <SageShell>
        <p className="text-sm text-indigo-300">🗝️ ปลุก Magic Key ก่อนเพื่อรับคำแนะนำจาก Sage</p>
      </SageShell>
    );
  }

  return (
    <SageShell>
      <h2 className="text-lg font-bold text-indigo-100 mb-3">🧙 MeeBot Sage</h2>

      {/* คำแนะนำอัตโนมัติจาก Quest Log */}
      {isLoading && <p className="text-sm text-indigo-300">🧙 Sage กำลังทบทวนม้วนคัมภีร์ของท่าน...</p>}
      {error && <p className="text-sm text-red-400">⚠️ ปรึกษา Sage ไม่สำเร็จ: {error.message}</p>}
      {advice && (
        <div className="mb-4 p-3 rounded-lg bg-indigo-900/50 border border-indigo-700">
          <p className="text-sm text-indigo-100">{advice.text}</p>
          {advice.suggestedAction && (
            <button
              onClick={() => onSuggestedAction?.(advice.suggestedAction)}
              className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-emerald-950"
            >
              👉 {ACTION_LABELS[advice.suggestedAction] || advice.suggestedAction}
            </button>
          )}
        </div>
      )}
      <button onClick={() => refetch()} className="text-xs text-indigo-400 hover:text-indigo-200 mb-4">
        🔄 ขอคำแนะนำใหม่
      </button>

      {/* กล่องแชทถาม Sage เอง */}
      <div className="border-t border-indigo-800 pt-3">
        <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
          {chatLog.map((entry, i) => (
            <p key={i} className={`text-xs ${entry.role === "user" ? "text-indigo-300 text-right" : "text-emerald-300"}`}>
              {entry.role === "user" ? "🗣️ " : "🧙 "}
              {entry.text}
            </p>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder="ถาม Sage เช่น 'อยากสร้าง NFT'"
            className="flex-1 px-3 py-2 rounded-lg bg-indigo-800/50 border border-indigo-700 text-white placeholder-indigo-400 text-sm outline-none"
            disabled={chat.isPending}
          />
          <button
            onClick={handleAsk}
            disabled={chat.isPending || !input.trim()}
            className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm font-semibold"
          >
            ถาม
          </button>
        </div>
      </div>
    </SageShell>
  );
}

function SageShell({ children }) {
  return (
    <div className="p-5 rounded-2xl border border-indigo-800 bg-gradient-to-br from-indigo-950 to-slate-950 shadow-lg">
      {children}
    </div>
  );
}
