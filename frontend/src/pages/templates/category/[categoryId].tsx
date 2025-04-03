import { GetStaticProps, GetStaticPaths } from 'next';
import QuizTemplateCategoryPage from '../../../components/templates/QuizTemplateCategoryPage';

export default function TemplateCategoryPage({ categoryId }) {
  return <QuizTemplateCategoryPage categoryId={categoryId} />;
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Define the categories we want to pre-render
  const categories = ['academic', 'professional', 'compliance', 'employee'];
  
  const paths = categories.map(category => ({
    params: { categoryId: category }
  }));
  
  return {
    paths,
    fallback: 'blocking' // Show a loading state for paths not generated at build time
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const categoryId = params?.categoryId as string;
  
  // Validate category
  const validCategories = ['academic', 'professional', 'compliance', 'employee'];
  if (!validCategories.includes(categoryId)) {
    return {
      notFound: true
    };
  }
  
  return {
    props: {
      categoryId
    },
    revalidate: 3600 // Revalidate every hour
  };
};