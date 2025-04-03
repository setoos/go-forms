import { GetServerSideProps } from 'next';
import QuizTemplatePreview from '../../../../components/templates/QuizTemplatePreview';
import Breadcrumbs from '../../../../components/Breadcrumbs';
import { supabase } from '../../../../lib/supabase';

export default function TemplatePreviewPage({ template }) {
  return (
    <>
      <Breadcrumbs />
      <QuizTemplatePreview initialTemplate={template} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params, req }) => {
  const id = params?.id as string;
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth',
        permanent: false,
      },
    };
  }
  
  // For this demo, we'll use mock data
  // In a real app, you would fetch the template from the database
  const template = {
    id: 'math-algebra-basics',
    title: 'Algebra Basics Quiz',
    description: 'Fundamental algebra concepts assessment with equation solving and graphing problems',
    category: 'academic',
    subcategory: 'math',
    audienceLevel: 'intermediate',
    duration: 30, // minutes
    questionCount: 15,
    questionTypes: ['multiple_choice', 'fill_blank', 'matching'],
    scoringMethod: 'percentage',
    passingScore: 70,
    certificateEnabled: true,
    analyticsEnabled: true,
    feedbackType: 'immediate',
    tags: ['algebra', 'mathematics', 'equations', 'academic'],
    previewImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070',
    popularity: 4.8,
    usageCount: 1245,
    lastUpdated: '2025-04-15',
    sampleQuestions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        text: 'Solve for x: 2x + 5 = 13',
        options: [
          { id: 'a', text: 'x = 4', isCorrect: true },
          { id: 'b', text: 'x = 6', isCorrect: false },
          { id: 'c', text: 'x = 8', isCorrect: false },
          { id: 'd', text: 'x = 9', isCorrect: false }
        ]
      },
      {
        id: 'q2',
        type: 'fill_blank',
        text: 'The slope of a line can be calculated using the formula m = ______.',
        answer: 'rise/run'
      },
      {
        id: 'q3',
        type: 'matching',
        text: 'Match each equation with its graph type:',
        pairs: [
          { left: 'y = mx + b', right: 'Line' },
          { left: 'y = x²', right: 'Parabola' },
          { left: 'x² + y² = r²', right: 'Circle' }
        ]
      }
    ],
    features: [
      'Automatic scoring and grading',
      'Detailed performance analytics',
      'Customizable passing threshold',
      'Certificate generation',
      'Question randomization',
      'Timed assessment option',
      'Mobile-responsive design'
    ],
    reportingMetrics: [
      'Overall score and pass/fail status',
      'Time spent per question',
      'Question difficulty analysis',
      'Concept mastery breakdown',
      'Comparison to peer performance',
      'Historical performance tracking'
    ]
  };
  
  return {
    props: {
      template
    }
  };
};