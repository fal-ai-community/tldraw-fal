"use client";

import * as fal from "@fal-ai/serverless-client";
import { Tldraw } from "@tldraw/tldraw";

import "@tldraw/tldraw/tldraw.css";

fal.config({
  requestMiddleware: fal.withProxy({
    targetUrl: "/api/fal/proxy",
  }),
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className="fixed inset-0">
        <Tldraw />
      </div>
    </main>
  );
}
