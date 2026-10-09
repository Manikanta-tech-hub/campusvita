"use client";

import { useEffect, useRef } from "react";

const FRAME_COUNT = 84;

// How much of the original frame to crop horizontally.
// Increase this if you want the burger larger.
const CROP_X = 0.10;

export default function BurgerScroll() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    // ============================================================
    // LOAD FRAMES
    // ============================================================

    const images: HTMLImageElement[] = [];

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const image = new Image();

      image.src =
        `/burger-frames/frame_${String(i).padStart(3, "0")}.jpg`;

      images.push(image);
    }

    imagesRef.current = images;

    // ============================================================
    // DRAW FRAME
    // ============================================================

    const drawFrame = (frameIndex: number) => {
      const image = images[frameIndex];

      if (
        !image ||
        !image.complete ||
        image.naturalWidth === 0
      ) {
        return;
      }

      const width = window.innerWidth;
      const height = window.innerHeight;

      const dpr = window.devicePixelRatio || 1;

      // High-resolution canvas
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );

      context.clearRect(
        0,
        0,
        width,
        height
      );

      // ========================================================
      // CROP SOURCE IMAGE
      // ========================================================

      const sourceWidth = image.naturalWidth;
      const sourceHeight = image.naturalHeight;

      /*
       * Original:
       *
       *  ┌───────────────────────────────┐
       *  │                               │
       *  │          BURGER               │
       *  │                               │
       *  └───────────────────────────────┘
       *
       * We remove some of the empty sides.
       */

      const cropAmount =
        sourceWidth * CROP_X;

      const sourceX = cropAmount;

      const sourceCropWidth =
        sourceWidth - cropAmount * 2;

      // ========================================================
      // SCALE CROPPED IMAGE TO SCREEN
      // ========================================================

      const scaleX =
        width / sourceCropWidth;

      const scaleY =
        height / sourceHeight;

      /*
       * Cover the entire hero.
       *
       * This guarantees there is no empty
       * space on the left or right.
       */
      const scale = Math.max(
        scaleX,
        scaleY
      );

      const drawWidth =
        sourceCropWidth * scale;

      const drawHeight =
        sourceHeight * scale;

      const x =
        (width - drawWidth) / 2 ;

      const y =
        (height - drawHeight) / 2;

      context.drawImage(
        image,

        // SOURCE
        sourceX,
        0,
        sourceCropWidth,
        sourceHeight,

        // DESTINATION
        x,
        y,
        drawWidth,
        drawHeight
      );
    };

    // ============================================================
    // FIRST FRAME
    // ============================================================

    images[0].onload = () => {
      drawFrame(0);
    };

    // ============================================================
    // SCROLL → FRAME
    // ============================================================

    const handleScroll = () => {
      const section = canvas.closest(
        ".burger-scroll-section"
      ) as HTMLElement | null;

      if (!section) return;

      const rect =
        section.getBoundingClientRect();

      const scrollDistance =
        section.clientHeight -
        window.innerHeight;

      if (scrollDistance <= 0) return;

      const progress = Math.min(
        Math.max(
          -rect.top / scrollDistance,
          0
        ),
        1
      );

      const frameIndex = Math.round(
        progress * (FRAME_COUNT - 1)
      );

      if (
        frameIndex ===
        currentFrameRef.current
      ) {
        return;
      }

      currentFrameRef.current =
        frameIndex;

      if (requestRef.current !== null) {
        cancelAnimationFrame(
          requestRef.current
        );
      }

      requestRef.current =
        requestAnimationFrame(() => {
          drawFrame(frameIndex);
        });
    };

    // ============================================================
    // RESIZE
    // ============================================================

    const handleResize = () => {
      drawFrame(
        currentFrameRef.current
      );
    };

    // ============================================================
    // EVENTS
    // ============================================================

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    window.addEventListener(
      "resize",
      handleResize
    );

    // Initial frame
    handleScroll();

    // ============================================================
    // CLEANUP
    // ============================================================

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );

      window.removeEventListener(
        "resize",
        handleResize
      );

      if (requestRef.current !== null) {
        cancelAnimationFrame(
          requestRef.current
        );
      }
    };
  }, []);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <section
      className="burger-scroll-section"
      style={{
        position: "relative",
        width: "100%",
        height: "180vh",
      }}
    >
      <div
        className="burger-scroll-viewport"
        style={{
          position: "sticky",
          top: 0,

          width: "100%",
          height: "100vh",

          overflow: "hidden",

          background: "#e5e5e5",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block",

            width: "100%",
            height: "100%",

            margin: 0,
            padding: 0,
          }}
        />

        {/* ====================================================
            BRAND LOGO
            Positioned above the burger canvas (canvas is not
            positioned, so any positioned + z-index element
            paints over it). pointer-events stay disabled so the
            logo never blocks scroll or clicks.
        ==================================================== */}

        <img
          src="/branding/logo.png"
          alt="CampusVita"
          className="
            pointer-events-none
            absolute
            z-[3]
            left-[clamp(16px,3.2vw,40px)]
            top-[clamp(16px,2.4vw,30px)]
            w-[clamp(95px,13.7vw,211px)]
            h-auto
            max-w-[max(72px,calc(46.8vw_-_54px))]
            object-contain
            md:max-w-[max(72px,calc(46.8vw_-_285px))]
          "
        />

<div
  style={{
    position: "absolute",
    left: "1%",
    top: "50%",
    transform: "translateY(-50%)",
    width: "36%",
    maxWidth: "520px",
    zIndex: 2,
    pointerEvents: "none",
  }}
>
  {/* EYEBROW */}
  <p
    style={{
      margin: 0,
      marginBottom: "1.25rem",
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: "#525252",
    }}
  >
    CampusVita · Your campus, your food
  </p>

  {/* MAIN HEADING */}
  <h1
    style={{
      margin: 0,
      fontSize: "clamp(2.8rem, 5vw, 5.5rem)",
      fontWeight: 750,
      lineHeight: 0.95,
      letterSpacing: "-0.055em",
      color: "#171717",
    }}
  >
    Good food.
    <br />
    Better campus days.
  </h1>

  {/* DESCRIPTION */}
  <p
    style={{
      marginTop: "1.75rem",
      marginBottom: 0,
      maxWidth: "430px",
      fontSize: "clamp(1rem, 1.35vw, 1.2rem)",
      lineHeight: 1.55,
      color: "#525252",
    }}
  >
    Discover what&apos;s cooking around you, find your
    favorites, and make every campus break worth it.
  </p>

  {/* CTA */}
  <div
    style={{
      marginTop: "2rem",
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      fontSize: "0.95rem",
      fontWeight: 700,
      color: "#171717",
    }}
  >
    <span>Explore food</span>
    <span style={{ fontSize: "1.2rem" }}>→</span>
  </div>
</div>

      </div>
    </section>
  );
}