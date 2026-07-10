"use client";

import { Fragment, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { HeroIllustration } from "./HeroIllustration";
import { dictionary, type Locale } from "@/lib/i18n";

export function Hero({ locale }: { locale: Locale }) {
  const t = dictionary[locale];
  const rootRef = useRef<HTMLElement>(null);
  const words = t.heroTitle.split(" ");

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

  return (
    <section className="hero" ref={rootRef}>
      <div className="hero-aurora" />
      <div className="hero-content">
        <div className="hero-label-row">
          <p className="kicker">{t.heroKicker}</p>
          <span className="signal-pill">{t.heroSignal}</span>
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
