"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { academicApi } from "@/services/academic-api";
import type { Course, Grade, Student } from "@/types/academic";
import { calculateGpa, formatStudentName, scoreToLetter } from "@/utils/grades";

export default function StudentProfilePage() {
  const params = useParams<{ id: string }>();
  const studentId = Number(params.id);
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

  const enrolledCourses = useMemo(() => {
    return grades
      .map((grade) => ({
        grade,
        course: courses.find((course) => course.id === grade.courseId),
      }))
      .filter((item): item is { grade: Grade; course: Course } =>
        Boolean(item.course),
      );
  }, [grades, courses]);

  const averageScore = useMemo(() => {
    if (!grades.length) return 0;
    const total = grades.reduce((sum, grade) => sum + grade.score, 0);
    return Math.round(total / grades.length);
  }, [grades]);

  if (loading) {
    return (
      <div className="text-sm text-slate-500">Loading student profile...</div>
    );
  }

  if (!student) {
    return <div className="text-sm text-slate-500">Student not found.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={formatStudentName(student)}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/students"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Back to list
            </Link>
            <Link
              href={`/students/${student.id}/edit`}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              Edit student
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Overview</CardTitle>
            <CardDescription>
              Courses, grades, and progress snapshot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enrolledCourses.length === 0 ? (
              <p className="text-sm text-slate-500">
                No course enrollments yet.
              </p>
            ) : (
              <div className="space-y-4">
                {enrolledCourses.map(({ course, grade }) => (
                  <div
                    key={grade.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {course.title}
                      </p>
                      <p className="text-xs text-slate-500">{course.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">
                        {grade.score}%
                      </p>
                      <p className="text-xs text-slate-500">
                        {scoreToLetter(grade.score)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress Summary</CardTitle>
            <CardDescription>Performance averages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 uppercase">
                  Average Score
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {averageScore}%
                </p>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${averageScore}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase">GPA</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {calculateGpa(grades).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase">
                  Courses Enrolled
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {grades.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Details</CardTitle>
          <CardDescription>Contact and profile attributes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-slate-400 uppercase">Email</p>
              <p className="text-sm font-medium text-slate-900">
                {student.email}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase">Academic Year</p>
              <p className="text-sm font-medium text-slate-900">
                {student.year}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase">Major</p>
              <p className="text-sm font-medium text-slate-900">
                {student.major}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase">Attributes</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {student.attributes?.length ? (
                  student.attributes.map((attr, index) => (
                    <Badge key={`${attr.key}-${index}`}>
                      {attr.key}: {attr.value}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">
                    No custom attributes
                  </span>
                )}
              </div>
            </div>
          </div>

          {student.notes ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              {student.notes}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
