import React from "react";

interface SearchBarProps {
  radius: number;
  setRadius: (value: number) => void;
  onRefresh: () => void;
}

export default function SearchBar({ radius, setRadius, onRefresh }: SearchBarProps) {
  return (
    <div className="absolute top-4 left-4 bg-white p-4 rounded-2xl shadow-xl z-20 w-80 border border-gray-100">
      <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
        📍 BÁN KÍNH TÌM KIẾM
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between text-xs text-gray-500 font-medium">
          <span>Phạm vi:</span>
          <span className="text-orange-600 font-bold">{radius} km</span>
        </div>
        <input
          type="range"
          min="1"
          max="20"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full accent-orange-500 cursor-pointer"
        />
        <button
          onClick={onRefresh}
          className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-orange-100"
        >
          Quét Quán Ăn Xung Quanh
        </button>
      </div>
    </div>
  );
}