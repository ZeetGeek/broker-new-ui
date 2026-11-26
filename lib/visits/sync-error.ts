/** A safe, user-facing workflow error, unlike an arbitrary runtime or server error. */
export class VisitSyncError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "VisitSyncError";
    }
}
