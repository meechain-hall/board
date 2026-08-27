/**
 * ============================================================================
 *  MeeChain Daily Quest — Frontend (React + @tanstack/react-query + Wagmi)
 * ============================================================================
 *  ใช้คู่กับ backend cron-based Daily Quest system:
 *    GET  /api/magic/daily-quest/:address   -> ภารกิจวันนี้ + สถานะสำเร็จ
 *    POST /api/magic/daily-quest/confirm    -> ยืนยันภารกิจแบบ manual เอง
 *
 *  ภารกิจ mode: "auto"   -> ติ๊กถูกอัตโนมัติจาก backend (create-relic /
 *                            ritual-of-growth / send-blessing confirm แล้ว)
 *               ไม่ต้องมีปุ่มยืนยันในนี้ รอ refetch แล้วจะเห็นเองเปลี่ยนเป็น ✅
 *  ภารกิจ mode: "manual" -> ต้องกดปุ่ม "ยืนยันภารกิจ" ในการ์ดนี้เอง
 * ============================================================================
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_MEECHAIN_API_BASE) ||
  "http://localhost:5000";

async function getDailyQuest(address) {
  const res = await fetch(`${API_BASE}/api/magic/daily-quest/${address}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to fetch daily quests");
  return json.result; // { date, quests, completedCount, totalCount, allComplete }
}

async function confirmDailyQuest({ address, questId }) {
  const res = await fetch(`${API_BASE}/api/magic/daily-quest/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, questId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to confirm quest");
  return json;
}

// ---------------------------------------------------------------------------
// useDailyQuest — polling ทุก 15 วิ (เผื่อ auto-quest เพิ่งสำเร็จจากที่อื่น)
// ---------------------------------------------------------------------------
export function useDailyQuest(address) {
  return useQuery({
    queryKey: ["dailyQuest", address],
    queryFn: () => getDailyQuest(address),
    enabled: Boolean(address),
    refetchInterval: 15000,
  });
}

// ---------------------------------------------------------------------------
// useConfirmDailyQuest — สำหรับภารกิจ mode: "manual"
// ---------------------------------------------------------------------------
export function useConfirmDailyQuest(address) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questId) => confirmDailyQuest({ address, questId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyQuest", address] });
    },
  });
}

// ---------------------------------------------------------------------------
// UI: DailyQuestCard
// ---------------------------------------------------------------------------
export function DailyQuestCard() {
  const { address, isConnected } = useAccount();
  const { data, isLoading, error } = useDailyQuest(address);
  const confirmQuest = useConfirmDailyQuest(address);

  if (!isConnected) {
    return (
      <QuestShell>
        <p className="text-sm text-indigo-300">🗝️ ปลุก Magic Key ก่อนเพื่อดูภารกิจประจำวัน</p>
      </QuestShell>
    );
  }
  if (isLoading) return <QuestShell>🎲 กำลังหมุนภารกิจของวันนี้...</QuestShell>;
  if (error) return <QuestShell tone="error">⚠️ โหลดภารกิจไม่สำเร็จ: {error.message}</QuestShell>;

  return (
    <QuestShell>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-indigo-100">🎲 Daily Quest</h2>
        <span className="text-xs text-indigo-400">{data.date}</span>
      </div>

      <div className="mb-4">
        <div className="h-2 rounded-full bg-indigo-900 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${(data.completedCount / data.totalCount) * 100}%` }}
          />
        </div>
        <p className="text-xs text-indigo-400 mt-1">
          {data.completedCount}/{data.totalCount} ภารกิจสำเร็จวันนี้
          {data.allComplete && " 🎉 ครบทุกภารกิจแล้ว!"}
        </p>
      </div>

      <ul className="space-y-2">
        {data.quests.map((quest) => (
          <li
            key={quest.id}
            className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border ${
              quest.completed
                ? "bg-emerald-950/40 border-emerald-700"
                : "bg-indigo-900/40 border-indigo-800"
            }`}
          >
            <div>
              <p className={`text-sm font-medium ${quest.completed ? "text-emerald-300" : "text-indigo-100"}`}>
                {quest.completed ? "✅" : "⬜"} {quest.label}
              </p>
              <p className="text-xs text-indigo-400">{quest.desc}</p>
            </div>

            {!quest.completed && quest.mode === "manual" && (
              <button
                onClick={() => confirmQuest.mutate(quest.id)}
                disabled={confirmQuest.isPending}
                className="text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-emerald-950 whitespace-nowrap"
              >
                ยืนยันภารกิจ
              </button>
            )}
            {!quest.completed && quest.mode === "auto" && (
              <span className="text-[11px] text-indigo-500 whitespace-nowrap">อัตโนมัติ</span>
            )}
          </li>
        ))}
      </ul>

      {confirmQuest.error && (
        <p className="text-xs text-red-400 mt-2">⚠️ {confirmQuest.error.message}</p>
      )}
    </QuestShell>
  );
}

function QuestShell({ children, tone = "normal" }) {
  return (
    <div
      className={`p-5 rounded-2xl border shadow-lg ${
        tone === "error"
          ? "bg-red-950/40 border-red-800 text-red-200"
          : "bg-gradient-to-br from-indigo-950 to-slate-950 border-indigo-800 text-indigo-100"
      }`}
    >
      {children}
    </div>
  );
}
