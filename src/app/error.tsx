"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container">
      <h1>A little pause.</h1>
      <p>This page could not load. Your saved work remains in your account.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
