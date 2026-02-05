"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import {
  StudentForm,
  type StudentFormValues,
} from "@/components/forms/StudentForm";
import { Card, CardContent } from "@/components/ui/Card";
import { academicApi } from "@/services/academic-api";
import type { Course, Grade, Student } from "@/types/academic";
import { scoreToLetter } from "@/utils/grades";

export default function EditStudentPage() {
  const params = useParams<{ id: string }>();
  const studentId = Number(params.id);
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [studentData, coursesData, gradesData] = await Promise.all([
          academicApi.getStudent(studentId),
          academicApi.getCourses(),
          academicApi.getGradesByStudent(studentId),
        ]);
        setStudent(studentData);
        setCourses(coursesData);
        setGrades(gradesData);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [studentId]);

  const defaultValues = useMemo<StudentFormValues | undefined>(() => {
    if (!student) return undefined;
    return {
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      year: student.year,
      major: student.major,
      notes: student.notes ?? "",
      attributes: student.attributes ?? [],
      grades: grades.map((grade) => ({
        courseId: grade.courseId,
        score: grade.score,
      })),
    };
  }, [student, grades]);

  const handleSubmit = async (values: StudentFormValues) => {
    const now = new Date().toISOString();
    await academicApi.updateStudent(studentId, {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      year: values.year,
      major: values.major,
      notes: values.notes,
      attributes: values.attributes ?? [],
    });

    const existingGrades = await academicApi.getGradesByStudent(studentId);
    await Promise.all(
      existingGrades.map((grade) => academicApi.deleteGrade(grade.id)),
    );

    if (values.grades?.length) {
      await Promise.all(
        values.grades.map((grade) =>
          academicApi.createGrade({
            studentId,
            courseId: grade.courseId,
            score: grade.score,
            letter: scoreToLetter(grade.score),
            createdAt: now,
            updatedAt: now,
          }),
        ),
      );
    }

    router.push(`/students/${studentId}`);
  };

  if (loading || !defaultValues) {
    return (
      <div className="text-sm text-slate-500">Loading student record...</div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Student" />
      <Card>
        <CardContent>
          <StudentForm
            courses={courses}
            defaultValues={defaultValues}
            submitLabel="Save changes"
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
