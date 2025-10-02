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

const SUPPORT_EMAIL = "support@yourapp.com";
const SALES_EMAIL   = "sales@yourapp.com";
const BILLING_EMAIL = "billing@yourapp.com";
const PHONE_NUMBER  = "+92 300 1234567";
const WHATSAPP_LINK = "https://wa.me/923001234567"; // change to your official WA
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

  // Opens user's email client with prefilled subject/body.
  // If you later add a backend endpoint (e.g. /api/contact), you can POST instead.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setNotice({ type: "error", text: "Please fill in your name, a valid email, and a message." });
      return;
    }
    setSubmitting(true);
    setNotice(null);

    const subject = encodeURIComponent(`[${form.topic}] Contact from ${form.name}`);
    const body = encodeURIComponent(
      [
        `Name: ${form.name}`,
        `Email: ${form.email}`,
        form.storeDomain ? `Store: ${form.storeDomain}` : undefined,
        `Topic: ${form.topic}`,
        "",
        form.message,
      ].filter(Boolean).join("\n")
    );

    // Prefer support inbox by default
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    window.location.href = mailto;

    // Light UX: show a success notice
    setTimeout(() => {
      setSubmitting(false);
      setNotice({ type: "success", text: "Your email draft is ready. Send it from your email client — we’ll reply ASAP." });
      setForm({ name: "", email: "", topic: "General", message: "", storeDomain: "" });
    }, 600);
  };

  return (
    <div className="max-w-6xl mx-auto py-16 px-6">
      {/* Page Header */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold">Contact Us</h1>
        <p className="text-gray-500 mt-2">
          Questions, feedback, or need a hand? We’ve got you. We usually reply within one business day.
        </p>
      </header>

      {/* Contact Info Cards */}
      {/* <section className="grid gap-6 md:grid-cols-3 mb-12">
        <Card className="rounded-2xl shadow-lg border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" /> Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium w-16">Support</span>
              <a className="text-blue-600 underline break-all" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium w-16">Sales</span>
              <a className="text-blue-600 underline break-all" href={`mailto:${SALES_EMAIL}`}>{SALES_EMAIL}</a>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium w-16">Billing</span>
              <a className="text-blue-600 underline break-all" href={`mailto:${BILLING_EMAIL}`}>{BILLING_EMAIL}</a>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" /> Call / WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium w-24">Phone</span>
              <a className="text-blue-600 underline" href={`tel:${PHONE_NUMBER.replace(/\s/g, "")}`}>{PHONE_NUMBER}</a>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium w-24">WhatsApp</span>
              <a className="text-blue-600 underline" href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
                Message us
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>{HOURS_TEXT}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Office
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
              <div>
                <div>{OFFICE_ADDR}</div>
                <a className="text-blue-600 underline" href={MAPS_LINK} target="_blank" rel="noreferrer">
                  Open in Maps
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </section> */}

      {/* Contact Form */}
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
                  <Send className="h-4 w-4 mr-2" /> {submitting ? "Opening…" : "Send"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Helpful quick answers card */}
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
              <li>PRO offers unlimited usage; BASIC includes 200 generations.</li>
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
              The FREE plan gives you a one-time quota of 10 generations. It’s meant to try the app risk-free.
              Once used, it can’t be reactivated again.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q2">
            <AccordionTrigger>Can I switch from BASIC to PRO (or vice versa)?</AccordionTrigger>
            <AccordionContent>
              Yes — first cancel your current plan from Billing, then subscribe to the other plan. We’ll warn you before switching to avoid accidental changes.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q3">
            <AccordionTrigger>What are the usage limits for each plan?</AccordionTrigger>
            <AccordionContent>
              FREE: 10 total generations (one-time). BASIC: 200 active-plan generations. PRO: unlimited usage.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q4">
            <AccordionTrigger>How fast do you respond?</AccordionTrigger>
            <AccordionContent>
              We reply within one business day (usually much faster) during {HOURS_TEXT}. For urgent issues, call us or message on WhatsApp.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q5">
            <AccordionTrigger>Do you offer refunds?</AccordionTrigger>
            <AccordionContent>
              If something isn’t working as promised, reach out to <a href={`mailto:${BILLING_EMAIL}`} className="text-blue-600 underline">{BILLING_EMAIL}</a>. We’ll review on a case-by-case basis in line with our terms.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q6">
            <AccordionTrigger>Is my store data safe?</AccordionTrigger>
            <AccordionContent>
              We take privacy seriously and only use the minimum permissions needed for product generation. Contact <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 underline">{SUPPORT_EMAIL}</a> for any specific questions.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}
