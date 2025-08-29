"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, MapPin, Clock, Heart } from "lucide-react"
import Link from "next/link"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // TODO: Implement form submission
    try {
      console.log("Submitting contact form:", formData)
      // Handle form submission
    } catch (error) {
      console.error("Form submission error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      {/* Floating Navigation */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white/80 backdrop-blur-lg border border-emerald-200 rounded-full px-6 py-3 shadow-lg">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <span className="text-gray-800 font-bold">SOTERIA</span>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-gray-600">
            <Link href="/features" className="hover:text-emerald-600 transition-colors">
              Features
            </Link>
            <Link href="/how-it-works" className="hover:text-emerald-600 transition-colors">
              How It Works
            </Link>
            <Link href="/pricing" className="hover:text-emerald-600 transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="hover:text-emerald-600 transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-emerald-600 font-medium">
              Contact
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/auth/signin">
              <Button variant="ghost" className="text-gray-600 hover:bg-emerald-50">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-0 text-white">
                Get Protected
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative">
        <div className="container mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-gray-800 mb-6 leading-tight">
            Get in
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Touch</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions about SOTERIA? Need support? We're here to help you stay safe and connected.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Contact Information</h2>
              <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-lg border-emerald-200 shadow-lg p-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Email Support</h3>
                      <p className="text-gray-600">support@soteria.io</p>
                      <p className="text-sm text-gray-500">We typically respond within 24 hours</p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-white/80 backdrop-blur-lg border-emerald-200 shadow-lg p-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Emergency Support</h3>
                      <p className="text-gray-600">1-800-SOTERIA (1-800-768-3742)</p>
                      <p className="text-sm text-gray-500">24/7 emergency technical support</p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-white/80 backdrop-blur-lg border-emerald-200 shadow-lg p-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Headquarters</h3>
                      <p className="text-gray-600">
                        123 Safety Boulevard
                        <br />
                        Tech City, TC 12345
                        <br />
                        United States
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-white/80 backdrop-blur-lg border-emerald-200 shadow-lg p-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl flex items-center justify-center">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Business Hours</h3>
                      <p className="text-gray-600">
                        Monday - Friday: 8:00 AM - 8:00 PM EST
                        <br />
                        Saturday - Sunday: 10:00 AM - 6:00 PM EST
                      </p>
                      <p className="text-sm text-gray-500">Emergency support available 24/7</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Quick Links */}
            <Card className="bg-white/80 backdrop-blur-lg border-emerald-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-800">Quick Help</CardTitle>
                <CardDescription className="text-gray-600">Common questions and resources</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/faq" className="block text-emerald-600 hover:underline">
                  Frequently Asked Questions
                </Link>
                <Link href="/help" className="block text-emerald-600 hover:underline">
                  Help Center
                </Link>
                <Link href="/setup" className="block text-emerald-600 hover:underline">
                  Device Setup Guide
                </Link>
                <Link href="/troubleshooting" className="block text-emerald-600 hover:underline">
                  Troubleshooting
                </Link>
                <Link href="/status" className="block text-emerald-600 hover:underline">
                  System Status
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-lg border-emerald-200 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800">Send us a Message</CardTitle>
                <CardDescription className="text-gray-600">
                  Fill out the form below and we'll get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-800">
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-800">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-gray-800">
                      Category
                    </Label>
                    <Select onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger className="bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="billing">Billing Question</SelectItem>
                        <SelectItem value="device">Device Issue</SelectItem>
                        <SelectItem value="emergency">Emergency Support</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="media">Media Inquiry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-gray-800">
                      Subject *
                    </Label>
                    <Input
                      id="subject"
                      placeholder="Brief description of your inquiry"
                      value={formData.subject}
                      onChange={(e) => handleInputChange("subject", e.target.value)}
                      className="bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-gray-800">
                      Message *
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Please provide details about your inquiry..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      className="bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="privacy" required />
                    <Label htmlFor="privacy" className="text-sm text-gray-800">
                      I agree to the{" "}
                      <Link href="/privacy" className="text-emerald-600 hover:underline">
                        Privacy Policy
                      </Link>{" "}
                      and{" "}
                      <Link href="/terms" className="text-emerald-600 hover:underline">
                        Terms of Service
                      </Link>
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Emergency Notice */}
        <div className="mt-12">
          <Card className="bg-red-50/80 backdrop-blur-lg border-red-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">Emergency Situations</h3>
                  <p className="text-red-800 mb-3">
                    If you're experiencing a life-threatening emergency, do not use this contact form. Call emergency
                    services immediately (911 in the US).
                  </p>
                  <p className="text-red-800">
                    For urgent technical issues with your SOTERIA device during an emergency, call our 24/7 emergency
                    support line: <strong>1-800-SOTERIA</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
    </div>
  )
}
