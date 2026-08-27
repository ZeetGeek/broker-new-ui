import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import {
    type AuthUser,
    clearSession,
    getAccessToken,
    getStoredUser,
    setSession,
} from "@/lib/auth/session";

type AuthState = {
    user: AuthUser | null;
    accessToken: string | null;
    hydrated: boolean;
    status: "idle" | "loading" | "failed";
    error: string | null;
};

export type AuthRejectPayload = {
    message: string;
    status: number;
};

const initialState: AuthState = {
    user: null,
    accessToken: null,
    hydrated: false,
    status: "idle",
    error: null,
};

export const hydrateAuth = createAsyncThunk("auth/hydrate", async () => {
    return {
        accessToken: getAccessToken(),
        user: getStoredUser(),
    };
});

export const login = createAsyncThunk(
    "auth/login",
    async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
        try {
            const res = await authApi.login(email, password);
            setSession({ accessToken: res.accessToken, user: res.user });
            return res;
        } catch (err) {
            if (err instanceof ApiError) {
                return rejectWithValue({
                    message: err.message,
                    status: err.status,
                } satisfies AuthRejectPayload);
            }
            return rejectWithValue({
                message: err instanceof Error ? err.message : "Login failed",
                status: 0,
            } satisfies AuthRejectPayload);
        }
    },
);

export const logout = createAsyncThunk("auth/logout", async () => {
    try {
        await authApi.logout();
    } finally {
        clearSession();
    }
});

export const refreshProfile = createAsyncThunk("auth/refreshProfile", async () => {
    const token = getAccessToken();
    if (!token) {
        throw new Error("Not authenticated");
    }
    const user = await authApi.profile();
    setSession({ accessToken: token, user });
    return user;
});

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        establishSession(state, action: PayloadAction<{ accessToken: string; user: AuthUser }>) {
            setSession(action.payload);
            state.accessToken = action.payload.accessToken;
            state.user = action.payload.user;
            state.error = null;
            state.status = "idle";
        },
        setUser(state, action: PayloadAction<AuthUser | null>) {
            state.user = action.payload;
            const token = state.accessToken ?? getAccessToken();
            if (action.payload && token) {
                setSession({ accessToken: token, user: action.payload });
            }
        },
        clearAuth(state) {
            clearSession();
            state.user = null;
            state.accessToken = null;
            state.error = null;
            state.status = "idle";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(hydrateAuth.fulfilled, (state, action) => {
                state.accessToken = action.payload.accessToken;
                state.user = action.payload.user;
                state.hydrated = true;
            })
            .addCase(hydrateAuth.rejected, (state) => {
                state.hydrated = true;
            })
            .addCase(login.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.status = "idle";
                state.accessToken = action.payload.accessToken;
                state.user = action.payload.user;
                state.error = null;
            })
            .addCase(login.rejected, (state, action) => {
                state.status = "failed";
                const payload = action.payload as AuthRejectPayload | undefined;
                state.error = payload?.message ?? action.error.message ?? "Login failed";
            })
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.accessToken = null;
                state.error = null;
                state.status = "idle";
            })
            .addCase(logout.rejected, (state) => {
                state.user = null;
                state.accessToken = null;
                state.error = null;
                state.status = "idle";
            })
            .addCase(refreshProfile.fulfilled, (state, action) => {
                state.user = action.payload;
            });
    },
});

export const { establishSession, setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
