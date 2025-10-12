// app/(site)/about/page.tsx
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Link2,
  Phone,
  MessageSquareText,
  MapPin,
  Shield,
  Users,
  Building2,
  UserCheck,
  Bell,
  AlertTriangle,
  Wrench,
  HelpCircle,
} from "lucide-react";

export const metadata = {
  title: "How to Use • SOTERIA",
  description: "What, where, when, and how to use SOTERIA — quick start, roles, pairing, and troubleshooting.",
};

export default function AboutPage() {
  return (
    // Keep safe top padding so the fixed Navbar doesn't overlap
    <div className="relative z-10 pt-24 md:pt-28">
      {/* Hero */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-3xl">
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 mb-4">
            Quick Guide
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
            How to use SOTERIA
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Everything you need to know — what SOTERIA is, where things live, when alerts fire,
            and how to get devices paired fast.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/how-it-works">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 hover:from-emerald-600 hover:to-teal-600">
                See the flow
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                Talk to us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick start */}
      <section className="container mx-auto px-4 pb-12">
        <div className="mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Quick start</h2>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Follow these steps to get from zero to a live, paired device sending events.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/90 border-emerald-200">
            <CardHeader className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Building2 className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-gray-900">1) Architect adds the device</CardTitle>
              <CardDescription className="text-gray-600">
                In <b>Architect &gt; Devices</b>, add a new device with its <b>Device ID (HW UID)</b> and the device’s <b>Contact #</b>. New devices are <b>Unavailable</b> by default — toggle them to <b>Available</b> when they’re ready for pairing.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/90 border-emerald-200">
            <CardHeader className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-gray-900">2) Warden creates a Sentinel</CardTitle>
              <CardDescription className="text-gray-600">
                In <b>Warden &gt; Sentinels</b>, click <b>Add &amp; Pair</b>, enter Sentinel details and the same <b>Device ID (HW UID)</b>. Generate a pairing code.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/90 border-emerald-200">
            <CardHeader className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <MessageSquareText className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-gray-900">3) Send the SMS to the device</CardTitle>
              <CardDescription className="text-gray-600">
                From the warden phone, text <code className="px-1 py-0.5 bg-emerald-50 border border-emerald-200 rounded">PAIR &lt;CODE&gt;</code> to the device’s <b>Contact #</b> (the number added by Architect).
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/90 border-emerald-200">
            <CardHeader className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-gray-900">4) Verify pairing</CardTitle>
              <CardDescription className="text-gray-600">
                The dashboard will confirm <b>Paired</b> and start showing <b>Live Events</b> (button presses, SOS, SMS). You’re good to go.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* What (Roles) */}
      <section className="container mx-auto px-4 pb-12">
        <div className="mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">What are the roles?</h2>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Clear responsibilities keep things simple under pressure.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-white/90 border-emerald-200">
            <CardHeader className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Building2 className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-gray-900">Architect</CardTitle>
              <CardDescription className="text-gray-600">
                Provisions devices (Device ID + Contact #), sets <b>Available</b>/<b>Unavailable</b>, and can delete devices if needed.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/90 border-emerald-200">
            <CardHeader className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <UserCheck className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-gray-900">Warden</CardTitle>
              <CardDescription className="text-gray-600">
                Creates Sentinels, generates pairing codes for <b>Available</b> devices, monitors live events, and responds.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/90 border-emerald-200">
            <CardHeader className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Shield className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-gray-900">Provider (optional)</CardTitle>
              <CardDescription className="text-gray-600">
                Assigned to Sentinels to help coordinate responses across teams or facilities.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>


      {/* When (alerts & events) */}
      <section className="container mx-auto px-4 pb-12">
        <div className="mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">When do alerts fire?</h2>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Understand the stream so the right people move fast.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-white/90 border-emerald-200">
            <CardHeader className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Bell className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-gray-900">Button Press (BTN_SHORT)</CardTitle>
              <CardDescription className="text-gray-600">
                User taps the device. Shows message and coordinates when available.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/90 border-emerald-200">
            <CardHeader className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-gray-900">SOS</CardTitle>
              <CardDescription className="text-gray-600">
                High-priority alert with location. Treat as urgent and coordinate response.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/90 border-emerald-200">
            <CardHeader className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <MessageSquareText className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-gray-900">Incoming SMS</CardTitle>
              <CardDescription className="text-gray-600">
                Device moves data or replies via SMS. The content appears in the feed.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How (pair step-by-step, with the SMS instruction) */}
      <section className="container mx-auto px-4 pb-12">
        <div className="mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How to pair a device</h2>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Pairing links a physical device to a Sentinel profile so events show up live.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/90 border-emerald-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Link2 className="h-5 w-5 text-emerald-600" />
                Architecture
              </CardTitle>
              <CardDescription className="text-gray-600">
                Architect prepares, Warden pairs, Provider optionally assists.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-gray-700 space-y-3">
              <ol className="list-decimal ml-5 space-y-2">
                <li>
                  Architect: add the device with <b>Device ID</b> and <b>Contact #</b>, then mark it <b>Available</b>.
                </li>
                <li>
                  Warden: create a <b>Sentinel</b> and enter the same <b>Device ID</b>.
                </li>
                <li>
                  Click <b>Generate Code</b>. You’ll get a short code and the device’s Contact #.
                </li>
                <li>
                  From the warden phone, send:{" "}
                  <code className="px-1 py-0.5 bg-emerald-50 border border-emerald-200 rounded">
                    PAIR &lt;CODE&gt;
                  </code>{" "}
                  to the device’s <b>Contact #</b>.
                </li>
                <li>
                  Watch for <b>Paired successfully</b> and incoming events.
                </li>
              </ol>
              <div className="text-xs text-gray-600 flex items-center gap-2">
                <Phone className="h-4 w-4" /> SMS is used for devices that rely on cellular text transport.
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border-emerald-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-emerald-600" />
                Tips
              </CardTitle>
              <CardDescription className="text-gray-600">
                Make pairing smooth and reliable.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-gray-700 space-y-2">
              <ul className="list-disc ml-5 space-y-2">
                <li>Always confirm the <b>Device ID (HW UID)</b> printed on the device.</li>
                <li>Ensure the SIM in the device has SMS service and a reachable <b>Contact #</b>.</li>
                <li>If a code expires, just generate a new one and resend the SMS.</li>
                <li>Use the map link on events to verify the device’s location <MapPin className="inline -mt-1 h-4 w-4" />.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="container mx-auto px-4 pb-16">
        <div className="mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Troubleshooting</h2>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Common issues and quick fixes.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/90 border-emerald-200">
            <CardHeader className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <HelpCircle className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-gray-900">Code won’t generate</CardTitle>
              <CardDescription className="text-gray-600">
                You might see messages like <em>No such device is available</em> or <em>device not available</em>.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-gray-700 space-y-2">
              <ul className="list-disc ml-5 space-y-2">
                <li>Confirm Architect added the correct <b>Device ID</b> and set it to <b>Available</b>.</li>
                <li>Ensure the Warden entered the same <b>Device ID</b> when generating the code.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/90 border-emerald-200">
            <CardHeader className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-gray-900">No events after pairing</CardTitle>
              <CardDescription className="text-gray-600">
                Pairing succeeded but nothing appears in <b>Live Events</b>.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-gray-700 space-y-2">
              <ul className="list-disc ml-5 space-y-2">
                <li>Verify the device has power and network coverage (SMS/data).</li>
                <li>Trigger a test: short button press (BTN_SHORT) or send a test SMS.</li>
                <li>Check the device’s SIM balance/plan and that the Contact # is reachable.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
