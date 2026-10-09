function pdfSafe(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[^\x20-\x7E]/g, " ")
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");
}

function wrapLine(value: string, limit = 84): string[] {
    const words = pdfSafe(value).split(/\s+/).filter(Boolean);
    if (!words.length) return [""];
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
        if (!line || `${line} ${word}`.length <= limit) line = line ? `${line} ${word}` : word;
        else {
            lines.push(line);
            line = word;
        }
    }
    if (line) lines.push(line);
    return lines;
}

function buildPdf(title: string, lines: string[]): Uint8Array {
    const printable = [title, "", ...lines].flatMap((line) => wrapLine(line)).slice(0, 42);
    const stream = printable
        .map((line, index) => {
            const size = index === 0 ? 18 : 10;
            const y = index === 0 ? 790 : 770 - (index - 1) * 17;
            return `BT /F1 ${size} Tf 54 ${y} Td (${pdfSafe(line)}) Tj ET`;
        })
        .join("\n");
    const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    for (let index = 0; index < objects.length; index += 1) {
        offsets.push(new TextEncoder().encode(pdf).length);
        pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
    }
    const xrefOffset = new TextEncoder().encode(pdf).length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    pdf += offsets
        .slice(1)
        .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
        .join("");
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return new TextEncoder().encode(pdf);
}

export function downloadDealSheetPdf({
    title,
    lines,
    filename,
}: {
    title: string;
    lines: string[];
    filename: string;
}) {
    const bytes = buildPdf(title, lines);
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    const blob = new Blob([buffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
