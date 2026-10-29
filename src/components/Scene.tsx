import { useEffect, useRef } from "react";
import { KageLandingPage } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css";

export interface SceneProps {
  onReachEnd?: () => void;
}

export function Scene({ onReachEnd }: SceneProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root || !onReachEnd) return;

    const iframe = root.querySelector<HTMLIFrameElement>("iframe");
    if (!iframe) return;

    const attachHooks = () => {
      const win = iframe.contentWindow;
      const doc = iframe.contentDocument;
      if (!win || !doc) return;

      const cta = doc.querySelector<HTMLAnchorElement>(".fin .cta");
      if (cta) {
        cta.addEventListener("click", (e) => {
          e.preventDefault();
          onReachEnd();
        });
      }

      let overscrollCount = 0;
      win.addEventListener(
        "wheel",
        (e: WheelEvent) => {
          const scrollEl = doc.scrollingElement || doc.documentElement;
          const atBottom =
            scrollEl.scrollTop + win.innerHeight >= scrollEl.scrollHeight - 8;
          if (atBottom && e.deltaY > 0) {
            overscrollCount += Math.abs(e.deltaY);
            if (overscrollCount > 120) {
              overscrollCount = 0;
              onReachEnd();
            }
          } else {
            overscrollCount = 0;
          }
        },
        { passive: true }
      );
    };

    iframe.addEventListener("load", attachHooks);
    if (iframe.contentDocument?.readyState === "complete") {
      attachHooks();
    }

    return () => {
      iframe.removeEventListener("load", attachHooks);
    };
  }, [onReachEnd]);

  return (
    <div ref={containerRef} className="shader-frame w-full h-screen relative">
      <KageLandingPage
        headingFont="onest"
        bodyFont="onest"
        headingWeight="400"
        bodyWeight="300"
        primaryColor="#e0231c"
        headingSize={46}
        bodySize={17}
        headingLetterSpacing={-0.012}
      />
    </div>
  );
}

export default Scene;
