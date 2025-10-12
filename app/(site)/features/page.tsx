// app/(site)/features/page.tsx
"use client"

import Navbar from "@/components/site/navbar"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ShieldAlert,
  Bell,
  MapPin,
  MessageSquareText,
  LocateFixed,
  LayoutDashboard,
  Shield,
  CheckCircle2,
} from "lucide-react"

export default function FeaturesPage() {
  const [active, setActive] = useState<number | null>(0)

  const core = [
    {
      icon: <Bell className="h-8 w-8" />,
      title: "One-press SOS / Button",
      desc: "Immediate alerts with clear event labels (SOS, Button Short) and timestamps.",
      color: "from-emerald-500 to-teal-500",
      detail:
        "Your device can send SOS and button events. We render them with icons and colors so they’re easy to scan in a crisis.",
    },
    {
      icon: <MapPin className="h-8 w-8" />,
      title: "GPS + Maps Deep Link",
      desc: "If a payload includes lat/lng, you get a one-tap “Open in Maps” action.",
      color: "from-green-500 to-emerald-500",
      detail:
        "Coordinates are shown as a pill with a prominent map button. Great for field teams and family responders.",
    },
    {
      icon: <MessageSquareText className="h-8 w-8" />,
      title: "SMS Pairing to Contact #",
      desc: "Wardens pair by texting “PAIR {CODE}” to the device’s Contact # set by the Architect.",
      color: "from-sky-500 to-cyan-500",
      detail:
        "Architects add devices with Device ID + Contact #. When Wardens generate a code, the UI shows exactly where to send it.",
    },
  ]

  const platform = [
    {
      icon: <LocateFixed className="h-8 w-8" />,
      title: "A-GPS Boost",
      desc: "Kickstart location acquisition for faster first-fix.",
      color: "from-indigo-500 to-violet-500",
      detail:
        "Events like AGPS_BOOST/STOP are displayed with friendly labels so operators know what the device is doing.",
    },
    {
      icon: <LayoutDashboard className="h-8 w-8" />,
      title: "Role-Based Dashboards",
      desc: "Architect provisions devices; Warden pairs + monitors; others are access-controlled.",
      color: "from-amber-500 to-orange-500",
      detail:
        "If your role isn’t allowed, you’re redirected. This keeps sensitive tools in the right hands.",
    },
    {
      icon: <ShieldAlert className="h-8 w-8" />,
      title: "Live Event Timeline",
      desc: "Readable message chips, key/value pills, and collapsible raw JSON for debugging.",
      color: "from-rose-500 to-pink-500",
      detail:
        "Noise like GPS search can be filtered. Events group by day, with icons and colors for instant triage.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden pt-24 md:pt-28">
      <Navbar />

      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply blur-xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply blur-xl opacity-30 animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply blur-xl opacity-20 animate-pulse delay-2000" />
      </div>

      {/* Hero */}
      <section className="pb-16 px-4 relative">
        <div className="container mx-auto text-center">
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 mb-6">What ships today</Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Features that are{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">live</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Provision devices, pair via SMS, and monitor events in real time—with clear labels, icons, and Maps links.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 hover:from-emerald-700 hover:to-teal-700">
                Get started
              </Button>
            </Link>
            <Link href="/faq">
              <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                Read the FAQ
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Core features */}
      <section className="py-10 px-4 relative z-10">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Core device flow</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {core.map((f, i) => (
              <Card
                key={i}
                className={`transition-all ${active === i ? "bg-white/85 border-emerald-200 shadow-lg" : "bg-white/75 border-emerald-100"}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              >
                <CardHeader className="space-y-3">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${f.color} text-white flex items-center justify-center`}>
                    {f.icon}
                  </div>
                  <CardTitle className="text-gray-900">{f.title}</CardTitle>
                  <CardDescription className="text-gray-600">{f.desc}</CardDescription>
                </CardHeader>
                <CardContent className="text-gray-700">{f.detail}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform features */}
      <section className="py-10 px-4 relative z-10">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Platform & dashboards</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {platform.map((f, i) => (
              <Card key={i} className="bg-white/75 border-emerald-100 hover:bg-white/85 hover:shadow-lg transition-all">
                <CardHeader className="space-y-3">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${f.color} text-white flex items-center justify-center`}>
                    {f.icon}
                  </div>
                  <CardTitle className="text-gray-900">{f.title}</CardTitle>
                  <CardDescription className="text-gray-600">{f.desc}</CardDescription>
                </CardHeader>
                <CardContent className="text-gray-700">{f.detail}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="py-16 px-4 relative z-10">
        <div className="container mx-auto text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Ready to provision and pair?</h3>
          <p className="text-gray-600 mt-2">Architects add devices with Device ID + Contact #. Wardens pair via SMS.</p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 hover:from-emerald-700 hover:to-teal-700">
                Create an account
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                Talk to us
              </Button>
            </Link>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> No marketing fluff — only features that ship today.
          </div>
        </div>
      </section>

      {/* Footer (only live pages) */}
      <footer className="bg-white/85 backdrop-blur-lg border-t border-emerald-200 py-12 px-4 relative z-10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-gray-800">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold">SOTERIA</span>
              </div>
              <p className="text-gray-600">Provision. Pair. Protect.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/features" className="hover:text-emerald-700 transition-colors">Features</Link></li>
                <li><Link href="/faq" className="hover:text-emerald-700 transition-colors">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-emerald-700 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Get started</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/auth/signup" className="hover:text-emerald-700 transition-colors">Sign up</Link></li>
                <li><Link href="/auth/signin" className="hover:text-emerald-700 transition-colors">Sign in</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 text-center text-gray-600 border-t border-emerald-200">
            <p>&copy; {new Date().getFullYear()} SOTERIA.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
