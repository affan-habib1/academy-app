"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import type { Course } from "@/types/academic";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";

const gradeSchema = z.object({
  courseId: z.preprocess((value) => Number(value), z.number().min(1, "Select a course")),
  score: z.preprocess(
    (value) => (value === "" || value === null ? undefined : Number(value)),
    z.number().min(0, "Score must be at least 0").max(100, "Score must be <= 100"),
  ),
});

const attributeSchema = z.object({
  key: z.string().min(1, "Attribute name is required"),
  value: z.string().min(1, "Attribute value is required"),
});

const studentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  year: z.enum(["Freshman", "Sophomore", "Junior", "Senior", "Graduate"]),
  major: z.string().min(1, "Major is required"),
  notes: z.string().optional(),
  grades: z.array(gradeSchema).default([]),
  attributes: z.array(attributeSchema).default([]),
});

export type StudentFormValues = z.infer<typeof studentSchema>;

export function StudentForm({
  courses,
  defaultValues,
  onSubmit,
  submitLabel,
  className,
}: {
  courses: Course[];
  defaultValues?: StudentFormValues;
  onSubmit: (values: StudentFormValues) => void | Promise<void>;
  submitLabel: string;
  className?: string;
}) {
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: defaultValues ?? {
      firstName: "",
      lastName: "",
      email: "",
      year: "Freshman",
      major: "",
      notes: "",
      grades: [],
      attributes: [],
    },
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const grades = useFieldArray({ control, name: "grades" });
  const attributes = useFieldArray({ control, name: "attributes" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-6", className)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">First name</label>
          <Input {...register("firstName")} placeholder="Ava" />
          {errors.firstName ? <p className="text-xs text-rose-600">{errors.firstName.message}</p> : null}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Last name</label>
          <Input {...register("lastName")} placeholder="Henderson" />
          {errors.lastName ? <p className="text-xs text-rose-600">{errors.lastName.message}</p> : null}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Email</label>
          <Input type="email" {...register("email")} placeholder="ava@university.edu" />
          {errors.email ? <p className="text-xs text-rose-600">{errors.email.message}</p> : null}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Year</label>
          <Select {...register("year")}>
            {["Freshman", "Sophomore", "Junior", "Senior", "Graduate"].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
          {errors.year ? <p className="text-xs text-rose-600">{errors.year.message}</p> : null}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Major</label>
          <Input {...register("major")} placeholder="Computer Science" />
          {errors.major ? <p className="text-xs text-rose-600">{errors.major.message}</p> : null}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Notes</label>
          <Textarea rows={3} {...register("notes")} placeholder="Optional student notes" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-semibold text-slate-900">Grades</h4>
            <p className="text-xs text-slate-500">Add one or more grades for enrolled courses.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              grades.append({
                courseId: courses[0]?.id ?? 0,
                score: 0,
              })
            }
          >
            + Add grade
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {grades.fields.length === 0 ? <p className="text-sm text-slate-500">No grades added yet.</p> : null}

          {grades.fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 md:grid-cols-[2fr_1fr_auto]">
              <div>
                <Select {...register(`grades.${index}.courseId` as const)}>
                  <option value="">Select course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.title}
                    </option>
                  ))}
                </Select>
                {errors.grades?.[index]?.courseId ? (
                  <p className="text-xs text-rose-600">{errors.grades[index]?.courseId?.message}</p>
                ) : null}
              </div>
              <div>
                <Input type="number" min={0} max={100} step={1} {...register(`grades.${index}.score` as const)} />
                {errors.grades?.[index]?.score ? (
                  <p className="text-xs text-rose-600">{errors.grades[index]?.score?.message}</p>
                ) : null}
              </div>
              <Button type="button" variant="ghost" onClick={() => grades.remove(index)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-semibold text-slate-900">Custom Attributes</h4>
            <p className="text-xs text-slate-500">Track scholarships, mentors, or custom tags.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => attributes.append({ key: "", value: "" })}>
            + Add attribute
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {attributes.fields.length === 0 ? (
            <p className="text-sm text-slate-500">No custom attributes added.</p>
          ) : null}

          {attributes.fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <div>
                <Input {...register(`attributes.${index}.key` as const)} placeholder="Attribute" />
                {errors.attributes?.[index]?.key ? (
                  <p className="text-xs text-rose-600">{errors.attributes[index]?.key?.message}</p>
                ) : null}
              </div>
              <div>
                <Input {...register(`attributes.${index}.value` as const)} placeholder="Value" />
                {errors.attributes?.[index]?.value ? (
                  <p className="text-xs text-rose-600">{errors.attributes[index]?.value?.message}</p>
                ) : null}
              </div>
              <Button type="button" variant="ghost" onClick={() => attributes.remove(index)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
