/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                dark: {
                    50: '#f7f7f8',
                    100: '#ececf1',
                    200: '#d9d9e3',
                    300: '#c5c5d2',
                    400: '#acacbe',
                    500: '#8e8ea0',
                    600: '#565869',
                    700: '#40414f',
                    800: '#2d2d3a',
                    900: '#1e1e2e',
                    950: '#141420',
                },
                accent: {
                    DEFAULT: '#6c63ff',
                    light: '#8b83ff',
                    dark: '#5046e4',
                },
                math: {
                    green: '#4ade80',
                    blue: '#60a5fa',
                    purple: '#a78bfa',
                    amber: '#fbbf24',
                    rose: '#fb7185',
                }
            },
            fontFamily: {
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            }
        },
    },
    plugins: [],
}