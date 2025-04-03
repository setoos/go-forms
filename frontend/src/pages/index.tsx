import { GetStaticProps } from 'next';
import Welcome from '../components/Welcome';

export default function HomePage() {
  return <Welcome />;
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
    // Revalidate the page every hour
    revalidate: 3600,
  };
};