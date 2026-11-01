import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getParallelMatrix, listParallelMatrices } from "@/lib/parallels/server";
import MatrixView from "./MatrixView";
import StudyContextBanner from "../../_components/StudyContextBanner";
import { resolveStudyContext } from "@/lib/scriptures/server/study-context";
import { studyToolHref, type StudySearchParams } from "@/lib/scriptures/study-context";

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
    alternates: { canonical: `/scriptures/parallels/${matrix.slug}` },
    openGraph: {
      title: `${matrix.title} · Parallel Claim Matrix`,
      description: matrix.summary,
      url: `/scriptures/parallels/${matrix.slug}`,
      images: ["/worlds/scriptures.jpg"],
    },
  };
}

export default async function ParallelPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<StudySearchParams>;
}) {
  const { id } = await params;
  const matrix = await getParallelMatrix(id);
  if (!matrix) notFound();
  const study = await resolveStudyContext(await searchParams ?? {});

  return <>
    <StudyContextBanner {...study} note="This comparison uses its own selected sources. Your starting verse stays available above so you can return to reading." />
    <MatrixView matrix={matrix} returnHref={study.context ? studyToolHref("/scriptures/parallels", study.context) : "/scriptures/parallels"} />
  </>;
}
