"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function DisposalPage() {

const { data: session, status } = useSession();
const router = useRouter();

const [wasteName, setWasteName] = useState("");
const [aiDate, setAiDate] = useState("");
const [generating, setGenerating] = useState(false);
const [message, setMessage] = useState("");
const [events, setEvents] = useState([]);
const [selectedDate, setSelectedDate] = useState(null);

/* ---------------- FETCH EVENTS ---------------- */

const fetchEvents = useCallback(async () => {
if (status !== "authenticated") return;

try {
  const res = await fetch("/api/markDate");
  const data = await res.json();

  if (res.ok && data?.events) {
    setEvents(data.events);
  }

} catch (err) {
  console.error("Failed to fetch events", err);
}

}, [status]);

useEffect(() => {

if (status === "unauthenticated") {
  router.push("/login");
}

if (status === "authenticated") {
  fetchEvents();
}


}, [status, fetchEvents, router]);

/* ---------------- AI DATE GENERATION ---------------- */

const triggerGenerate = async () => {

if (!wasteName) return;

setGenerating(true);
setMessage("");

try {

  const form = new FormData();
  form.append("wasteName", wasteName);

  const res = await fetch("/api/generateDate", {
    method: "POST",
    body: form
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data?.error);

  setAiDate(data.disposalDate);
  setSelectedDate(new Date(data.disposalDate));

  setMessage("AI suggested date: " + data.disposalDate);

  await fetchEvents();

} catch (err) {

  console.error(err);
  setMessage("Failed to generate AI date");

} finally {
  setGenerating(false);
}

};

/* ---------------- SCHEDULE EVENT ---------------- */

const scheduleDisposal = async (e) => {

e.preventDefault();

if (!aiDate) {
  setMessage("Generate AI date first");
  return;
}

try {

  const res = await fetch("/api/markDate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: wasteName,
      date: aiDate
    })
  });

  if (!res.ok) throw new Error("Failed");

  setMessage("Disposal scheduled");

  await fetchEvents();

  setWasteName("");
  setAiDate("");

} catch (err) {

  console.error(err);
  setMessage("Scheduling failed");

}

};

/* ---------------- DELETE EVENT ---------------- */

const deleteEvent = async (id) => {

try {

  await fetch("/api/markDate", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ id })
  });

  await fetchEvents();

} catch (err) {

  console.error("Delete error", err);

}

};

/* ---------------- CALENDAR EVENTS ---------------- */

const calendarEvents = events.map((ev) => ({
id: ev.id,
title: ev.title,
date: ev.date
}));

/* ---------------- PAGE UI ---------------- */

return (
<div className="min-h-screen bg-gray-900 text-gray-200 p-6">

  <div className="max-w-5xl mx-auto">

    <h1 className="text-2xl font-semibold mb-6">
      Quick Disposal (Individual)
    </h1>

    {/* Waste Form */}

    <form
      onSubmit={scheduleDisposal}
      className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4"
    >

      <div>

        <label className="text-sm text-gray-300 block">
          Waste Item
        </label>

        <input
          value={wasteName}
          onChange={(e) => setWasteName(e.target.value)}
          placeholder="Plastic Bottle"
          className="mt-1 w-full p-2 rounded bg-gray-900 text-white"
        />

      </div>

      <div>

        <button
          type="button"
          onClick={triggerGenerate}
          className="px-4 py-2 bg-blue-600 rounded text-white"
        >

          {generating ? "Generating..." : "Generate AI Date"}

        </button>

      </div>

      <div>

        <div className="text-green-400">

          {aiDate ? "Suggested Date: " + aiDate : ""}

        </div>

      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-emerald-600 rounded text-white"
      >
        Schedule Disposal
      </button>

      {message && (
        <div className="text-sm text-gray-300">
          {message}
        </div>
      )}

    </form>

    {/* Calendar */}

    <div className="mt-10 bg-gray-800 p-4 rounded-lg border border-gray-700">

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height="auto"
        events={calendarEvents}

        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: ""
        }}

        eventColor="#8b5cf6"

        dateClick={(info) => {
          setSelectedDate(new Date(info.dateStr));
        }}

        eventClick={(info) => {

          const confirmDelete = confirm(
            "Delete this event?"
          );

          if (confirmDelete) {
            deleteEvent(info.event.id);
          }

        }}
      />

    </div>

  </div>

</div>

);
}
