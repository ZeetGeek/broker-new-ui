/** Serialize writes and retire Undo callbacks after a newer edit to the same lead. */
export class StageOperationGate {
    revision = 0;
    private pending = false;
    private versions = new Map<string, number>();

    begin(id: string, expectedVersion?: number): number | null {
        const current = this.versions.get(id) ?? 0;
        if (this.pending || (expectedVersion != null && current !== expectedVersion)) return null;
        this.pending = true;
        this.revision++;
        this.versions.set(id, current + 1);
        return current + 1;
    }

    end() {
        this.pending = false;
        this.revision++;
    }
}
