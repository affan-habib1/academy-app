export type AcademicYear = "Freshman" | "Sophomore" | "Junior" | "Senior" | "Graduate";

export interface StudentAttribute {
  key: string;
  value: string;
}

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  year: AcademicYear;
  major: string;
  notes?: string;
  attributes: StudentAttribute[];
  createdAt: string;
}

export interface CourseMetadata {
  key: string;
  value: string;
}

export interface Course {
  id: number;
  code: string;
  title: string;
  department: string;
  credits: number;
  description?: string;
  facultyIds: number[];
  metadata: CourseMetadata[];
  createdAt: string;
}

export interface Faculty {
  id: number;
  name: string;
  email: string;
  department: string;
  title: string;
}

export interface Grade {
  id: number;
  studentId: number;
  courseId: number;
  score: number;
  letter: string;
  createdAt: string;
  updatedAt: string;
}
