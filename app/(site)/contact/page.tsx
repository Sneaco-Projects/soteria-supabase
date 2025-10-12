
// app/(site)/contact/page.tsx — CONTACT (no mock text; uses settings from DB)
"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Navbar from "@/components/site/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Clock, Heart } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";

// Shape your table: site_settings(support_email, emergency_phone, hq_address, business_hours)
// hq_address can be a text[] or json string; business_hours can be json.

type SiteSettings = {
  support_email: string | null;
  emergency_phone: string | null;
  hq_address: string | string[] | null; // array of lines or full string
  business_hours: any | null; // { weekdays: "..", weekend: ".." } or similar
};

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", category: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [submitOk, setSubmitOk] = useState<null | boolean>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingSettings(true);
      const { data, error } = await supabase.from("site_settings").select("support_email,emergency_phone,hq_address,business_hours").single();
      if (!mounted) return;
      if (!error) setSettings(data as SiteSettings);
      setLoadingSettings(false);
    })();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitOk(null);
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      setSubmitOk(res.ok);
      if (res.ok) setFormData({ name: "", email: "", subject: "", category: "", message: "" });
    } catch (e) {
      setSubmitOk(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => setFormData((prev) => ({ ...prev, [field]: value }));

  // Helpers to render address/hours safely
  const renderAddress = () => {
    if (!settings?.hq_address) return <p className="text-gray-500">—</p>;
    if (Array.isArray(settings.hq_address)) {
      return (
        <p className="text-gray-600">{settings.hq_address.map((line, i) => (<span key={i}>{line}<br /></span>))}</p>
      );
    }
    return <p className="text-gray-600">{settings.hq_address}</p>;
  };

  const renderHours = () => {
    const h = settings?.business_hours;
    if (!h) return <p className="text-gray-500">—</p>;
    if (typeof h === "string") return <p className="text-gray-600">{h}</p>;
    return (
      <p className="text-gray-600">
        {h.weekdays ? <>Mon–Fri: {h.weekdays}<br /></> : null}
        {h.weekend ? <>Sat–Sun: {h.weekend}</> : null}
      </p>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden pt-24 md:pt-28">
      <Navbar />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000" />
      </div>

      {/* Hero */}
      <section className="pb-20 px-4 relative">
        <div className="container mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-gray-800 mb-6 leading-tight">
            Get in<br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Touch</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Have questions about SOTERIA? Need support? We're here to help.</p>
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
                      <p className="text-gray-600">+639451458138</p>
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
                      <p className="text-sm text-gray-500">123 Soteria St, Makati, Philippines</p>
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
                <Link href="/faq" className="block text-emerald-600 hover:underline">Frequently Asked Questions</Link>
                <Link href="/help" className="block text-emerald-600 hover:underline">Help Center</Link>
                <Link href="/setup" className="block text-emerald-600 hover:underline">Device Setup Guide</Link>
                <Link href="/troubleshooting" className="block text-emerald-600 hover:underline">Troubleshooting</Link>
                <Link href="/status" className="block text-emerald-600 hover:underline">System Status</Link>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-lg border-emerald-200 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-800">Send us a Message</CardTitle>
                <CardDescription className="text-gray-600">Fill out the form below and we'll get back to you as soon as possible</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-800">Full Name *</Label>
                      <Input id="name" placeholder="Enter your full name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} className="bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-800">Email Address *</Label>
                      <Input id="email" type="email" placeholder="Enter your email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} className="bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-gray-800">Category</Label>
                    <Select onValueChange={(value) => handleInputChange("category", value)} value={formData.category}>
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
                    <Label htmlFor="subject" className="text-gray-800">Subject *</Label>
                    <Input id="subject" placeholder="Brief description of your inquiry" value={formData.subject} onChange={(e) => handleInputChange("subject", e.target.value)} className="bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-gray-800">Message *</Label>
                    <Textarea id="message" placeholder="Please provide details about your inquiry..." rows={6} value={formData.message} onChange={(e) => handleInputChange("message", e.target.value)} className="bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500" required />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="privacy" required />
                    <Label htmlFor="privacy" className="text-sm text-gray-800">
                      I agree to the {" "}
                      <Link href="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link>{" "}
                      and {" "}
                      <Link href="/terms" className="text-emerald-600 hover:underline">Terms of Service</Link>
                    </Label>
                  </div>

                  <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white" disabled={submitting}>
                    {submitting ? "Sending..." : "Send Message"}
                  </Button>

                  {submitOk === true && <p className="text-emerald-700 text-sm">Thanks! Your message has been sent.</p>}
                  {submitOk === false && <p className="text-red-600 text-sm">Something went wrong. Please try again.</p>}
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
                  <p className="text-red-800 mb-3">If you're experiencing a life-threatening emergency, call local emergency services immediately.</p>
                  <p className="text-red-800">For urgent technical issues with your SOTERIA device during an emergency, call our 24/7 emergency support line: <strong>+639451458138</strong></p>
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
            <p>&copy; {new Date().getFullYear()} SOTERIA.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
