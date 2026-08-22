import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { useDebounce } from "@/hooks/useDebounce";
import { useCheckUsernameAvailability, useRegister } from "@/features/auth/hooks/useAuth";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  // Debounce username input by 500ms
  const debouncedUsername = useDebounce(username.trim(), 500);

  // Real-time username availability query
  const {
    data: isUsernameAvailable,
    isFetching: isCheckingUsername,
    isError: isUsernameCheckError
  } = useCheckUsernameAvailability(debouncedUsername);

  // Register mutation
  const registerMutation = useRegister();

  // Username validation rules: 2-10 chars, alphanumeric + underscore
  const isUsernameRegexValid = /^[a-zA-Z0-9_]+$/.test(username);
  const isUsernameLengthValid = username.length >= 2 && username.length <= 10;
  const isUsernameFormatValid = isUsernameRegexValid && isUsernameLengthValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isUsernameFormatValid) {
      toast.error("Username must be 2-10 characters and contain only letters, numbers, and underscores.");
      return;
    }

    if (isUsernameAvailable === false) {
      toast.error("This username is already taken. Please choose another.");
      return;
    }

    if (password.length < 6 || password.length > 20) {
      toast.error("Password must be between 6 and 20 characters.");
      return;
    }

    try {
      const res = await registerMutation.mutateAsync({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password
      });

      toast.success(res?.message || "Account created! Please verify your email.");
      navigate(`/verify?username=${encodeURIComponent(username.trim())}`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to register. Please try again.";
      toast.error(errorMsg);
    }
  };

  const isSubmitDisabled =
    !username ||
    !email ||
    !password ||
    !isUsernameFormatValid ||
    isCheckingUsername ||
    isUsernameAvailable === false ||
    registerMutation.isPending;

  return (
    <Card className="mx-auto w-full max-w-md rounded-xl border border-border bg-card shadow-none">
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          Create Manager Profile
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Join ShadowLeague to create private clubs, build fantasy squads, and dominate the leaderboard.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field with Real-Time Availability Checking */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="username" className="text-xs font-semibold text-foreground">
                Username
              </Label>
              <span className="text-[10px] text-muted-foreground">
                2-10 characters (letters, numbers, _)
              </span>
            </div>

            <div className="relative">
              <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="username"
                placeholder="shadow_king"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="pl-9 pr-9 bg-background border-border text-foreground text-sm"
              />

              {/* Real-time status icon in the input */}
              <div className="absolute right-3 top-2.5 flex items-center">
                {username.trim().length >= 2 && (
                  <>
                    {isCheckingUsername ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : isUsernameAvailable === true && isUsernameFormatValid ? (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    ) : (isUsernameAvailable === false || (username.length > 0 && !isUsernameFormatValid)) ? (
                      <XCircle className="size-4 text-rose-500" />
                    ) : null}
                  </>
                )}
              </div>
            </div>

            {/* Real-time feedback message below input */}
            <div className="min-h-[18px] text-[11px] transition-all">
              {username.length > 0 && !isUsernameFormatValid && (
                <p className="text-rose-500 flex items-center gap-1">
                  <XCircle className="size-3 shrink-0" />
                  {!isUsernameLengthValid
                    ? "Username must be 2-10 characters."
                    : "Only letters, numbers, and underscores allowed."}
                </p>
              )}

              {username.trim().length >= 2 && isUsernameFormatValid && (
                <>
                  {isCheckingUsername ? (
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Loader2 className="size-3 animate-spin shrink-0" />
                      Checking username availability...
                    </p>
                  ) : isUsernameAvailable === true ? (
                    <p className="text-emerald-500 font-medium flex items-center gap-1">
                      <CheckCircle2 className="size-3 shrink-0" />
                      @{username.trim()} is available!
                    </p>
                  ) : isUsernameAvailable === false || isUsernameCheckError ? (
                    <p className="text-rose-500 font-medium flex items-center gap-1">
                      <XCircle className="size-3 shrink-0" />
                      @{username.trim()} is already taken.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-foreground">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="email"
                placeholder="manager@shadowleague.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="pl-9 bg-background border-border text-foreground text-sm"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                Password
              </Label>
              <span className="text-[10px] text-muted-foreground">
                6-20 characters
              </span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="password"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="pl-9 pr-9 bg-background border-border text-foreground text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all h-10 mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Creating Profile...
              </>
            ) : (
              <>
                Sign Up as Manager <ArrowRight className="ml-2 size-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-3 border-t border-border bg-secondary/20 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Already registered as a manager?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}