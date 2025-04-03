import { GetStaticProps } from 'next';
import InstaFormsHome from '../../components/forms/InstaFormsHome';

export default function FormsHomePage() {
  return <InstaFormsHome />;
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
    revalidate: 3600, // Revalidate every hour
  };
};