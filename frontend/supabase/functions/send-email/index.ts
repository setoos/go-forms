import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { Resend } from 'https://esm.sh/resend@2.1.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, name, score, pdfBase64 } = await req.json();

    // Validate required fields
    if (!email || !name || score === undefined || !pdfBase64) {
      throw new Error('Missing required fields');
    }

    // Send email with PDF attachment
    const { error: emailError } = await resend.emails.send({
      from: 'Quiz Results <quiz@goforms.com>',
      to: email,
      subject: 'Your Quiz Results',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6b21a8; margin-bottom: 24px;">Quiz Results</h1>
          
          <p style="color: #374151; font-size: 16px;">Hi ${name},</p>
          
          <p style="color: #374151; font-size: 16px;">Thank you for completing the quiz!</p>
          
          <div style="background-color: #f3e8ff; border-radius: 8px; padding: 24px; margin: 32px 0;">
            <h2 style="color: #6b21a8; margin: 0; font-size: 36px;">Your Score: ${score}%</h2>
          </div>
          
          <div style="margin-top: 32px; padding-top: 32px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This email was sent by GoForms Quiz System.
              We've attached a detailed report of your results to this email.
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: 'quiz-results.pdf',
          content: pdfBase64,
          encoding: 'base64'
        }
      ]
    });

    if (emailError) throw emailError;

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to send email'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});