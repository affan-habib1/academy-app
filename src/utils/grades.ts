import type { Grade, Student } from "@/types/academic";

export function scoreToLetter(score: number) {
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 67) return "D+";
  if (score >= 63) return "D";
  if (score >= 60) return "D-";
  return "F";
}

export function scoreToGpa(score: number) {
  if (score >= 93) return 4.0;
  if (score >= 90) return 3.7;
  if (score >= 87) return 3.3;
  if (score >= 83) return 3.0;
  if (score >= 80) return 2.7;
  if (score >= 77) return 2.3;
  if (score >= 73) return 2.0;
  if (score >= 70) return 1.7;
  if (score >= 67) return 1.3;
  if (score >= 63) return 1.0;
  if (score >= 60) return 0.7;
  return 0;
}

export function calculateGpa(grades: Grade[]) {
  if (!grades.length) return 0;
  const total = grades.reduce((sum, grade) => sum + scoreToGpa(grade.score), 0);
  return Number((total / grades.length).toFixed(2));
}

export function formatStudentName(student: Student) {
  return `${student.firstName} ${student.lastName}`;
}
