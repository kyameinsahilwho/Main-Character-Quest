"use client";

import { User } from 'lucide-react';
import type { Task } from '@/lib/types';

export default function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 md:px-6">
      <div className="flex items-center gap-2">
        <User className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold font-headline text-foreground">
          Main Character Quest
        </h1>
      </div>
    </header>
  );
}
