export const LIST_DISPLAY_OPTIONS = ["5", "10", "15", "20"] as const;

export type ListDisplayOption = (typeof LIST_DISPLAY_OPTIONS)[number];
