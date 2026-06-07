import { useState, useEffect, useRef, useCallback } from "react";

export function useTypewriter(text: string, speed = 30, enabled = true) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    indexRef.current = 0;
    setDisplayed("");
  }, []);

  useEffect(() => {
    if (!enabled || !text) {
      reset();
      return;
    }

    indexRef.current = 0;
    setDisplayed("");

    timerRef.current = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current > text.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }
      setDisplayed(text.slice(0, indexRef.current));
    }, speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text, speed, enabled, reset]);

  const isTyping = displayed.length < text.length && enabled;

  return { displayed, isTyping };
}
