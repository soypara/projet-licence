"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { uploadFiles } from "@/lib/uploadMedia";
import { usePopup } from "@/components/PopupProvider";
import PendingPhotos from "./PendingPhotos";
import { useAT } from "@/components/admin/AdminLanguage";

const EMPTY = { name: "", description: "", latitude: "", longitude: "" };

// Nombre saisi avec une virgule ou un point ("-18,9" ou "-18.9")
function toNumber(text) {
  const clean = String(text).trim().replace(",", ".");

  return clean === "" ? NaN : Number(clean);
}

// Ajout d'un lieu entièrement à la main : nom, description, coordonnées,
// photos depuis l'ordinateur. (La recherche en ligne reste disponible.)
export default function ManualPlaceForm() {
  const { showPopup } = usePopup();
  const { ta } = useAT();

  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function change(e) {
    const { name, value } = e.target;

    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function validate() {
    const found = {};
    const lat = toNumber(form.latitude);
    const lon = toNumber(form.longitude);

    if (form.name.trim().length < 2) {
      found.name = ta("a.plc.manual_err_name");
    }

    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      found.latitude = ta("a.plc.manual_err_lat");
    }

    if (Number.isNaN(lon) || lon < -180 || lon > 180) {
      found.longitude = ta("a.plc.manual_err_lon");
    }

    return { found, lat, lon };
  }

  async function save(lat, lon) {
    try {
      setSaving(true);

      const place = await api.post("/tourist-places", {
        name: form.name.trim(),
        description: form.description.trim(),
        latitude: lat,
        longitude: lon,
        source_url: "",
      });

      const failures = await uploadFiles("tourist_place", place.id, files);

      setForm(EMPTY);
      setFiles([]);

      showPopup({
        kind: failures.length ? "error" : "success",
        title: failures.length ? ta("a.plc.manual_popup_partial_title") : ta("a.plc.manual_popup_added_title"),
        message: failures.length
          ? ta("a.plc.manual_popup_partial_msg", { name: place.name, n: failures.length, error: failures[0].message })
          : ta("a.plc.manual_popup_added_msg", { name: place.name }),
      });
    } catch (err) {
      showPopup({
        kind: "error",
        title: ta("a.plc.manual_popup_fail_title"),
        message: err.message || ta("a.plc.manual_popup_fail_fallback"),
      });
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();

    const { found, lat, lon } = validate();

    if (Object.keys(found).length > 0) {
      setErrors(found);

      const messages = Object.values(found);

      showPopup({
        kind: "error",
        title: messages.length === 1 ? ta("a.plc.manual_popup_missing_one") : ta("a.plc.manual_popup_missing_many"),
        message: messages.length === 1 ? messages[0] : "",
        items: messages.length === 1 ? [] : messages,
      });

      return;
    }

    // Coordonnées hors de Madagascar : probablement une faute de frappe
    const inMadagascar = lat >= -26 && lat <= -11 && lon >= 43 && lon <= 51;

    if (!inMadagascar) {
      showPopup({
        kind: "error",
        title: ta("a.plc.manual_popup_outside_title"),
        message: ta("a.plc.manual_popup_outside_msg"),
        confirmLabel: ta("a.plc.manual_popup_outside_confirm"),
        cancelLabel: ta("a.plc.manual_popup_outside_cancel"),
        onConfirm: () => save(lat, lon),
      });

      return;
    }

    save(lat, lon);
  }

  const bad = (name) =>
    errors[name] ? "!border-red-500 !ring-1 !ring-red-500" : "";

  return (
    <form onSubmit={handleSubmit} noValidate className="adm-card mt-6 grid gap-5">
      <p className="adm-note">
        {ta("a.plc.manual_intro")}
      </p>

      <div>
        <label htmlFor="m-name" className="adm-label">
          {ta("a.plc.manual_label_name")}
        </label>
        <input
          id="m-name"
          name="name"
          value={form.name}
          onChange={change}
          className={`adm-input ${bad("name")}`}
        />
        {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="m-desc" className="adm-label">
          {ta("a.plc.manual_label_description")}
        </label>
        <textarea
          id="m-desc"
          name="description"
          rows={5}
          value={form.description}
          onChange={change}
          className="adm-input"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="m-lat" className="adm-label">
            {ta("a.plc.manual_label_lat")}
          </label>
          <input
            id="m-lat"
            name="latitude"
            inputMode="decimal"
            placeholder={ta("a.plc.manual_lat_placeholder")}
            value={form.latitude}
            onChange={change}
            className={`adm-input ${bad("latitude")}`}
          />
          {errors.latitude && (
            <p className="mt-1 text-sm text-red-400">{errors.latitude}</p>
          )}
        </div>

        <div>
          <label htmlFor="m-lon" className="adm-label">
            {ta("a.plc.manual_label_lon")}
          </label>
          <input
            id="m-lon"
            name="longitude"
            inputMode="decimal"
            placeholder={ta("a.plc.manual_lon_placeholder")}
            value={form.longitude}
            onChange={change}
            className={`adm-input ${bad("longitude")}`}
          />
          {errors.longitude && (
            <p className="mt-1 text-sm text-red-400">{errors.longitude}</p>
          )}
        </div>
      </div>

      <p className="-mt-2 text-xs text-slate-500">
        {ta("a.plc.manual_range_hint")}
      </p>

      <div>
        <label className="adm-label">{ta("a.plc.manual_label_photos")}</label>
        <PendingPhotos files={files} onChange={setFiles} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" disabled={saving} className="adm-btn w-full sm:w-auto">
          {saving ? ta("a.plc.manual_saving") : ta("a.plc.manual_submit")}
        </button>

        <Link href="/admin/places/list" className="adm-btn-ghost w-full sm:w-auto">
          {ta("a.plc.existing_places")}
        </Link>
      </div>
    </form>
  );
}
