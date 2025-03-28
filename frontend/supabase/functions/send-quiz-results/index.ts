import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Load environment variables
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("❌ Missing required environment variables!");
}

// Initialize services
const resend = new Resend(RESEND_API_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  global: {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  }
});


// CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Change to specific frontend origin for better security
  "Access-Control-Allow-Methods": "OPTIONS, POST",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      console.log("✅ OPTIONS Preflight Handled");
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Allow only POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Only POST requests are allowed" }),
        { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { email, name, score, quiz, pdfBase64, quizId, userId } = body;

    // Validate required fields
    if (!email || !name || score === undefined || !pdfBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send Email
    const { data, error: emailError } = await resend.emails.send({
      from: "Quiz Results <quiz@vidoora.com>",
      to: email,
      subject: `Your ${quiz?.title || "Quiz"} Results`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6b21a8;">Quiz Results</h1>
          <p>Hi ${name},</p>
          <p>Thank you for completing "${quiz?.title || "the quiz"}"!</p>
          <div style="background-color: #f3e8ff; padding: 24px;">
            <h2>Your Score: ${score}%</h2>
          </div>
          <p>This email was sent by Vidoora Quiz System.</p>
        </div>
      `,
      attachments: [{ filename: "quiz-results.pdf", content: pdfBase64 }],
    });

    if (emailError) throw emailError;

    // Store analytics event in Supabase
    if (userId) {
      await supabase.from("analytics_events").insert({
        user_id: userId,
        event_type: "email_sent",
        event_data: { quiz_id: quizId, score },
      });
    }

    // Success Response
    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("❌ API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
