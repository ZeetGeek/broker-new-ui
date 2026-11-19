const config = {
    plugins: {
        "@tailwindcss/postcss": {},
        // Run after Tailwind so generated utilities and authored CSS use the same units.
        "postcss-pxtorem": {
            rootValue: 16,
            unitPrecision: 6,
            propList: ["*"],
            replace: true,
            mediaQuery: true,
            minPixelValue: 0,
            exclude: /node_modules/i,
        },
    },
};

export default config;
