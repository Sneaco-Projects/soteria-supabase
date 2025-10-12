// app/(site)/pricing/page.tsx
import Navbar from "@/components/site/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Check, Phone, MapPin, Heart } from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
  return (
    // Top padding so fixed Navbar doesn't overlap
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden pt-24 md:pt-28">
      {/* Shared Navbar */}
      <Navbar />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      {/* Hero */}
      <section className="pb-20 px-4 relative">
        <div className="container mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-gray-800 mb-6 leading-tight">
            Simple, Transparent
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Pricing</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            One plan designed for the Philippines—includes monitoring and Globe SIM load for SMS & data.
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

      {/* Single PH Plan */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="text-center pb-8">
                <div className="mb-3">
                  <Badge className="bg-emerald-500 text-white px-4 py-1">Philippines Plan</Badge>
                </div>
                <CardTitle className="text-2xl text-gray-800">SOTERIA PH</CardTitle>
                <CardDescription className="text-gray-600 mb-4">
                  Device + monitoring with Globe SIM load included
                </CardDescription>

                {/* Pricing */}
                <div className="flex flex-col items-center gap-1">
                  <div className="text-center">
                    <span className="text-sm text-gray-500">One-time device</span>
                    <div className="text-4xl font-bold text-gray-800">₱3,490</div>
                  </div>
                  <div className="text-center">
                    <span className="text-sm text-gray-500">Subscription</span>
                    <div>
                      <span className="text-4xl font-bold text-emerald-600">₱499</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Includes monthly Globe load (SMS + data) for standard usage
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    "24/7 monitoring & alert routing",
                    "Emergency button alerts with GPS location",
                    "Globe SIM with bundled SMS & data (fair-use)",
                    "Family/guardian notifications via SMS & app",
                    "Medication reminders & health profile",
                    "Water-resistant wearable, 7-day battery",
                    "Priority customer support in PH time zone",
                  ].map((line, i) => (
                    <div key={i} className="flex items-center space-x-3 text-gray-700">
                      <Check className="h-5 w-5 text-green-500" />
                      <span className="text-sm">{line}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid sm:grid-cols-2 gap-3">
                  <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
                    Get SOTERIA PH
                  </Button>
                  <Button variant="outline" className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                    Talk to Sales
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 px-4 bg-white/50 backdrop-blur-sm relative z-10">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">What’s Included</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">SOTERIA Device</h3>
              <p className="text-sm text-gray-600">Water-resistant wearable with 7-day battery life</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">24/7 Monitoring</h3>
              <p className="text-sm text-gray-600">Trained responders & alert routing</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">GPS Tracking</h3>
              <p className="text-sm text-gray-600">Precise location sharing with guardians</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Globe SIM Load</h3>
              <p className="text-sm text-gray-600">Bundled SMS & data for alerts each month</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ (kept) */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Pricing Questions</h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Is there a contract or commitment?</h3>
              <p className="text-gray-600">
                No long-term contracts. Month-to-month billing; cancel anytime.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">What happens if I need to replace my device?</h3>
              <p className="text-gray-600">
                2-year warranty for defects. Lost units can be replaced at a discounted fee.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Are there any additional fees?</h3>
              <p className="text-gray-600">
                Subscription includes monitoring, app access, and monthly Globe load for standard usage. Overage SMS/data may be billed at local rates.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Do you offer discounts?</h3>
              <p className="text-gray-600">
                Senior & PWD discounts available on request (ID required).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer (unchanged) */}
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
    </div>
  )
}
