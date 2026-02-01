import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Login - Pollytasks',
    description: 'Sign in to your Pollytasks account',
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-violet-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {children}
        </div>
    );
}
