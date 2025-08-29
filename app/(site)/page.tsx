"use client"

import "./globals.css";
import Navbar from "@/components/site/navbar";
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, MapPin, Smartphone, Zap, Users, Clock, Heart, Phone, Wifi, Battery, AlertTriangle, Play, Star, ArrowRight, CheckCircle } from 'lucide-react'
import Link from "next/link"

export default function HomePage() {
  const [deviceStatus, setDeviceStatus] = useState("online")
  const [alertCount, setAlertCount] = useState(1247)
  const [livesProtected, setLivesProtected] = useState(15420)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  // Animated counters
  useEffect(() => {
    const interval = setInterval(() => {
      setAlertCount(prev => prev + Math.floor(Math.random() * 3))
      setLivesProtected(prev => prev + Math.floor(Math.random() * 2))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Testimonial rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const testimonials = [
    {
      name: "Margaret Thompson",
      age: "78",
      story: "SOTERIA saved my life when I fell in my garden. Help arrived in 3 minutes!",
      location: "Phoenix, AZ"
    },
    {
      name: "Robert Chen",
      age: "65", 
      story: "My family has peace of mind knowing I'm protected 24/7.",
      location: "Seattle, WA"
    },
    {
      name: "Linda Rodriguez",
      age: "72",
      story: "The device is so comfortable, I forget I'm wearing it until I need it.",
      location: "Miami, FL"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Role-aware Navbar */}
      <Navbar />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-gray-800 space-y-8">
              <div className="space-y-4">
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 animate-pulse">
                  🌟 LIVE: {alertCount.toLocaleString()} Lives Protected Today
                </Badge>
                <h1 className="text-6xl md:text-7xl font-bold leading-tight">
                  Your Life.
                  <br />
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Protected.
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  The world's most advanced medical alert system. One button press connects you to help in under 30 seconds, anywhere in the world.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-lg px-8 py-4 rounded-full border-0 shadow-lg transform hover:scale-105 transition-all text-white">
                  <Shield className="mr-2 h-5 w-5" />
                  Get Protected Now
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-4 rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>

              {/* Live Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800">{livesProtected.toLocaleString()}</div>
                  <div className="text-gray-500 text-sm">Lives Protected</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800">23s</div>
                  <div className="text-gray-500 text-sm">Avg Response</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800">99.9%</div>
                  <div className="text-gray-500 text-sm">Uptime</div>
                </div>
              </div>
            </div>

            {/* Interactive Device Demo */}
            <div className="relative">
              <div className="relative z-10">
                {/* Main Device */}
                <div className="bg-white rounded-3xl p-8 shadow-2xl transform hover:scale-105 transition-all duration-500 border border-emerald-100">
                  <div className="text-center space-y-6">
                    <div className="relative">
                      <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full mx-auto flex items-center justify-center shadow-xl animate-pulse">
                        <Heart className="h-16 w-16 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-gray-900">SOTERIA Pro</h3>
                      <div className="flex justify-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${deviceStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                          <span className="text-sm text-gray-600">Online</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Battery className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-600">94%</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Wifi className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm text-gray-600">Strong</span>
                        </div>
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-4 rounded-xl transform hover:scale-105 transition-all shadow-lg"
                      onClick={() => {
                        // Simulate emergency alert
                        setDeviceStatus('alerting')
                        setTimeout(() => setDeviceStatus('online'), 3000)
                      }}
                    >
                      <AlertTriangle className="mr-2 h-5 w-5" />
                      EMERGENCY BUTTON
                    </Button>
                  </div>
                </div>

                {/* Floating Feature Cards */}
                <div className="absolute -left-8 top-1/4 transform -translate-y-1/2">
                  <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 text-gray-800 p-4 animate-float shadow-lg">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-6 w-6 text-emerald-500" />
                      <div>
                        <div className="font-semibold">GPS Tracking</div>
                        <div className="text-sm text-gray-600">Precise location</div>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="absolute -right-8 top-3/4 transform -translate-y-1/2">
                  <Card className="bg-white/90 backdrop-blur-lg border-teal-200 text-gray-800 p-4 animate-float delay-1000 shadow-lg">
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

      {/* Testimonial Carousel */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Real Stories. Real Lives Saved.</h2>
            <p className="text-gray-600 text-lg">Hear from families whose lives were changed by SOTERIA</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/80 backdrop-blur-lg border-emerald-200 p-8 text-gray-800 transform hover:scale-105 transition-all duration-500 shadow-xl">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="font-bold text-xl">{testimonials[currentTestimonial].name}</div>
                  <div className="text-gray-500">Age {testimonials[currentTestimonial].age} • {testimonials[currentTestimonial].location}</div>
                </div>
              </div>
              <blockquote className="text-2xl font-medium leading-relaxed mb-6 text-gray-700">
                "{testimonials[currentTestimonial].story}"
              </blockquote>
              <div className="flex justify-center space-x-2">
                {testimonials.map((_, index) => (
                  <div 
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentTestimonial ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive Features Grid */}
      <section className="py-20 px-4 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-800 mb-6">
              Why Choose SOTERIA?
            </h2>
            <p className="text-xl text-gray-600">Advanced technology meets life-saving simplicity</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="h-12 w-12" />,
                title: "Instant Emergency Response",
                description: "One button press connects you to help in under 30 seconds",
                color: "from-emerald-500 to-teal-500",
                delay: "delay-0"
              },
              {
                icon: <MapPin className="h-12 w-12" />,
                title: "Precise GPS Tracking",
                description: "Accurate to within 10 feet, anywhere in the world",
                color: "from-teal-500 to-cyan-500",
                delay: "delay-200"
              },
              {
                icon: <Heart className="h-12 w-12" />,
                title: "Health Monitoring",
                description: "Track vitals and detect falls automatically",
                color: "from-rose-500 to-pink-500",
                delay: "delay-400"
              },
              {
                icon: <Phone className="h-12 w-12" />,
                title: "Two-Way Communication",
                description: "Speak directly with emergency responders",
                color: "from-blue-500 to-indigo-500",
                delay: "delay-600"
              },
              {
                icon: <Battery className="h-12 w-12" />,
                title: "7-Day Battery Life",
                description: "Long-lasting power with smart charging",
                color: "from-amber-500 to-orange-500",
                delay: "delay-800"
              },
              {
                icon: <Users className="h-12 w-12" />,
                title: "Family Network",
                description: "Keep your loved ones informed and connected",
                color: "from-purple-500 to-violet-500",
                delay: "delay-1000"
              }
            ].map((feature, index) => (
              <Card 
                key={index}
                className={`group bg-white/80 backdrop-blur-lg border-gray-200 hover:bg-white/90 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 ${feature.delay} shadow-lg`}
              >
                <CardHeader className="text-center">
                  <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl mx-auto mb-4 flex items-center justify-center text-white group-hover:animate-pulse shadow-lg`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-gray-800 text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Simulation */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl font-bold text-gray-800 mb-8">
              See SOTERIA in Action
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              Experience how quickly help arrives when you need it most
            </p>

            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 border border-emerald-200 shadow-xl">
              <div className="grid md:grid-cols-3 gap-8 text-gray-800">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full mx-auto flex items-center justify-center text-2xl font-bold animate-pulse text-white shadow-lg">
                    1
                  </div>
                  <h3 className="text-xl font-bold">Press Button</h3>
                  <p className="text-gray-600">Emergency detected and alert initiated</p>
                </div>
                
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full mx-auto flex items-center justify-center text-2xl font-bold animate-pulse delay-1000 text-white shadow-lg">
                    2
                  </div>
                  <h3 className="text-xl font-bold">Location Sent</h3>
                  <p className="text-gray-600">GPS coordinates transmitted instantly</p>
                </div>
                
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full mx-auto flex items-center justify-center text-2xl font-bold animate-pulse delay-2000 text-white shadow-lg">
                    3
                  </div>
                  <h3 className="text-xl font-bold">Help Arrives</h3>
                  <p className="text-gray-600">Emergency responders dispatched</p>
                </div>
              </div>

              <div className="mt-12">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-xl px-12 py-6 rounded-full border-0 shadow-lg transform hover:scale-105 transition-all text-white"
                >
                  <Play className="mr-3 h-6 w-6" />
                  Watch Full Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-6xl font-bold text-gray-800 leading-tight">
              Don't Wait for an Emergency
            </h2>
            <p className="text-2xl text-gray-600">
              Join over {livesProtected.toLocaleString()} people who trust SOTERIA with their lives
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-xl px-12 py-6 rounded-full border-0 shadow-lg transform hover:scale-105 transition-all text-white"
              >
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
              <p className="text-gray-600">
                Protecting lives with advanced medical alert technology.
              </p>
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
