import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, name, score, quiz, pdfBase64, quizId, userId, customFeedback } = await req.json();

    // Validate required fields
    if (!email || !name || score === undefined) {
      throw new Error('Missing required fields');
    }

    // Get performance category based on score
    const getPerformanceCategory = (score: number) => {
      if (score >= 90) return 'Excellent';
      if (score >= 80) return 'Very Good';
      if (score >= 70) return 'Good';
      if (score >= 60) return 'Satisfactory';
      return 'Needs Improvement';
    };

    // Process custom feedback if available
    let emailBody = '';
    
    if (customFeedback) {
      // Clean up HTML for email
      emailBody = customFeedback
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    } else {
      // Default email content
      emailBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6b21a8; margin-bottom: 16px;">Performance Summary</h2>
          <p>Thank you for completing the assessment. Your score of ${score}% places you in the ${getPerformanceCategory(score)} category.</p>
          
          <h3 style="color: #6b21a8; margin-top: 24px; margin-bottom: 12px;">Key Takeaways</h3>
          <p>We've analyzed your responses and prepared a detailed report with personalized recommendations. Please review the attached PDF for a comprehensive breakdown of your performance.</p>
          
          <div style="margin-top: 24px; padding: 16px; background-color: #f3e8ff; border-radius: 8px;">
            <p style="margin: 0; font-weight: bold;">Next Steps</p>
            <p style="margin-top: 8px; margin-bottom: 0;">Review your detailed report and consider focusing on the areas where you scored lower. We recommend revisiting the material and taking the assessment again in a few weeks to track your progress.</p>
          </div>
        </div>
      `;
    }

    // Log email sent event
    if (userId) {
      try {
        await supabase.from('analytics_events').insert({
          user_id: userId,
          event_type: 'email_sent',
          event_data: {
            quiz_id: quizId,
            score: score
          }
        });
      } catch (logError) {
        console.error('Error logging email event:', logError);
        // Continue even if logging fails
      }
    }

    // Since we can't actually send emails in this environment, we'll simulate success
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email would be sent in production environment"
      }),
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
        success: false,
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