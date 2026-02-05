"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CourseForm, type CourseFormValues } from "@/components/forms/CourseForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { academicApi } from "@/services/academic-api";
import type { Course, Faculty } from "@/types/academic";

export default function NewCoursePage() {
  const router = useRouter();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const facultyData = await academicApi.getFaculty();
        setFaculty(facultyData);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSubmit = async (values: CourseFormValues) => {
    const now = new Date().toISOString();
    const payload: Omit<Course, "id"> = {
      code: values.code,
      title: values.title,
      department: values.department,
      credits: values.credits,
      description: values.description,
      facultyIds: values.instructors.map((item) => item.facultyId),
      metadata: values.metadata,
      createdAt: now,
    };

    const created = await academicApi.createCourse(payload);
    router.push(`/courses/${created.id}/edit`);
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Loading faculty...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Create Course" />
      <Card>
        <CardContent>
          <CourseForm faculty={faculty} submitLabel="Create course" onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}
