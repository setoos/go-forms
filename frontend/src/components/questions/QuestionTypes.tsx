import React, { useState } from 'react';
import { Question, Option } from '../../types/quiz';
import { processTemplateVariables } from '../../lib/htmlSanitizer';

// Base props for all question types
interface BaseQuestionProps {
  question: Question;
  onAnswer: (score: number, answer: any) => void;
  showFeedback?: boolean;
}

// Multiple Choice Question
export function MultipleChoiceQuestion({ question, onAnswer, showFeedback }: BaseQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [showOptionFeedback, setShowOptionFeedback] = useState(false);

  const handleOptionSelect = (option: Option) => {
    setSelectedOption(option);
    setShowOptionFeedback(true);
    onAnswer(option.score, { optionId: option.id, correct: option.is_correct });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">{question.instructions}</p>
      <div className="space-y-3">
        {question.options?.map((option: Option, index) => (
          <div key={option.id}>
            <button
              onClick={() => handleOptionSelect(option)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedOption?.id === option.id
                  ? option.is_correct
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-secondary hover:bg-accent'
              }`}
            >
              <div className="flex items-center">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 mr-3">
                  {String.fromCharCode(65 + index)}
                </span>
                <p className="text-lg font-medium text-text">{option.text}</p>
              </div>
            </button>
            
            {showFeedback && showOptionFeedback && selectedOption?.id === option.id && option.feedback && (
              <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: processTemplateVariables(option.feedback, {
                      name: 'User',
                      email: 'user@example.com',
                      score: option.score.toString(),
                      date: new Date().toLocaleDateString(),
                      time: '0:00',
                      quiz_title: 'Quiz',
                      performance_category: 'N/A'
                    })
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// True/False Question
export function TrueFalseQuestion({ question, onAnswer }: BaseQuestionProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">{question.instructions}</p>
      <div className="grid grid-cols-2 gap-4">
        {['True', 'False'].map((value) => (
          <button
            key={value}
            onClick={() => {
              const isCorrect = (value.toLowerCase() === 'true') === 
                (question.answer_key?.correct_answer === true);
              onAnswer(isCorrect ? question.points : 0, { answer: value.toLowerCase(), correct: isCorrect });
            }}
            className="p-6 text-center rounded-lg border-2 border-gray-200 hover:border-secondary hover:bg-accent transition-all duration-200"
          >
            <span className="text-xl font-semibold text-text">{value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Fill in the Blank Question
export function FillBlankQuestion({ question, onAnswer }: BaseQuestionProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const answerKey = question.answer_key as { correct_answer: string; alternative_answers?: string[] };
    const isCorrect = answer.toLowerCase() === answerKey.correct_answer.toLowerCase() ||
      answerKey.alternative_answers?.some(alt => alt.toLowerCase() === answer.toLowerCase());
    onAnswer(isCorrect ? question.points : 0, { answer, correct: isCorrect });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">{question.instructions}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
          placeholder="Type your answer here"
        />
        <button
          type="submit"
          className="w-full px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
        >
          Submit Answer
        </button>
      </form>
    </div>
  );
}

// Short Answer Question
export function ShortAnswerQuestion({ question, onAnswer }: BaseQuestionProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For short answer, we'll need manual grading
    onAnswer(0, { answer, needsGrading: true });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">{question.instructions}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
          rows={4}
          placeholder="Type your answer here"
        />
        <button
          type="submit"
          className="w-full px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
        >
          Submit Answer
        </button>
      </form>
    </div>
  );
}

// Matching Question
export function MatchingQuestion({ question, onAnswer }: BaseQuestionProps) {
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const handleMatch = (rightItem: string) => {
    if (selectedLeft) {
      setMatches(prev => ({ ...prev, [selectedLeft]: rightItem }));
      setSelectedLeft(null);
    }
  };

  const handleSubmit = () => {
    const score = Object.entries(matches).reduce((acc, [left, right]) => {
      const isCorrect = question.matching_pairs?.some(
        pair => pair.left_item === left && pair.right_item === right
      );
      return acc + (isCorrect ? question.points / Object.keys(matches).length : 0);
    }, 0);
    onAnswer(score, { matches });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">{question.instructions}</p>
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-3">
          {question.matching_pairs?.map(pair => {
            const buttonClasses = [
              "w-full p-4 rounded-lg border-2 transition-colors",
              selectedLeft === pair.left_item
                ? "border-secondary bg-accent"
                : "border-gray-200 hover:border-secondary hover:bg-accent"
            ].join(" ");

            return (
              <button
                key={pair.left_item}
                onClick={() => setSelectedLeft(pair.left_item)}
                className={buttonClasses}
              >
                {pair.left_item}
              </button>
            );
          })}
        </div>
        <div className="space-y-3">
          {question.matching_pairs?.map(pair => (
            <button
              key={pair.right_item}
              onClick={() => handleMatch(pair.right_item)}
              className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-secondary hover:bg-accent transition-colors"
            >
              {pair.right_item}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={handleSubmit}
        className="w-full mt-6 px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
      >
        Submit Matches
      </button>
    </div>
  );
}

// Ordering Question
export function OrderingQuestion({ question, onAnswer }: BaseQuestionProps) {
  const [items, setItems] = useState(
    question.ordering_items?.sort(() => Math.random() - 0.5) || []
  );

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setItems(newItems);
  };

  const handleSubmit = () => {
    const score = items.reduce((acc, item, index) => {
      return acc + (item.correct_position === index + 1 ? question.points / items.length : 0);
    }, 0);
    onAnswer(score, { order: items.map(item => item.item) });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">{question.instructions}</p>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-2"
          >
            <button
              onClick={() => index > 0 && moveItem(index, index - 1)}
              className="p-2 text-gray-500 hover:text-text"
              disabled={index === 0}
            >
              ↑
            </button>
            <button
              onClick={() => index < items.length - 1 && moveItem(index, index + 1)}
              className="p-2 text-gray-500 hover:text-text"
              disabled={index === items.length - 1}
            >
              ↓
            </button>
            <div className="flex-1 p-4 bg-background rounded-lg border-2 border-gray-200">
              {item.item}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        className="w-full mt-6 px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
      >
        Submit Order
      </button>
    </div>
  );
}

// Essay Question
export function EssayQuestion({ question, onAnswer }: BaseQuestionProps) {
  const [essay, setEssay] = useState('');
  const minWords = 250;

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).length;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (countWords(essay) >= minWords) {
      onAnswer(0, { essay, needsGrading: true });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">{question.instructions}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={essay}
          onChange={(e) => setEssay(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
          rows={10}
          placeholder="Write your essay here (minimum 250 words)"
        />
        <div className="text-sm text-gray-600">
          Words: {countWords(essay)} / {minWords} minimum
        </div>
        <button
          type="submit"
          disabled={countWords(essay) < minWords}
          className="w-full px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary transition-colors disabled:bg-gray-400"
        >
          Submit Essay
        </button>
      </form>
    </div>
  );
}

// Picture Based Question
export function PictureBasedQuestion({ question, onAnswer }: BaseQuestionProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnswer(0, { answer, needsGrading: true });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">{question.instructions}</p>
      {question.media_url && (
        <img
          src={question.media_url}
          alt="Question"
          className="w-full rounded-lg mb-4"
        />
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
          rows={6}
          placeholder="Analyze the image and provide your answer"
        />
        <button
          type="submit"
          className="w-full px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
        >
          Submit Analysis
        </button>
      </form>
    </div>
  );
}

// Complete Statement Question
export function CompleteStatementQuestion({ question, onAnswer }: BaseQuestionProps) {
  const [answers, setAnswers] = useState<string[]>([]);
  const answerKey = question.answer_key as { answers: string[]; scoring: { per_correct: number; partial_credit: boolean } };
  const blanks = question.text.split('\n').filter(line => line.includes('____'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const score = answers.reduce((acc, answer, index) => {
      const isCorrect = answer.toLowerCase() === answerKey.answers[index].toLowerCase();
      return acc + (isCorrect ? answerKey.scoring.per_correct : 0);
    }, 0);
    onAnswer(score, { answers });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">{question.instructions}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {blanks.map((blank, index) => (
          <div key={index} className="flex items-center gap-4">
            <span>{blank.replace('____', '')}</span>
            <input
              type="text"
              value={answers[index] || ''}
              onChange={(e) => {
                const newAnswers = [...answers];
                newAnswers[index] = e.target.value;
                setAnswers(newAnswers);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
              placeholder="Fill in the blank"
            />
          </div>
        ))}
        <button
          type="submit"
          className="w-full px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
        >
          Submit Answers
        </button>
      </form>
    </div>
  );
}

// Definition Question
export function DefinitionQuestion({ question, onAnswer }: BaseQuestionProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnswer(0, { answer, needsGrading: true });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">{question.instructions}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
          rows={6}
          placeholder="Write your definition and explanation"
        />
        <button
          type="submit"
          className="w-full px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
        >
          Submit Definition
        </button>
      </form>
    </div>
  );
}

// Question Factory Component
export function QuestionComponent({ question, onAnswer, showFeedback }: BaseQuestionProps) {
  switch (question.type) {
    case 'multiple_choice':
      return <MultipleChoiceQuestion question={question} onAnswer={onAnswer} showFeedback={showFeedback} />;
    case 'true_false':
      return <TrueFalseQuestion question={question} onAnswer={onAnswer} />;
    case 'fill_blank':
      return <FillBlankQuestion question={question} onAnswer={onAnswer} />;
    case 'short_answer':
      return <ShortAnswerQuestion question={question} onAnswer={onAnswer} />;
    case 'matching':
      return <MatchingQuestion question={question} onAnswer={onAnswer} />;
    case 'ordering':
      return <OrderingQuestion question={question} onAnswer={onAnswer} />;
    case 'essay':
      return <EssayQuestion question={question} onAnswer={onAnswer} />;
    case 'picture_based':
      return <PictureBasedQuestion question={question} onAnswer={onAnswer} />;
    case 'complete_statement':
      return <CompleteStatementQuestion question={question} onAnswer={onAnswer} />;
    case 'definition':
      return <DefinitionQuestion question={question} onAnswer={onAnswer} />;
    default:
      return <div>Unsupported question type</div>;
  }
}