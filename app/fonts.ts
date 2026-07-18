import localFont from "next/font/local";

export const suisse = localFont({
  src: [
    { path: "../public/fonts/SuisseIntl-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/SuisseIntl-Light.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/SuisseIntl-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-suisse",
  fallback: ["sans-serif"],
});

export const aeonik = localFont({
  src: "../public/fonts/Aeonik-Regular.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-aeonik",
  fallback: ["sans-serif"],
});
