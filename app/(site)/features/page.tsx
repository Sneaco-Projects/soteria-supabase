// app/(site)/features/page.tsx
"use client"

import Navbar from "@/components/site/navbar";
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  MapPin,
  Heart,
  Phone,
  Wifi,
  Battery,
  Clock,
  Users,
  Stethoscope,
  AlertTriangle,
  Smartphone,
  Play,
  ArrowRight,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"

export default function FeaturesPage() {
  const [activeFeature, setActiveFeature] = useState(0)
  const [isDeviceActive, setIsDeviceActive] = useState(false)

  const features = [
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Emergency Alert Button",
      description: "Large, easy-to-press button for instant medical emergency alerts",
      details: "Single press alerts your care team, triple press contacts emergency services",
      color: "from-emerald-500 to-teal-500",
      demo: "Press to simulate emergency alert",
    },
    {
      icon: <MapPin className="h-8 w-8" />,
      title: "GPS Location Tracking",
      description: "Precise GPS coordinates sent with every alert",
      details: "Accurate to within 10 feet, works anywhere in the world",
      color: "from-green-500 to-emerald-500",
      demo: "Track location in real-time",
    },
    {
      icon: <Stethoscope className="h-8 w-8" />,
      title: "24/7 Medical Monitoring",
      description: "Professional monitoring center staffed by trained medical personnel",
      details: "Certified medical professionals available around the clock",
      color: "from-blue-500 to-cyan-500",
      demo: "Connect to monitoring center",
    },
  ]

  return (
    // Add top padding so the fixed Navbar doesn't overlap
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden pt-24 md:pt-28">
      {/* Role-aware Navbar */}
      <Navbar />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      {/* Hero Section (no extra top padding here) */}
      <section className="pb-20 px-4 relative">
        <div className="container mx-auto text-center">
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 mb-6 animate-pulse">
            🚀 Advanced Medical Technology
          </Badge>
          <h1 className="text-6xl md:text-7xl font-bold text-gray-800 mb-6 leading-tight">
            Features That
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Save Lives
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Every feature is engineered with one goal: getting you help when you need it most. Discover the technology
            that's protecting thousands of lives every day.
          </p>
        </div>
      </section>

      {/* Interactive Feature Demo */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Feature List */}
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-gray-800 mb-8">Core Life-Saving Features</h2>
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all duration-500 transform hover:scale-105 ${
                    activeFeature === index
                      ? "bg-white/80 border-emerald-200 shadow-2xl"
                      : "bg-white/50 border-emerald-100 hover:bg-white/60"
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-white`}
                      >
                        {feature.icon}
                      </div>
                      <div>
                        <CardTitle className="text-gray-800 text-xl">{feature.title}</CardTitle>
                        <CardDescription className="text-gray-600">{feature.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {activeFeature === index && (
                    <CardContent className="pt-0">
                      <p className="text-gray-700 mb-4">{feature.details}</p>
                      <Button
                        size="sm"
                        className={`bg-gradient-to-r ${feature.color} hover:opacity-90 border-0 text-white`}
                        onClick={() => setIsDeviceActive(!isDeviceActive)}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        {feature.demo}
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {/* Interactive Device */}
            <div className="relative">
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-12 shadow-2xl transform hover:scale-105 transition-all duration-500 border border-emerald-200">
                <div className="text-center space-y-8">
                  <div className="relative">
                    <div
                      className={`w-40 h-40 bg-gradient-to-br ${features[activeFeature].color} rounded-full mx-auto flex items-center justify-center shadow-2xl transition-all duration-500 ${
                        isDeviceActive ? "animate-pulse scale-110" : ""
                      }`}
                    >
                      <div className="text-white text-4xl">{features[activeFeature].icon}</div>
                    </div>
                    {isDeviceActive && (
                      <div className="absolute inset-0 w-40 h-40 mx-auto border-4 border-white rounded-full animate-ping"></div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-gray-800">{features[activeFeature].title}</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-gray-600">Active</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <Battery className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600">94%</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <Wifi className="h-4 w-4 text-emerald-500" />
                        <span className="text-gray-600">Strong</span>
                      </div>
                    </div>
                  </div>

                  {isDeviceActive && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-pulse">
                      <div className="text-red-800 font-semibold">🚨 EMERGENCY ALERT ACTIVE</div>
                      <div className="text-red-600 text-sm">Help is on the way...</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Floating Status Cards */}
              <div className="absolute -left-8 top-1/4 animate-float">
                <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 text-gray-800 p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <div className="font-semibold">GPS Lock</div>
                      <div className="text-sm text-gray-600">Location acquired</div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="absolute -right-8 top-3/4 animate-float delay-1000">
                <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 text-gray-800 p-4">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-6 w-6 text-emerald-500" />
                    <div>
                      <div className="font-semibold">Connected</div>
                      <div className="text-sm text-gray-600">Monitoring center</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features Grid */}
      <section className="py-20 px-4 bg-white/50 backdrop-blur-sm relative z-10">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-800 mb-6">Advanced Health Monitoring</h2>
            <p className="text-xl text-gray-600">Next-generation technology for comprehensive care</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <AlertTriangle className="h-8 w-8" />,
                title: "Fall Detection",
                description: "AI-powered sensors detect falls and auto-trigger alerts",
                color: "from-orange-500 to-red-500",
                stats: "99.2% accuracy",
              },
              {
                icon: <Heart className="h-8 w-8" />,
                title: "Heart Rate Monitoring",
                description: "Continuous heart rate tracking with abnormality detection",
                color: "from-red-500 to-pink-500",
                stats: "24/7 monitoring",
              },
              {
                icon: <Clock className="h-8 w-8" />,
                title: "Medication Reminders",
                description: "Smart reminders to help maintain medication schedules",
                color: "from-blue-500 to-purple-500",
                stats: "Custom schedules",
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: "Care Team Network",
                description: "Connect multiple family members and healthcare providers",
                color: "from-emerald-500 to-teal-500",
                stats: "Unlimited contacts",
              },
              {
                icon: <Smartphone className="h-8 w-8" />,
                title: "Mobile Integration",
                description: "Seamless connection with smartphones and smart home devices",
                color: "from-purple-500 to-indigo-500",
                stats: "iOS & Android",
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Data Security",
                description: "HIPAA-compliant encryption protects your health information",
                color: "from-gray-600 to-gray-800",
                stats: "Bank-level security",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="group bg-white/80 backdrop-blur-lg border-emerald-200 hover:bg-white/90 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2"
              >
                <CardHeader className="text-center">
                  <div
                    className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl mx-auto mb-4 flex items-center justify-center text-white group-hover:animate-pulse`}
                  >
                    {feature.icon}
                  </div>
                  <CardTitle className="text-gray-800 text-xl">{feature.title}</CardTitle>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{feature.stats}</Badge>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-center">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specs with Animation */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-800 mb-6">Technical Excellence</h2>
            <p className="text-xl text-gray-600">Medical-grade specifications you can trust</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Smartphone className="h-8 w-8" />,
                title: "Connectivity",
                specs: ["4G LTE/GSM", "Wi-Fi 802.11", "GPS + GLONASS", "Bluetooth 5.0"],
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: <Battery className="h-8 w-8" />,
                title: "Power",
                specs: ["7-Day Battery", "USB-C Charging", "Low Battery Alerts", "Power Saving Mode"],
                color: "from-green-500 to-emerald-500",
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Durability",
                specs: ["IP65 Water Resistant", "Drop Tested 4ft", "-10°C to 60°C", "Medical Grade"],
                color: "from-purple-500 to-violet-500",
              },
              {
                icon: <CheckCircle className="h-8 w-8" />,
                title: "Certifications",
                specs: ["FDA Registered", "FCC Certified", "HIPAA Compliant", "UL Listed"],
                color: "from-red-500 to-pink-500",
              },
            ].map((spec, index) => (
              <Card
                key={index}
                className="bg-white/80 backdrop-blur-lg border-emerald-200 text-gray-800 hover:bg-white/90 transition-all duration-500 transform hover:scale-105"
              >
                <CardHeader className="text-center">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${spec.color} rounded-2xl mx-auto mb-4 flex items-center justify-center`}
                  >
                    {spec.icon}
                  </div>
                  <CardTitle className="text-lg">{spec.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {spec.specs.map((item, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
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
            <h2 className="text-6xl font-bold text-gray-800 leading-tight">Experience the Future of Medical Alerts</h2>
            <p className="text-2xl text-gray-600">Don't settle for outdated technology when your life is on the line</p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-xl px-12 py-6 rounded-full border-0 shadow-lg transform hover:scale-105 transition-all text-white"
              >
                <Shield className="mr-3 h-6 w-6" />
                Get SOTERIA Today
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="text-xl px-12 py-6 rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-transparent"
              >
                <Play className="mr-3 h-6 w-6" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-lg border-t border-emerald-200 py-12 px-4 relative z-10">
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
                <li>
                  <Link href="/features" className="hover:text-emerald-600 transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="hover:text-emerald-600 transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-emerald-600 transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-emerald-600 transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <Link href="/about" className="hover:text-emerald-600 transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-emerald-600 transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-emerald-600 transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-emerald-600 transition-colors">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <Link href="/help" className="hover:text-emerald-600 transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-emerald-600 transition-colors">
                    Contact Support
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="hover:text-emerald-600 transition-colors">
                    System Status
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-emerald-200 mt-8 pt-8 text-center text-gray-600">
            <p>&copy; 2024 SOTERIA. Saving lives, one heartbeat at a time.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
