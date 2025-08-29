// app/(site)/how-it-works/page.tsx
import Navbar from "@/components/site/navbar";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, MapPin, Heart, Users, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function HowItWorksPage() {
  return (
    // Top padding so the fixed Navbar won't overlap
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
          <h1 className="text-6xl md:text-7xl font-bold text-gray-800 mb-6 leading-tight">
            How SOTERIA
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Works</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Simple, reliable, and fast. SOTERIA connects you to help in just three easy steps, providing peace of mind
            for you and your loved ones.
          </p>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-16">Emergency Response in 3 Simple Steps</h2>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center relative">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                1
              </div>
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-full h-0.5 bg-gray-200 hidden lg:block lg:w-full lg:left-full lg:top-12"></div>

              <Card className="bg-white/80 backdrop-blur-lg border border-emerald-200 rounded-lg p-6 shadow-lg">
                <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Press the Button</h3>
                <p className="text-gray-600 mb-4">
                  Press the large emergency button once for a medical alert to your care team, or three times quickly
                  for immediate emergency services.
                </p>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    <strong>Single Press:</strong> Alerts your family/caregivers
                    <br />
                    <strong>Triple Press:</strong> Contacts emergency services
                  </p>
                </div>
              </Card>
            </div>

            {/* Step 2 */}
            <div className="text-center relative">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                2
              </div>
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-full h-0.5 bg-gray-200 hidden lg:block lg:w-full lg:left-full lg:top-12"></div>

              <Card className="bg-white/80 backdrop-blur-lg border border-emerald-200 rounded-lg p-6 shadow-lg">
                <MapPin className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Location Sent Instantly</h3>
                <p className="text-gray-600 mb-4">
                  Your exact GPS location is immediately transmitted to our monitoring center and your designated
                  contacts via SMS and app notifications.
                </p>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>GPS Accuracy:</strong> Within 10 feet
                    <br />
                    <strong>Response Time:</strong> Under 30 seconds
                  </p>
                </div>
              </Card>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                3
              </div>

              <Card className="bg-white/80 backdrop-blur-lg border border-emerald-200 rounded-lg p-6 shadow-lg">
                <Users className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Help Arrives</h3>
                <p className="text-gray-600 mb-4">
                  Our trained monitoring professionals assess your situation and coordinate with your care team, family,
                  or emergency services as needed.
                </p>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>24/7 Monitoring:</strong> Always available
                    <br />
                    <strong>Trained Staff:</strong> Medical professionals
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Process */}
      <section className="py-20 px-4 bg-white/50 backdrop-blur-sm relative z-10">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
            Behind the Scenes: What Happens When You Press the Button
          </h2>

        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-full flex items-center justify-center font-bold">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">0-5 Seconds: Alert Initiated</h3>
                <p className="text-gray-600">
                  Device vibrates to confirm button press, LED indicator shows alert status, and GPS location is
                  acquired. Multiple communication channels activate simultaneously.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-full flex items-center justify-center font-bold">
                  <Phone className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">5-15 Seconds: Monitoring Center Contacted</h3>
                <p className="text-gray-600">
                  Alert reaches our 24/7 monitoring center with your location, medical profile, and emergency
                  contacts. Trained professionals begin assessment protocol.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-full flex items-center justify-center font-bold">
                  <Users className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">15-30 Seconds: Care Team Notified</h3>
                <p className="text-gray-600">
                  Your designated contacts receive SMS alerts and app notifications with your location and alert type.
                  They can respond directly through the app.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-full flex items-center justify-center font-bold">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">30+ Seconds: Response Coordinated</h3>
                <p className="text-gray-600">
                  Based on your response and alert type, appropriate help is dispatched. You receive confirmation
                  feedback through device vibration and LED indicators.
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Device Feedback */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Understanding Your Device Feedback</h2>

          <div className="grid md:grid-cols-2 gap-12">
            <Card className="shadow-lg bg-white/80 border border-emerald-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-800">
                  <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span>Vibration Patterns</span>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Feel the confirmation through tactile feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-2 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-600">1 long vibration = Alert sent successfully</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-3 h-2 bg-green-500 rounded"></div>
                    <div className="w-3 h-2 bg-green-500 rounded"></div>
                    <div className="w-8 h-2 bg-green-500 rounded"></div>
                  </div>
                  <span className="text-sm text-gray-600">2 short + 1 long = Guardian responded</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-purple-500 rounded"></div>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">5 short vibrations = Help is on the way</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-white/80 border border-emerald-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-800">
                  <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                  <span>LED Indicators</span>
                </CardTitle>
                <CardDescription className="text-gray-600">Visual status updates at a glance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Green blink = Alert sent successfully</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Blue blink = Guardian received alert</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Red blink = Connection issue or low battery</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Purple blink = Emergency services contacted</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-6xl font-bold text-gray-800 leading-tight">See SOTERIA in Action</h2>
            <p className="text-2xl text-gray-600">
              Experience the peace of mind that comes with reliable medical alert protection
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-xl px-12 py-6 rounded-full border-0 shadow-lg transform hover:scale-105 transition-all text-white"
              >
                Watch Demo Video
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-xl px-12 py-6 rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-transparent"
              >
                Schedule Free Consultation
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
    </div>
  )
}
