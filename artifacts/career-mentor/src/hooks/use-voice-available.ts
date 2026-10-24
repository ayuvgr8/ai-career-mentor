import { useEffect, useState } from 'react';

/**
 * False until the server reports voice as configured and verified; text chat
 * stays the fallback. Kept apart from VoiceMentor so the ElevenLabs SDK only
 * loads on the /voice page.
 */
export function useVoiceAvailable(): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/api/voice/status', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : { available: false }))
      .then((data: { available?: unknown }) => { if (active) setAvailable(data.available === true); })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  return available;
}
