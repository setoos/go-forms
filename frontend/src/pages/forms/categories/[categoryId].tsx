import { GetStaticProps, GetStaticPaths } from 'next';
import FormCategoryPage from '../../../components/forms/FormCategoryPage';

export default function FormCategoryPage({ categoryId }) {
  return <FormCategoryPage categoryId={categoryId} />;
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Define the categories we want to pre-render
  const categories = ['lead-magnet', 'hr', 'academic', 'certificate'];
  
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
  const validCategories = ['lead-magnet', 'hr', 'academic', 'certificate'];
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