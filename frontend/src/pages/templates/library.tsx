import { GetStaticProps } from 'next';
import QuizTemplateLibrary from '../../components/templates/QuizTemplateLibrary';

export default function TemplatesLibraryPage() {
  return <QuizTemplateLibrary />;
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
    revalidate: 3600, // Revalidate every hour
  };
};