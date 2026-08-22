"use client";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import { cn } from "@/lib/utils";
import { ZapIcon, ArrowRightIcon } from "lucide-react";

export const FloatingNav = ({
  navItems,
  className,
}: {
  navItems: {
    name: string;
    link: string;
    icon?: React.ReactNode;
  }[];
  className?: string;
}) => {
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(true);

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    if (typeof current === "number") {
      const direction = current - scrollYProgress.getPrevious()!;

      if (scrollYProgress.get() < 0.05) {
        setVisible(true);
      } else {
        if (direction < 0) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      }
    }
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{
          opacity: 1,
          y: 0,
        }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          duration: 0.2,
        }}
        className={cn(
          "flex max-w-[calc(100vw-1.5rem)] fixed top-4 sm:top-6 inset-x-0 mx-auto z-[5000] items-center justify-center",
          className
        )}
      >
        <div className="flex items-center justify-center gap-1.5 sm:gap-3 rounded-full border border-border bg-card/95 px-3 py-1.5 sm:px-4 sm:py-2 shadow-none backdrop-blur-md max-w-full overflow-hidden">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-1.5 pr-1.5 sm:pr-2 border-r border-border shrink-0">
            <div className="flex size-6 sm:size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-none">
              <ZapIcon className="size-3.5 sm:size-4 fill-current" />
            </div>
            <span className="font-extrabold tracking-wider text-xs text-foreground hidden md:inline">SHADOWLEAGUE</span>
          </Link>

          {/* Nav items container */}
          <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar">
            {navItems.map((navItem, idx: number) => {
              const isInternal = navItem.link.startsWith("/");
              return isInternal ? (
                <Link
                  key={`link-${idx}`}
                  to={navItem.link}
                  title={navItem.name}
                  className="relative flex items-center gap-1.5 rounded-full px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground shrink-0"
                >
                  {navItem.icon && <span className="size-3.5 flex items-center justify-center">{navItem.icon}</span>}
                  <span className="hidden sm:inline">{navItem.name}</span>
                </Link>
              ) : (
                <a
                  key={`link-${idx}`}
                  href={navItem.link}
                  title={navItem.name}
                  className="relative flex items-center gap-1.5 rounded-full px-2 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground shrink-0"
                >
                  {navItem.icon && <span className="size-3.5 flex items-center justify-center">{navItem.icon}</span>}
                  <span className="hidden sm:inline">{navItem.name}</span>
                </a>
              );
            })}
          </div>

          <div className="h-4 w-px bg-border hidden sm:block shrink-0" />

          {/* CTA Button */}
          <Link to="/login" className="shrink-0">
            <button className="relative rounded-full bg-primary px-3 py-1 sm:px-4 sm:py-1.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 flex items-center gap-1">
              <span>Sign In</span>
              <ArrowRightIcon className="size-3 hidden sm:inline" />
            </button>
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
