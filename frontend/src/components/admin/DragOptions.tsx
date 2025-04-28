import { useState } from "react";

const DragOptions = ({ isOptionExpanded }: { isOptionExpanded: boolean }) => {
    const fields = [
        { type: "instruction", label: "Instruction" },
        ...(isOptionExpanded
            ? [
                  { type: "is_correct", label: "Is Correct" },
                  { type: "score", label: "Score" },
              ]
            : []),
    ];

    return (
        <div className="p-4 border-r">
            {fields.map((field) => (
                <div
                    key={field.type}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("fieldType", field.type)}
                    className="p-2 mb-2 bg-gray-100 hover:bg-gray-200 cursor-pointer rounded"
                >
                    {field.label}
                </div>
            ))}
        </div>
    );
};

export default DragOptions;
