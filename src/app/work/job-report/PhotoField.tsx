import Image from "next/image";
import { useRef } from "react";
import { Button } from "@/app/_components/Button";
import type { ReportPhoto } from "@/lib/job-report/model";
import styles from "./page.module.css";

export default function PhotoField({ phase, photo, onChange, onRemove, disabled }: {
  phase: "before" | "after";
  photo: ReportPhoto | null;
  onChange: (file: File) => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  const title = phase === "before" ? "Before photo" : "After photo";
  const camera = useRef<HTMLInputElement>(null);
  function selected(input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = "";
    if (file) onChange(file);
  }
  return (
    <div className={styles.photoField}>
      <label htmlFor={`photo-${phase}`}>{title}</label>
      {photo && <Image src={photo.dataUrl} width={photo.width} height={photo.height} alt={`${phase === "before" ? "Before" : "After"} photo selected for the report`} unoptimized className={styles.photoThumb} />}
      <input id={`photo-${phase}`} type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="photo-help" disabled={disabled} onChange={event => selected(event.currentTarget)} />
      <input ref={camera} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden tabIndex={-1} aria-label={`Camera capture for ${phase}`} disabled={disabled} onChange={event => selected(event.currentTarget)} />
      <div className={styles.photoButtons}>
        <Button size="sm" variant="ghost" disabled={disabled} onClick={() => camera.current?.click()}>Use camera for {phase} photo</Button>
        {photo && <Button size="sm" variant="ghost" disabled={disabled} onClick={onRemove}>Remove {phase} photo</Button>}
      </div>
    </div>
  );
}
