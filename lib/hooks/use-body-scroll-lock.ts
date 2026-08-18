"use client";

import { useEffect } from "react";

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof document === "undefined") {
      return;
    }

    const { body } = document;
    const scrollY = window.scrollY;
    const previousOverflow = body.style.overflow;
    const previousPosition = body.style.position;
    const previousTop = body.style.top;
    const previousWidth = body.style.width;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      body.style.overflow = previousOverflow;
      body.style.position = previousPosition;
      body.style.top = previousTop;
      body.style.width = previousWidth;
      // "auto" burada global `scroll-behavior: smooth` (app/globals.css)
      // kuralına uyar ve kapanışta sayfanın en üstünden eski konumuna
      // görünür şekilde kayması gibi bir animasyona yol açar — "instant"
      // bu CSS kuralını atlayıp anlık zıplama sağlar.
      window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
    };
  }, [locked]);
}
