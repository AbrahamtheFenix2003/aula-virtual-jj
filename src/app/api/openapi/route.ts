import { NextResponse } from "next/server";
import { generateOpenAPIDocument } from "@/lib/openapi";
import "@/lib/openapi-paths";

export async function GET() {
  const document = generateOpenAPIDocument();
  
  return NextResponse.json(document, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60",
    },
  });
}
