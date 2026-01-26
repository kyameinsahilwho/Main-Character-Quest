import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <SignIn forceRedirectUrl="/" signUpUrl="/signup" />
    </div>
  );
}

