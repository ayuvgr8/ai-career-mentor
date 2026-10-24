import { useEffect, useState } from "react";

export function RoleConnection({ slug }: { slug: string }) {
  const [result, setResult] = useState<{
    why: string;
    quote: string;
    tradeoff: string;
  } | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    fetch(`/api/career/roles/${encodeURIComponent(slug)}/connection`, {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(setResult)
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [slug, attempt]);
  return (
    <div
      className="mt-5 border-t border-primary/20 pt-4 text-sm leading-7"
      aria-live="polite"
    >
      <h3 className="font-semibold">From your confirmed profile</h3>
      {result ? (
        <>
          <p className="mt-2">{result.why}</p>
          {result.quote && (
            <blockquote className="mt-3 border-l-2 border-primary pl-3">
              You said: “{result.quote}”
            </blockquote>
          )}
          <p className="mt-3">
            <b>Something to test:</b> {result.tradeoff}
          </p>
        </>
      ) : error ? (
        <>
          <p>
            Your personal connection could not load. The field notes above are
            general, not an assessment of you.
          </p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="mt-2 underline"
          >
            Retry connection
          </button>
        </>
      ) : (
        <p>Connecting your own words to this role…</p>
      )}
    </div>
  );
}
