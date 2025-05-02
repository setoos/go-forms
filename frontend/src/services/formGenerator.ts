import openai from '../lib/openai';
import { Form, Question, FormType, QuestionType, FormTier, EvaluationMode } from '../types/aiTypes';

interface FormPrompt {
  type: FormType;
  tier: FormTier;
  purpose: string;
  details: string;
  evaluationMode: EvaluationMode;
}

export class FormGenerator {
  private static questionTypes: Record<FormTier, QuestionType[]> = {
    capture: ['short-text', 'email', 'phone', 'file-upload'],
    learn: ['short-text', 'long-text', 'multiple-choice', 'rating-scale', 'checkbox', 'likert-scale'],
    engage: ['multiple-choice', 'checkbox', 'short-text', 'voice-input'],
    strategize: ['long-text', 'multiple-choice', 'rating-scale', 'matrix', 'file-upload'],
    convert: ['price', 'quantity', 'unit', 'multiple-choice', 'file-upload']
  };

  static async analyzePrompt(input: string): Promise<FormPrompt> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a form creation assistant. Analyze the user's request and determine:
              1. Most appropriate form type (contact, survey, quiz, assessment, transaction)
              2. Product tier (capture, learn, engage, strategize, convert)
              3. Evaluation mode (none, simple, ai-assisted, weighted, dynamic)
              4. Key purpose and details
              
