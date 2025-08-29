"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Heart, AlertTriangle, CheckCircle, CheckCircle2, Circle } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

/** Modal */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SignUpForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

// --- validators (edit copy/requirements here) ---
const validatePassword = (pwd: string): string | null => {
  const unmet: string[] = [];
  if (pwd.length < 12) unmet.push("• At least 12 characters");
  if (!/[A-Z]/.test(pwd)) unmet.push("• At least one uppercase letter (A–Z)");
  if (!/[a-z]/.test(pwd)) unmet.push("• At least one lowercase letter (a–z)");
  if (!/\d/.test(pwd)) unmet.push("• At least one number (0–9)");
  if (!/[^A-Za-z0-9]/.test(pwd)) unmet.push("• At least one symbol (!@#$…)");
  if (/\s/.test(pwd)) unmet.push("• No spaces");
  return unmet.length ? `Please use a stronger password:\n${unmet.join("\n")}` : null;
};

const mapAuthError = (msg?: string): string => {
  if (!msg) return "Something went wrong.";
  if (msg.toLowerCase().includes("password")) {
    return "That password doesn’t meet our requirements. Try a longer one with a mix of letters, numbers, and a symbol.";
  }
  return msg;
};

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<SignUpForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  // modal state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [successAction, setSuccessAction] = useState<null | "gotoSignIn" | "routeByRole">(null);

  const router = useRouter();

  const handleInputChange = <K extends keyof SignUpForm>(field: K, value: SignUpForm[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // live password checklist state
  const req = useMemo(() => {
    const pwd = formData.password;
    return {
      len: pwd.length >= 12,
      up: /[A-Z]/.test(pwd),
      lo: /[a-z]/.test(pwd),
      num: /\d/.test(pwd),
      sym: /[^A-Za-z0-9]/.test(pwd),
      sp: !/\s/.test(pwd),
    };
  }, [formData.password]);

  const routeByRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push("/");

    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    // Soft fallback: ensure a row exists (no formData used here)
    if (!profileData || error) {
      const display_name =
        (user.user_metadata?.display_name as string | undefined) ??
        (user.email?.split("@")[0] ?? "");
// fallback upsert (if profile row missing)
await supabase.from("profiles").upsert({
  id: user.id,
  email: user.email,
  display_name,
  role: "warden", // was "guardian"
});
    }
const role = profileData?.role ?? "warden";
if (role === "admin") router.push("/dashboard/admin");
else if (role === "warden") router.push("/dashboard/warden"); // was /guardian
else router.push("/");

  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    const strengthErr = validatePassword(formData.password);
    if (strengthErr) {
      setErrorMsg(strengthErr);
      return;
    }

    setLoading(true);
    try {
      const display_name = `${formData.firstName} ${formData.lastName}`.trim();

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { display_name, phone: formData.phone } },
      });
      if (error) throw error;

      const hasSession = Boolean(data.session);
      if (!hasSession) {
        setSuccessMsg("Check your email to confirm your account, then sign in.");
        setSuccessAction("gotoSignIn");
        return;
      }

      setSuccessMsg("Account created successfully. Welcome to SOTERIA!");
      setSuccessAction("routeByRole");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(mapAuthError(err?.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = async () => {
    const action = successAction;
    setSuccessMsg(null);
    setSuccessAction(null);
    if (action === "gotoSignIn") router.push("/auth/signin");
    if (action === "routeByRole") await routeByRole();
  };

  return (
    <>
      {/* Error Modal */}
      <AlertDialog open={!!errorMsg} onOpenChange={(open) => !open && setErrorMsg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Something went wrong
            </AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap">
              {errorMsg}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorMsg(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Modal */}
      <AlertDialog open={!!successMsg} onOpenChange={(open) => !open && handleSuccessClose()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Success
            </AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap">
              {successMsg}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSuccessClose}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Page */}
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden flex items-center justify-center px-4 py-8">
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
          </div>

          <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-gray-800">Get Started</CardTitle>
              <CardDescription className="text-center text-gray-600">
                Join SOTERIA to protect yourself and your loved ones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-700">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gray-700">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+63 9XX XXX XXXX"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
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
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* Live checklist */}
                  <ul className="mt-2 space-y-1 text-sm">
                    {[
                      ["len", "At least 12 characters"],
                      ["up", "One uppercase letter (A–Z)"],
                      ["lo", "One lowercase letter (a–z)"],
                      ["num", "One number (0–9)"],
                      ["sym", "One symbol (!@#$…)"],
                      ["sp", "No spaces"],
                    ].map(([k, label]) => {
                      const ok = req[k as keyof typeof req];
                      return (
                        <li key={k} className={`flex items-center gap-2 ${ok ? "text-emerald-600" : "text-gray-500"}`}>
                          {ok ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                          <span>{label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className="bg-white/80 border-emerald-200 focus:border-emerald-500"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="terms" required />
                  <Label htmlFor="terms" className="text-sm text-gray-700">
                    I agree to the{" "}
                    <Link href="/terms" className="text-emerald-600 hover:underline">Terms of Service</Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link>
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <p className="text-center text-sm text-gray-600 mt-6">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-emerald-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
