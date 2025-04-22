import React, { useState } from "react";
import { Question, Option, TrueFalseQuestion, MatchingQuestion, OrderingQuestion, MultipleChoiceQuestion } from "../../types/quiz";
import { processTemplateVariables } from "../../lib/htmlSanitizer";

// Base props for all question types
interface BaseQuestionProps {
  question: Question;
  onAnswer: (score: number, answer: any) => void;
  showFeedback?: boolean;
}

// Multiple Choice Question
export function MultipleChoiceQuestions({
  question,
  onAnswer,
  showFeedback,
}: BaseQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [showOptionFeedback, setShowOptionFeedback] = useState(false);

  const handleOptionSelect = (option: Option) => {
    setSelectedOption(option);
    setShowOptionFeedback(true);
    onAnswer(option.score, { optionId: option.id, feedback: option.feedback });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">{question.instructions}</p>
      <div className="space-y-3">
        {(question as MultipleChoiceQuestion).options?.map((option: Option, index) => (
          <div key={option.id}>
            <button
              onClick={() => handleOptionSelect(option)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${selectedOption?.id === option.id
                ? option.is_correct
                  ? "border-green-500 bg-green-50"
                  : "border-red-500 bg-red-50"
                : "border-gray-200 hover:border-secondary hover:bg-accent"
                }`}
            >
              <div className="flex items-center">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 mr-3">
                  {String.fromCharCode(65 + index)}
                </span>
                <p className="text-lg font-medium text-text">{option.text}</p>
              </div>
            </button>

            {showFeedback &&
              showOptionFeedback &&
              selectedOption?.id === option.id &&
              option.feedback && (
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: processTemplateVariables(option.feedback, {
                        name: "User",
                        email: "user@example.com",
                        score: option.score.toString(),
                        date: new Date().toLocaleDateString(),
                        time: "0:00",
                        quiz_title: "Quiz",
                        performance_category: "N/A",
                      }),
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
export function TrueFalseQuestions({
  question,
  onAnswer,
  showFeedback,
}: BaseQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showOptionFeedback, setShowOptionFeedback] = useState(false);

  const handleSelect = (value: string) => {
    const isTrue = value.toLowerCase() === "true";
    const isCorrect = isTrue === (question.answer_key?.correct_answer === true);

    setSelected(value);
    setShowOptionFeedback(true);

    onAnswer(isCorrect ? question.points : 0, {
      answer: value.toLowerCase(),
      correct: isCorrect,
      question_id: question.id,
      feedback: (question as TrueFalseQuestion).tf_feedback?.[value.toLowerCase() as "true" | "false"] || "",
    });
  };

  const selectedKey = selected?.toLowerCase() as "true" | "false";

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">{question.instructions}</p>
      <div className="grid grid-cols-2 gap-4">
        {["True", "False"].map((value) => {
          const isSelected = selected === value;
          const isTrue = value.toLowerCase() === "true";
          const isCorrect =
            isTrue === (question.answer_key?.correct_answer === true);
          return (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              className={`p-6 text-center rounded-lg border-2 transition-all duration-200 ${
                isSelected
                  ? isCorrect
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                  : "border-gray-200 hover:border-secondary hover:bg-accent"
              }`}
            >
              <span className="text-xl font-semibold text-text">{value}</span>
            </button>
          );
        })}
      </div>

      {showFeedback && showOptionFeedback && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{
              __html: processTemplateVariables(
                (question as TrueFalseQuestion).tf_feedback?.[selectedKey] || "",
                {
                  name: "User",
                  email: "user@example.com",
                  score: selected || "",
                  date: new Date().toLocaleDateString(),
                  time: new Date().toLocaleTimeString(),
                  quiz_title: "Quiz",
                  performance_category: "N/A",
                }
              ),
            }}
          />
        </div>
      )}
    </div>
  );
}


// Fill in the Blank Question
export function FillBlankQuestions({
  question,
  onAnswer,
  showFeedback,
}: BaseQuestionProps) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const answerKey = question.answer_key as {
      correct_answer: string;
      alternative_answers?: string[];
    };

    const normalizedAnswer = answer.trim().toLowerCase();
    const correct =
      normalizedAnswer === answerKey?.correct_answer?.toLowerCase() ||
      answerKey.alternative_answers?.some(
        (alt) => alt.trim().toLowerCase() === normalizedAnswer
      );

    setIsCorrect(correct ? true : false);
    setSubmitted(true);
    onAnswer(correct ? question.points : 0, {
      answer,
      correct,
      question_id: question.id,
      feedback: question.answer_key?.explanation,
    });
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
          disabled={submitted}
        />
        {!submitted && (
          <button
            type="submit"
            className="w-full px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
          >
            Submit Answer
          </button>
        )}
      </form>

      {submitted && showFeedback && question.feedback && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{
              __html: processTemplateVariables(question.feedback, {
                name: "User",
                email: "user@example.com",
                score: isCorrect ? question.points.toString() : "0",
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                quiz_title: "Quiz",
                performance_category: "N/A",
              }),
            }}
          />
        </div>
      )}
    </div>
  );
}

// Short Answer Question
export function ShortAnswerQuestions({
  question,
  onAnswer,
  showFeedback,
}: BaseQuestionProps) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    // For short answer, grading is manual, so score is 0, and we flag it
    onAnswer(0, {
      answer,
      needsGrading: true,
      question_id: question.id,
      feedback: question.feedback,
    });
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
          disabled={submitted}
        />
        {!submitted && (
          <button
            type="submit"
            className="w-full px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
          >
            Submit Answer
          </button>
        )}
      </form>

      {submitted && showFeedback && question.feedback && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{
              __html: processTemplateVariables(question.feedback, {
                name: "User",
                email: "user@example.com",
                score: "Pending",
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                quiz_title: "Quiz",
                performance_category: "Manual Review",
              }),
            }}
          />
        </div>
      )}
    </div>
  );
}

// Matching Question
export function MatchingQuestions({
  question,
  onAnswer,
  showFeedback,
}: BaseQuestionProps) {
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleMatch = (rightItem: string) => {
    if (selectedLeft) {
      setMatches((prev) => ({ ...prev, [selectedLeft]: rightItem }));
      setSelectedLeft(null);
    }
  };

  const handleSubmit = () => {
    let totalScore = 0;
    const totalPairs = (question as MatchingQuestion).matching_pairs?.length || 1;

    const matchResults =
      (question as MatchingQuestion).matching_pairs?.map((pair) => {
        const userMatch = matches[pair.left_item];
        const isCorrect = userMatch === pair.right_item;

        if (isCorrect) {
          totalScore += question.points / totalPairs;
        }

        return {
          left_item: pair.left_item,
          right_item: pair.right_item,
          userMatch,
          isCorrect,
          id: pair.id,
          feedback: pair.feedback || "",
        };
      }) || [];

    setSubmitted(true);
    onAnswer(totalScore, { matches, matchResults });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">{question.instructions}</p>

      <div className="grid grid-cols-2 gap-8">
        {/* Left Side */}
        <div className="space-y-3">
          {(question as MatchingQuestion).matching_pairs?.map((pair) => {
            const isSelected = selectedLeft === pair.left_item;
            return (
              <button
                key={`left-${pair.left_item}`}
                onClick={() => setSelectedLeft(pair.left_item)}
                className={`w-full p-4 rounded-lg border-2 transition-colors ${isSelected
                  ? "border-secondary bg-accent"
                  : "border-gray-200 hover:border-secondary hover:bg-accent"
                  }`}
                disabled={submitted}
              >
                {pair.left_item}
              </button>
            );
          })}
        </div>

        {/* Right Side */}
        <div className="space-y-3">
          {(question as MatchingQuestion).matching_pairs?.map((pair) => (
            <button
              key={`right-${pair.right_item}`}
              onClick={() => handleMatch(pair.right_item)}
              className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-secondary hover:bg-accent transition-colors"
              disabled={submitted}
            >
              {pair.right_item}
            </button>
          ))}
        </div>
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          className="w-full mt-6 px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
        >
          Submit Matches
        </button>
      )}

      {/* Feedback */}
      {submitted && showFeedback && (
        <div className="mt-6 space-y-4">
          {(question as MatchingQuestion).matching_pairs?.map((pair) => {
            const userMatch = matches[pair.left_item] || "No match";
            const isCorrect = userMatch === pair.right_item;

            return (
              <div
                key={`feedback-${pair.left_item}`}
                className={`p-4 border rounded-lg ${isCorrect
                  ? "border-green-500 bg-green-50"
                  : "border-red-500 bg-red-50"
                  }`}
              >
                <p className="font-medium">
                  <strong>{pair.left_item}</strong> →{" "}
                  <strong>{userMatch}</strong>
                </p>

                {pair.feedback?.trim() && (
                  <div
                    className="prose max-w-none mt-2 text-sm"
                    dangerouslySetInnerHTML={{
                      __html: processTemplateVariables(pair.feedback, {
                        name: "User",
                        email: "user@example.com",
                        score: isCorrect
                          ? `${question.points /
                          ((question as MatchingQuestion).matching_pairs?.length || 1)
                          }`
                          : "0",
                        date: new Date().toLocaleDateString(),
                        time: new Date().toLocaleTimeString(),
                        quiz_title: "Quiz",
                        performance_category: isCorrect
                          ? "Correct"
                          : "Incorrect",
                      }),
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Ordering Question
export function OrderingQuestions({
  question,
  onAnswer,
  showFeedback,
}: BaseQuestionProps) {
  const [items, setItems] = useState(
    (question as OrderingQuestion).ordering_items?.sort(() => Math.random() - 0.5) || []
  );
  const [submitted, setSubmitted] = useState(false);

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setItems(newItems);
  };

  const handleSubmit = () => {
    const score = items.reduce((acc, item, index) => {
      return (
        acc +
        (item.correct_position === index + 1
          ? question.points / items.length
          : 0)
      );
    }, 0);
    setSubmitted(true);
    onAnswer(score, {
      order: items.map((item) => item.item),
      result: items.map((item, index) => ({
        id: item.id,
        correct: item.correct_position === index + 1,
        position: index + 1,
        feedback: item.feedback,
      })),
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">{question.instructions}</p>
      <div className="space-y-4">
        {items.map((item, index) => {
          const isCorrect = item.correct_position === index + 1;

          return (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => index > 0 && moveItem(index, index - 1)}
                  className="p-2 text-gray-500 hover:text-text"
                  disabled={index === 0 || submitted}
                >
                  ↑
                </button>
                <button
                  onClick={() =>
                    index < items.length - 1 && moveItem(index, index + 1)
                  }
                  className="p-2 text-gray-500 hover:text-text"
                  disabled={index === items.length - 1 || submitted}
                >
                  ↓
                </button>
                <div
                  className={`flex-1 p-4 rounded-lg border-2 transition-colors ${submitted
                    ? isCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                    : "border-gray-200 bg-background"
                    }`}
                >
                  {item.item}
                </div>
              </div>

              {submitted && showFeedback && item.feedback && (
                <div
                  className="prose max-w-none p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm"
                  dangerouslySetInnerHTML={{
                    __html: processTemplateVariables(item.feedback, {
                      name: "User",
                      email: "user@example.com",
                      score: isCorrect
                        ? `${question.points / items.length}`
                        : "0",
                      date: new Date().toLocaleDateString(),
                      time: new Date().toLocaleTimeString(),
                      quiz_title: "Quiz",
                      performance_category: isCorrect ? "Correct" : "Incorrect",
                    }),
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          className="w-full mt-6 px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
        >
          Submit Order
        </button>
      )}
    </div>
  );
}
// Essay Question
export function EssayQuestions({
  question,
  onAnswer,
  showFeedback,
}: BaseQuestionProps) {
  const [essay, setEssay] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const minWords = 250;

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (countWords(essay) >= minWords) {
      setSubmitted(true);
      onAnswer(0, {
        essay,
        needsGrading: true,
        question_id: question.id,
        feedback: question.feedback,
      });
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
          disabled={submitted}
        />
        <div className="text-sm text-gray-600">
          Words: {countWords(essay)} / {minWords} minimum
        </div>
        {!submitted && (
          <button
            type="submit"
            disabled={countWords(essay) < minWords}
            className="w-full px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary transition-colors disabled:bg-gray-400"
          >
            Submit Essay
          </button>
        )}
      </form>

      {submitted && showFeedback && question.feedback && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{
              __html: processTemplateVariables(question.feedback, {
                name: "User",
                email: "user@example.com",
                score: "Pending",
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                quiz_title: "Quiz",
                performance_category: "Manual Review",
              }),
            }}
          />
        </div>
      )}
    </div>
  );
}
// Picture Based Question
export function PictureBasedQuestions({
  question,
  onAnswer,
  showFeedback,
}: BaseQuestionProps) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    onAnswer(0, {
      answer,
      needsGrading: true,
      question_id: question.id,
      feedback: question.feedback,
    });
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
          disabled={submitted}
        />
        {!submitted && (
          <button
            type="submit"
            className="w-full px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
          >
            Submit Analysis
          </button>
        )}
      </form>

      {submitted && showFeedback && question.feedback && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{
              __html: processTemplateVariables(question.feedback, {
                name: "User",
                email: "user@example.com",
                score: "Pending",
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                quiz_title: "Quiz",
                performance_category: "Manual Review",
              }),
            }}
          />
        </div>
      )}
    </div>
  );
}

// Complete Statement Question

export function CompleteStatementQuestions({
  question,
  onAnswer,
  showFeedback,
}: BaseQuestionProps) {
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const answerKey = question.answer_key as {
    answers: string[];
    scoring: { per_correct: number; partial_credit: boolean };
  };

  const blanks = question.text
    .split("\n")
    .filter((line) => line.includes("____"));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const score = answers.reduce((acc, answer, index) => {
      const isCorrect =
        answer.toLowerCase() === answerKey.answers[index].toLowerCase();
      return acc + (isCorrect ? answerKey.scoring.per_correct : 0);
    }, 0);
    onAnswer(score, {
      answers,
      question_id: question.id,
      feedback: question.feedback,
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">{question.instructions}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {blanks.map((blank, index) => (
          <div key={index} className="flex items-center gap-4">
            <span>{blank.replace("____", "")}</span>
            <input
              type="text"
              value={answers[index] || ""}
              onChange={(e) => {
                const newAnswers = [...answers];
                newAnswers[index] = e.target.value;
                setAnswers(newAnswers);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
              placeholder="Fill in the blank"
              disabled={submitted}
            />
          </div>
        ))}
        {!submitted && (
          <button
            type="submit"
            className="w-full px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
          >
            Submit Answers
          </button>
        )}
      </form>

      {submitted && showFeedback && question.feedback && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{
              __html: processTemplateVariables(question.feedback, {
                name: "User",
                email: "user@example.com",
                score: "Pending",
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                quiz_title: "Quiz",
                performance_category: "Manual Review",
              }),
            }}
          />
        </div>
      )}
    </div>
  );
}

// Definition Question

export function DefinitionQuestions({
  question,
  onAnswer,
  showFeedback,
}: BaseQuestionProps) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    onAnswer(0, {
      answer,
      needsGrading: true,
      question_id: question.id,
      feedback: question.feedback,
    });
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
          disabled={submitted}
        />
        {!submitted && (
          <button
            type="submit"
            className="w-full px-6 py-3 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
          >
            Submit Definition
          </button>
        )}
      </form>

      {submitted && showFeedback && question.feedback && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{
              __html: processTemplateVariables(question.feedback, {
                name: "User",
                email: "user@example.com",
                score: "Pending",
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                quiz_title: "Quiz",
                performance_category: "Manual Review",
              }),
            }}
          />
        </div>
      )}
    </div>
  );
}

// Question Factory Component
export function QuestionComponent({
  question,
  onAnswer,
  showFeedback,
}: BaseQuestionProps) {
  switch (question.type) {
    case "multiple_choice":
      return (
        <MultipleChoiceQuestions
          question={question}
          onAnswer={onAnswer}
          showFeedback={showFeedback}
        />
      );
    case "true_false":
      return <TrueFalseQuestions question={question} onAnswer={onAnswer} />;
    case "fill_blank":
      return <FillBlankQuestions question={question} onAnswer={onAnswer} />;
    case "short_answer":
      return <ShortAnswerQuestions question={question} onAnswer={onAnswer} />;
    case "matching":
      return <MatchingQuestions question={question} onAnswer={onAnswer} />;
    case "ordering":
      return <OrderingQuestions question={question} onAnswer={onAnswer} />;
    case "essay":
      return <EssayQuestions question={question} onAnswer={onAnswer} />;
    case "picture_based":
      return <PictureBasedQuestions question={question} onAnswer={onAnswer} />;
    case "complete_statement":
      return (
        <CompleteStatementQuestions question={question} onAnswer={onAnswer} />
      );
    case "definition":
      return <DefinitionQuestions question={question} onAnswer={onAnswer} />;
    default:
      return <div>Unsupported question type</div>;
  }
}
