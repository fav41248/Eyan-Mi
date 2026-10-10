import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, Send, Award, PartyPopper, ArrowUp } from 'lucide-react';
import { LoveNote } from '../types';

interface BirthdayFinaleProps {
  exactFinaleMessage: string;
  recipientName: string;
  nickname: string;
  onTriggerBurst: () => void;
}

export const BirthdayFinale: React.FC<BirthdayFinaleProps> = ({
  exactFinaleMessage,
  recipientName,
  nickname,
  onTriggerBurst,
}) => {
  const [loveNotes, setLoveNotes] = useState<LoveNote[]>(() => {
    const saved = localStorage.getItem('precious_birthday_notes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 'note-1',
        author: 'Forever In Your Corner',
        message: 'May this new age usher in joy beyond your wildest imagination, Precious. You are deeply cherished!',
        timestamp: 'Today',
      },
      {
        id: 'note-2',
        author: 'With Warmth & Love',
        message: 'Happy Birthday Oluwapreciousimi! Watching you shine is an absolute blessing.',
        timestamp: 'Today',
      },
    ];
  });

  const [authorInput, setAuthorInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    localStorage.setItem('precious_birthday_notes', JSON.stringify(loveNotes));
  }, [loveNotes]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newNote: LoveNote = {
      id: `note-${Date.now()}`,
      author: authorInput.trim() || 'A Secret Admirer',
      message: messageInput.trim(),
      timestamp: 'Just now',
    };

    setLoveNotes([newNote, ...loveNotes]);
    setMessageInput('');
    setAuthorInput('');
    setIsSent(true);
    onTriggerBurst();
    setTimeout(() => setIsSent(false), 3000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="finale-section" className="relative py-16 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto text-center">
      {/* Glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#FCE6E9]/40 blur-3xl pointer-events-none" />

      {/* Main Finale Container */}
      <div className="relative rounded-3xl bg-white/95 p-8 sm:p-14 border border-[#EADBDA] shadow-2xl shadow-[#4A1525]/10">
        
        {/* Top Ornament */}
        <div className="washi-tape-top washi-tape-gold" />

        {/* Floating Heart & Crown Emblem */}
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-[#FFF0F2] to-[#FCE6E9] border-2 border-[#F3C4CC] flex items-center justify-center shadow-lg mb-6 relative">
          <PartyPopper className="w-10 h-10 text-[#8B1E3F] animate-bounce" />
          <Sparkles className="w-5 h-5 text-[#D4AF37] absolute -top-1 -right-1" />
        </div>

        <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-[#9E5D6C] font-semibold mb-3">
          <span>A Toast To You</span>
          <span aria-hidden="true">·</span>
          <span>Forever Precious</span>
        </div>

        {/* EXACT REQUIREMENT: “HAPPPYYYYYYY BIRTHDAYYYYYYYYY🤭🤗🤭🤗” */}
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-black text-[#8B1E3F] tracking-tight mb-4 select-text leading-tight">
          {exactFinaleMessage}
        </h2>

        <p className="text-base sm:text-lg text-[#6E4F57] max-w-lg mx-auto font-light leading-relaxed mb-8">
          To {recipientName}, also known to the world as our lovely {nickname}—may your laughter echo long into this year, and may peace follow every step you take.
        </p>

        {/* Interactive Shower with Love button */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <button
            type="button"
            onClick={onTriggerBurst}
            className="group px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#8B1E3F] via-[#A62B50] to-[#8B1E3F] text-white font-medium text-sm sm:text-base shadow-lg shadow-[#8B1E3F]/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Heart className="w-5 h-5 fill-white text-[#FFF0F2] group-hover:scale-125 transition-transform" />
            <span>Shower Precious With Love 💕</span>
            <Sparkles className="w-4 h-4 text-[#FFDF80]" />
          </button>

          <button
            type="button"
            onClick={scrollToTop}
            className="px-5 py-3.5 rounded-2xl bg-white border border-[#EADBDA] text-[#6E4F57] hover:text-[#8B1E3F] hover:border-[#8B1E3F] font-medium text-sm transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <ArrowUp className="w-4 h-4" />
            <span>Re-read From Top</span>
          </button>
        </div>

        {/* Birthday Wishbook / Note tribute */}
        <div className="mt-10 pt-10 border-t border-[#F0DEDB] text-left">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-[#8B1E3F] fill-[#F8D2D8]" />
            <h3 className="font-serif text-xl font-bold text-[#4A1525]">
              Leave A Birthday Wish For Precious
            </h3>
          </div>

          <form onSubmit={handleAddNote} className="space-y-3 mb-8">
            <input
              type="text"
              placeholder="Your name or signature (optional)"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#EADBDA] bg-[#FAF7F2] text-sm text-[#332226] placeholder-[#A88B92] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
            />
            <textarea
              placeholder="Write a sweet prayer or birthday wish for Oluwapreciousimi..."
              rows={3}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-[#EADBDA] bg-[#FAF7F2] text-sm text-[#332226] placeholder-[#A88B92] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F] resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8C6B73]">
                {isSent ? '✨ Wish preserved for Precious!' : 'Your message will appear below in the wishbook.'}
              </span>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#8B1E3F] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-[#A62B50] transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Pin To Wishbook</span>
              </button>
            </div>
          </form>

          {/* List of notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loveNotes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-xl bg-[#FAF5F4] border border-[#F0DFDE] relative overflow-hidden"
              >
                <p className="text-xs sm:text-sm text-[#4A2D35] leading-relaxed mb-3">
                  "{note.message}"
                </p>
                <div className="flex items-center justify-between text-[11px] text-[#9E5D6C] font-medium border-t border-[#F0D5D8] pt-2">
                  <span className="truncate">— {note.author}</span>
                  <span className="font-mono text-[10px] text-[#BA8D96]">{note.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer quiet copyright/dedication */}
        <div className="mt-12 text-center text-xs text-[#9E5D6C]">
          <p>Created with boundless affection for Oluwapreciousimi ❤️</p>
        </div>
      </div>
    </footer>
  );
};
