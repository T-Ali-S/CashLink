import React from "react";

export default function AvatarPicker({ avatars, selected, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white  text-black rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold text-black text-center mb-4">Choose an Avatar</h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {avatars.map((avatar, i) => (
            <img
              key={i}
              src={avatar}
              onClick={() => onSelect(avatar)}
              className={`w-20 h-20 cursor-pointer rounded-full border-4 object-cover transition
                ${selected === avatar ? "border-blue-500 ring-2 ring-blue-400 scale-105" : "border-transparent"}`}
              alt={`Avatar ${i}`}
            />
          ))}
        </div>

        <div className="flex justify-end gap-4 ">
          <button onClick={onClose} className="text-sm px-4 py-2 border rounded  hover:bg-gray-100">Cancel</button>
          <button
            onClick={() => onClose(true)}
            className="text-sm px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}