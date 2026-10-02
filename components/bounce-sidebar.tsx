"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import Link from "next/link";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { cn } from "@/lib/utils";

const MotionLink = motion.create(Link);

const DOT_SIZE = 6;

// Sidebar dot hops along a quadratic bezier so it visibly kicks out toward
// the rail mid-flight instead of sliding straight down the list.
function quadraticBezier(p0: number, p1: number, p2: number, t: number) {
  const u = 1 - t;
  return u * u * p0 + 2 * u * t * p1 + t * t * p2;
}

export type BounceSidebarItem =
  | string
  | { label: string; href?: string }
  | { label: string; heading: true };

export type BounceSidebarProps = Omit<ComponentProps<"ul">, "onChange"> & {
  items: BounceSidebarItem[];
  value?: number;
  defaultValue?: number;
  onChange?: (index: number) => void;
  dotColor?: string;
};

export function BounceSidebar({
  items,
  value,
  defaultValue = 0,
  onChange,
  dotColor = "#FC4C01",
  className,
  ...props
}: BounceSidebarProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeIndex = value ?? internalValue;
  const reduce = useReducedMotion();

  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [ready, setReady] = useState(false);

  const indexRef = useRef(activeIndex);
  indexRef.current = activeIndex;
  const placedRef = useRef(false);
  const prevIndexRef = useRef(activeIndex);
  const flightRef = useRef<ReturnType<typeof animate> | null>(null);

  const place = useCallback(
    (index: number) => {
      const el = itemRefs.current[index];
      if (!el) return false;
      flightRef.current?.stop();
      x.set(0);
      y.set(el.offsetTop + (el.offsetHeight - DOT_SIZE) / 2);
      placedRef.current = true;
      prevIndexRef.current = index;
      setReady(true);
      return true;
    },
    [x, y],
  );
  const placeRef = useRef(place);
  placeRef.current = place;

  // Jump the dot along an arc to the newly active row.
  useLayoutEffect(() => {
    const el = itemRefs.current[activeIndex];
    if (!el) return;
    const destinationY = el.offsetTop + (el.offsetHeight - DOT_SIZE) / 2;

    if (!placedRef.current || reduce || prevIndexRef.current === activeIndex) {
      place(activeIndex);
      return;
    }

    const startY = y.get();
    const travel = Math.abs(destinationY - startY);
    if (travel < 1) {
      place(activeIndex);
      return;
    }

    flightRef.current?.stop();
    // Kick out toward the rail; longer flights get a slightly softer spring.
    const soft = Math.min(1, Math.max(0, (travel - 48) / 120));
    const controlX = -Math.min(40, Math.max(8, travel * 0.25));
    const controlY = (startY + destinationY) / 2;
    flightRef.current = animate(0, 1, {
      type: "spring",
      stiffness: 280 - 60 * soft,
      damping: 18 + soft,
      mass: 0.3 + 0.15 * soft,
      onUpdate: (t) => {
        x.set(quadraticBezier(0, controlX, 0, t));
        y.set(quadraticBezier(startY, controlY, destinationY, t));
      },
      onComplete: () => {
        x.set(0);
        y.set(destinationY);
      },
    });
    prevIndexRef.current = activeIndex;
    setReady(true);
    return () => flightRef.current?.stop();
  }, [activeIndex, place, reduce, x, y]);

  // Re-seat the dot when layout shifts (fonts, resize) instead of leaving
  // it stranded halfway down a row.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      placeRef.current(indexRef.current);
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    document.fonts?.ready.then(() => {
      placeRef.current(indexRef.current);
    });
    return () => flightRef.current?.stop();
  }, []);

  const select = (index: number) => {
    if (value === undefined) setInternalValue(index);
    onChange?.(index);
  };

  return (
    <ul
      ref={listRef}
      data-slot="bounce-sidebar"
      className={cn("relative flex flex-col gap-1 pl-6", className)}
      {...props}
    >
      <motion.span
        aria-hidden
        data-slot="bounce-sidebar-dot"
        className="absolute left-2 top-0 h-1.5 w-1.5 rounded-full"
        style={{ x, y, backgroundColor: dotColor, opacity: ready ? 1 : 0 }}
      />

      {items.map((item, index) => {
        const label = typeof item === "string" ? item : item.label;

        if (typeof item !== "string" && "heading" in item) {
          return (
            <li
              key={`${index}-${label}`}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              role="presentation"
              data-slot="bounce-sidebar-heading"
              style={{ color: dotColor }}
              className="px-1 pb-1 pt-7 text-[11px] font-semibold uppercase tracking-[0.14em] first:pt-0"
            >
              {label}
            </li>
          );
        }

        const href = typeof item === "string" ? undefined : item.href;
        const isActive = index === activeIndex;
        const itemClassName = cn(
          "flex w-full cursor-pointer items-center rounded-lg p-1 text-left text-sm transition-colors duration-200",
          isActive
            ? "text-black dark:text-white"
            : "text-black/50 dark:text-zinc-400 hover:text-black dark:hover:text-white",
        );

        return (
          <li
            key={`${index}-${label}`}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
          >
            {href ? (
              <MotionLink
                href={href}
                data-slot="bounce-sidebar-item"
                data-active={isActive}
                onClick={() => select(index)}
                className={itemClassName}
              >
                {label}
              </MotionLink>
            ) : (
              <motion.button
                type="button"
                data-slot="bounce-sidebar-item"
                data-active={isActive}
                onClick={() => select(index)}
                className={itemClassName}
              >
                {label}
              </motion.button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
