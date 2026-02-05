"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import {
  StudentForm,
  type StudentFormValues,
} from "@/components/forms/StudentForm";
import { Card, CardContent } from "@/components/ui/Card";
import { academicApi } from "@/services/academic-api";
import type { Course, Student } from "@/types/academic";
import { scoreToLetter } from "@/utils/grades";

export default function NewStudentPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const coursesData = await academicApi.getCourses();
        setCourses(coursesData);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSubmit = async (values: StudentFormValues) => {
    const now = new Date().toISOString();
    const payload: Omit<Student, "id"> = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      year: values.year,
      major: values.major,
      notes: values.notes,
      attributes: values.attributes ?? [],
      createdAt: now,
    };

    const created = await academicApi.createStudent(payload);

    if (values.grades?.length) {
      await Promise.all(
        values.grades.map((grade) =>
          academicApi.createGrade({
            studentId: created.id,
            courseId: grade.courseId,
            score: grade.score,
            letter: scoreToLetter(grade.score),
            createdAt: now,
            updatedAt: now,
          }),
        ),
      );
    }

    router.push(`/students/${created.id}`);
  };

  if (loading) {
    return (
      <div className="text-sm text-slate-500">Loading course catalog...</div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Create Student" />
      <Card>
        <CardContent>
          <StudentForm
            courses={courses}
            submitLabel="Create student"
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
