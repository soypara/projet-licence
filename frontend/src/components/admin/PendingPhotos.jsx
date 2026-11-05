"use client";

import { useEffect, useMemo } from "react";
import { useAT } from "@/components/admin/AdminLanguage";

// Choix des photos AVANT la création : elles sont envoyées dès que le
// circuit est enregistré (il faut d'abord son identifiant).
export default function PendingPhotos({ files, onChange }) {
  const { ta } = useAT();
  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        isVideo: file.type.startsWith("video"),
      })),
    [files]
  );

  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [previews]);

  function handlePick(event) {
    const picked = Array.from(event.target.files || []);
    event.target.value = "";

    if (picked.length) onChange([...files, ...picked]);
  }

  function remove(index) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div>
      {previews.length === 0 ? (
        <p className="py-2 text-sm text-slate-500">{ta("a.cir.pending_none")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {previews.map((p, index) => (
            <div
              key={`${p.file.name}-${index}`}
              className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950"
            >
              {p.isVideo ? (
                <video src={p.url} className="h-24 w-full object-cover" />
              ) : (
                <img src={p.url} alt="" className="h-24 w-full object-cover" />
              )}

              <div className="flex items-center justify-between gap-2 p-2">
                <span className="truncate text-xs text-slate-400">
                  {p.file.name}
                </span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="adm-btn-danger !px-2 !py-1 !text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className="adm-btn-ghost mt-3 w-full cursor-pointer sm:w-auto">
        {ta("a.cir.pending_choose")}
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handlePick}
          className="hidden"
        />
      </label>
    </div>
  );
}
