"use client";

import { memo } from 'react';
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

interface OverallProgressProps {
  completionPercentage: number;
  isInitialLoad: boolean;
}

function OverallProgress({ completionPercentage, isInitialLoad }: OverallProgressProps) {
  return (
    <div className="hidden lg:flex w-12 bg-card/50 border-l border-border flex-col items-center justify-center p-2">
      <div className="flex flex-col items-center justify-center h-full w-full">
        {isInitialLoad ? <Skeleton className="h-full w-full" /> : (
            <>
                <div className="relative h-full w-8 rounded-full overflow-hidden bg-secondary/30 border border-border shadow-inner">
                    {/* Liquid fill */}
                    <div 
                      className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400 transition-all duration-1000 ease-out"
                      style={{ height: `${completionPercentage}%` }}
                    >
                      {/* Multiple wave layers for more realistic liquid effect */}
                      <div className="absolute top-0 left-0 w-full overflow-visible" style={{ height: '16px' }}>
                        {/* Front wave - most visible */}
                        <svg 
                          className="absolute top-0 left-0 w-[200%] h-full -translate-y-1/2" 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 200 16"
                          preserveAspectRatio="none"
                        >
                          <path 
                            d="M0,8 Q10,4 20,8 T40,8 T60,8 T80,8 T100,8 T120,8 T140,8 T160,8 T180,8 T200,8 L200,16 L0,16 Z" 
                            fill="currentColor"
                            className="text-emerald-400 animate-wave-front drop-shadow-sm"
                          />
                        </svg>
                        {/* Middle wave */}
                        <svg 
                          className="absolute top-0 left-0 w-[200%] h-full -translate-y-1/2 opacity-60" 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 200 16"
                          preserveAspectRatio="none"
                        >
                          <path 
                            d="M0,8 Q10,11 20,8 T40,8 T60,8 T80,8 T100,8 T120,8 T140,8 T160,8 T180,8 T200,8 L200,16 L0,16 Z" 
                            fill="currentColor"
                            className="text-emerald-500 animate-wave-middle"
                          />
                        </svg>
                        {/* Back wave - subtle */}
                        <svg 
                          className="absolute top-0 left-0 w-[200%] h-full -translate-y-1/2 opacity-40" 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 200 16"
                          preserveAspectRatio="none"
                        >
                          <path 
                            d="M0,8 Q10,6 20,8 T40,8 T60,8 T80,8 T100,8 T120,8 T140,8 T160,8 T180,8 T200,8 L200,16 L0,16 Z" 
                            fill="currentColor"
                            className="text-emerald-600 animate-wave-back"
                          />
                        </svg>
                      </div>
                      {/* Enhanced shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                      {/* Light reflection on the side */}
                      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-white/40 via-white/10 to-transparent" />
                    </div>
                    {/* Enhanced bubbles */}
                    {completionPercentage > 10 && (
                      <>
                        <div className="absolute bottom-[10%] left-[20%] w-1.5 h-1.5 rounded-full bg-white/50 animate-bubble shadow-sm" style={{ animationDelay: '0s' }} />
                        <div className="absolute bottom-[20%] left-[70%] w-2 h-2 rounded-full bg-white/40 animate-bubble shadow-sm" style={{ animationDelay: '1.5s' }} />
                        <div className="absolute bottom-[5%] left-[50%] w-1 h-1 rounded-full bg-white/60 animate-bubble shadow-sm" style={{ animationDelay: '3s' }} />
                        <div className="absolute bottom-[15%] left-[40%] w-1 h-1 rounded-full bg-white/45 animate-bubble shadow-sm" style={{ animationDelay: '0.8s' }} />
                        <div className="absolute bottom-[8%] left-[80%] w-1.5 h-1.5 rounded-full bg-white/35 animate-bubble shadow-sm" style={{ animationDelay: '2.3s' }} />
                      </>
                    )}
                </div>
                <span className="mt-2 font-bold text-sm text-foreground animate-pulse-subtle">{completionPercentage}%</span>
            </>
        )}
      </div>
      <style jsx>{`
        @keyframes wave-front {
          0% {
            transform: translateX(0) translateY(-50%);
          }
          100% {
            transform: translateX(-50%) translateY(-50%);
          }
        }
        @keyframes wave-middle {
          0% {
            transform: translateX(0) translateY(-50%);
          }
          100% {
            transform: translateX(-50%) translateY(-50%);
          }
        }
        @keyframes wave-back {
          0% {
            transform: translateX(0) translateY(-50%);
          }
          100% {
            transform: translateX(-50%) translateY(-50%);
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes bubble {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.5;
          }
          50% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(-300px) scale(0.3);
            opacity: 0;
          }
        }
        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.05);
          }
        }
        .animate-wave-front {
          animation: wave-front 2.5s linear infinite;
        }
        .animate-wave-middle {
          animation: wave-middle 3.5s linear infinite;
        }
        .animate-wave-back {
          animation: wave-back 4.5s linear infinite;
        }
        .animate-shimmer {
          animation: shimmer 2.5s ease-in-out infinite;
        }
        .animate-bubble {
          animation: bubble 5s ease-in-out infinite;
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default memo(OverallProgress);

declare module "react" {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      orientation?: 'horizontal' | 'vertical';
    }
  }
