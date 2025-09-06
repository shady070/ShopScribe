import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const token = req.headers.get("authorization") || "";

  const res = await fetch("http://localhost:3001/stores", {
    headers: { Authorization: token },
  });

  const data = await res.json();
  return NextResponse.json(data);
}
