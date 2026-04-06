import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

interface HelpModalProps {
    open: boolean;
    onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ open, onClose }) => {
    const [markdown, setMarkdown] = useState("");

    useEffect(() => {
        if (open) {
            fetch("/README.md")
                .then((res) => res.text())
                .then((text) => setMarkdown(text));
        }
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-4xl h-[80vh] overflow-y-auto relative">
                <button
                    className="absolute top-2 right-2 text-2xl font-bold text-gray-600 hover:text-red-500"
                    onClick={onClose}
                >
                    ×
                </button>
                <h2 className="text-xl font-bold mb-4">ヘルプ</h2>
                <div className="prose max-w-none [&_img]:w-1/2 [&_img]:mx-auto">
                    <ReactMarkdown>{markdown}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
