"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import type { Faculty } from "@/types/academic";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/utils";

const instructorSchema = z.object({
  facultyId: z.preprocess(
    (value) => Number(value),
    z.number().min(1, "Select a faculty member"),
  ),
});

const metadataSchema = z.object({
  key: z.string().min(1, "Field name is required"),
  value: z.string().min(1, "Field value is required"),
});

const courseSchema = z.object({
  code: z.string().min(1, "Course code is required"),
  title: z.string().min(1, "Course title is required"),
  department: z.string().min(1, "Department is required"),
  credits: z.preprocess(
    (value) => Number(value),
    z
      .number()
      .min(1, "Credits must be at least 1")
      .max(10, "Credits must be <= 10"),
  ),
  description: z.string().optional(),
  instructors: z.array(instructorSchema).default([]),
  metadata: z.array(metadataSchema).default([]),
});

export type CourseFormValues = z.infer<typeof courseSchema>;

export function CourseForm({
  faculty,
  defaultValues,
  onSubmit,
  submitLabel,
  className,
}: {
  faculty: Faculty[];
  defaultValues?: CourseFormValues;
  onSubmit: (values: CourseFormValues) => void | Promise<void>;
  submitLabel: string;
  className?: string;
}) {
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: defaultValues ?? {
      code: "",
      title: "",
      department: "",
      credits: 3,
      description: "",
      instructors: [],
      metadata: [],
    },
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const instructors = useFieldArray({ control, name: "instructors" });
  const metadata = useFieldArray({ control, name: "metadata" });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-6", className)}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Course code
          </label>
          <Input {...register("code")} placeholder="CS-320" />
          {errors.code ? (
            <p className="text-xs text-rose-600">{errors.code.message}</p>
          ) : null}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Title</label>
          <Input
            {...register("title")}
            placeholder="Applied Machine Learning"
          />
          {errors.title ? (
            <p className="text-xs text-rose-600">{errors.title.message}</p>
          ) : null}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">
            Department
          </label>
          <Input {...register("department")} placeholder="Computer Science" />
          {errors.department ? (
            <p className="text-xs text-rose-600">{errors.department.message}</p>
          ) : null}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Credits</label>
          <Input type="number" min={1} max={10} {...register("credits")} />
          {errors.credits ? (
            <p className="text-xs text-rose-600">{errors.credits.message}</p>
          ) : null}
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-slate-700">
            Description
          </label>
          <Textarea
            rows={3}
            {...register("description")}
            placeholder="Optional course description"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-semibold text-slate-900">
              Instructors
            </h4>
            <p className="text-xs text-slate-500">
              Assign multiple faculty members to this course.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              instructors.append({ facultyId: faculty[0]?.id ?? 0 })
            }
          >
            + Add instructor
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {instructors.fields.length === 0 ? (
            <p className="text-sm text-slate-500">
              No instructors assigned yet.
            </p>
          ) : null}
          {instructors.fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div>
                <Select
                  {...register(`instructors.${index}.facultyId` as const)}
                >
                  <option value="">Select faculty</option>
                  {faculty.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} · {member.department}
                    </option>
                  ))}
                </Select>
                {errors.instructors?.[index]?.facultyId ? (
                  <p className="text-xs text-rose-600">
                    {errors.instructors[index]?.facultyId?.message}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => instructors.remove(index)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-semibold text-slate-900">Metadata</h4>
            <p className="text-xs text-slate-500">
              Add custom metadata fields for reporting.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => metadata.append({ key: "", value: "" })}
          >
            + Add field
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {metadata.fields.length === 0 ? (
            <p className="text-sm text-slate-500">No metadata fields added.</p>
          ) : null}
          {metadata.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
            >
              <div>
                <Input
                  {...register(`metadata.${index}.key` as const)}
                  placeholder="Field name"
                />
                {errors.metadata?.[index]?.key ? (
                  <p className="text-xs text-rose-600">
                    {errors.metadata[index]?.key?.message}
                  </p>
                ) : null}
              </div>
              <div>
                <Input
                  {...register(`metadata.${index}.value` as const)}
                  placeholder="Field value"
                />
                {errors.metadata?.[index]?.value ? (
                  <p className="text-xs text-rose-600">
                    {errors.metadata[index]?.value?.message}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => metadata.remove(index)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
