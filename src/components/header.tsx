"use client";

import type { Task } from '@/lib/types';

export default function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 md:px-6">
      <div className="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-primary"
        >
          <path d="M12.22 2h-4.44a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.38" />
          <path d="M16 2l4 4" />
          <path d="M12.22 2h-4.44a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.5" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <path d="m7.5 10.5 2 2 4-4" />
        </svg>
        <h1 className="text-xl font-bold font-headline text-foreground">
          Task Quest
        </h1>
      </div>
    </header>
  );
}
