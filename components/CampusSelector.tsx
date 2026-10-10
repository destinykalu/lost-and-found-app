
"use client";

import { useState } from "react";

const campuses = [
  "Georgia Institute of Technology",
  "University of Georgia",
  "Georgia State University",
  "Kennesaw State University",
  "Emory University",
  "Georgia Southern University",
];

export default function CampusSelector() {
  const [selectedCampus, setSelectedCampus] = useState("");

  return (
    <div className="w-full">
      <label
        htmlFor="campus"
        className="mb-2 block text-sm font-medium text-gray-700"
      >
        Select your campus
      </label>

      <select
        id="campus"
        value={selectedCampus}
        onChange={(event) => setSelectedCampus(event.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-700 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
      >
        <option value="">Choose your campus</option>

        {campuses.map((campus) => (
          <option key={campus} value={campus}>
            {campus}
          </option>
        ))}
      </select>
    </div>
  );
}
