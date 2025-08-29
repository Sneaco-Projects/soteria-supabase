"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Heart } from "lucide-react";

import { supabase } from "@/lib/supabase-client";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const routeByRole = (role?: string) => {
    if (role === "admin") router.push("/dashboard/admin");
    else if (role === "guardian") router.push("/dashboard/guardian");
    else router.push("/");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (!formData.role) {
      alert("Please select a role");
      return;
    }

    setLoading(true);
    try {
      // 1) Create auth user
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            display_name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
          },
        },
      });
      if (error) throw error;

      // If email confirmations are OFF, a session exists now.
      // If ON, there is no session until user clicks email link.
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // No session yet (confirmations ON). Tell user to check email, then push to sign-in.
        alert("Check your email to confirm your account, then sign in.");
        return router.push("/auth/signin");
      }

      // 2) Upsert into profiles (safe even if you also have a signup trigger)
      const role = formData.role as "admin" | "guardian" | "user" | "organization" | "healthcare";
      const displayName = `${formData.firstName} ${formData.lastName}`;

      const { error: upsertErr } = await supabase.from("profiles").upsert({
        id: user.id,
        email: formData.email,
        display_name: displayName,
        role: role === "organization" || role === "healthcare" ? "user" : role, // map extra roles to 'user' if you want
      });
      if (upsertErr) throw upsertErr;

      routeByRole(role);
    } catch (err: any) {
      alert(err?.message ?? "Sign up failed.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
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
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-gray-700">I am a...</Label>
                <Select onValueChange={(value) => handleInputChange("role", value)}>
                  <SelectTrigger className="bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guardian">Guardian/Family Member</SelectItem>
                    <SelectItem value="user">Device User (Sentinel)</SelectItem>
                    <SelectItem value="organization">Organization/Company</SelectItem>
                    <SelectItem value="healthcare">Healthcare Provider</SelectItem>
                  </SelectContent>
                </Select>
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
                    className="bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
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

            {/* Google sign-up removed for now */}
            {/* <div className="mt-6">...</div> */}

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
  );
}
