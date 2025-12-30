"use client";

import { useState } from "react";
import { Project } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Folder } from "lucide-react";

interface AddProjectDialogProps {
  children: React.ReactNode;
  onAddProject: (projectData: Omit<Project, 'id' | 'createdAt'>) => void;
}

export function AddProjectDialog({ children, onAddProject }: AddProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddProject({
      name: name.trim(),
    });

    setName("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[90vw] max-w-[400px] bg-white border-2 border-b-8 border-[#CBD5E1] text-[#1E293B] rounded-[2rem] shadow-2xl p-0 overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">Create New Project</DialogTitle>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F1F4F9] border-2 border-b-4 border-[#CBD5E1] flex items-center justify-center">
              <Folder className="w-5 h-5 text-[#1E293B] stroke-[3]" />
            </div>
            <h2 className="text-lg font-black font-headline uppercase tracking-tight text-[#1E293B]">New Project</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[11px] font-black uppercase tracking-[0.15em] text-[#64748B]">Project Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Work, Personal, Fitness"
                autoFocus
                className="h-12 bg-[#F1F4F9] border-2 border-[#CBD5E1] rounded-xl font-bold focus:ring-0 focus:border-primary transition-all"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="submit"
                disabled={!name.trim()}
                className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-widest border-2 border-b-4 border-blue-700 rounded-xl active:translate-y-[2px] active:border-b-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
