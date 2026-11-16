export type TextSegment = { id: string; type: "text"; value: string };
export type ChipSegment = {
    id: string;
    type: "chip";
    kind: "date" | "time" | "priority" | "property" | "client" | "owner";
    label: string;
    value: string;
};
export type Segment = TextSegment | ChipSegment;

const newId = () => crypto.randomUUID();

const emptySegments = (): Segment[] => [{ id: newId(), type: "text", value: "" }];

/**
 * Collapse empty/whitespace gaps around chips. Keeps empty text runs when they
 * sit next to a chip so the caret can stay inline after token insert.
 */
export function normalizeSegments(segments: Segment[]): Segment[] {
    const trailingEmptyId = [...segments]
        .reverse()
        .find((segment) => segment.type === "text" && segment.value === "")?.id;

    const prepared = segments.map((segment, index) => {
        if (segment.type !== "text") return segment;
        let value = segment.value;
        const prev = segments[index - 1];
        const next = segments[index + 1];
        if (prev?.type === "chip") value = value.replace(/^\s+/, "");
        if (next?.type === "chip") value = value.replace(/\s+$/, "");
        return { ...segment, value };
    });

    const merged: Segment[] = [];
    for (let index = 0; index < prepared.length; index += 1) {
        const segment = prepared[index];
        if (segment.type === "chip") {
            merged.push(segment);
            continue;
        }
        if (!segment.value) {
            const prev = merged.at(-1);
            const next = prepared[index + 1];
            const chipAdjacent = prev?.type === "chip" || next?.type === "chip";
            if (!chipAdjacent) continue;
            if (prev?.type === "text" && !prev.value) continue;
            merged.push({ ...segment });
            continue;
        }
        const previous = merged.at(-1);
        if (previous?.type === "text") {
            if (!previous.value) {
                previous.value = segment.value;
                continue;
            }
            previous.value += segment.value;
            continue;
        }
        merged.push({ ...segment });
    }

    const last = merged.at(-1);
    if (last?.type !== "text") {
        merged.push({
            id: trailingEmptyId ?? newId(),
            type: "text",
            value: "",
        });
    } else if (last.value) {
        merged.push({
            id: trailingEmptyId ?? newId(),
            type: "text",
            value: "",
        });
    }
    return merged.length ? merged : emptySegments();
}
