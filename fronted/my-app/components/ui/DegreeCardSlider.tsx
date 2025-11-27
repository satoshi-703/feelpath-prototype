"use client";
import { useState } from "react";

interface Card {
    title: string;
    content: React.ReactNode;
}

interface Props {
    cards: Card[];
}

export default function DegreeCardSlider({ cards }: Props) {
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState<"left" | "right">("right");

    const prev = () => {
        setDirection("left");
        setCurrent((current - 1 + cards.length) % cards.length);
    };

    const next = () => {
        setDirection("right");
        setCurrent((current + 1) % cards.length);
    };

    return (
        <div className="overflow-hidden">
            <div className="relative w-full h-full bg-white rounded-xl p-4 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="flex justify-between mt-2">
                    <button onClick={prev} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">◀</button>
                    <button onClick={next} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">▶</button>
                </div>
                {/* アニメーションする中身 */}
                <div
                    key={current}
                    className={`
                        transition-all duration-500
                        ${direction === "right" ? "animate-slide-in-right" : "animate-slide-in-left"}
                    `}
                >
                    <h2 className="text-xl font-bold mb-2 border-b pb-2">{cards[current].title}</h2>
                    <div className="mb-3">{cards[current].content}</div>
                </div>
            </div>
        </div>
    );
}
