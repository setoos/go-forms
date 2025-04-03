import { useRouter } from 'next/router';
import Results from '../../components/Results';

export default function ResultsPage() {
  const router = useRouter();
  
  // Check if we have state data
  if (typeof window !== 'undefined' && !router.query.fromQuiz) {
    // If no state data and not from a quiz, redirect to home
    if (!window.history.state?.state) {
      router.replace('/');
      return null;
    }
  }
  
  return <Results isAdmin={false} />;
}