import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./slices/auth-slice";
import dashboardReducer from "./slices/dashboard-slice";

export const makeStore = () =>
    configureStore({
        reducer: {
            auth: authReducer,
            dashboard: dashboardReducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: false,
            }),
    });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
