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
import { useLogin } from "@/features/auth/hooks/useAuth";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      toast.error("Please enter your email or username.");
      return;
    }

    if (!password) {
      toast.error("Please enter your password.");
      return;
    }

    try {
      const res = await loginMutation.mutateAsync({
        identifier: identifier.trim(),
        password
      });

      toast.success(res?.message || "Welcome back to ShadowLeague!");
      navigate("/select-club");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Invalid credentials. Please try again.";
      toast.error(errorMsg);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md rounded-xl border border-border bg-card shadow-none">
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          Sign In to ShadowLeague
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Enter your manager credentials to access leagues, rosters, and live matchups.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identifier (Email or Username) */}
          <div className="space-y-1.5">
            <Label htmlFor="identifier" className="text-xs font-semibold text-foreground">
              Email or Username
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="identifier"
                placeholder="alex@shadowleague.com or alex_morgan"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
                className="pl-9 bg-background border-border text-foreground text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                Password
              </Label>
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
                autoComplete="current-password"
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
            disabled={!identifier || !password || loginMutation.isPending}
            className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all h-10 mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                Sign In <ArrowRight className="ml-2 size-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-3 border-t border-border bg-secondary/20 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Don't have a manager account yet?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Register here
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}