// app/(site)/about/page.tsx
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Shield,
  Users,
  Globe,
  Clock,
  Sparkles,
  Activity,
} from "lucide-react";

export const metadata = {
  title: "About • SOTERIA",
  description: "Our mission, story, and the people behind SOTERIA.",
};

export default function AboutPage() {
  return (
    // Add top padding here so the fixed Navbar doesn't overlap.
    // If your (site)/layout.tsx already uses <main className="pt-24">,
    // you can set this to pt-0 instead. This version is safe on its own.
    <div className="relative z-10 pt-24 md:pt-28">
      {/* Hero */}
      {/* Removed pt-24 here to avoid double top padding */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-3xl">
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 mb-4">
            Our Mission
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
            Saving lives, one heartbeat at a time.
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            SOTERIA builds simple, beautiful technology that connects people to
            help—fast. From a single button to a global response network, we
            obsess over every second that matters.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/contact">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 hover:from-emerald-600 hover:to-teal-600">
                Get in touch
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                How it works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick stats */}
      <section className="container mx-auto px-4 pb-12">
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-white/90 border-emerald-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Heart className="h-4 w-4 text-emerald-600" />
                Lives Protected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">15,000+</div>
              <CardDescription className="text-gray-600">and counting</CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border-emerald-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                Avg Response
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">23s</div>
              <CardDescription className="text-gray-600">to connect to help</CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border-emerald-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-600" />
                Coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">180+</div>
              <CardDescription className="text-gray-600">countries supported</CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border-emerald-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                Uptime
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">99.9%</div>
              <CardDescription className="text-gray-600">reliability</CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Values */}
      <section className="container mx-auto px-4 pb-12">
        <div className="mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">What we stand for</h2>
          <p className="mt-2 text-gray-600 max-w-2xl">
            We design for clarity under pressure. When every moment counts,
            technology should be calm, fast, and invisible.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: <Shield className="h-6 w-6" />,
              title: "Trust & Safety",
              desc: "Privacy-first systems, rigorous testing, and built-in redundancies."
            },
            {
              icon: <Sparkles className="h-6 w-6" />,
              title: "Simplicity",
              desc: "One clear action when it matters. No clutter, no confusion."
            },
            {
              icon: <Users className="h-6 w-6" />,
              title: "Human Support",
              desc: "24/7 real people in the loop, backed by smart automation."
            },
          ].map((v, i) => (
            <Card key={i} className="bg-white/90 border-emerald-200">
              <CardHeader className="space-y-2">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  {v.icon}
                </div>
                <CardTitle className="text-xl text-gray-900">{v.title}</CardTitle>
                <CardDescription className="text-gray-600">{v.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Story / timeline */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid gap-8 md:grid-cols-2">
          <Card className="bg-white/90 border-emerald-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Our Story</CardTitle>
              <CardDescription className="text-gray-600">
                From a single wearable to a connected safety platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-gray-700 space-y-4">
              <p>
                SOTERIA started with a simple question: <em>How fast can help arrive?</em>
                We built hardware, software, and a response network that
                shrinks that time down to seconds—without sacrificing privacy or dignity.
              </p>
              <p>
                Today, families and professionals rely on SOTERIA to protect the people they love,
                whether they’re across town or across the world.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border-emerald-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Milestones</CardTitle>
              <CardDescription className="text-gray-600">
                Highlights on our path.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 text-gray-700">
                <li>
                  <span className="font-semibold">2023</span> — First prototype and family pilot
                </li>
                <li>
                  <span className="font-semibold">2024</span> — 24/7 monitoring and global routing
                </li>
                <li>
                  <span className="font-semibold">2025</span> — Provider tools, Sentinel/Warden/Architect roles
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-24">
        <Card className="bg-white/90 border-emerald-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl md:text-3xl text-gray-900">
              Join us in building safer days
            </CardTitle>
            <CardDescription className="text-gray-600">
              Whether you’re protecting family or caring for patients,
              SOTERIA is here to help.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-3">
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 hover:from-emerald-600 hover:to-teal-600">
                Get Started
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                Talk to us
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
