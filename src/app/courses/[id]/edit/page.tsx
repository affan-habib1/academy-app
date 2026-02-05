"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { CourseForm, type CourseFormValues } from "@/components/forms/CourseForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { academicApi } from "@/services/academic-api";
import type { Course, Faculty } from "@/types/academic";

export default function EditCoursePage() {
  const params = useParams<{ id: string }>();
  const courseId = Number(params.id);
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [courseData, facultyData] = await Promise.all([
          academicApi.getCourse(courseId),
          academicApi.getFaculty(),
        ]);
        setCourse(courseData);
        setFaculty(facultyData);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [courseId]);

  const defaultValues = useMemo<CourseFormValues | undefined>(() => {
    if (!course) return undefined;
    return {
      code: course.code,
      title: course.title,
      department: course.department,
      credits: course.credits,
      description: course.description ?? "",
      instructors: course.facultyIds.map((facultyId) => ({ facultyId })),
      metadata: course.metadata ?? [],
    };
  }, [course]);

  const handleSubmit = async (values: CourseFormValues) => {
    await academicApi.updateCourse(courseId, {
      code: values.code,
      title: values.title,
      department: values.department,
      credits: values.credits,
      description: values.description,
      facultyIds: values.instructors.map((item) => item.facultyId),
      metadata: values.metadata,
    });

    router.push("/courses");
  };

  if (loading || !defaultValues) {
    return <div className="text-sm text-slate-500">Loading course...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Course" />
      <Card>
        <CardContent>
          <CourseForm
            faculty={faculty}
            defaultValues={defaultValues}
            submitLabel="Save changes"
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
