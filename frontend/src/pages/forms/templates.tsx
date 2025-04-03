import { GetStaticProps } from 'next';
import InstaFormsLibrary from '../../components/forms/InstaFormsLibrary';

export default function FormsTemplatesPage() {
  return <InstaFormsLibrary />;
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
    revalidate: 3600, // Revalidate every hour
  };
};