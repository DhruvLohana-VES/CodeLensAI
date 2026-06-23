"use client";

import { useCallback, useState } from "react";

export type UploadStatus = "idle" | "uploading" | "success";

type UploadState = {
  status: UploadStatus;
  progress: number;
  fileName: string | null;
  error: string | null;
  file: File | null;
};

const initialState: UploadState = {
  status: "idle",
  progress: 0,
  fileName: null,
  error: null,
  file: null,
};

export function useUploadSimulator() {
  const [state, setState] = useState<UploadState>(initialState);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const selectFile = useCallback((file: File | null) => {
    if (!file) {
      setState(initialState);
      return;
    }
    if (file.type !== "application/pdf") {
      setState({
        status: "idle",
        progress: 0,
        fileName: file.name,
        error: "Only PDF resumes are supported.",
        file: null,
      });
      return;
    }
    setState({
      status: "idle",
      progress: 0,
      fileName: file.name,
      error: null,
      file: file,
    });
  }, []);

  const startUpload = useCallback(() => {
    if (!state.file) return;

    setState((prev) => ({ ...prev, status: "uploading", progress: 0, error: null }));

    const formData = new FormData();
    formData.append("file", state.file);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const xhr = new XMLHttpRequest();

    xhr.open("POST", `${apiUrl}/api/v1/resume/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const pct = Math.round((event.loaded / event.total) * 100);
        // Scale to 95% during upload, set 100% on response load
        setState((prev) => ({ ...prev, progress: Math.min(pct, 95) }));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.analysis) {
            // Persist the analysis in localStorage for immediate client routing sync
            localStorage.setItem("current_resume_analysis", JSON.stringify(res.analysis));
            setState((prev) => ({ ...prev, progress: 100, status: "success" }));
            
            // Redirect to analysis page after a short delay
            setTimeout(() => {
              window.location.href = "/resume/analysis";
            }, 800);
          } else {
            setState((prev) => ({
              ...prev,
              status: "idle",
              progress: 0,
              error: "Upload succeeded but failed to parse analysis details.",
            }));
          }
        } catch (e) {
          setState((prev) => ({
            ...prev,
            status: "idle",
            progress: 0,
            error: "Failed to read server response.",
          }));
        }
      } else {
        let errMsg = "Upload failed. Verify backend server is running.";
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.detail && res.detail.details) {
            errMsg = res.detail.details;
          }
        } catch (e) {}
        setState((prev) => ({
          ...prev,
          status: "idle",
          progress: 0,
          error: errMsg,
        }));
      }
    };

    xhr.onerror = () => {
      setState((prev) => ({
        ...prev,
        status: "idle",
        progress: 0,
        error: "Network error. Please verify the backend is running at " + apiUrl,
      }));
    };

    xhr.send(formData);
  }, [state.file]);

  return {
    ...state,
    reset,
    selectFile,
    startUpload,
  };
}

