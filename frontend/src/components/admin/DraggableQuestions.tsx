import {
    useSortable,
} from "@dnd-kit/sortable";
import React, { useState } from "react";
import {
    Trash2,
    Copy,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import "react-quill/dist/quill.snow.css";
import type { Quiz, Question, Option } from "../../types/quiz";
import { CSS } from "@dnd-kit/utilities";
import { useTheme } from "../../lib/theme";

const questionTypes = [
    { value: "multiple_choice", label: "Multiple Choice" },
    { value: "true_false", label: "True/False" },
    { value: "fill_blank", label: "Fill in the Blank" },
    { value: "short_answer", label: "Short Answer" },
    { value: "matching", label: "Matching" },
    { value: "ordering", label: "Ordering" },
    { value: "essay", label: "Essay" },
    { value: "picture_based", label: "Picture-Based" },
    { value: "complete_statement", label: "Complete Statement" },
    { value: "definition", label: "Definition" },
];

interface SortableQuestionProps {
    question: Question;
    index: number;
    expandedQuestion: number | null;
    toggleQuestionExpand: (index: number) => void;
    handleDuplicateQuestion: (index: number) => void;
    handleDeleteQuestion: (index: number) => void;
    initialQuiz?: Quiz;
    initialQuestions?: Question[];
    setExpandedQuestion: (index: number | null) => void;
}

export function SortableQuestion({
    question,
    index,
    expandedQuestion,
    toggleQuestionExpand,
    handleDuplicateQuestion,
    handleDeleteQuestion,
    initialQuestions,
}: SortableQuestionProps) {
    
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: question.id });

    const { quizQuestionType } = useTheme();
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };


    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="border border-border rounded-lg overflow-hidden mb-4"
        >
            <div
                className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
                onClick={() => toggleQuestionExpand(index)}
            >
                <div className="flex items-center">
                    <div {...listeners} className="cursor-grab px-2">
                        <svg width="16" height="16" fill="currentColor">
                            <circle cx="4" cy="4" r="1.5" />
                            <circle cx="4" cy="8" r="1.5" />
                            <circle cx="4" cy="12" r="1.5" />
                            <circle cx="8" cy="4" r="1.5" />
                            <circle cx="8" cy="8" r="1.5" />
                            <circle cx="8" cy="12" r="1.5" />
                        </svg>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center mr-3">
                        <span className="text-secondary font-medium">
                            {index + 1}
                        </span>
                    </div>
                    <div>
                        <p className="font-medium text-text">
                            {question.text || "Untitled Question"}
                        </p>
                        <p className="text-xs text-gray-500">
                            {questionTypes.find((t) => t.value === question.type)
                                ?.label && quizQuestionType || "Multiple Choice"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateQuestion(index);
                        }}
                        className="p-1.5 text-gray-500 hover:text-text mr-1"
                        title="Duplicate question"
                    >
                        <Copy className="h-4 w-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuestion(index);
                        }}
                        className="p-1.5 text-red-500 hover:text-red-700 mr-1"
                        title="Delete question"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-gray-500">
                        {expandedQuestion === index ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
