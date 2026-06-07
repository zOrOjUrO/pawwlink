"use client";

import { useCallback, useRef, useState } from "react";

const ACCEPT = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function PhotoDropzone({ onFile }: { onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const pick = useCallback(
    (f: File | undefined | null) => {
      if (!f) return;
      if (!ACCEPT.includes(f.type)) {
        alert("Please use a JPEG, PNG, or WebP photo.");
        return;
      }
      setPreview(URL.createObjectURL(f));
      onFile(f);
    },
    [onFile]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]); }}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition-all min-h-[240px] flex flex-col items-center justify-center bg-white ${
        dragging ? "border-rescue bg-rescue/5" : "border-mist hover:border-rescue/60"
      }`}
    >
      <input ref={inputRef} type="file" accept={ACCEPT.join(",")} capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Selected pet" className="max-h-52 rounded-xl object-contain shadow-sm" />
          <p className="mt-4 text-sm text-slate-brand/60">Tap to change</p>
        </>
      ) : (
        <>
          <div className="h-16 w-16 rounded-full bg-rescue/10 flex items-center justify-center">
            <svg className="h-8 w-8 text-rescue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M12 16V4m0 0L8 8m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="mt-4 font-display font-semibold text-slate-brand text-lg">Drag &amp; drop a photo</p>
          <p className="mt-1 text-sm text-slate-brand/60">or tap to choose a photo of your pet</p>
        </>
      )}
    </div>
  );
}
