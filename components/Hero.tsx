"use client";

import { Fragment, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { HeroIllustration } from "./HeroIllustration";
import { dictionary, type Locale } from "@/lib/i18n";

const CARD_ROTATIONS: Record<string, number> = {
  "card-a": -4,
  "card-b": 3,
  "card-c": -2
};

export function Hero({ locale }: { locale: Locale }) {
  const t = dictionary[locale];
  const rootRef = useRef<HTMLElement>(null);
  const words = t.heroTitle.split(" ");

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanupFns: Array<() => void> = [];

    const ctx = gsap.context(() => {
      const introEls = [
        root.querySelector(".kicker"),
        root.querySelector(".signal-pill"),
        root.querySelector(".hero-copy"),
        ...root.querySelectorAll(".hero-actions .button")
      ].filter(Boolean) as Element[];
      const wordEls = root.querySelectorAll(".word-mask .word");

      const hexPolygon = root.querySelector(".hero-illustration-hex polygon") as SVGPolygonElement | null;
      const hexGroup = root.querySelector(".hero-illustration-hex") as SVGSVGElement | null;
      const circuitPath = root.querySelector(".hero-illustration-line path") as SVGPathElement | null;
      const circuitDots = root.querySelectorAll(".hero-illustration-line circle:not(.circuit-pulse)");
      const pulseDot = root.querySelector(".circuit-pulse") as SVGCircleElement | null;
      const cards = root.querySelectorAll<HTMLElement>(".hero-illustration-card");
      const aurora = root.querySelector(".hero-aurora");

      if (reduceMotion) {
        gsap.set([introEls, wordEls], { opacity: 1, y: 0, rotate: 0 });
        gsap.set(cards, { opacity: 1, scale: 1, y: 0, rotate: (i, el) => CARD_ROTATIONS[(el as HTMLElement).classList[1] ?? ""] ?? 0 });
        if (hexPolygon) gsap.set(hexPolygon, { strokeDashoffset: 0 });
        if (circuitPath) gsap.set(circuitPath, { strokeDashoffset: 0 });
        gsap.set(circuitDots, { opacity: 1, scale: 1 });
        return;
      }

      gsap.set(circuitDots, { opacity: 0, scale: 0 });

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
        .to(circuitDots, { opacity: 1, scale: 1, duration: 0.35, stagger: 0.09, ease: "back.out(3)" }, 0.4);

      // idle loops, start once the entrance settles
      cards.forEach((card, i) => {
        gsap.to(card, {
          y: "+=9",
          duration: 2.6 + i * 0.35,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1.6 + i * 0.2
        });
      });

      if (hexGroup) {
        gsap.to(hexGroup, {
          rotate: "+=360",
          transformOrigin: "50% 50%",
          duration: 100,
          repeat: -1,
          ease: "none",
          delay: 1.4
        });
      }

      gsap.to(circuitDots, {
        opacity: 0.35,
        duration: 1.3,
        repeat: -1,
        yoyo: true,
        stagger: 0.35,
        ease: "sine.inOut",
        delay: 1.9
      });

      // a live "data pulse" runs the length of the circuit — a signature
      // touch tied to the logo's own line-and-node motif, not a stock
      // fade/slide pattern.
      if (circuitPath && pulseDot) {
        const len = circuitPath.getTotalLength();
        const pulseTl = gsap.timeline({ repeat: -1, delay: 2.1, repeatDelay: 0.4 });
        pulseTl
          .set(pulseDot, { opacity: 0 })
          .to(pulseDot, { opacity: 1, duration: 0.15 })
          .to(
            {},
            {
              duration: 1.6,
              ease: "power1.inOut",
              onUpdate() {
                const pt = circuitPath.getPointAtLength(this.progress() * len);
                pulseDot.setAttribute("cx", String(pt.x));
                pulseDot.setAttribute("cy", String(pt.y));
              }
            },
            "<"
          )
          .to(pulseDot, { opacity: 0, duration: 0.2 }, "-=0.2");
      }

      if (aurora) {
        gsap.to(aurora, {
          backgroundPosition: "75% 60%, 20% 35%",
          duration: 9,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }

      // magnetic CTAs — buttons lean toward the cursor within their box
      const buttons = root.querySelectorAll<HTMLElement>(".hero-actions .button");
      buttons.forEach((btn) => {
        const qx = gsap.quickTo(btn, "x", { duration: 0.45, ease: "power3" });
        const qy = gsap.quickTo(btn, "y", { duration: 0.45, ease: "power3" });
        const onMove = (e: MouseEvent) => {
          const rect = btn.getBoundingClientRect();
          qx((e.clientX - (rect.left + rect.width / 2)) * 0.3);
          qy((e.clientY - (rect.top + rect.height / 2)) * 0.4);
        };
        const onLeave = () => {
          qx(0);
          qy(0);
        };
        btn.addEventListener("mousemove", onMove);
        btn.addEventListener("mouseleave", onLeave);
        cleanupFns.push(() => {
          btn.removeEventListener("mousemove", onMove);
          btn.removeEventListener("mouseleave", onLeave);
        });
      });

      // cursor-parallax tilt on the illustration panel
      const visual = root.querySelector<HTMLElement>(".hero-visual");
      const illo = root.querySelector<HTMLElement>(".hero-illustration");
      if (visual && illo) {
        const qrx = gsap.quickTo(illo, "rotationX", { duration: 0.6, ease: "power3" });
        const qry = gsap.quickTo(illo, "rotationY", { duration: 0.6, ease: "power3" });
        const onVisualMove = (e: MouseEvent) => {
          const rect = visual.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width - 0.5;
          const py = (e.clientY - rect.top) / rect.height - 0.5;
          qrx(py * -8);
          qry(px * 8);
        };
        const onVisualLeave = () => {
          qrx(0);
          qry(0);
        };
        visual.addEventListener("mousemove", onVisualMove);
        visual.addEventListener("mouseleave", onVisualLeave);
        cleanupFns.push(() => {
          visual.removeEventListener("mousemove", onVisualMove);
          visual.removeEventListener("mouseleave", onVisualLeave);
        });
      }
    }, root);

    return () => {
      cleanupFns.forEach((fn) => fn());
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
