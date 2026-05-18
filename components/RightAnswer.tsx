'use client';

import React, { useEffect, useRef } from 'react';

interface Props {
  show: boolean;
  isCorrect: boolean;
  onNext: () => void;
}

export default function AnswerFeedback({ show, isCorrect, onNext }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ─── Ovoz chalish ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!show) return;

    const src = isCorrect ? '/right.mp3' : '/wrong.mp3';
    const audio = new Audio(src);
    audio.volume = 0.1;
    audio.play().catch(() => {});
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [show, isCorrect]);

  // ─── To'g'ri bo'lsa 1.5 sekunddan keyin avtomatik o'tish ────────────────────
  useEffect(() => {
    if (!show || !isCorrect) return;
    const timer = setTimeout(() => {
      onNext();
    }, 1000);
    return () => clearTimeout(timer);
  }, [show, isCorrect]);

  if (!show) return null;

  return (
    <>
      {/* Overlay — faqat wrong da bosish bloklansin */}
      {!isCorrect && (
        <div className="fixed inset-0 z-40" />
      )}

      {/* Bottom toast bar */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-50
          flex items-center justify-between
          px-6 py-4 shadow-2xl
          transition-all duration-300
          ${isCorrect ? 'bg-green-500' : 'bg-white border-t-4 border-red-500'}
        `}
        style={{ minHeight: '72px' }}
      >
        {/* Chap: icon + matn */}
        <div className="flex items-center gap-4">
          {/* Icon doira */}
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
              ${isCorrect ? 'bg-white/20' : 'bg-red-500'}
            `}
          >
            {isCorrect ? (
              // ✓ checkmark
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              // ✗ xmark
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>

          {/* Matn */}
          <span
            className={`
              font-bold text-lg
              ${isCorrect ? 'text-white' : 'text-red-600'}
            `}
          >
            {isCorrect ? 'Correct answer!' : 'Wrong answer'}
          </span>
        </div>

        {/* O'ng: tugmalar */}
        <div className="flex items-center gap-3">
          {/* Faqat wrong da extra icon tugmalar ko'rsatiladi */}
          {!isCorrect && (
            <>
              {/* Key icon */}
              <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-gray-500">
                  <path
                    d="M15 7a4 4 0 11-4 4 4 4 0 014-4zM7.05 17.05l4.24-4.24M7 21l3-3"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {/* Bookmark icon */}
              <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-gray-500">
                  <path
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Flag icon */}
              <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-gray-500">
                  <path
                    d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Next tugmasi — faqat wrong da */}
          {!isCorrect && (
            <button
              onClick={onNext}
              className="
                px-10 py-3 rounded-full
                bg-red-500 hover:bg-red-600
                text-white font-bold text-base
                transition-all duration-150
                hover:scale-105 active:scale-95
                shadow-md ml-2
              "
            >
              Next
            </button>
          )}

          {/* To'g'ri bo'lsa: loading indikator (avtomatik o'tadi) */}
          {isCorrect && (
            <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <span>Next...</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}