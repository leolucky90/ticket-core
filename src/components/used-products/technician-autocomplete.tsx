"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Input } from "@/components/ui/input";

export type TechnicianOption = {
    id: string;
    name: string;
    email: string;
    phone: string;
};

type TechnicianAutocompleteProps = {
    technicians: TechnicianOption[];
    defaultTechnicianId?: string;
    defaultTechnicianName?: string;
    technicianIdFieldName: string;
    technicianNameFieldName: string;
    placeholder?: string;
};

function normalizeText(value: string): string {
    return value.trim().toLowerCase();
}

export function TechnicianAutocomplete({
    technicians,
    defaultTechnicianId,
    defaultTechnicianName,
    technicianIdFieldName,
    technicianNameFieldName,
    placeholder,
}: TechnicianAutocompleteProps) {
    const [query, setQuery] = useState(defaultTechnicianName ?? "");
    const [selectedId, setSelectedId] = useState(defaultTechnicianId ?? "");
    const [open, setOpen] = useState(false);

    const matched = useMemo(() => {
        const q = normalizeText(query);
        if (!q) return technicians.slice(0, 8);
        return technicians
            .filter((row) => normalizeText(`${row.name} ${row.email} ${row.phone}`).includes(q))
            .slice(0, 8);
    }, [query, technicians]);

    return (
        <div className="relative grid gap-2">
            <input type="hidden" name={technicianIdFieldName} value={selectedId} />
            <input type="hidden" name={technicianNameFieldName} value={query} />

            <div className="relative">
                <Input
                    value={query}
                    placeholder={placeholder ?? "輸入維修人員姓名 / Email / 電話"}
                    onFocus={() => setOpen(true)}
                    onChange={(event) => {
                        const value = event.currentTarget.value;
                        setQuery(value);
                        setSelectedId("");
                        setOpen(true);
                    }}
                    onBlur={() => {
                        window.setTimeout(() => setOpen(false), 120);
                    }}
                    className="pr-12"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                    <IconActionButton icon={Search} label="搜尋維修人員" tooltip="搜尋維修人員" onClick={() => setOpen((prev) => !prev)} />
                </div>
            </div>

            {open ? (
                <div className="absolute top-full z-20 mt-1 grid max-h-56 w-full overflow-y-auto rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-1 shadow-sm">
                    {matched.length === 0 ? <div className="px-2 py-2 text-xs text-[rgb(var(--muted))]">找不到符合條件的維修人員。</div> : null}
                    {matched.map((row) => (
                        <button
                            key={row.id}
                            type="button"
                            className="rounded-md px-2 py-2 text-left text-sm hover:bg-[rgb(var(--panel2))]"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                                setSelectedId(row.id);
                                setQuery(row.name);
                                setOpen(false);
                            }}
                        >
                            <div className="font-medium">{row.name}</div>
                            <div className="text-xs text-[rgb(var(--muted))]">{row.email || "-"} / {row.phone || "-"}</div>
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
