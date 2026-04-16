"use client";

import { useEffect, useRef, useState } from "react";

export function useAnimatedCounter(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number | null>(null);
  const valueRef = useRef(0);

  useEffect(() => {
    const startValue = valueRef.current;
    const endValue = target || 0;

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    if (startValue === endValue) {
      return;
    }

    let start: number | null = null;
    const animate = (timestamp: number) => {
      if (start === null) {
        start = timestamp;
      }

      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.floor(startValue + (endValue - startValue) * eased);
      valueRef.current = nextValue;
      setValue(nextValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        valueRef.current = endValue;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target, duration]);

  return value;
}

export function useClock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return time;
}
