import React from 'react';
import { BarChart2, BookOpen } from 'lucide-react';

const TeacherGradebookRight = () => (
  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
      <BarChart2 className="w-4 h-4 text-blue-600" /> Marksheet Guidelines
    </h3>
    <div className="space-y-2 text-xs text-gray-500 leading-relaxed">
      <p>
        <strong className="text-gray-700">Course Eligibility:</strong> Only active students with confirmed course registrations appear on this marksheet.
      </p>
      <p>
        <strong className="text-gray-700">Continuous Assessment (CA):</strong> CA1 and CA2 scores can be drafted and updated at any time prior to administrative submission.
      </p>
      <p>
        <strong className="text-gray-700">CBT & Combined Exams:</strong> For CBT and Combined exam configurations, verified online test scores are automatically imported and locked from student exam submissions. You enter only the written/theory component.
      </p>
      <p>
        <strong className="text-gray-700">Locking & Approval:</strong> Once submitted and approved or released by the administration, the marksheet becomes strictly read-only.
      </p>
    </div>
  </div>
);

export default TeacherGradebookRight;
