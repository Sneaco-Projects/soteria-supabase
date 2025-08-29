import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Heart, Users, Target } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
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
            <Link href="/about" className="text-emerald-600 font-medium">
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
            Our Mission:
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Keeping You Safe
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            SOTERIA was born from a simple belief: everyone deserves to feel safe and connected, especially when they
            need help the most.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-4 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-6">Our Story</h2>
              <p className="text-lg text-gray-600 mb-6">
                SOTERIA was created after recognizing the critical gap in emergency response systems for vulnerable
                individuals. Traditional emergency systems often fail when people need them most - during medical
                emergencies, accidents, or dangerous situations.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Our team of engineers and safety experts developed SOTERIA to provide instant, reliable emergency
                communication that works anywhere, anytime. Built on the robust LilyGO T-A7670X platform, SOTERIA
                combines GPS tracking, cellular communication, and IoT technology into a compact, wearable device.
              </p>
              <p className="text-lg text-gray-600">
                Today, SOTERIA protects thousands of solo workers, elderly individuals, and people with medical
                conditions, giving them and their families peace of mind.
              </p>
            </div>
            <div className="relative">
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-emerald-200">
                <img
                  src="/placeholder.svg?height=400&width=500&text=SOTERIA+Device+Technology"
                  alt="SOTERIA device technology"
                  className="w-full rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center bg-white/80 backdrop-blur-lg border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-gray-800">Safety First</CardTitle>
                <CardDescription className="text-gray-600">
                  Every decision we make prioritizes user safety and reliability
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center bg-white/80 backdrop-blur-lg border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-gray-800">Compassion</CardTitle>
                <CardDescription className="text-gray-600">
                  We understand the fear and vulnerability that drives the need for our product
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center bg-white/80 backdrop-blur-lg border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-gray-800">Community</CardTitle>
                <CardDescription className="text-gray-600">
                  Building networks of care and support around every user
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center bg-white/80 backdrop-blur-lg border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-gray-800">Innovation</CardTitle>
                <CardDescription className="text-gray-600">
                  Continuously improving our technology to serve users better
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Meet Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center bg-white/80 backdrop-blur-lg border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <img
                  src="/placeholder.svg?height=128&width=128&text=CEO"
                  alt="CEO"
                  className="w-32 h-32 rounded-full mx-auto mb-4"
                />
                <CardTitle className="text-gray-800">Sarah Johnson</CardTitle>
                <CardDescription className="text-gray-600">CEO & Co-Founder</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Former emergency response coordinator with 15 years of experience in public safety.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center bg-white/80 backdrop-blur-lg border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <img
                  src="/placeholder.svg?height=128&width=128&text=CTO"
                  alt="CTO"
                  className="w-32 h-32 rounded-full mx-auto mb-4"
                />
                <CardTitle className="text-gray-800">Michael Chen</CardTitle>
                <CardDescription className="text-gray-600">CTO & Co-Founder</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  IoT and embedded systems expert with a passion for life-saving technology.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center bg-white/80 backdrop-blur-lg border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <img
                  src="/placeholder.svg?height=128&width=128&text=Product+Manager"
                  alt="Product Manager"
                  className="w-32 h-32 rounded-full mx-auto mb-4"
                />
                <CardTitle className="text-gray-800">Dr. Emily Rodriguez</CardTitle>
                <CardDescription className="text-gray-600">Head of Product</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Medical device specialist focused on user experience and accessibility.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-6xl font-bold text-gray-800 leading-tight">Join the SOTERIA Family</h2>
            <p className="text-2xl text-gray-600">
              Experience the peace of mind that comes with reliable emergency protection
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-xl px-12 py-6 rounded-full border-0 shadow-lg transform hover:scale-105 transition-all text-white"
            >
              <Shield className="mr-3 h-6 w-6" />
              Get Started Today
            </Button>
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
