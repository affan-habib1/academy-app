import type { Grade } from "@/types/academic";

export function groupEnrollmentsByMonth(grades: Grade[]) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });
  const tally = new Map<string, number>();

  grades.forEach((grade) => {
    const key = formatter.format(new Date(grade.createdAt));
    tally.set(key, (tally.get(key) ?? 0) + 1);
  });

  return Array.from(tally.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => new Date(`1 ${a.label}`).getTime() - new Date(`1 ${b.label}`).getTime());
}
