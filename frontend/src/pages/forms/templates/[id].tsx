import { GetStaticProps, GetStaticPaths } from 'next';
import FormTemplateDetails from '../../../components/forms/FormTemplateDetails';

export default function FormTemplateDetailsPage({ templateId }) {
  return <FormTemplateDetails templateId={templateId} />;
}

export const getStaticPaths: GetStaticPaths = async () => {
  // For demo purposes, we'll pre-render a few template IDs
  const templateIds = ['lm-newsletter-1', 'hr-performance-1', 'ac-multiple-1', 'cert-completion-1'];
  
  const paths = templateIds.map(id => ({
    params: { id }
  }));
  
  return {
    paths,
    fallback: 'blocking' // Show a loading state for paths not generated at build time
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const templateId = params?.id as string;
  
  return {
    props: {
      templateId
    },
    revalidate: 3600 // Revalidate every hour
  };
};