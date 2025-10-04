"use client";

import { useMemo, useState } from "react";
import { Mail, Phone, MessageCircle, MapPin, Clock, Send, HelpCircle, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

const PHONE_NUMBER  = "+92 300 1234567";
const WHATSAPP_LINK = "https://wa.me/923001234567";
const OFFICE_ADDR   = "2nd Floor, Example Plaza, Clifton, Karachi, Pakistan";
const MAPS_LINK     = "https://maps.google.com/?q=Clifton+Karachi+Pakistan";
const HOURS_TEXT    = "Mon–Fri, 9:00–18:00 PKT";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "General",
    message: "",
    storeDomain: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<null | { type: "success" | "error"; text: string }>(null);

  const isValid = useMemo(() => {
    return form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.message.trim();
  }, [form]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Send to /api/contact (Resend on the server)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setNotice({ type: "error", text: "Please fill in your name, a valid email, and a message." });
      return;
    }
    setSubmitting(true);
    setNotice(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          topic: form.topic,
          message: form.message,
          storeDomain: form.storeDomain || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to send message.");
      }

      setNotice({ type: "success", text: "✅ Your message has been sent successfully! We’ll reply ASAP." });
      setForm({ name: "", email: "", topic: "General", message: "", storeDomain: "" });
    } catch (err: any) {
      setNotice({ type: "error", text: err?.message || "Something went wrong sending your message." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-16 px-6">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold">Contact Us</h1>
        <p className="text-gray-500 mt-2">
          Questions, feedback, or need a hand? We’ve got you. We usually reply within one business day.
        </p>
      </header>

      {/* Form + Quick answers */}
      <section className="grid md:grid-cols-2 gap-8 mb-16">
        <Card className="rounded-2xl shadow-lg border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" /> Send us a message
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notice && (
              <div
                className={`mb-4 rounded-xl px-4 py-3 text-sm ${
                  notice.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {notice.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@store.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    name="topic"
                    placeholder="General / Billing / Sales"
                    value={form.topic}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeDomain">Shopify Store (optional)</Label>
                  <Input
                    id="storeDomain"
                    name="storeDomain"
                    placeholder="mystore.myshopify.com"
                    value={form.storeDomain}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Tell us how we can help…"
                  rows={6}
                  value={form.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  By contacting us, you agree to be contacted regarding your request.
                </p>
                <Button type="submit" disabled={submitting || !isValid} className="rounded-xl">
                  <Send className="h-4 w-4 mr-2" /> {submitting ? "Sending…" : "Send"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" /> Quick answers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Get instant help with common questions about plans, billing, and product generation limits.
              If you don’t find what you need, send us a message — we’re happy to help.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>FREE plan is a one-time trial with 10 generations total.</li>
              <li>You can switch plans after cancelling the current one.</li>
              <li>PRO offers up to 250 generations; BASIC includes 100 generations.</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* FAQs */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">FAQs</h2>
        <Accordion type="single" collapsible className="rounded-2xl border shadow-sm p-4">
          <AccordionItem value="q1">
            <AccordionTrigger>How does the FREE plan work?</AccordionTrigger>
            <AccordionContent>
              The FREE plan gives you a one-time quota of 10 generations. Once used, it can’t be reactivated again.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q2">
            <AccordionTrigger>Can I switch from BASIC to PRO (or vice versa)?</AccordionTrigger>
            <AccordionContent>
              Yes — first cancel your current plan from Billing, then subscribe to the other plan.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q3">
            <AccordionTrigger>What are the usage limits for each plan?</AccordionTrigger>
            <AccordionContent>
              FREE: 10 total generations. BASIC: 100 generations. PRO: 250 generations.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q4">
            <AccordionTrigger>How fast do you respond?</AccordionTrigger>
            <AccordionContent>
              We reply within one business day during {HOURS_TEXT}. For urgent issues, call us or WhatsApp.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}
