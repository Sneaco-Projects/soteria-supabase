import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Check, Phone, MapPin, Heart } from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
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
            <Link href="/pricing" className="text-emerald-600 font-medium">
              Pricing
            </Link>
            <Link href="/about" className="hover:text-emerald-600 transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-emerald-600 transition-colors">
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
            Simple, Transparent
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Pricing</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose the SOTERIA plan that best fits your medical alert and monitoring needs. All plans include 24/7
            professional monitoring and emergency response.
          </p>
          <div className="flex justify-center items-center space-x-6 opacity-75">
            <span className="text-sm text-gray-600">No Hidden Fees</span>
            <span className="text-sm text-gray-600">•</span>
            <span className="text-sm text-gray-600">Cancel Anytime</span>
            <span className="text-sm text-gray-600">•</span>
            <span className="text-sm text-gray-600">30-Day Money Back</span>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Basic Plan */}
            <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl text-gray-800">Basic Protection</CardTitle>
                <CardDescription className="text-gray-600 mb-4">Essential medical alert for home use</CardDescription>
                <div className="text-center">
                  <span className="text-4xl font-bold text-gray-800">$29</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-sm text-gray-500">+ $99 device fee (one-time)</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">SOTERIA wearable device</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">24/7 professional monitoring</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">GPS location tracking</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Emergency button alerts</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Up to 3 emergency contacts</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Mobile app for guardians</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Basic health profile</span>
                  </div>
                </div>
                <Button className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
                  Choose Basic
                </Button>
              </CardContent>
            </Card>

            {/* Advanced Plan - Most Popular */}
            <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 shadow-xl relative hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-emerald-500 text-white px-4 py-1">Most Popular</Badge>
              </div>
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl text-gray-800">Advanced Care</CardTitle>
                <CardDescription className="text-gray-600 mb-4">
                  Complete medical alert with smart features
                </CardDescription>
                <div className="text-center">
                  <span className="text-4xl font-bold text-emerald-600">$49</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-sm text-gray-500">+ $149 device fee (one-time)</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium">Everything in Basic, plus:</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Fall detection technology</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Medication reminders</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Two-way communication</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Up to 10 emergency contacts</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Advanced health monitoring</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Priority emergency response</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Family dashboard access</span>
                  </div>
                </div>
                <Button className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
                  Choose Advanced
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl text-gray-800">Premium Care</CardTitle>
                <CardDescription className="text-gray-600 mb-4">Complete health monitoring ecosystem</CardDescription>
                <div className="text-center">
                  <span className="text-4xl font-bold text-teal-600">$79</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-sm text-gray-500">+ $199 device fee (one-time)</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium">Everything in Advanced, plus:</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Nurse consultation calls</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Wellness check-ins</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Health trend reporting</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Unlimited emergency contacts</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Healthcare provider integration</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">24/7 nurse hotline</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Concierge support</span>
                  </div>
                </div>
                <Button className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
                  Choose Premium
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 px-4 bg-white/50 backdrop-blur-sm relative z-10">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">What's Included with Every Plan</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">SOTERIA Device</h3>
              <p className="text-sm text-gray-600">Waterproof, lightweight wearable with 7-day battery life</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">24/7 Monitoring</h3>
              <p className="text-sm text-gray-600">
                Professional monitoring center staffed by trained medical personnel
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">GPS Tracking</h3>
              <p className="text-sm text-gray-600">Precise location sharing with emergency responders and family</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Mobile App</h3>
              <p className="text-sm text-gray-600">
                Guardian app for family members with real-time alerts and tracking
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Pricing Questions</h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Is there a contract or commitment?</h3>
              <p className="text-gray-600">
                No long-term contracts required. You can cancel your service at any time. We offer month-to-month
                billing with no cancellation fees.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">What happens if I need to replace my device?</h3>
              <p className="text-gray-600">
                All devices come with a 2-year warranty. If your device is damaged or malfunctions, we'll replace it at
                no charge. Lost devices can be replaced for $50.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Are there any additional fees?</h3>
              <p className="text-gray-600">
                No hidden fees. The monthly service fee includes monitoring, cellular connectivity, app access, and
                customer support. The only additional cost is the one-time device fee.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Do you offer discounts for seniors or veterans?
              </h3>
              <p className="text-gray-600">
                Yes! We offer a 15% discount for seniors (65+) and veterans. Contact our customer service team to apply
                your discount.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-6xl font-bold text-gray-800 leading-tight">Ready to Get Protected?</h2>
            <p className="text-2xl text-gray-600">
              Start with a 30-day risk-free trial. If you're not completely satisfied, we'll refund your money and
              arrange device return.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-xl px-12 py-6 rounded-full border-0 shadow-lg transform hover:scale-105 transition-all text-white"
              >
                Start Free Trial
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-xl px-12 py-6 rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-transparent"
              >
                Speak with Specialist
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
