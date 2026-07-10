"use client";

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { HeroIllustration } from "./HeroIllustration";
import { dictionary, type Locale } from "@/lib/i18n";

export function Hero({ locale }: { locale: Locale }) {
  const t = dictionary[locale];
  const rootRef = useRef<HTMLElement>(null);
  const words = t.heroTitle.split(" ");
  const signalFrames = useMemo(
    () =>
      locale === "ru"
        ? ["Startups / Verdicts", "Data / No hype", "Risk / Market / Money", "Signal / Not noise"]
        : ["Startaplar / Verdict", "Data / Hype emas", "Risk / Bozor / Pul", "Signal / Shovqin emas"],
    [locale]
  );
  const [signalText, setSignalText] = useState(signalFrames[0]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const introEls = [
        root.querySelector(".kicker"),
        root.querySelector(".signal-pill"),
        root.querySelector(".hero-copy"),
        ...root.querySelectorAll(".hero-actions .button")
      ].filter(Boolean) as Element[];
      const wordEls = root.querySelectorAll(".word-mask .word");

      const hexPolygon = root.querySelector(".hero-illustration-hex polygon") as SVGPolygonElement | null;
      const circuitPath = root.querySelector(".hero-illustration-line path") as SVGPathElement | null;

      gsap.set(introEls, { opacity: 0, y: 16 });
      gsap.set(wordEls, { opacity: 0, y: 24 });

      if (reduceMotion) {
        gsap.set([introEls, wordEls], { opacity: 1, y: 0, rotate: 0 });
        if (hexPolygon) gsap.set(hexPolygon, { strokeDashoffset: 0 });
        if (circuitPath) gsap.set(circuitPath, { strokeDashoffset: 0 });
        return;
      }

      if (hexPolygon) {
        const hexLength = hexPolygon.getTotalLength();
        gsap.set(hexPolygon, { strokeDasharray: hexLength, strokeDashoffset: hexLength });
      }
      if (circuitPath) {
        const circuitLength = circuitPath.getTotalLength();
        gsap.set(circuitPath, { strokeDasharray: circuitLength, strokeDashoffset: circuitLength });
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.15 });

      tl.to(hexPolygon, { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut" }, 0)
        .to(circuitPath, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, 0.25)
        .to(introEls, { opacity: 1, y: 0, stagger: 0.08, duration: 0.55 }, 0.05)
        .to(wordEls, { y: 0, stagger: 0.05, duration: 0.7 }, 0.1);
    }, root);

    return () => {
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setSignalText(signalFrames[0]);
      return undefined;
    }

    let alive = true;
    let timeout = 0;
    let phraseIndex = 0;
    let charIndex = 0;
    let phase: "typing" | "holding" | "erasing" = "typing";

    const tick = () => {
      if (!alive) return;
      const phrase = signalFrames[phraseIndex];

      if (phase === "typing") {
        charIndex += 1;
        setSignalText(phrase.slice(0, charIndex));
        if (charIndex >= phrase.length) {
          phase = "holding";
          timeout = window.setTimeout(tick, 1100);
          return;
        }
        timeout = window.setTimeout(tick, 80);
        return;
      }

      if (phase === "holding") {
        phase = "erasing";
        timeout = window.setTimeout(tick, 180);
        return;
      }

      if (phase === "erasing") {
        charIndex -= 1;
        setSignalText(phrase.slice(0, Math.max(0, charIndex)));
        if (charIndex <= 0) {
          phraseIndex = (phraseIndex + 1) % signalFrames.length;
          phase = "typing";
          charIndex = 0;
          timeout = window.setTimeout(tick, 220);
          return;
        }
        timeout = window.setTimeout(tick, 32);
        return;
      }

    };

    timeout = window.setTimeout(tick, 220);
    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, [signalFrames]);

  return (
    <section className="hero" ref={rootRef}>
      <div className="hero-aurora" />
      <div className="hero-content">
        <div className="hero-label-row">
          <p className="kicker">{t.heroKicker}</p>
          <span className="signal-pill" aria-live="off">
            <span className="signal-pill-text">{signalText}</span>
            <span className="signal-cursor" aria-hidden="true">
              |
            </span>
          </span>
        </div>
        <h1>
          {words.map((word, i) => (
            <Fragment key={i}>
              <span className="word-mask">
                <span className="word">{word}</span>
              </span>
              {i < words.length - 1 ? " " : ""}
            </Fragment>
          ))}
        </h1>
        <p className="hero-copy">{t.heroCopy}</p>
        <div className="hero-actions">
          <a className="button primary" href="#feed">
            {t.heroCta}
          </a>
          <a className="button ghost" href="#position">
            {t.heroSecondary}
          </a>
        </div>
      </div>
      <div className="hero-visual">
        <HeroIllustration locale={locale} />
      </div>
    </section>
  );
}
