/**
 * ============================================================================
 *  MeeChain Achievement Popup — Frontend (React + @tanstack/react-query)
 * ============================================================================
 *  ใช้คู่กับ backend:
 *    GET  /api/magic/achievements/:address   -> badges (แต่ละอันมี seen: true/false)
 *    POST /api/magic/achievements/ack        -> mark badge ว่าแสดง popup ให้ดูแล้ว
 *
 *  Flow:
 *    1) poll achievements ทุก 5 วิ (เร็วกว่า card อื่นๆ เพราะอยากให้ popup ขึ้นไว)
 *    2) ถ้าเจอ badge ที่ seen === false -> ต่อคิวเข้า popup queue
 *    3) โชว์ popup ทีละใบ (กันหลาย badge unlock พร้อมกันแล้ว popup ซ้อนกันมั่ว)
 *    4) พอผู้ใช้ปิด popup -> เรียก /ack เพื่อไม่ให้ badge นี้ unlock popup ซ้ำอีก
 * ============================================================================
 */

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_MEECHAIN_API_BASE) ||
  "http://localhost:5000";

async function getAchievements(address) {
  const res = await fetch(`${API_BASE}/api/magic/achievements/${address}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to fetch achievements");
  return json.result.badges; // [{ id, label, trigger, earnedAt, seen }]
}

async function ackAchievements(address, badgeIds) {
  const res = await fetch(`${API_BASE}/api/magic/achievements/ack`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, badgeIds }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || "Failed to ack achievements");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// useAchievementWatcher — hook หลักที่ดูแล popup queue ทั้งหมด
// ---------------------------------------------------------------------------
export function useAchievementWatcher() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState([]); // badge ที่รอโชว์ popup
  const [current, setCurrent] = useState(null); // badge ที่กำลังโชว์อยู่ตอนนี้

  const { data: badges } = useQuery({
    queryKey: ["achievements", address],
    queryFn: () => getAchievements(address),
    enabled: Boolean(address),
    refetchInterval: 5000, // เร็วกว่า card อื่น เพราะอยาก popup ขึ้นไวๆ
  });

  // เจอ badge ใหม่ที่ seen === false -> ต่อคิว (กันซ้ำด้วย queue/current id check)
  useEffect(() => {
    if (!badges) return;
    const unseen = badges.filter((b) => !b.seen);
    if (unseen.length === 0) return;

    setQueue((prevQueue) => {
      const existingIds = new Set([...prevQueue.map((b) => b.id), current?.id]);
      const newOnes = unseen.filter((b) => !existingIds.has(b.id));
      return newOnes.length > 0 ? [...prevQueue, ...newOnes] : prevQueue;
    });
  }, [badges]); // eslint-disable-line react-hooks/exhaustive-deps

  // ดึงตัวถัดไปจากคิวมาโชว์ ถ้าตอนนี้ไม่มี popup ค้างอยู่
  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((q) => q.slice(1));
    }
  }, [queue, current]);

  const dismiss = async () => {
    if (!current || !address) return;
    const dismissed = current;
    setCurrent(null);
    try {
      await ackAchievements(address, [dismissed.id]);
      queryClient.invalidateQueries({ queryKey: ["achievements", address] });
    } catch (err) {
      console.warn("[MeeChain Achievement] ack ล้มเหลว (popup จะไม่ขึ้นซ้ำใน session นี้):", err.message);
    }
  };

  return { current, queueLength: queue.length, dismiss };
}

// ---------------------------------------------------------------------------
// UI: AchievementPopup — วางไว้ครั้งเดียวที่ root ของแอป (เช่นใน App.jsx / Layout.jsx)
// ---------------------------------------------------------------------------
export function AchievementPopup() {
  const { current, queueLength, dismiss } = useAchievementWatcher();

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      onClick={dismiss}
    >
      <div
        className="relative mx-4 max-w-sm w-full rounded-2xl border-2 border-emerald-400 bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-950 p-8 text-center shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-[popIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* emoji burst แทน confetti library ให้เบาๆ ไม่ต้องพึ่ง dependency เพิ่ม */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-3xl select-none animate-[bounce_1s_ease-in-out_infinite]">
          🎉
        </div>

        <p className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-2">
          Achievement Unlocked
        </p>
        <div className="text-5xl mb-3">{extractEmoji(current.label)}</div>
        <h3 className="text-xl font-bold text-white mb-1">{stripEmoji(current.label)}</h3>
        <p className="text-sm text-indigo-300 mb-6">
          ปลดล็อกเมื่อ {new Date(current.earnedAt).toLocaleString("th-TH")}
        </p>

        <button
          onClick={dismiss}
          className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold transition"
        >
          รับทราบ {queueLength > 0 ? `(อีก ${queueLength} รางวัลรอคิว)` : ""}
        </button>
      </div>

      {/* keyframes ฝัง inline กันต้องแก้ tailwind.config เพิ่ม */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.8) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// badge label เป็นรูปแบบ "✨ First Awakening" -> แยก emoji ออกมาโชว์ตัวใหญ่ต่างหาก
function extractEmoji(label) {
  const match = label.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)/u);
  return match ? match[0] : "🏆";
}
function stripEmoji(label) {
  return label.replace(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s*/u, "");
}
