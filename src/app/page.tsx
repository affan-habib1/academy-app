"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { BookOpen, GraduationCap, Users } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EnrollmentBarChart } from "@/components/charts/EnrollmentBarChart";
import { PageHeader } from "@/components/layout/PageHeader";
import { academicApi } from "@/services/academic-api";
import type { Course, Faculty, Grade, Student } from "@/types/academic";
import { calculateGpa, formatStudentName } from "@/utils/grades";

export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [studentsData, coursesData, facultyData, gradesData] =
          await Promise.all([
            academicApi.getStudents(),
            academicApi.getCourses(),
            academicApi.getFaculty(),
            academicApi.getGrades(),
          ]);
        setStudents(studentsData);
        setCourses(coursesData);
        setFaculty(facultyData);
        setGrades(gradesData);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const gradesByStudent = useMemo(() => {
    const map = new Map<number, Grade[]>();
    grades.forEach((grade) => {
      const list = map.get(grade.studentId) ?? [];
      list.push(grade);
      map.set(grade.studentId, list);
    });
    return map;
  }, [grades]);

  const enrollmentByCourse = useMemo(() => {
    const map = new Map<number, number>();
    grades.forEach((grade) => {
      map.set(grade.courseId, (map.get(grade.courseId) ?? 0) + 1);
    });
    return courses.map((course) => ({
      course,
      count: map.get(course.id) ?? 0,
    }));
  }, [courses, grades]);

  const topStudents = useMemo(() => {
    return students
      .map((student) => ({
        student,
        gpa: calculateGpa(gradesByStudent.get(student.id) ?? []),
      }))
      .sort((a, b) => b.gpa - a.gpa)
      .slice(0, 5);
  }, [students, gradesByStudent]);

  const popularCourses = useMemo(() => {
    return [...enrollmentByCourse]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [enrollmentByCourse]);

  if (loading) {
    return (
      <div className="text-sm text-slate-500">
        Loading dashboard insights...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Academic Management Dashboard"
        actions={
          <Link
            href="/reports"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            View Reports
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Students"
          value={students.length}
          description="Active learner records"
          icon={Users}
        />
        <StatCard
          title="Total Courses"
          value={courses.length}
          description={`${faculty.length} faculty assigned`}
          icon={BookOpen}
        />
        <StatCard
          title="Total Faculty"
          value={faculty.length}
          description={`Teaching across ${courses.length} courses`}
          icon={GraduationCap}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Jump into the most common workflows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Link
              href="/students/new"
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700 hover:border-emerald-200 hover:bg-emerald-50"
            >
              Add a new student
              <p className="mt-1 text-xs text-slate-500">
                Capture profile, grades, and attributes.
              </p>
            </Link>
            <Link
              href="/courses/new"
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700 hover:border-emerald-200 hover:bg-emerald-50"
            >
              Create a course
              <p className="mt-1 text-xs text-slate-500">
                Assign faculty and metadata.
              </p>
            </Link>
            <Link
              href="/faculty"
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700 hover:border-emerald-200 hover:bg-emerald-50"
            >
              Open faculty panel
              <p className="mt-1 text-xs text-slate-500">
                Enroll students and update grades.
              </p>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Course Enrollments</CardTitle>
            <CardDescription>Enrollment volume by course</CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length ? (
              <EnrollmentBarChart
                categories={courses.map((course) => course.code)}
                data={enrollmentByCourse.map((entry) => entry.count)}
              />
            ) : (
              <p className="text-sm text-slate-500">No course data to chart.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Popular Courses</CardTitle>
            <CardDescription>Sorted by enrollment count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {popularCourses.length ? (
                popularCourses.map((entry) => (
                  <div
                    key={entry.course.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {entry.course.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {entry.course.code}
                      </p>
                    </div>
                    <Badge>{entry.count} enrolled</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No enrollments yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Top-Ranking Students</CardTitle>
            <CardDescription>Sorted by GPA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs tracking-wide text-slate-400 uppercase">
                  <tr>
                    <th className="py-2">Student</th>
                    <th className="py-2">Year</th>
                    <th className="py-2">GPA</th>
                    <th className="py-2">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topStudents.map(({ student, gpa }) => (
                    <tr key={student.id}>
                      <td className="py-3 font-medium text-slate-900">
                        {formatStudentName(student)}
                      </td>
                      <td className="py-3 text-slate-500">{student.year}</td>
                      <td className="py-3 text-slate-700">{gpa.toFixed(2)}</td>
                      <td className="py-3">
                        <Link
                          className="text-emerald-600 hover:text-emerald-700"
                          href={`/students/${student.id}`}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leaderboard Snapshot</CardTitle>
            <CardDescription>Performance highlights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topStudents.map(({ student, gpa }, index) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      #{index + 1} {formatStudentName(student)}
                    </p>
                    <p className="text-xs text-slate-500">{student.major}</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700">
                    {gpa.toFixed(2)} GPA
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
