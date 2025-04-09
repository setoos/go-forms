import { supabase } from './supabase';
import { generatePDF } from './pdf';
import type { QuizResponse } from '../types/quiz';
import { showToast } from './toast';

export async function sendResultsEmail(response: QuizResponse): Promise<boolean> {
  try {
    console.log('Starting email sending process...');
    
    // Generate PDF
    const pdfBlob = await generatePDF(response, true);
    if (!pdfBlob) {
      throw new Error('Failed to generate PDF');
    }

    // Convert blob to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const base64data = reader.result as string;
          resolve(base64data.split(',')[1]); // Remove data URL prefix
        } catch (error) {
          reject(new Error('Failed to process PDF data'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read PDF data'));
      reader.readAsDataURL(pdfBlob);
    });

    // Get quiz details if quiz_id exists
    let quizDetails = null;
    
    if (response.quiz_id && response.quiz_id !== 'preview' && response.quiz_id !== 'sample') {
      try {
        // Get quiz details
        const { data: quiz } = await supabase
          .from('quizzes')
          .select('title, description')
          .eq('id', response.quiz_id)
          .single();
        
        quizDetails = quiz;
      } catch (error) {
        console.error('Error fetching quiz details:', error);
        // Continue with default values if there's an error
      }
    }

    // Get current user
    // const { data: { user } } = await supabase.auth.getUser();

    const data = {
      "to_email": response.email,
      "subject": `Your ${quizDetails?.title || 'Quiz'} Results`,
      "message": `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6b21a8; margin-bottom: 24px;">Quiz Results</h1>
      
      <p style="color: #374151; font-size: 16px;">Hi ${name},</p>
      
      <p style="color: #374151; font-size: 16px;">Thank you for completing "${quizDetails?.title || 'the quiz'}"!</p>
      
      <div style="background-color: #f3e8ff; border-radius: 8px; padding: 24px; margin: 32px 0;">
        <h2 style="color: #6b21a8; margin: 0; font-size: 36px;">Your Score: ${response.score}%</h2>
      </div>
      
      ${quizDetails?.description ? `
        <div style="color: #4b5563; font-size: 16px; margin-bottom: 24px;">
          <h3 style="color: #374151; margin-bottom: 8px;">About this Quiz</h3>
          <p>${quizDetails.description}</p>
        </div>
      ` : ''}
      
      <div style="margin-top: 32px; padding-top: 32px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          This email was sent by Vidoora Quiz System.
          We've attached a detailed report of your results to this email.
        </p>
      </div>
    </div>
      `,
      "filename": "quiz-results.pdf",
      "file_base64": base64
    }

     await fetch('https://strateji-backend.onrender.com/send-quiz-results',{
      method:"POST",
      headers:{
        "content-type": "application/json"
      },
      body: JSON.stringify(data),
    })
    showToast('Results sent to your email!', 'success');

    // Call the Supabase Edge Function to send the email
    // const { data, error } = await supabase.functions.invoke('send-quiz-results', {
    //   body: {
    //     email: response.email,
    //     name: response.name,
    //     score: response.score,
    //     quiz: quizDetails,
    //     pdfBase64: base64,
    //     quizId: response.quiz_id,
    //     userId: user?.id,
    //     customFeedback: response.custom_feedback
    //   }
    // });

    // if (error) {
    //   console.error('Error invoking Edge Function:', error);
    //   throw error;
    // }

    // console.log('Email sent successfully:', data);
    // showToast('Results sent to email', 'success');
    
    return true;
  } catch (error) {
    console.error('Error in sendResultsEmail:', error);
    showToast('Failed to send email. Please try again later.', 'error');
    return false;
  }
}