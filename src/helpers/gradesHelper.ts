// utils/gradeCalculator.ts

export interface SubjectResult {
  subjectId: string;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  grade: string;
}

export interface GradeSummary {
  totalObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
}

// Percentage → Letter grade mapping
function calculateLetterGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
}

// Per-subject result
export function calculateSubjectResult(
  subjectId: string,
  obtainedMarks: number,
  totalMarks: number
): SubjectResult {
  const percentage =
    totalMarks > 0
      ? parseFloat(((obtainedMarks / totalMarks) * 100).toFixed(2))
      : 0;

  return {
    subjectId,
    obtainedMarks,
    totalMarks,
    percentage,
    grade: calculateLetterGrade(percentage),
  };
}

// Full class grade summary
export function calculateGradeSummary(
  subjects: { subjectId: string; obtainedMarks: number; totalMarks: number }[]
) {
  const subjectResults = subjects.map((s) =>
    calculateSubjectResult(s.subjectId, s.obtainedMarks, s.totalMarks)
  );

  const totalObtained = subjectResults.reduce(
    (sum, s) => sum + s.obtainedMarks,
    0
  );

  const totalMarks = subjectResults.reduce(
    (sum, s) => sum + s.totalMarks,
    0
  );

  const percentage =
    totalMarks > 0
      ? parseFloat(((totalObtained / totalMarks) * 100).toFixed(2))
      : 0;

  return {
    totalObtained,
    totalMarks,
    percentage,
    grade: calculateLetterGrade(percentage),
  };
}
