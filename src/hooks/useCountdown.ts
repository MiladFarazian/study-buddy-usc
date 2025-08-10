import { useEffect, useMemo, useState } from "react";

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

export function useCountdown(targetISO: string | Date | null | undefined): Countdown {
  const targetTime = useMemo(() => {
    if (!targetISO) return null;
    return typeof targetISO === "string" ? new Date(targetISO).getTime() : targetISO.getTime();
  }, [targetISO]);

  const calc = () => {
    if (!targetTime) return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
    const now = Date.now();
    const totalMs = targetTime - now;
    const totalSec = Math.max(Math.floor(totalMs / 1000), -86400);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = Math.floor(totalSec % 60);
    return { days, hours, minutes, seconds, totalMs };
  };

  const [state, setState] = useState<Countdown>(calc());

  useEffect(() => {
    const id = setInterval(() => setState(calc()), 1000);
    return () => clearInterval(id);
  }, [targetTime]);

  return state;
}

export function useJoinWindow(startISO: string, endISO?: string, earlyMinutes = 10) {
  const start = useMemo(() => new Date(startISO), [startISO]);
  const end = useMemo(() => (endISO ? new Date(endISO) : undefined), [endISO]);
  const { totalMs } = useCountdown(start);

  const msEarly = earlyMinutes * 60 * 1000;
  const now = Date.now();
  const canJoinByEarly = start.getTime() - now <= msEarly;
  const hasStarted = now >= start.getTime();
  const notEnded = end ? now <= end.getTime() : true;
  const canJoinNow = (canJoinByEarly || hasStarted) && notEnded;

  return {
    canJoinNow,
    msUntilJoin: Math.max(start.getTime() - msEarly - now, 0),
  };
}