              Respond with a JSON object containing:
              - type (string)
              - tier (string)
              - evaluationMode (string)
              - purpose (string)
              - details (string)`
          },
          {
            role: "user",
            content: input
          }
        ]
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        return this.fallbackAnalysis(input);
      }

      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        return this.fallbackAnalysis(input);
      }
    } catch (error) {
      console.error('Error analyzing prompt:', error);
      return this.fallbackAnalysis(input);
    }
  }

  private static fallbackAnalysis(input: string): FormPrompt {
    const lowercased = input.toLowerCase();
    let type: FormType = 'contact';
    let tier: FormTier = 'capture';
    let evaluationMode: EvaluationMode = 'none';

    if (lowercased.includes('survey') || lowercased.includes('feedback')) {
      type = 'survey';
      tier = 'learn';
      evaluationMode = 'simple';
    } else if (lowercased.includes('quiz') || lowercased.includes('test')) {
      type = 'quiz';
      tier = 'engage';
      evaluationMode = 'simple';
    } else if (lowercased.includes('assessment') || lowercased.includes('evaluate')) {
      type = 'assessment';
      tier = 'strategize';
      evaluationMode = 'ai-assisted';
    } else if (lowercased.includes('payment') || lowercased.includes('order')) {
      type = 'transaction';
      tier = 'convert';
      evaluationMode = 'dynamic';
    }

    return {
      type,
      tier,
      evaluationMode,
      purpose: input,
      details: input
    };
  }

  static async generateQuestions(prompt: FormPrompt): Promise<Question[]> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Generate appropriate questions for a ${prompt.tier} tier ${prompt.type} form with the following purpose: ${prompt.purpose}. 
            
            Consider these tier-specific requirements:
            - capture: Focus on identity and basic intent
            - learn: Include varied question types for insights
            - engage: Include scoring and feedback mechanisms
            - strategize: Include weighted questions and categories
            - convert: Include pricing and quantity fields
            
            Return a JSON array of questions, where each question has:
            - type (string, matching allowed question types)
            - label (string)
            - required (boolean)
            - options (array, for multiple-choice/checkbox)
            - correct_answer (string/array, optional)
            - ai_prompt (string, optional)
            - max_score (number, optional)
            - weight (number, optional)
            - category (string, optional)
            - price (number, optional)
            - unit (string, optional)
            - order (number)
            - logic (array, optional)`
          }
        ]
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        return this.generateBasicQuestions(prompt);
      }

      try {
        const parsedContent = JSON.parse(content);
        const questions = Array.isArray(parsedContent) ? parsedContent : 
                         Array.isArray(parsedContent?.questions) ? parsedContent.questions : 
                         null;

        if (!questions) {
          console.error('Invalid questions format from OpenAI:', parsedContent);
          return this.generateBasicQuestions(prompt);
        }

        return questions.map((q: any, index: number) => ({
          ...q,
          id: crypto.randomUUID()
        }));
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        return this.generateBasicQuestions(prompt);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      return this.generateBasicQuestions(prompt);
    }
  }

  private static generateBasicQuestions(prompt: FormPrompt): Question[] {
    const questions: Question[] = [];
    
    switch (prompt.tier) {
      case 'capture':
        questions.push(
          {
            id: crypto.randomUUID(),
            type: 'short-text',
            label: 'Full Name',
            required: true,
            order: 1
          },
          {
            id: crypto.randomUUID(),
            type: 'email',
            label: 'Email Address',
            required: true,
            order: 2
          }
        );
        break;

      case 'learn':
        questions.push(
          {
            id: crypto.randomUUID(),
            type: 'rating-scale',
            label: 'How satisfied are you with our service?',
            required: true,
            options: ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'],
            order: 1
          },
          {
            id: crypto.randomUUID(),
            type: 'long-text',
            label: 'What aspects could we improve?',
            required: false,
            order: 2
          }
        );
        break;

      case 'engage':
        questions.push(
          {
            id: crypto.randomUUID(),
            type: 'multiple-choice',
            label: 'Sample Question 1',
            required: true,
            options: ['Option A', 'Option B', 'Option C'],
            correct_answer: 'Option A',
            max_score: 10,
            order: 1
          }
        );
        break;

      case 'strategize':
        questions.push(
          {
            id: crypto.randomUUID(),
            type: 'long-text',
            label: 'Describe your experience with this topic',
            required: true,
            ai_prompt: 'Evaluate response for depth of understanding and practical experience',
            max_score: 10,
            weight: 1.5,
            category: 'Experience',
            order: 1
          }
        );
        break;

      case 'convert':
        questions.push(
          {
            id: crypto.randomUUID(),
            type: 'price',
            label: 'Product Price',
            required: true,
            price: 99.99,
            unit: 'USD',
            order: 1
          },
          {
            id: crypto.randomUUID(),
            type: 'quantity',
            label: 'Quantity',
            required: true,
            min_quantity: 1,
            max_quantity: 10,
            order: 2
          }
        );
        break;
    }

    return questions;
  }

  static async generateForm(input: string): Promise<Form> {
    const prompt = await this.analyzePrompt(input);
    const questions = await this.generateQuestions(prompt);

    const settings = {
      requireIdentity: prompt.tier === 'capture' || prompt.tier === 'convert',
      enableBranching: prompt.tier !== 'capture',
      enableScoring: prompt.tier === 'engage' || prompt.tier === 'strategize',
      enableAI: prompt.evaluationMode === 'ai-assisted',
      enableVoice: true,
      enableWebhooks: true
    };

    return {
      id: crypto.randomUUID(),
      title: await this.generateTitle(prompt),
      description: prompt.details,
      type: prompt.type,
      tier: prompt.tier,
      evaluation_mode: prompt.evaluationMode,
      questions,
      settings,
      analytics: {
        views: 0,
        submissions: 0,
        completionRate: 0
      },
      created_at: new Date(),
      updated_at: new Date(),
      is_template: false,
      sharing_enabled: false
    };
  }

  private static async generateTitle(prompt: FormPrompt): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Generate a concise, professional title for a form based on its purpose, type, and tier."
          },
          {
            role: "user",
            content: `Form type: ${prompt.type}\nTier: ${prompt.tier}\nPurpose: ${prompt.purpose}`
          }
        ]
      });

      return completion.choices[0].message.content || this.generateBasicTitle(prompt);
    } catch (error) {
      console.error('Error generating title:', error);
      return this.generateBasicTitle(prompt);
    }
  }

  private static generateBasicTitle(prompt: FormPrompt): string {
    const type = prompt.type.charAt(0).toUpperCase() + prompt.type.slice(1);
    const tier = prompt.tier.charAt(0).toUpperCase() + prompt.tier.slice(1);
    return `${tier} ${type} - ${new Date().toLocaleDateString()}`;
  }
}