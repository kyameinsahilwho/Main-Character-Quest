"use client";

import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

const convex = convexUrl ? new ConvexReactClient(convexUrl) : undefined;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    if (!convex) {
        console.error("NEXT_PUBLIC_CONVEX_URL is not defined");
        return <div className="p-4 text-red-500 font-bold">Error: NEXT_PUBLIC_CONVEX_URL is missing. Please restart the dev server.</div>;
    }

    return (
        <ClerkProvider
            publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
            signInUrl="/login"
            signUpUrl="/signup"
            afterSignInUrl="/"
            afterSignUpUrl="/"
        >
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}
