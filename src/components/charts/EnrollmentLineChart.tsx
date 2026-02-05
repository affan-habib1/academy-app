"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function EnrollmentLineChart({ categories, data }: { categories: string[]; data: number[] }) {
  const options: ApexOptions = {
    chart: {
      toolbar: { show: false },
      foreColor: "#475569",
    },
    stroke: { curve: "smooth", width: 3 },
    dataLabels: { enabled: false },
    xaxis: { categories },
    colors: ["#6366f1"],
    grid: { strokeDashArray: 4, borderColor: "#e2e8f0" },
  };

  const series = [{ name: "Enrollments", data }];

  return <Chart options={options} series={series} type="line" height={320} />;
}
