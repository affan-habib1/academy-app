"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatCard } from "@/components/ui/StatCard";
import { academicApi } from "@/services/academic-api";
import type { Course, Grade, Student } from "@/types/academic";
import { formatStudentName } from "@/utils/grades";

const PAGE_SIZE = 6;

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [page, setPage] = useState(1);

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

  const gradesByStudent = useMemo(() => {
    const map = new Map<number, Grade[]>();
    grades.forEach((grade) => {
      const list = map.get(grade.studentId) ?? [];
      list.push(grade);
      map.set(grade.studentId, list);
    });
    return map;
  }, [grades]);

  const filteredStudents = useMemo(() => {
    const query = search.toLowerCase();
    return students.filter((student) => {
      const matchesSearch =
        formatStudentName(student).toLowerCase().includes(query) || student.email.toLowerCase().includes(query);
      const matchesYear = yearFilter === "all" || student.year === yearFilter;
      const matchesCourse =
        courseFilter === "all" ||
        (gradesByStudent.get(student.id) ?? []).some((grade) => String(grade.courseId) === courseFilter);
      return matchesSearch && matchesYear && matchesCourse;
    });
  }, [students, search, yearFilter, courseFilter, gradesByStudent]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filteredStudents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, yearFilter, courseFilter]);

  const handleDelete = async (studentId: number) => {
    if (!confirm("Remove this student? This will also delete their grades.")) {
      return;
    }

    const previousStudents = students;
    const previousGrades = grades;
    setStudents((prev) => prev.filter((student) => student.id !== studentId));
    setGrades((prev) => prev.filter((grade) => grade.studentId !== studentId));

    try {
      await academicApi.deleteStudent(studentId);
      const studentGrades = previousGrades.filter((grade) => grade.studentId === studentId);
      await Promise.all(studentGrades.map((grade) => academicApi.deleteGrade(grade.id)));
    } catch (error) {
      console.error(error);
      setStudents(previousStudents);
      setGrades(previousGrades);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Loading students...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Management"
        actions={
          <Link
            href="/students/new"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            Add student
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="All Students" value={students.length} description="Total records" />
        <StatCard title="Filtered Results" value={filteredStudents.length} description="Matches current filters" />
        <StatCard title="Active Enrollments" value={grades.length} description="Course registrations" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>Refine students by year and enrolled course.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr]">
            <Input
              placeholder="Search by name or email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
              <option value="all">All years</option>
              {["Freshman", "Sophomore", "Junior", "Senior", "Graduate"].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
            <Select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)}>
              <option value="all">All courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student Directory</CardTitle>
          <CardDescription>Click into a student profile to view grades and progress.</CardDescription>
        </CardHeader>
        <CardContent>
          {paginated.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">No students match your filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs tracking-wide text-slate-400 uppercase">
                  <tr>
                    <th className="py-2">Student</th>
                    <th className="py-2">Year</th>
                    <th className="py-2">Major</th>
                    <th className="py-2">Enrollments</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map((student) => {
                    const enrolled = gradesByStudent.get(student.id) ?? [];
                    return (
                      <tr key={student.id}>
                        <td className="py-3">
                          <p className="font-medium text-slate-900">{formatStudentName(student)}</p>
                          <p className="text-xs text-slate-500">{student.email}</p>
                        </td>
                        <td className="py-3 text-slate-500">{student.year}</td>
                        <td className="py-3 text-slate-500">{student.major}</td>
                        <td className="py-3">
                          <Badge>{enrolled.length} courses</Badge>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Link className="text-emerald-600 hover:text-emerald-700" href={`/students/${student.id}`}>
                              View
                            </Link>
                            <Link className="text-slate-500 hover:text-slate-700" href={`/students/${student.id}/edit`}>
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(student.id)}
                              className="text-rose-600 hover:text-rose-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredStudents.length)} of{" "}
          {filteredStudents.length} students
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
            Previous
          </Button>
          <span className="text-xs text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
