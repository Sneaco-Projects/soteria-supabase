"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

import { Eye, EyeOff, Heart, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  // modal messages
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);

  const router = useRouter();

  // INLINE routeByRole (no shared helper)
  const routeByRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/");

    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    // Soft fallback: ensure a row exists (defaults to warden)
    if (!profileData || error) {
      const display_name =
        (user.user_metadata?.display_name as string | undefined) ??
        (user.email?.split("@")[0] ?? "");
      await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        display_name,
        role: "warden",
      });
    }

    let role = profileData?.role ?? "warden";
    
    // Debug: Log the role information
    console.log("Raw role from database:", role, typeof role);
    console.log("Profile data:", profileData);
    
    // Handle legacy "guardian" role
    if (role === "guardian") role = "warden";
    
    console.log("Final role after conversion:", role);
    
    if (role === "architect") {
      console.log("Redirecting to architect dashboard");
      router.push("/dashboard/architect");
    }
    else if (role === "provider") {
      console.log("Redirecting to provider dashboard");
      router.push("/dashboard/provider");
    }
    else if (role === "warden") {
      console.log("Redirecting to warden dashboard");
      router.push("/dashboard/warden");
    }
    else {
      console.log("Unknown role, defaulting to warden dashboard:", role);
      router.push("/dashboard/warden"); // Default fallback
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await routeByRole();
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden flex items-center justify-center px-4">
      {/* Error Modal */}
      <AlertDialog open={!!errorMsg} onOpenChange={(open) => !open && setErrorMsg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" /> Sign-in problem
            </AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap">{errorMsg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorMsg(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* animated blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-800">SOTERIA</span>
          </Link>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-gray-800">Welcome back</CardTitle>
            <CardDescription className="text-center text-gray-600">
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link href="/auth/forgot-password" className="text-sm text-emerald-600 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-6">
              {"Don't have an account? "}
              <Link href="/auth/signup" className="text-emerald-600 hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
