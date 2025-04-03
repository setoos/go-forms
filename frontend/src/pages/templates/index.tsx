import { GetStaticProps } from 'next';
import QuizTemplateHome from '../../components/templates/QuizTemplateHome';

export default function TemplatesHomePage() {
  return <QuizTemplateHome />;
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
    revalidate: 3600, // Revalidate every hour
  };
};