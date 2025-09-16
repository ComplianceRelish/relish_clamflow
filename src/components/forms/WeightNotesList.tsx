// components/forms/WeightNotesList.tsx - FIXED PROPS INTERFACE

"use client";

import React from 'react';
import { User } from '@/types/auth';

// ✅ FIXED: Added missing onViewDetails prop
interface WeightNotesListProps {
  currentUser: User | null;
  onViewDetails: (note: any) => void; // ✅ Added missing prop
}

const WeightNotesList: React.FC<WeightNotesListProps> = ({ 
  currentUser, 
  onViewDetails 
}) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Weight Notes List</h3>
      <p className="text-gray-600">Current user: {currentUser?.full_name}</p>
      <button 
        onClick={() => onViewDetails({ id: 'test' })}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        View Sample Note
      </button>
    </div>
  );
};

export default WeightNotesList;