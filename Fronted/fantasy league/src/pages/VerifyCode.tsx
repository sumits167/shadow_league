import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { useVerifyCode } from "@/features/auth/hooks/useAuth";
import { KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function VerifyCode() {
  const [searchParams] = useSearchParams();
  const usernameParam = searchParams.get("username") || "";

  const [username, setUsername] = useState(usernameParam);
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const navigate = useNavigate();
  const verifyMutation = useVerifyCode();

  // Auto-focus first digit input on load
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numbers
    const cleanVal = value.replace(/[^0-9]/g, "");

    if (cleanVal.length > 1) {
      // Handle paste
      const pastedChars = cleanVal.slice(0, 6).split("");
      const newDigits = [...digits];
      pastedChars.forEach((char, i) => {
        if (index + i < 6) newDigits[index + i] = char;
      });
      setDigits(newDigits);
      const nextIdx = Math.min(index + pastedChars.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);

    // Auto-advance to next input
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const fullCode = digits.join("");
  const isCodeComplete = fullCode.length === 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error("Username is required.");
      return;
    }

    if (!isCodeComplete) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    try {
      const res = await verifyMutation.mutateAsync({
        username: username.trim(),
        code: fullCode
      });

      toast.success(res?.message || "Account verified successfully! Please log in.");
      navigate("/login");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Invalid or expired verification code.";
      toast.error(errorMsg);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md rounded-xl border border-border bg-card shadow-none">
      <CardHeader className="space-y-1.5 pb-4 text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <KeyRound className="size-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          Verify Your Account
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Enter the 6-digit verification code sent to your registered email for{" "}
          <span className="font-semibold text-primary">@{username || "user"}</span>.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {!usernameParam && (
            <div className="space-y-1.5">
              <Input
                placeholder="Enter your username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-background border-border text-foreground text-sm"
              />
            </div>
          )}

          {/* 6-Digit PIN Boxes */}
          <div className="flex justify-center items-center gap-2 sm:gap-3 py-2">
            {digits.map((digit, idx) => (
              <Input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="size-11 sm:size-12 text-center text-lg font-bold bg-background border-border focus:border-primary focus:ring-1 focus:ring-primary text-foreground rounded-lg transition-all"
              />
            ))}
          </div>

          <Button
            type="submit"
            disabled={!isCodeComplete || verifyMutation.isPending || !username.trim()}
            className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all h-10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifyMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Verifying Code...
              </>
            ) : (
              <>
                Confirm & Verify Account <CheckCircle2 className="ml-2 size-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-3 border-t border-border bg-secondary/20 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Ready to log in?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Go to Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
