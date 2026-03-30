"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type AiChatBallVisibilityContextValue = {
    enabled: boolean;
    setEnabled: (v: boolean) => void;
};

const AiChatBallVisibilityContext = createContext<AiChatBallVisibilityContextValue | null>(null);

export function AiChatBallVisibilityProvider({
    initialEnabled,
    children,
}: {
    initialEnabled: boolean;
    children: ReactNode;
}) {
    const [enabled, setEnabledState] = useState(initialEnabled);

    useEffect(() => {
        setEnabledState(initialEnabled);
    }, [initialEnabled]);

    const setEnabled = useCallback((v: boolean) => {
        setEnabledState(v);
    }, []);

    const value = useMemo(() => ({ enabled, setEnabled }), [enabled, setEnabled]);

    return <AiChatBallVisibilityContext.Provider value={value}>{children}</AiChatBallVisibilityContext.Provider>;
}

export function useAiChatBallVisibility(): AiChatBallVisibilityContextValue | null {
    return useContext(AiChatBallVisibilityContext);
}
