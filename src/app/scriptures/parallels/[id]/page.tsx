import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getParallelMatrix, listParallelMatrices } from "@/lib/parallels/server";
import MatrixView from "./MatrixView";

export async function generateStaticParams() {
  const matrices = await listParallelMatrices();
  return matrices.map((m) => ({ id: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const matrix = await getParallelMatrix(id);
  if (!matrix) return { title: "Parallel Comparison Not Found" };

  return {
    title: `${matrix.title} · Parallel Claim Matrix`,
    description: matrix.summary,
    openGraph: {
      title: `${matrix.title} · Parallel Claim Matrix`,
      description: matrix.summary,
    },
  };
}

export default async function ParallelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const matrix = await getParallelMatrix(id);
  if (!matrix) notFound();

  return <MatrixView matrix={matrix} />;
}
