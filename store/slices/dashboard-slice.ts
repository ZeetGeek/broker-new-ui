import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { ApiError } from "@/lib/api/client";
import { dashboardApi, type DashboardResponse } from "@/lib/api/dashboard";
import { profileApi, type UserProfile } from "@/lib/api/profile";

type DashboardState = {
    data: DashboardResponse | null;
    profile: UserProfile | null;
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
};

const initialState: DashboardState = {
    data: null,
    profile: null,
    status: "idle",
    error: null,
};

export const fetchBrokerDashboard = createAsyncThunk(
    "dashboard/fetchBroker",
    async (_, { rejectWithValue }) => {
        try {
            const [data, profile] = await Promise.all([dashboardApi.get(), profileApi.get()]);
            return { data, profile };
        } catch (err) {
            if (err instanceof ApiError) {
                return rejectWithValue(err.message);
            }
            return rejectWithValue(err instanceof Error ? err.message : "Failed to load dashboard");
        }
    },
);

const dashboardSlice = createSlice({
    name: "dashboard",
    initialState,
    reducers: {
        resetDashboard(state) {
            state.data = null;
            state.profile = null;
            state.status = "idle";
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchBrokerDashboard.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchBrokerDashboard.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.data = action.payload.data;
                state.profile = action.payload.profile;
                state.error = null;
            })
            .addCase(fetchBrokerDashboard.rejected, (state, action) => {
                state.status = "failed";
                state.error =
                    (typeof action.payload === "string" ? action.payload : null) ||
                    action.error.message ||
                    "Failed to load dashboard";
            });
    },
});

export const { resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
