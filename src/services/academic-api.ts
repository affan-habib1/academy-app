import { api } from "@/lib/api";
import type { Course, Faculty, Grade, Student } from "@/types/academic";

export const academicApi = {
  getStudents: () => api.get<Student[]>("/students"),
  getStudent: (id: number) => api.get<Student>(`/students/${id}`),
  createStudent: (payload: Omit<Student, "id">) =>
    api.post<Student>("/students", payload),
  updateStudent: (id: number, payload: Partial<Student>) =>
    api.patch<Student>(`/students/${id}`, payload),
  deleteStudent: (id: number) => api.delete<void>(`/students/${id}`),

  getCourses: () => api.get<Course[]>("/courses"),
  getCourse: (id: number) => api.get<Course>(`/courses/${id}`),
  createCourse: (payload: Omit<Course, "id">) =>
    api.post<Course>("/courses", payload),
  updateCourse: (id: number, payload: Partial<Course>) =>
    api.patch<Course>(`/courses/${id}`, payload),
  deleteCourse: (id: number) => api.delete<void>(`/courses/${id}`),

  getFaculty: () => api.get<Faculty[]>("/faculty"),

  getGrades: () => api.get<Grade[]>("/grades"),
  getGradesByStudent: (studentId: number) =>
    api.get<Grade[]>(`/grades?studentId=${studentId}`),
  getGradesByCourse: (courseId: number) =>
    api.get<Grade[]>(`/grades?courseId=${courseId}`),
  createGrade: (payload: Omit<Grade, "id">) =>
    api.post<Grade>("/grades", payload),
  updateGrade: (id: number, payload: Partial<Grade>) =>
    api.patch<Grade>(`/grades/${id}`, payload),
  deleteGrade: (id: number) => api.delete<void>(`/grades/${id}`),
};
