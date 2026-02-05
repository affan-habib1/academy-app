"use client";

import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { BookOpen, ClipboardCheck, Layers, Users } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { StatCard } from "@/components/ui/StatCard";
import { academicApi } from "@/services/academic-api";
import type { Course, Grade, Student } from "@/types/academic";
import { formatStudentName, scoreToLetter } from "@/utils/grades";

const ROSTER_PAGE_SIZE = 8;

const assignSchema = z.object({
  studentId: z.preprocess((value) => Number(value), z.number().min(1, "Select a student")),
  courseId: z.preprocess((value) => Number(value), z.number().min(1, "Select a course")),
  score: z.preprocess((value) => (value === "" || value === null ? 0 : Number(value)), z.number().min(0).max(100)),
});

const updateSchema = z.object({
  studentId: z.preprocess((value) => Number(value), z.number().min(1, "Select a student")),
  courseId: z.preprocess((value) => Number(value), z.number().min(1, "Select a course")),
  score: z.preprocess((value) => (value === "" || value === null ? 0 : Number(value)), z.number().min(0).max(100)),
});

const bulkSchema = z.object({
  rows: z
    .array(
      z.object({
        studentId: z.preprocess((value) => Number(value), z.number().min(1, "Select a student")),
        courseId: z.preprocess((value) => Number(value), z.number().min(1, "Select a course")),
        score: z.preprocess(
          (value) => (value === "" || value === null ? 0 : Number(value)),
          z.number().min(0).max(100),
        ),
      }),
    )
    .min(1, "Add at least one enrollment"),
});

type AssignValues = z.infer<typeof assignSchema>;

type BulkValues = z.infer<typeof bulkSchema>;

