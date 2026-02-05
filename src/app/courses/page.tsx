"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StatCard } from "@/components/ui/StatCard";
import { academicApi } from "@/services/academic-api";
import type { Course, Faculty, Grade } from "@/types/academic";

export default function CoursesPage() {
  const PAGE_SIZE = 6;
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [coursesData, facultyData, gradesData] = await Promise.all([
          academicApi.getCourses(),
          academicApi.getFaculty(),
          academicApi.getGrades(),
        ]);
        setCourses(coursesData);
        setFaculty(facultyData);
        setGrades(gradesData);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const facultyMap = useMemo(() => {
    return new Map(faculty.map((member) => [member.id, member]));
  }, [faculty]);

  const enrollmentCounts = useMemo(() => {
    const map = new Map<number, number>();
    grades.forEach((grade) => {
      map.set(grade.courseId, (map.get(grade.courseId) ?? 0) + 1);
    });
    return map;
  }, [grades]);

  const filteredCourses = useMemo(() => {
    const query = search.toLowerCase();
    return courses.filter((course) => {
      return (
        course.title.toLowerCase().includes(query) ||
        course.code.toLowerCase().includes(query) ||
        course.department.toLowerCase().includes(query)
      );
    });
  }, [courses, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filteredCourses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleDelete = async (courseId: number) => {
    if (!confirm("Delete this course? This will remove related grades.")) {
      return;
    }

    const previousCourses = courses;
    const previousGrades = grades;
    setCourses((prev) => prev.filter((course) => course.id !== courseId));
    setGrades((prev) => prev.filter((grade) => grade.courseId !== courseId));

    try {
      await academicApi.deleteCourse(courseId);
      const relatedGrades = previousGrades.filter((grade) => grade.courseId === courseId);
      await Promise.all(relatedGrades.map((grade) => academicApi.deleteGrade(grade.id)));
    } catch (error) {
      console.error(error);
      setCourses(previousCourses);
      setGrades(previousGrades);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Loading courses...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Management"
        actions={
          <Link
            href="/courses/new"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            Add course
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Courses" value={courses.length} description="Catalog size" />
        <StatCard title="Enrollments" value={grades.length} description="Active course registrations" />
        <StatCard title="Faculty" value={faculty.length} description="Teaching staff available" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Courses</CardTitle>
          <CardDescription>Filter by title, code, or department.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input placeholder="Search courses" value={search} onChange={(event) => setSearch(event.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course Directory</CardTitle>
          <CardDescription>Review assignments and enrollments for each course.</CardDescription>
        </CardHeader>
        <CardContent>
          {paginated.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">No courses match your search.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs tracking-wide text-slate-400 uppercase">
                  <tr>
                    <th className="py-2">Course</th>
                    <th className="py-2">Department</th>
                    <th className="py-2">Faculty</th>
                    <th className="py-2">Enrollment</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map((course) => {
                    const facultyNames = course.facultyIds
                      .map((id) => facultyMap.get(id)?.name)
                      .filter(Boolean)
                      .join(", ");
                    const count = enrollmentCounts.get(course.id) ?? 0;
                    return (
                      <tr key={course.id}>
                        <td className="py-3">
                          <p className="font-medium text-slate-900">{course.title}</p>
                          <p className="text-xs text-slate-500">{course.code}</p>
                        </td>
                        <td className="py-3 text-slate-500">{course.department}</td>
                        <td className="py-3 text-slate-500">{facultyNames.length ? facultyNames : "Unassigned"}</td>
                        <td className="py-3">
                          <Badge>{count} enrolled</Badge>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Link className="text-slate-500 hover:text-slate-700" href={`/courses/${course.id}/edit`}>
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(course.id)}
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

      {filteredCourses.length > 0 ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredCourses.length)} of{" "}
            {filteredCourses.length} courses
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
      ) : null}
    </div>
  );
}
