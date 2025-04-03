import { GetStaticProps } from 'next';
import QuizTemplateFeatures from '../../components/templates/QuizTemplateFeatures';

export default function TemplateFeaturesPage() {
  return <QuizTemplateFeatures />;
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
    revalidate: 3600, // Revalidate every hour
  };
};