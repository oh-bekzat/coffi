/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "main_blue": "#375E2A", // main
        "main_black": "#1D1D1D",
        "main_gray": "#58595B",
        "main_white": "#FFFFFF",
        "add_red": "#FD1D1D", // additional
        "add_green": "#00FF44",
        "add_yellow": "#FFCC00",
        "blue_100": "#F1EBFF", // blue
        "blue_200": "#d6b976",
        "blue_300": "#A984FF",
        "blue_400": "#834EFF",
        "blue_500": "#375E2A",
        "blue_600": "#375E2A",
        "blue_700": "#375E2A",
        "blue_800": "#2E0B7B",
        "blue_900": "#160340",
        "mono_100": "#FFFFFF", // monochrome
        "mono_200": "#DDDDDD",
        "mono_300": "#B8B8B8",
        "mono_400": "#898A8C",
        "mono_500": "#58595B",
        "mono_600": "#4B4C4F",
        "mono_700": "#3F4042",
        "mono_800": "#2A2B2C",
        "mono_900": "#1D1D1D",
        "red_100": "#FFEBEB", // red
        "red_300": "#FF8282",
        "red_500": "#FD1D1D",
        "red_700": "#A51111",
        "red_900": "#400303",
        "green_100": "#EBFFF0", // green
        "green_300": "#78FF9A",
        "green_500": "#00FF44",
        "green_700": "#04AC31",
        "green_900": "#034013",
        "yellow_100": "#FFFBEB", // yellow
        "yellow_300": "#FFE373",
        "yellow_500": "#FFCC00",
        "yellow_700": "#9D7F07",
        "yellow_900": "#403403",
      },
    },
  },
  plugins: [],
}