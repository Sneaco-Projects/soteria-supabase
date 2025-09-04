// app/(site)/page.tsx — HOMEPAGE (no mock data)
"use client";

import Navbar from "@/components/site/navbar";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, MapPin, Heart, Phone, Wifi, Battery, AlertTriangle, Play, Star, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";

// Types reflecting your DB shape. Adjust to match exact columns.
type PublicStats = {
  alert_count: number | null;
  lives_protected: number | null;
  avg_response_seconds: number | null;
  uptime: number | null; // 0..100
};

type Testimonial = {
  name: string;
  age: string | number | null;
  story: string;
  location: string | null;
};

export default function HomePage() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Fetch real data from Supabase
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const [{ data: statsRow, error: statsErr }, { data: tRows, error: tErr }] = await Promise.all([
        supabase.from("public_stats").select("alert_count,lives_protected,avg_response_seconds,uptime").single(),
        supabase
          .from("testimonials")
          .select("name,age,story,location")
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (!mounted) return;
      if (!statsErr) setStats(statsRow as PublicStats);
      if (!tErr && Array.isArray(tRows)) setTestimonials(tRows as Testimonial[]);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Rotate testimonials only if we have 2+ real items
  useEffect(() => {
    if (testimonials.length < 2) return;
    const id = setInterval(() => {
      setCurrentTestimonial((p) => (p + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(id);
  }, [testimonials.length]);

  const livesProtected = stats?.lives_protected ?? null;
  const alertCount = stats?.alert_count ?? null;
  const avgResponse = stats?.avg_response_seconds ?? null;
  const uptime = stats?.uptime ?? null;

  const hasStats = useMemo(() => livesProtected !== null || alertCount !== null || avgResponse !== null || uptime !== null, [livesProtected, alertCount, avgResponse, uptime]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Role-aware Navbar */}
      <Navbar />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000" />
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-gray-800 space-y-8">
              <div className="space-y-4">
                {hasStats ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    🌟 LIVE: {alertCount?.toLocaleString?.() ?? "—"} Alerts Today
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-500 border-gray-200">Stats unavailable</Badge>
                )}
                <h1 className="text-6xl md:text-7xl font-bold leading-tight">
                  Your Life.
                  <br />
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Protected.</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  One button press connects you to help—fast. No fake counters here; this page now reflects live data as available.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-lg px-8 py-4 rounded-full border-0 shadow-lg transform hover:scale-105 transition-all text-white">
                  <Shield className="mr-2 h-5 w-5" />
                  Get Protected Now
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-4 rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50" onClick={() => setIsPlaying((p) => !p)}>
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>

              {/* Live Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800">{livesProtected?.toLocaleString?.() ?? "—"}</div>
                  <div className="text-gray-500 text-sm">Lives Protected</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800">{avgResponse ? `${avgResponse}s` : "—"}</div>
                  <div className="text-gray-500 text-sm">Avg Response</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800">{uptime != null ? `${uptime}%` : "—"}</div>
                  <div className="text-gray-500 text-sm">Uptime</div>
                </div>
              </div>
            </div>

            {/* Device Card (visual only, no fake status) */}
            <div className="relative">
              <div className="relative z-10">
                <div className="bg-white rounded-3xl p-8 shadow-2xl border border-emerald-100">
                  <div className="text-center space-y-6">
                    <div className="relative">
                      <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full mx-auto flex items-center justify-center shadow-xl">
                        <Heart className="h-16 w-16 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-gray-900">SOTERIA Pro</h3>
                      <div className="flex justify-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Status:</span>
                          <span className="text-sm text-gray-900">Ready</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Battery className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-600">—</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Wifi className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm text-gray-600">—</span>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-4 rounded-xl">
                      <AlertTriangle className="mr-2 h-5 w-5" />
                      EMERGENCY BUTTON
                    </Button>
                  </div>
                </div>

                {/* Floating Feature Cards */}
                <div className="absolute -left-8 top-1/4 -translate-y-1/2">
                  <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 text-gray-800 p-4 shadow-lg">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-6 w-6 text-emerald-500" />
                      <div>
                        <div className="font-semibold">GPS Tracking</div>
                        <div className="text-sm text-gray-600">Precise location</div>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="absolute -right-8 top-3/4 -translate-y-1/2">
                  <Card className="bg-white/90 backdrop-blur-lg border-teal-200 text-gray-800 p-4 shadow-lg">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-6 w-6 text-teal-500" />
                      <div>
                        <div className="font-semibold">24/7 Monitoring</div>
                        <div className="text-sm text-gray-600">Always protected</div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Carousel (shows only if real items exist) */}
      {testimonials.length > 0 && (
        <section className="py-20 px-4 relative">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">Real Stories</h2>
              <p className="text-gray-600 text-lg">Approved testimonials from real users</p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card className="bg-white/80 backdrop-blur-lg border-emerald-200 p-8 text-gray-800 shadow-xl">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-xl">{testimonials[currentTestimonial]?.name}</div>
                    <div className="text-gray-500">
                      {testimonials[currentTestimonial]?.age ? `Age ${testimonials[currentTestimonial]?.age}` : ""}
                      {testimonials[currentTestimonial]?.location ? ` • ${testimonials[currentTestimonial]?.location}` : ""}
                    </div>
                  </div>
                </div>
                <blockquote className="text-2xl font-medium leading-relaxed mb-6 text-gray-700">
                  “{testimonials[currentTestimonial]?.story}”
                </blockquote>
                <div className="flex justify-center space-x-2">
                  {testimonials.map((_, index) => (
                    <div key={index} className={`w-3 h-3 rounded-full transition-all ${index === currentTestimonial ? "bg-emerald-500" : "bg-gray-300"}`} />
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Interactive Features Grid (static copy, no fake metrics) */}
      <section className="py-20 px-4 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-800 mb-6">Why Choose SOTERIA?</h2>
            <p className="text-xl text-gray-600">Advanced technology meets life-saving simplicity</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Shield className="h-12 w-12" />, title: "Instant Emergency Response", description: "Get connected to help with one press" },
              { icon: <MapPin className="h-12 w-12" />, title: "Precise GPS Tracking", description: "Accurate location when seconds matter" },
              { icon: <Heart className="h-12 w-12" />, title: "Health Monitoring", description: "Detect falls & monitor vitals (model dependent)" },
              { icon: <Phone className="h-12 w-12" />, title: "Two-Way Communication", description: "Talk directly with responders" },
              { icon: <Battery className="h-12 w-12" />, title: "Long Battery Life", description: "Power that lasts when you need it" },
              { icon: <Wifi className="h-12 w-12" />, title: "Global Connectivity", description: "Designed for reliable coverage" },
            ].map((f, i) => (
              <Card key={i} className="group bg-white/80 backdrop-blur-lg border-gray-200 hover:bg-white/90 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-lg">
                <CardHeader className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white shadow-lg">
                    {f.icon}
                  </div>
                  <CardTitle className="text-gray-800 text-xl">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-center">{f.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-6xl font-bold text-gray-800 leading-tight">Don't Wait for an Emergency</h2>
            <p className="text-2xl text-gray-600">
              {livesProtected != null ? (
                <>Join over {livesProtected.toLocaleString()} people who trust SOTERIA</>
              ) : (
                <>Join people who trust SOTERIA</>
              )}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-xl px-12 py-6 rounded-full border-0 shadow-lg transform hover:scale-105 transition-all text-white">
                <Shield className="mr-3 h-6 w-6" />
                Get Protected Today
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>

              <div className="text-gray-600 text-sm">
                <div>✓ 30-day money-back guarantee</div>
                <div>✓ Free shipping & setup</div>
                <div>✓ 24/7 customer support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-lg border-t border-emerald-200 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-gray-800">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold">SOTERIA</span>
              </div>
              <p className="text-gray-600">Protecting lives with advanced medical alert technology.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/features" className="hover:text-emerald-600 transition-colors">Features</Link></li>
                <li><Link href="/how-it-works" className="hover:text-emerald-600 transition-colors">How It Works</Link></li>
                <li><Link href="/pricing" className="hover:text-emerald-600 transition-colors">Pricing</Link></li>
                <li><Link href="/faq" className="hover:text-emerald-600 transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/about" className="hover:text-emerald-600 transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-emerald-600 transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-emerald-600 transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-emerald-600 transition-colors">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/help" className="hover:text-emerald-600 transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-emerald-600 transition-colors">Contact Support</Link></li>
                <li><Link href="/status" className="hover:text-emerald-600 transition-colors">System Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-emerald-200 mt-8 pt-8 text-center text-gray-600">
            <p>&copy; {new Date().getFullYear()} SOTERIA.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

