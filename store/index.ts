import { combineReducers, configureStore, type UnknownAction } from "@reduxjs/toolkit";

import authReducer from "./slices/auth-slice";
import dashboardReducer from "./slices/dashboard-slice";

const combinedReducer = combineReducers({ auth: authReducer, dashboard: dashboardReducer });

// Reset synchronously with identity changes, before a new account renders.
const reducer = (
    state: ReturnType<typeof combinedReducer> | undefined,
    action: UnknownAction,
): ReturnType<typeof combinedReducer> => {
    const next = combinedReducer(state, action);
    if (
        state &&
        (state.auth.user?.id !== next.auth.user?.id ||
            state.auth.user?.role !== next.auth.user?.role ||
            Boolean(state.auth.accessToken) !== Boolean(next.auth.accessToken))
    ) {
        return {
            ...next,
            auth: { ...next.auth, sessionEpoch: state.auth.sessionEpoch + 1 },
            dashboard: dashboardReducer(undefined, { type: "session/reset" }),
        };
    }
    return next;
};

export const makeStore = () =>
    configureStore({
        reducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: false,
            }),
    });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
