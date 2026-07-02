"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Send } from "lucide-react";

export default function ContactForm() {
  const [form, setForm] = useState({ company: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Placeholder submission - no backend wired up yet.
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    setForm({ company: "", email: "", message: "" });
    toast.success("Thanks! Our team will get back to you shortly.");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl p-8 space-y-5"
    >
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
          Company Name
        </label>
        <input
          required
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-blue-500 text-[var(--text-main)]"
        />
      </div>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
          Work Email
        </label>
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-blue-500 text-[var(--text-main)]"
        />
      </div>
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
          Message
        </label>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-blue-500 text-[var(--text-main)] resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={sending}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl py-4 transition-all active:scale-95 disabled:opacity-50"
      >
        {sending ? "Sending..." : "Send Message"}
        {!sending && <Send size={14} />}
      </button>
    </form>
  );
}
