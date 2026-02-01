import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-foreground mb-2">Pollytasks</h1>
                    <p className="text-muted-foreground font-medium">Welcome back, hero! 🎮</p>
                </div>
                <SignIn
                    forceRedirectUrl="/"
                    signUpUrl="/signup"
                    appearance={{
                        elements: {
                            rootBox: "w-full",
                            card: "shadow-xl rounded-3xl border-2 border-border",
                        }
                    }}
                />
            </div>
        </div>
    );
}
