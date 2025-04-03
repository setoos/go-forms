import { useRouter } from 'next/router';
import ResultsSuccess from '../../components/ResultsSuccess';

export default function ResultsSuccessPage() {
  const router = useRouter();
  const { action } = router.query;
  
  // Check if we have state data
  if (typeof window !== 'undefined' && !router.query.fromQuiz) {
    // If no state data and not from a quiz, redirect to home
    if (!window.history.state?.state) {
      router.replace('/');
      return null;
    }
  }
  
  return <ResultsSuccess action={action as 'save' | 'email'} />;
}