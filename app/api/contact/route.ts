// app/api/contact/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";           // ensure Node runtime (not Edge)
export const dynamic = "force-dynamic";    // avoid static optimization

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { name, email, topic, message, storeDomain } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: "Missing name, email, or message." },
        { status: 400 }
      );
    }

    const subject = `[${topic || "General"}] Contact from ${name}`;
    const text = [
      `Name: ${name}`,
      `Email: ${email}`,
      storeDomain ? `Store: ${storeDomain}` : undefined,
      `Topic: ${topic || "General"}`,
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    // send via Resend
    const result = await resend.emails.send({
      from: "support@pulseboard.live", // must be a verified sender/domain in Resend
      to: ["malikx029squaddie@gmail.com", "uzaair.maalik@gmail.com"],
      replyTo: email,                   // so you can reply directly to the user
      subject,
      text,
    });

    return NextResponse.json({ success: true, id: (result as any)?.id ?? null });
  } catch (err: any) {
    console.error("contact POST error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Send failed" },
      { status: 500 }
    );
  }
}

// Optional: quick sanity check in the browser
export async function GET() {
  return NextResponse.json({ ok: true });
}
