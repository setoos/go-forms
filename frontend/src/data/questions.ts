import { Question } from '../types/quiz';

export const questions: Question[] = [
  {
    id: '1',
    text: 'What is your primary method for measuring marketing success?',
    type: 'multiple_choice',
    order: 0,
    points: 10,
    cognitive_level: 'understanding',
    difficulty_level: 'medium',
    required: true,
    created_at: new Date().toISOString(),
    options: [
      {
        id: '1-1',
        text: 'Comprehensive analytics tracking ROI, conversion rates, and customer lifetime value',
        score: 10,
        feedback: 'Excellent! Using multiple metrics provides a complete view of marketing performance.',
        order: 0,
        is_correct: true,
        question_id: '1'
      },
      {
        id: '1-2',
        text: 'Regular tracking of sales and website traffic',
        score: 7,
        feedback: 'Good start! Consider expanding your metrics to include more detailed customer insights.',
        order: 1,
        is_correct: false,
        question_id: '1'
      },
      {
        id: '1-3',
        text: 'Basic social media engagement metrics',
        score: 4,
        feedback: 'While social metrics are important, a broader approach would be more effective.',
        order: 2,
        is_correct: false,
        question_id: '1'
      },
      {
        id: '1-4',
        text: 'No specific measurement method',
        score: 0,
        feedback: 'Implementing a measurement strategy is crucial for marketing success.',
        order: 3,
        is_correct: false,
        question_id: '1'
      }
    ]
  },
  {
    id: '2',
    text: 'A high bounce rate always indicates poor website performance.',
    type: 'true_false',
    order: 1,
    points: 5,
    cognitive_level: 'analysis',
    difficulty_level: 'easy',
    required: true,
    created_at: new Date().toISOString(),
    answer_key: {
      correct_answer: false,
      explanation: 'A high bounce rate may be normal for certain types of pages or content, such as blog posts or contact pages.'
    }
  },
  {
    id: '3',
    text: 'The process of gradually nurturing potential customers through the sales funnel is called ________ marketing.',
    type: 'fill_blank',
    order: 2,
    points: 8,
    cognitive_level: 'recall',
    difficulty_level: 'medium',
    required: true,
    created_at: new Date().toISOString(),
    answer_key: {
      correct_answer: 'drip',
      alternative_answers: ['nurture', 'lead nurturing']
    }
  },
  {
    id: '4',
    text: 'Match the following marketing terms with their definitions.',
    type: 'matching',
    order: 3,
    points: 15,
    cognitive_level: 'understanding',
    difficulty_level: 'medium',
    required: true,
    created_at: new Date().toISOString(),
    matching_pairs: [
      {
        id: '4-1',
        question_id: '4',
        left_item: 'ROI',
        right_item: 'Return on Investment',
        order: 0,
        created_at: new Date().toISOString()
      },
      {
        id: '4-2',
        question_id: '4',
        left_item: 'CTA',
        right_item: 'Call to Action',
        order: 1,
        created_at: new Date().toISOString()
      },
      {
        id: '4-3',
        question_id: '4',
        left_item: 'SEO',
        right_item: 'Search Engine Optimization',
        order: 2,
        created_at: new Date().toISOString()
      }
    ]
  },
  {
    id: '5',
    text: 'Arrange the following steps of the customer journey in the correct order.',
    type: 'ordering',
    order: 4,
    points: 12,
    cognitive_level: 'analysis',
    difficulty_level: 'hard',
    required: true,
    created_at: new Date().toISOString(),
    ordering_items: [
      {
        id: '5-1',
        question_id: '5',
        item: 'Awareness',
        correct_position: 1,
        order: 0,
        created_at: new Date().toISOString()
      },
      {
        id: '5-2',
        question_id: '5',
        item: 'Consideration',
        correct_position: 2,
        order: 1,
        created_at: new Date().toISOString()
      },
      {
        id: '5-3',
        question_id: '5',
        item: 'Decision',
        correct_position: 3,
        order: 2,
        created_at: new Date().toISOString()
      },
      {
        id: '5-4',
        question_id: '5',
        item: 'Retention',
        correct_position: 4,
        order: 3,
        created_at: new Date().toISOString()
      }
    ]
  },
  {
    id: '6',
    text: 'Analyze the effectiveness of this marketing campaign image.',
    type: 'picture_based',
    order: 5,
    points: 15,
    cognitive_level: 'analysis',
    difficulty_level: 'medium',
    required: true,
    created_at: new Date().toISOString(),
    media_url: 'https://images.unsplash.com/photo-1432888622747-4eb9a8f1fafd?q=80&w=1744',
    instructions: 'Examine the image and identify the key marketing elements used. Consider the target audience, messaging, and visual hierarchy.'
  },
  {
    id: '7',
    text: 'Develop a comprehensive social media strategy for a new fitness app.',
    type: 'essay',
    order: 6,
    points: 20,
    cognitive_level: 'analysis',
    difficulty_level: 'hard',
    required: true,
    created_at: new Date().toISOString(),
    instructions: 'Include target audience analysis, platform selection, content strategy, and success metrics. Minimum 250 words.',
    essay_rubrics: [
      {
        id: '7-1',
        question_id: '7',
        criteria: 'Strategy Comprehensiveness',
        description: 'Includes all required components',
        max_points: 5,
        created_at: new Date().toISOString()
      },
      {
        id: '7-2',
        question_id: '7',
        criteria: 'Target Audience Analysis',
        description: 'Clear understanding of audience needs',
        max_points: 5,
        created_at: new Date().toISOString()
      },
      {
        id: '7-3',
        question_id: '7',
        criteria: 'Implementation Plan',
        description: 'Actionable and realistic plan',
        max_points: 5,
        created_at: new Date().toISOString()
      },
      {
        id: '7-4',
        question_id: '7',
        criteria: 'Success Metrics',
        description: 'Clear and measurable KPIs',
        max_points: 5,
        created_at: new Date().toISOString()
      }
    ]
  },
  {
    id: '8',
    text: 'A successful value proposition should be:\n1. ____\n2. ____\n3. ____',
    type: 'complete_statement',
    order: 7,
    points: 15,
    cognitive_level: 'understanding',
    difficulty_level: 'medium',
    required: true,
    created_at: new Date().toISOString(),
    answer_key: {
      answers: [
        'unique and distinctive',
        'clear and specific',
        'valuable to customers'
      ],
      scoring: {
        per_correct: 5,
        partial_credit: true
      }
    }
  },
  {
    id: '9',
    text: 'Define "customer lifetime value" (CLV) and explain its importance in marketing.',
    type: 'definition',
    order: 8,
    points: 10,
    cognitive_level: 'understanding',
    difficulty_level: 'medium',
    required: true,
    created_at: new Date().toISOString(),
    rubric: {
      key_components: [
        'Accurate definition',
        'Explanation of importance',
        'Business context'
      ],
      scoring: {
        definition: 4,
        importance: 4,
        context: 2
      }
    }
  },
  {
    id: '10',
    text: 'Explain your content marketing strategy and its goals.',
    type: 'short_answer',
    order: 9,
    points: 10,
    cognitive_level: 'application',
    difficulty_level: 'medium',
    required: true,
    created_at: new Date().toISOString(),
    instructions: 'Provide a brief explanation of your content marketing strategy and its primary objectives. Include specific examples.',
    rubric: {
      criteria: [
        'Strategy clarity',
        'Goal alignment',
        'Example quality'
      ],
      scoring: {
        clarity: 4,
        alignment: 3,
        examples: 3
      }
    }
  }
];