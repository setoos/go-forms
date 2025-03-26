import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Load environment variables
const RESEND_API_KEY = "re_32pSNL82_PzUTFSi8jr7GhTUdSvdpvM13";
const SUPABASE_URL = "https://ybxnslxyxxpeyhbpecwc.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieG5zbHh5eHhwZXloYnBlY3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjYzNzM1MywiZXhwIjoyMDU4MjEzMzUzfQ.0qGHvZc3voWw7YQj_10tbwvhcjlpaTK2Yr8tK2jcyEI";

// Debugging logs (ensure environment variables are loaded correctly)
console.log("✅ SUPABASE_URL:", SUPABASE_URL);
console.log("✅ RESEND_API_KEY is set:", !!RESEND_API_KEY);

// Validate required env variables
if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("❌ Missing required environment variables!");
}

// Initialize services
const resend = new Resend(RESEND_API_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Start Deno server
Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  // Handle CORS preflight requests
// Handle CORS preflight requests properly
if (req.method === "OPTIONS") {
  console.log("✅ OPTIONS preflight request handled");
  return new Response("OK", { status: 200, headers: corsHeaders });
}

  

  // Log the request method
  console.log("🚀 Received request method:", req.method);

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Only POST requests are allowed",
      }),
      {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ success: false, error: "Invalid or missing JSON body" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  const { email, name, score, quiz, pdfBase64, quizId, userId } = body;

  if (!email || !name || score === undefined || !pdfBase64) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing required fields" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  try {
    // Send email with PDF attachment
    const { data, error: emailError } = await resend.emails.send({
      from: "Quiz Results <quiz@vidoora.com>",
      to: email,
      subject: `Your ${quiz?.title || "Quiz"} Results`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6b21a8; margin-bottom: 24px;">Quiz Results</h1>
          <p style="color: #374151; font-size: 16px;">Hi ${name},</p>
          <p style="color: #374151; font-size: 16px;">Thank you for completing "${
            quiz?.title || "the quiz"
          }"!</p>
          <div style="background-color: #f3e8ff; border-radius: 8px; padding: 24px; margin: 32px 0;">
            <h2 style="color: #6b21a8; margin: 0; font-size: 36px;">Your Score: ${score}%</h2>
          </div>
          ${
            quiz?.description
              ? `
            <div style="color: #4b5563; font-size: 16px; margin-bottom: 24px;">
              <h3 style="color: #374151; margin-bottom: 8px;">About this Quiz</h3>
              <p>${quiz.description}</p>
            </div>
          `
              : ""
          }
          <div style="margin-top: 32px; padding-top: 32px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This email was sent by Vidoora Quiz System.
              We've attached a detailed report of your results to this email.
            </p>
          </div>
        </div>
      `,
      attachments: [{ filename: "quiz-results.pdf", content: pdfBase64 }],
    });

    if (emailError) throw emailError;

    // Log email sent event
    if (userId) {
      await supabase.from("analytics_events").insert({
        user_id: userId,
        event_type: "email_sent",
        event_data: { quiz_id: quizId, score },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error) {
    console.error("❌ Error sending email:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send email";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
