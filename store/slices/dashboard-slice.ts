import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { ApiError } from "@/lib/api/client";
import { dashboardApi, type DashboardResponse } from "@/lib/api/dashboard";
import { isMockMode, MOCK_PROFILE } from "@/lib/api/mock-mode";
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
        if (isMockMode()) {
            return { data: null, profile: MOCK_PROFILE };
        }
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
        /**
         * Replace the cached profile after the user edits it.
         *
         * The profile lives in this slice because the dashboard fetches it
         * alongside its own data, and the portal header reads it for the name
         * and avatar. Without this, saving the profile would leave the header
         * showing the old name until a full reload.
         */
        setProfile(state, action: PayloadAction<UserProfile>) {
            state.profile = action.payload;
        },
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

export const { resetDashboard, setProfile } = dashboardSlice.actions;
export default dashboardSlice.reducer;
