import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <header className="flex flex-col items-center gap-3 text-center">
          <Logo variant="mark" markClassName="size-16 drop-shadow-sm" />
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to CoupleCash
            </p>
          </div>
        </header>

        <LoginForm />

        <p className="text-center text-xs text-muted-foreground">
          Two accounts only: <span className="font-mono">abieka</span> &{" "}
          <span className="font-mono">semma</span>
        </p>
      </div>
    </main>
  );
}
