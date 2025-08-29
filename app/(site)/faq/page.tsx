// app/(site)/faq/page.tsx
"use client"

import { useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Navbar from "@/components/site/navbar"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search, Heart } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

const faqData = [
  {
    category: "General",
    questions: [
      {
        question: "What is SOTERIA?",
        answer:
          "SOTERIA is a voice-activated wearable emergency alert system that provides instant communication with your guardians during emergencies. It features GPS tracking, multiple alert methods, and real-time monitoring capabilities.",
      },
      {
        question: "How does the device work?",
        answer:
          "Simply press the emergency button once for a guardian alert or three times for emergency services. The device automatically sends your GPS location via SMS and internet connectivity to your designated contacts.",
      },
      {
        question: "Who should use SOTERIA?",
        answer:
          "SOTERIA is designed for solo workers, elderly individuals, people with medical conditions, and anyone who wants peace of mind knowing help is just a button press away.",
      },
    ],
  },
  {
    category: "Technical",
    questions: [
      {
        question: "Does SOTERIA require a SIM card?",
        answer:
          "Yes, SOTERIA uses cellular connectivity (LTE/GSM) and requires a SIM card for SMS alerts and internet connectivity. We offer SIM card packages with our devices.",
      },
      {
        question: "How long does the battery last?",
        answer:
          "The rechargeable LiPo battery typically lasts 5-7 days with normal use. The device includes low battery alerts and can be charged via USB-C.",
      },
      {
        question: "What happens if there's no cellular signal?",
        answer:
          "SOTERIA includes offline storage that retains emergency data during network loss and automatically syncs when connectivity is restored. The device will continue attempting to send alerts.",
      },
      {
        question: "Is the device waterproof?",
        answer:
          "SOTERIA has an IP65 rating, making it resistant to water and dust. It can withstand rain and splashes but should not be submerged in water.",
      },
    ],
  },
  {
    category: "Setup & Usage",
    questions: [
      {
        question: "How do I set up my SOTERIA device?",
        answer:
          "Setup is simple: 1) Charge the device, 2) Insert the SIM card, 3) Register your device online, 4) Add your guardian contacts, 5) Test the alert system. Detailed instructions are included with your device.",
      },
      {
        question: "Can I have multiple guardians?",
        answer:
          "Yes, you can add multiple guardian contacts who will all receive alerts simultaneously. You can manage your guardian list through the web dashboard or mobile app.",
      },
      {
        question: "How do I know if my alert was sent?",
        answer:
          "SOTERIA provides immediate feedback through vibration patterns and LED indicators. You'll feel one long vibration when an SMS is sent and see a green LED blink when the alert is successfully transmitted.",
      },
    ],
  },
  {
    category: "Billing & Support",
    questions: [
      {
        question: "What's included in the price?",
        answer:
          "Your SOTERIA purchase includes the device, charging cable, user manual, and 3 months of cellular service. After that, monthly service plans start at $19.99/month.",
      },
      {
        question: "Is there a monthly fee?",
        answer:
          "Yes, there's a monthly service fee for cellular connectivity and cloud services. Plans start at $19.99/month and include unlimited alerts, GPS tracking, and 24/7 monitoring.",
      },
      {
        question: "What if my device stops working?",
        answer:
          "All SOTERIA devices come with a 2-year warranty. If your device malfunctions, contact our support team for a replacement. We also offer 24/7 technical support.",
      },
    ],
  },
]

function FAQContent() {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")

  const filteredFaqData = useMemo(() => {
    if (!searchTerm) return faqData
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return faqData
      .map((category) => ({
        ...category,
        questions: category.questions.filter(
          (q) =>
            q.question.toLowerCase().includes(lowerCaseSearchTerm) ||
            q.answer.toLowerCase().includes(lowerCaseSearchTerm),
        ),
      }))
      .filter((category) => category.questions.length > 0)
  }, [searchTerm])

  return (
    // Add top padding so fixed Navbar doesn't overlap
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
            Frequently Asked
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Questions
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Find answers to common questions about SOTERIA emergency alert system
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search FAQ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12 px-4 relative z-10">
        <div className="container mx-auto max-w-4xl">
          {filteredFaqData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No FAQs found matching your search.</p>
            </div>
          ) : (
            filteredFaqData.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{category.category}</h2>
                <Accordion type="single" collapsible className="space-y-4">
                  {category.questions.map((faq, faqIndex) => (
                    <AccordionItem
                      key={faqIndex}
                      value={`${categoryIndex}-${faqIndex}`}
                      className="bg-white/80 backdrop-blur-lg border border-emerald-200 rounded-lg px-6 shadow-lg"
                    >
                      <AccordionTrigger className="text-left hover:no-underline text-gray-800">
                        <span className="font-medium">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 pb-4">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-20 px-4 bg-white/50 backdrop-blur-sm relative z-10">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Still Have Questions?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help you 24/7.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              >
                Contact Support
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-transparent"
            >
              Call 1-800-SOTERIA
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

export default function FAQPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FAQContent />
    </Suspense>
  )
}
