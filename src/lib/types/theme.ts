export type ThemeMode = "light" | "dark" | "custom";

export type ThemeColorRole = "bg" | "panel" | "panel2" | "nav" | "text" | "accent" | "border";

export type RgbTriplet = `${number} ${number} ${number}`;

export type ThemeCustomColors = {
    bg: RgbTriplet;
    panel: RgbTriplet;
    panel2: RgbTriplet;
    nav: RgbTriplet;
    text: RgbTriplet;
    accent: RgbTriplet;
    border: RgbTriplet;
};

export type ThemeState = {
    mode: ThemeMode;
    customColors: ThemeCustomColors;
};
