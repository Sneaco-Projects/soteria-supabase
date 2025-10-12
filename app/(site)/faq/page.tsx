// app/(site)/faq/page.tsx
"use client"

import { useState, useMemo, Suspense } from "react"
import Navbar from "@/components/site/navbar"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search, Shield } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

const faqData = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "What does SOTERIA actually do today?",
        answer:
          "We provide a clean, real-time dashboard for device events (SOS, Button, SMS, A-GPS, Health) with Maps support. Devices are provisioned by an Architect (Device ID + Contact #), marked Available, then paired by Wardens using a short SMS code.",
      },
      {
        question: "What roles exist and who sees what?",
        answer:
          "Architect: adds devices with Device ID + Contact # and controls their Available status. Warden: creates Sentinels and pairs them to available devices via a SMS pairing code. Provider/others are role-restricted and cannot access dashboards they’re not allowed to.",
      },
      {
        question: "What do I need before pairing?",
        answer:
          "An Architect must first add the device (Device ID + Contact #) and set it to Available. Then the Warden can pair it to a Sentinel from the Warden dashboard.",
      },
    ],
  },
  {
    category: "Devices & Availability",
    questions: [
      {
        question: "How does a device become 'Available'?",
        answer:
          "When the Architect adds a device, it starts as Unavailable by default. The Architect can toggle it to Available. Only Available devices can be paired by Wardens.",
      },
      {
        question: "What happens if a Warden tries to pair an unavailable or unknown device?",
        answer:
          "Pairing will fail with a friendly message such as “No such device is available” or “That device is not available.” Ask the Architect to add the device and/or mark it Available.",
      },
      {
        question: "Can devices be removed?",
        answer:
          "Yes. Architects can delete devices they previously added. If a device is already assigned to a Sentinel, it should be unassigned first to avoid breaking event flow.",
      },
    ],
  },
  {
    category: "Pairing & Codes",
    questions: [
      {
        question: "How do Wardens pair a device to a Sentinel?",
        answer:
          "From the Warden dashboard: (1) Add a Sentinel (enter the Sentinel’s name and Warden number), (2) Enter the device’s Device ID, (3) Generate a pairing code, and (4) Text “PAIR {CODE}” to the device’s Contact # (the number the Architect stored for that device).",
      },
      {
        question: "Where do I send the pairing code?",
        answer:
          "Send a text message that says: PAIR {YOUR_CODE} to the device’s Contact #. The UI shows this number in the modal as soon as the code is generated.",
      },
      {
        question: "What pairing errors might I see, and what do they mean?",
        answer:
          "• no_such_device_available — The Device ID isn’t in the system or isn’t Available.\n• device_not_available — The device exists but is not marked Available.\n• device_already_assigned — The device is already assigned to a different Sentinel.\n• active_claim_locked_to_different_hw — Code exists but was locked to another hardware ID.\n• sentinel_not_owned — You’re trying to pair to a Sentinel you don’t own.",
      },
    ],
  },
  {
    category: "Events & Maps",
    questions: [
      {
        question: "Which events are supported in the live feed?",
        answer:
          "SOS, BTN_SHORT (button press), IN_SMS (incoming SMS), AGPS_BOOST/STOP, HEALTH, OTW. Each event shows a clear label and icon. If location is present, you’ll see a coordinate chip and an “Open in Maps” button.",
      },
      {
        question: "The raw JSON looked messy before—what did you improve?",
        answer:
          "We display a clean message chip, tidy key/value pills for extra fields, and a prominent Maps button when lat/lng exist. The raw JSON is available in a collapsible section for debugging only.",
      },
    ],
  },
  {
    category: "Troubleshooting",
    questions: [
      {
        question: "I generated a code but don’t see the SMS instruction with the Contact #",
        answer:
          "Make sure the device has a Contact # in Architect and that you entered a valid Device ID when generating the code. The pairing modal will then show “Send PAIR {CODE} to the device’s Contact # (e.g., +63… )”.",
      },
      {
        question: "Edge Function returned a non-2xx status code when creating a claim",
        answer:
          "Confirm the function name is create-claim, it’s deployed, and you’re sending both Authorization (user JWT) and apikey (anon) headers. Also ensure SUPABASE_URL/SERVICE_ROLE keys are correctly set in the function environment and that your RLS policies allow the call.",
      },
      {
        question: "The Warden dashboard redirected me somewhere unexpected",
        answer:
          "Role protection is enforced. If your role isn’t warden, you’ll be redirected to your role’s dashboard. Check your account’s role in the profiles table.",
      },
    ],
  },
]

function FAQContent() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredFaqData = useMemo(() => {
    if (!searchTerm) return faqData
    const q = searchTerm.toLowerCase()
    return faqData
      .map((cat) => ({
        ...cat,
        questions: cat.questions.filter(
          (x) => x.question.toLowerCase().includes(q) || x.answer.toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.questions.length > 0)
  }, [searchTerm])

  return (
    // Top padding so fixed Navbar doesn’t overlap
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden pt-24 md:pt-28">
      <Navbar />

      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply blur-xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply blur-xl opacity-30 animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply blur-xl opacity-20 animate-pulse delay-2000" />
      </div>

      {/* Hero */}
      <section className="pb-16 px-4 relative">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Frequently Asked <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Questions</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Clear answers about provisioning, pairing by SMS code, and the live event feed.
          </p>

          {/* Search */}
          <div className="mt-6 max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search FAQ…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>
        </div>
      </section>

      {/* FAQ list */}
      <section className="py-10 px-4 relative z-10">
        <div className="container mx-auto max-w-4xl">
          {filteredFaqData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No FAQs match your search.</p>
            </div>
          ) : (
            filteredFaqData.map((category, i) => (
              <div key={i} className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{category.category}</h2>
                <Accordion type="single" collapsible className="space-y-4">
                  {category.questions.map((faq, j) => (
                    <AccordionItem
                      key={j}
                      value={`${i}-${j}`}
                      className="bg-white/80 backdrop-blur-lg border border-emerald-200 rounded-lg px-6 shadow-lg"
                    >
                      <AccordionTrigger className="text-left hover:no-underline text-gray-900">
                        <span className="font-medium">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-700 pb-4 whitespace-pre-wrap">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Need more help */}
      <section className="py-16 px-4 bg-white/55 backdrop-blur-sm relative z-10">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Still have questions?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Our team can help you provision devices, set Availability, and walk through pairing by SMS.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              >
                Contact Support
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button
                size="lg"
                variant="outline"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-transparent"
              >
                Sign up
              </Button>
            </Link>
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
          <div className="border-top border-emerald-200 mt-8 pt-8 text-center text-gray-600">
            <p>&copy; {new Date().getFullYear()} SOTERIA.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function FAQPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <FAQContent />
    </Suspense>
  )
}
