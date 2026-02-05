"use client";

import { useEffect, useMemo, useState } from "react";

import { EnrollmentLineChart } from "@/components/charts/EnrollmentLineChart";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { academicApi } from "@/services/academic-api";
import type { Course, Grade, Student } from "@/types/academic";
import { calculateGpa, formatStudentName } from "@/utils/grades";
import { groupEnrollmentsByMonth } from "@/utils/reporting";
import { exportToCsv } from "@/utils/csv";

export default function ReportsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [studentsData, coursesData, gradesData] = await Promise.all([
          academicApi.getStudents(),
          academicApi.getCourses(),
          academicApi.getGrades(),
        ]);
        setStudents(studentsData);
        setCourses(coursesData);
        setGrades(gradesData);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const enrollmentSeries = useMemo(
    () => groupEnrollmentsByMonth(grades),
    [grades],
  );

  const topStudentsOverall = useMemo(() => {
    const gradesByStudent = new Map<number, Grade[]>();
    grades.forEach((grade) => {
      const list = gradesByStudent.get(grade.studentId) ?? [];
      list.push(grade);
      gradesByStudent.set(grade.studentId, list);
    });

    return students
      .map((student) => ({
        student,
        gpa: calculateGpa(gradesByStudent.get(student.id) ?? []),
      }))
      .sort((a, b) => b.gpa - a.gpa)
      .slice(0, 8);
  }, [students, grades]);

  const topStudentsByCourse = useMemo(() => {
    return courses
      .map((course) => {
        const courseGrades = grades.filter(
          (grade) => grade.courseId === course.id,
        );
        if (courseGrades.length === 0) {
          return null;
        }
        const topGrade = [...courseGrades].sort((a, b) => b.score - a.score)[0];
        const student = students.find((item) => item.id === topGrade.studentId);
        return {
          course: course.title,
          code: course.code,
          student: student ? formatStudentName(student) : "Student",
          score: topGrade.score,
        };
      })
      .filter(Boolean) as {
      course: string;
      code: string;
      student: string;
      score: number;
    }[];
  }, [courses, grades, students]);

  const handleExportEnrollments = () => {
    const rows = enrollmentSeries.map((entry) => ({
      Month: entry.label,
      Enrollments: entry.count,
    }));
    exportToCsv("course-enrollments-report.csv", rows);
  };

  const handleExportTopStudents = () => {
    const rows = topStudentsByCourse.map((entry) => ({
      Course: entry.course,
      Code: entry.code,
      "Top Student": entry.student,
      "Top Score": entry.score,
    }));
    exportToCsv("top-students-by-course.csv", rows);
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reporting & Export" />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Enrollments"
          value={grades.length}
          description="Across all courses"
        />
        <StatCard
          title="Active Courses"
          value={courses.length}
          description="Catalog coverage"
        />
        <StatCard
          title="Top Students"
          value={topStudentsOverall.length}
          description="Highlighted this term"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Course Enrollments Over Time</CardTitle>
            <Button variant="outline" onClick={handleExportEnrollments}>
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {enrollmentSeries.length ? (
            <EnrollmentLineChart
              categories={enrollmentSeries.map((entry) => entry.label)}
              data={enrollmentSeries.map((entry) => entry.count)}
            />
          ) : (
            <p className="text-sm text-slate-500">
              No enrollment history available.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Top-Performing Students by Course</CardTitle>
              <Button variant="outline" onClick={handleExportTopStudents}>
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topStudentsByCourse.map((entry) => (
                <div
                  key={entry.code}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {entry.course}
                    </p>
                    <p className="text-xs text-slate-500">{entry.student}</p>
                  </div>
                  <Badge>{entry.score}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Institute Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topStudentsOverall.map(({ student, gpa }, index) => (
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
                  <Badge className="bg-indigo-100 text-indigo-700">
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