export default function FacultyPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rosterPage, setRosterPage] = useState(1);
  const [assignOpen, setAssignOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

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

  const assignForm = useForm<AssignValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: { studentId: 0, courseId: 0, score: 0 },
  });

  const updateForm = useForm<AssignValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: { studentId: 0, courseId: 0, score: 0 },
  });

  const bulkForm = useForm<BulkValues>({
    resolver: zodResolver(bulkSchema),
    defaultValues: { rows: [] },
  });

  const bulkRows = useFieldArray({ control: bulkForm.control, name: "rows" });

  const averageScore = useMemo(() => {
    if (!grades.length) return 0;
    return Math.round(grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length);
  }, [grades]);

  const roster = useMemo(() => {
    const query = search.toLowerCase();
    return grades
      .map((grade) => {
        const student = students.find((item) => item.id === grade.studentId);
        const course = courses.find((item) => item.id === grade.courseId);
        return { grade, student, course };
      })
      .filter((entry) => entry.student && entry.course)
      .filter((entry) => {
        if (!query) return true;
        const studentName = formatStudentName(entry.student!);
        return (
          studentName.toLowerCase().includes(query) ||
          entry.course!.code.toLowerCase().includes(query) ||
          entry.course!.title.toLowerCase().includes(query)
        );
      });
  }, [grades, students, courses, search]);

  const totalRosterPages = Math.max(1, Math.ceil(roster.length / ROSTER_PAGE_SIZE));
  const currentRosterPage = Math.min(rosterPage, totalRosterPages);
  const paginatedRoster = roster.slice(
    (currentRosterPage - 1) * ROSTER_PAGE_SIZE,
    currentRosterPage * ROSTER_PAGE_SIZE,
  );

  useEffect(() => {
    setRosterPage(1);
  }, [search]);

  const recentGrades = useMemo(() => {
    return [...grades].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 6);
  }, [grades]);

  const handleAssign = async (values: AssignValues) => {
    const now = new Date().toISOString();
    const created = await academicApi.createGrade({
      studentId: values.studentId,
      courseId: values.courseId,
      score: values.score,
      letter: scoreToLetter(values.score),
      createdAt: now,
      updatedAt: now,
    });
    setGrades((prev) => [...prev, created]);
    setMessage("Student assigned to course.");
    assignForm.reset({ studentId: 0, courseId: 0, score: 0 });
    setAssignOpen(false);
  };

  const handleUpdate = async (values: AssignValues) => {
    const grade = grades.find((item) => item.studentId === values.studentId && item.courseId === values.courseId);
    if (!grade) {
      setMessage("No existing enrollment found for that student/course pair.");
      return;
    }
    const updated = await academicApi.updateGrade(grade.id, {
      score: values.score,
      letter: scoreToLetter(values.score),
      updatedAt: new Date().toISOString(),
    });
    setGrades((prev) => prev.map((item) => (item.id === grade.id ? { ...item, ...updated } : item)));
    setMessage("Grade updated successfully.");
    setUpdateOpen(false);
  };

  const handleBulkEnroll = async (values: BulkValues) => {
    const now = new Date().toISOString();
    const created = await Promise.all(
      values.rows.map((row) =>
        academicApi.createGrade({
          studentId: row.studentId,
          courseId: row.courseId,
          score: row.score,
          letter: scoreToLetter(row.score),
          createdAt: now,
          updatedAt: now,
        }),
      ),
    );
    setGrades((prev) => [...prev, ...created]);
    setMessage("Bulk enrollments completed.");
    bulkForm.reset({ rows: [] });
    setBulkOpen(false);
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Loading faculty tools...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Faculty Panel" />

      {message ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Students" value={students.length} description="Active learners" icon={Users} />
        <StatCard title="Courses" value={courses.length} description="Catalog entries" icon={BookOpen} />
        <StatCard title="Enrollments" value={grades.length} description="Registered seats" icon={Layers} />
        <StatCard
          title="Avg. Grade"
          value={`${averageScore}%`}
          description="Overall performance"
          icon={ClipboardCheck}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Faculty Actions</CardTitle>
            <CardDescription>Launch key workflows in a guided modal.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <button
                type="button"
                onClick={() => setAssignOpen(true)}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm font-medium text-slate-700 hover:border-emerald-200 hover:bg-emerald-50"
              >
                Assign student
                <p className="mt-1 text-xs text-slate-500">Enroll a student and log the first grade.</p>
              </button>
              <button
                type="button"
                onClick={() => setUpdateOpen(true)}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm font-medium text-slate-700 hover:border-emerald-200 hover:bg-emerald-50"
              >
                Update grade
                <p className="mt-1 text-xs text-slate-500">Adjust grades for existing enrollments.</p>
              </button>
              <button
                type="button"
                onClick={() => setBulkOpen(true)}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm font-medium text-slate-700 hover:border-emerald-200 hover:bg-emerald-50"
              >
                Bulk enrollments
                <p className="mt-1 text-xs text-slate-500">Add multiple enrollments in one pass.</p>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Grade Activity</CardTitle>
            <CardDescription>Latest updates across courses.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentGrades.map((grade) => {
                const student = students.find((item) => item.id === grade.studentId);
                const course = courses.find((item) => item.id === grade.courseId);
                return (
                  <div key={grade.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {student ? formatStudentName(student) : "Student"}
                      </p>
                      <p className="text-xs text-slate-500">{course ? course.code : "Course"}</p>
                    </div>
                    <Badge className="bg-slate-100 text-slate-600">{grade.score}%</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrollment Roster</CardTitle>
          <CardDescription>Search students and courses to view current grades.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by student, course code, or title"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs tracking-wide text-slate-400 uppercase">
                <tr>
                  <th className="py-2">Student</th>
                  <th className="py-2">Course</th>
                  <th className="py-2">Score</th>
                  <th className="py-2">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRoster.map((entry) => (
                  <tr key={entry.grade.id}>
                    <td className="py-3">
                      <p className="font-medium text-slate-900">{formatStudentName(entry.student!)}</p>
                      <p className="text-xs text-slate-500">{entry.student?.email}</p>
                    </td>
                    <td className="py-3 text-slate-600">
                      <p className="font-medium text-slate-900">{entry.course?.title}</p>
                      <p className="text-xs text-slate-500">{entry.course?.code}</p>
                    </td>
                    <td className="py-3">
                      <Badge className="bg-emerald-50 text-emerald-700">{entry.grade.score}%</Badge>
                    </td>
                    <td className="py-3 text-slate-500">{new Date(entry.grade.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {roster.length > 0 ? (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing {(currentRosterPage - 1) * ROSTER_PAGE_SIZE + 1}–
                {Math.min(currentRosterPage * ROSTER_PAGE_SIZE, roster.length)} of {roster.length} enrollments
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setRosterPage((prev) => Math.max(1, prev - 1))}>
                  Previous
                </Button>
                <span className="text-xs text-slate-500">
                  Page {currentRosterPage} of {totalRosterPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRosterPage((prev) => Math.min(totalRosterPages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign student to course"
        description="Enroll a student and capture their starting grade."
      >
        <form onSubmit={assignForm.handleSubmit(handleAssign)} className="space-y-3">
          <Select {...assignForm.register("studentId")}>
            <option value="0">Select student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {formatStudentName(student)}
              </option>
            ))}
          </Select>
          {assignForm.formState.errors.studentId ? (
            <p className="text-xs text-rose-600">{assignForm.formState.errors.studentId.message}</p>
          ) : null}
          <Select {...assignForm.register("courseId")}>
            <option value="0">Select course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} · {course.title}
              </option>
            ))}
          </Select>
          {assignForm.formState.errors.courseId ? (
            <p className="text-xs text-rose-600">{assignForm.formState.errors.courseId.message}</p>
          ) : null}
          <Input type="number" min={0} max={100} {...assignForm.register("score")} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Assign</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={updateOpen}
        onClose={() => setUpdateOpen(false)}
        title="Update student grade"
        description="Adjust a grade for an existing enrollment."
      >
        <form onSubmit={updateForm.handleSubmit(handleUpdate)} className="space-y-3">
          <Select {...updateForm.register("studentId")}>
            <option value="0">Select student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {formatStudentName(student)}
              </option>
            ))}
          </Select>
          {updateForm.formState.errors.studentId ? (
            <p className="text-xs text-rose-600">{updateForm.formState.errors.studentId.message}</p>
          ) : null}
          <Select {...updateForm.register("courseId")}>
            <option value="0">Select course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} · {course.title}
              </option>
            ))}
          </Select>
          {updateForm.formState.errors.courseId ? (
            <p className="text-xs text-rose-600">{updateForm.formState.errors.courseId.message}</p>
          ) : null}
          <Input type="number" min={0} max={100} {...updateForm.register("score")} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setUpdateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Update</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk enrollments"
        description="Add multiple enrollments and grades in one run."
        className="max-w-3xl"
      >
        <form onSubmit={bulkForm.handleSubmit(handleBulkEnroll)} className="space-y-4">
          {bulkRows.fields.length === 0 ? (
            <p className="text-sm text-slate-500">Add rows to enroll multiple students at once.</p>
          ) : null}
          <div className="space-y-3">
            {bulkRows.fields.map((field, index) => (
              <div key={field.id} className="grid gap-3 md:grid-cols-[2fr_2fr_1fr_auto]">
                <div>
                  <Select {...bulkForm.register(`rows.${index}.studentId` as const)}>
                    <option value="0">Select student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {formatStudentName(student)}
                      </option>
                    ))}
                  </Select>
                  {bulkForm.formState.errors.rows?.[index]?.studentId ? (
                    <p className="text-xs text-rose-600">{bulkForm.formState.errors.rows[index]?.studentId?.message}</p>
                  ) : null}
                </div>
                <div>
                  <Select {...bulkForm.register(`rows.${index}.courseId` as const)}>
                    <option value="0">Select course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} · {course.title}
                      </option>
                    ))}
                  </Select>
                  {bulkForm.formState.errors.rows?.[index]?.courseId ? (
                    <p className="text-xs text-rose-600">{bulkForm.formState.errors.rows[index]?.courseId?.message}</p>
                  ) : null}
                </div>
                <div>
                  <Input type="number" min={0} max={100} {...bulkForm.register(`rows.${index}.score` as const)} />
                  {bulkForm.formState.errors.rows?.[index]?.score ? (
                    <p className="text-xs text-rose-600">{bulkForm.formState.errors.rows[index]?.score?.message}</p>
                  ) : null}
                </div>
                <Button type="button" variant="ghost" onClick={() => bulkRows.remove(index)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => bulkRows.append({ studentId: 0, courseId: 0, score: 0 })}
            >
              + Add row
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setBulkOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Run bulk update</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
