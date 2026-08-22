"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const TextHoverEffect = ({
  text,
  duration,
  className,
}: {
  text: string;
  duration?: number;
  automatic?: boolean;
  className?: string;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });

  // Calculate dynamic viewBox width based on text length to prevent clipping titles
  const charWidth = 16;
  const viewBoxWidth = Math.max(350, text.length * charWidth);
  const viewBoxHeight = 70;

  useEffect(() => {
    if (svgRef.current && cursor.x !== null && cursor.y !== null) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100;
      const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100;
      setMaskPosition({
        cx: `${cxPercentage}%`,
        cy: `${cyPercentage}%`,
      });
    }
  }, [cursor]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      className={cn("select-none w-full h-auto max-w-full overflow-visible", className)}
    >
      <defs>
        <linearGradient
          id="textGradient"
          gradientUnits="userSpaceOnUse"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="25%" stopColor="#C084FC" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="75%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>

        <motion.radialGradient
          id="revealMask"
          gradientUnits="userSpaceOnUse"
          r="25%"
          initial={{ cx: "50%", cy: "50%" }}
          animate={maskPosition}
          transition={{ duration: duration ?? 0, ease: "easeOut" }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id="textMask">
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#revealMask)"
          />
        </mask>
      </defs>

      {/* Base Subtle Stroke Text */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        strokeWidth="1.2"
        className="fill-transparent stroke-neutral-400 dark:stroke-neutral-500 font-sans text-2xl sm:text-3xl font-extrabold tracking-tight"
        style={{ opacity: hovered ? 0.8 : 0.4 }}
      >
        {text}
      </text>

      {/* Animated Stroke Draw Text */}
      <motion.text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        strokeWidth="1.2"
        className="fill-transparent stroke-neutral-300 dark:stroke-neutral-400 font-sans text-2xl sm:text-3xl font-extrabold tracking-tight"
        initial={{ strokeDashoffset: 1500, strokeDasharray: 1500 }}
        animate={{
          strokeDashoffset: 0,
          strokeDasharray: 1500,
        }}
        transition={{
          duration: 3,
          ease: "easeInOut",
        }}
      >
        {text}
      </motion.text>

      {/* Gradient Mask Reveal Text on Hover */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        stroke="url(#textGradient)"
        strokeWidth="1.5"
        mask="url(#textMask)"
        className="fill-transparent font-sans text-2xl sm:text-3xl font-extrabold tracking-tight"
      >
        {text}
      </text>
    </svg>
  );
};
