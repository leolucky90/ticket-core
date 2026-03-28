"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/components/ui/cn";

const navigationProgressListeners = new Set<() => void>();

export function startNavigationProgress() {
    navigationProgressListeners.forEach((listener) => listener());
}

function isModifiedEvent(event: MouseEvent) {
    return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function NavigationProgress() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const locationKey = `${pathname}?${searchParams.toString()}`;
    const [pending, setPending] = useState(false);
    const lastLocationKeyRef = useRef(locationKey);
    const finishTimerRef = useRef<number | null>(null);
    const watchdogTimerRef = useRef<number | null>(null);

    const clearTimers = useEffectEvent(() => {
        if (finishTimerRef.current !== null) {
            window.clearTimeout(finishTimerRef.current);
            finishTimerRef.current = null;
        }
        if (watchdogTimerRef.current !== null) {
            window.clearTimeout(watchdogTimerRef.current);
            watchdogTimerRef.current = null;
        }
    });

    const beginProgress = useEffectEvent(() => {
        clearTimers();
        setPending(true);
        watchdogTimerRef.current = window.setTimeout(() => {
            watchdogTimerRef.current = null;
            setPending(false);
        }, 15000);
    });

    const finishProgress = useEffectEvent(() => {
        if (!pending) return;
        if (watchdogTimerRef.current !== null) {
            window.clearTimeout(watchdogTimerRef.current);
            watchdogTimerRef.current = null;
        }
        finishTimerRef.current = window.setTimeout(() => {
            finishTimerRef.current = null;
            setPending(false);
        }, 180);
    });

    useEffect(() => {
        function handleStart() {
            beginProgress();
        }

        navigationProgressListeners.add(handleStart);
        return () => {
            navigationProgressListeners.delete(handleStart);
        };
    }, []);

    useEffect(() => {
        if (lastLocationKeyRef.current !== locationKey) {
            finishProgress();
        }
        lastLocationKeyRef.current = locationKey;
    }, [locationKey, pending]);

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (event.defaultPrevented || event.button !== 0 || isModifiedEvent(event)) return;
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            const anchor = target.closest("a");
            if (!(anchor instanceof HTMLAnchorElement)) return;
            if (!anchor.href || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
            const nextUrl = new URL(anchor.href, window.location.href);
            const currentUrl = new URL(window.location.href);
            if (nextUrl.origin !== currentUrl.origin) return;
            if (`${nextUrl.pathname}${nextUrl.search}` === `${currentUrl.pathname}${currentUrl.search}`) return;
            beginProgress();
        }

        function handleSubmit(event: Event) {
            if (event.defaultPrevented) return;
            beginProgress();
        }

        document.addEventListener("click", handleClick, true);
        document.addEventListener("submit", handleSubmit, true);
        return () => {
            document.removeEventListener("click", handleClick, true);
            document.removeEventListener("submit", handleSubmit, true);
        };
    }, []);

    useEffect(
        () => () => {
            clearTimers();
        },
        [],
    );

    return (
        <div
            aria-hidden="true"
            className={cn(
                "pointer-events-none fixed inset-x-0 top-0 z-[80] h-1 transition-opacity duration-200",
                pending ? "opacity-100" : "opacity-0",
            )}
        >
            <div className="route-progress-track h-full">
                <div className="route-progress-bar h-full" />
            </div>
        </div>
    );
}
