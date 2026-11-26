const config = {
    plugins: {
        // optimize: false — in production Tailwind's optimizer folds `calc(infinity * 1px)`
        // (rounded-full) into `3.40282e38px`, and pxtorem then rewrites the "38px" inside that
        // number, corrupting every rounded-full. Next still minifies the CSS afterwards.
        "@tailwindcss/postcss": { optimize: false },
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
