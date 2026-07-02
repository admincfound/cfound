"use client";

import { useState } from "react";
import { Send, Search, MessageSquare } from "lucide-react";
import { PageHeader, EmptyState } from "../../../components/employer/UI";

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
}

const conversations: Conversation[] = [
  { id: "1", name: "Aditi Sharma", lastMessage: "Thanks, looking forward to the interview!", time: "10:24 AM", unread: 2 },
  { id: "2", name: "Rohan Mehta", lastMessage: "Can we reschedule to Friday?", time: "Yesterday", unread: 0 },
  { id: "3", name: "Priya Nair", lastMessage: "Sent over my portfolio link.", time: "Mon", unread: 1 },
];

export default function EmployerMessagesPage() {
  const [activeId, setActiveId] = useState(conversations[0]?.id);
  const [draft, setDraft] = useState("");
  const active = conversations.find((c) => c.id === activeId);

  return (
    <div>
      <PageHeader title="Messages" subtitle="Chat with candidates directly." />

      <div className="grid md:grid-cols-3 gap-6 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl overflow-hidden" style={{ minHeight: 520 }}>
        <div className="border-r border-[var(--border-main)] md:col-span-1">
          <div className="flex items-center gap-2 px-4 py-4 border-b border-[var(--border-main)]">
            <Search size={14} className="text-[var(--text-muted)]" />
            <input
              placeholder="Search conversations..."
              className="bg-transparent outline-none text-xs w-full text-[var(--text-main)]"
            />
          </div>
          <div>
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left px-4 py-4 border-b border-[var(--border-main)] transition-colors ${
                  c.id === activeId ? "bg-blue-600/5" : "hover:bg-[var(--bg-main)]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-[var(--text-main)]">{c.name}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{c.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)] truncate max-w-[160px]">
                    {c.lastMessage}
                  </span>
                  {c.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {c.unread}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col">
          {active ? (
            <>
              <div className="px-6 py-4 border-b border-[var(--border-main)] font-black italic text-[var(--text-main)]">
                {active.name}
              </div>
              <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                <div className="max-w-xs bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-[var(--text-main)]">
                  {active.lastMessage}
                </div>
              </div>
              <div className="p-4 border-t border-[var(--border-main)] flex items-center gap-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-[var(--bg-main)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-[var(--text-main)]"
                />
                <button
                  onClick={() => setDraft("")}
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all active:scale-95"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <EmptyState icon={<MessageSquare size={22} />} title="No conversation selected" />
          )}
        </div>
      </div>
    </div>
  );
}
