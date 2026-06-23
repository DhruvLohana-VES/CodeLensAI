"use client";

import { useCallback, useState } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUploadSimulator } from "@/hooks/use-upload-simulator";

export function UploadCard() {
  const {
    status,
    progress,
    fileName,
    error,
    selectFile,
    startUpload,
    reset,
  } = useUploadSimulator();
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragActive(false);
      const file = event.dataTransfer.files?.[0] ?? null;
      selectFile(file);
    },
    [selectFile],
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    selectFile(file);
  };

  return (
    <div
      className={cn(
        "relative rounded-3xl border border-white/10 bg-white/5 p-10 text-center",
        dragActive && "border-white/40 bg-white/10",
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
        <UploadCloud className="h-7 w-7" />
      </div>
      <h2 className="mt-6 text-xl font-semibold text-white">
        Upload resume PDF
      </h2>
      <p className="mt-2 text-sm text-white/60">
        Drag and drop a PDF or browse your files. We only accept PDFs.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm text-white hover:bg-white/20">
          Browse file
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleChange}
          />
        </label>
        {fileName ? (
          <p className="text-xs text-white/70">Selected: {fileName}</p>
        ) : null}
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </div>

      <div className="mt-8 space-y-3">
        {status === "uploading" ? (
          <div className="space-y-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white/70 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-white/60">Uploading... {progress}%</p>
          </div>
        ) : null}
        {status === "success" ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-left">
            <p className="text-sm font-semibold text-emerald-200">
              Upload complete
            </p>
            <p className="text-xs text-emerald-100/70">
              Your resume is ready for analysis.
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button
          className="w-full bg-white text-black hover:bg-white/90 sm:w-auto"
          disabled={!fileName || status === "uploading" || Boolean(error)}
          onClick={startUpload}
        >
          {status === "success" ? "Re-upload" : "Start upload"}
        </Button>
        <Button
          variant="outline"
          className="w-full border-white/20 text-white hover:bg-white/10 sm:w-auto"
          onClick={reset}
        >
          Reset
        </Button>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-60" />
    </div>
  );
}
