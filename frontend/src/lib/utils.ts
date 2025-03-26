import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateScore(answers: Record<number, number>): number {
  return Object.values(answers).reduce((acc, score) => acc + score, 0);
}

export function getScoreResponse(score: number): {
  message: string;
  recommendation: string;
} {
  if (score >= 80) {
    return {
      message: "Excellent! You have a strong marketing awareness.",
      recommendation: "You're ready for advanced marketing strategies!"
    };
  } else if (score >= 50) {
    return {
      message: "Good! You have a fair understanding but can improve.",
      recommendation: "Consider our advanced test to identify specific areas for growth."
    };
  } else if (score >= 20) {
    return {
      message: "Needs improvement! Consider learning more about marketing.",
      recommendation: "Book a consultation with Vidoora to develop your marketing skills."
    };
  } else {
    return {
      message: "You need guidance! Book a consultation with Vidoora.",
      recommendation: "Let us help you build a strong marketing foundation."
    };
  }
}