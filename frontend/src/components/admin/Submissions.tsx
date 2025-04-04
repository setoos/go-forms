import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Eye, FileText } from "lucide-react";
import { useTheme } from "../../lib/theme.tsx";

const QuizSubmissions = () => {
  const {
    quizzes,
    loading,
    selectedQuiz,
    setSelectedQuiz,
    quizSubmissions,
    error
  } = useTheme();

  useEffect(() => {
    if (quizzes.length > 0 && !selectedQuiz) {
      setSelectedQuiz(quizzes[0].id);
    }
  }, [quizzes]);

  console.log("quizSubmissions", quizSubmissions);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text mb-2">
          Failed to load quiz responses
        </h3>
        <p className="text-gray-500 mb-4">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="my-4">
        <label
          htmlFor="quiz-select"
          className="text-sm font-medium text-gray-600"
        >
          Select Quiz:
        </label>
        <select
          id="quiz-select"
          value={selectedQuiz}
          onChange={(e) => setSelectedQuiz(e.target.value)}
          className="ml-4 border rounded-md h-9 w-32"
        >
          {quizzes.map((quiz) => (
            <option key={quiz.id} value={quiz.id}>
              {quiz.title}
            </option>
          ))}
        </select>
      </div>
      {quizSubmissions.length === 0 ? (
        <div className="text-center py-16 bg-background rounded-lg shadow-md">
          <FileText className="h-16 w-16 text-secondary mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-text mb-3">
            No Responses yet
          </h3>
        </div>
      ) : (
        <div className="bg-background shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  View Response
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-gray-200">
              {quizSubmissions.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {quiz.name && (
                      <div className="text-sm text-gray-500">{quiz.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {quiz.email && (
                      <div className="text-sm text-gray-500">{quiz.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {quiz.phone && (
                      <div className="text-sm text-gray-500">{quiz.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {quiz.score && (
                      <div className="text-sm text-gray-500">{quiz.score}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/quiz/${quiz.quiz_id}`}
                      className="inline-flex justify-center items-center p-1 text-purple-600 hover:text-purple-900 transition-colors"
                      title="Preview Quiz result"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default QuizSubmissions;
