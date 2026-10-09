/** Parse hosted video / tour URLs into iframe-safe embed targets. */

export type MediaEmbed =
    | {
          kind: "youtube";
          id: string;
          embedUrl: string;
          sourceUrl: string;
          title: string;
      }
    | {
          kind: "vimeo";
          id: string;
          embedUrl: string;
          sourceUrl: string;
          title: string;
      }
    | {
          kind: "tour";
          embedUrl: string;
          sourceUrl: string;
          title: string;
      };

function trimUrl(raw: string): string {
    return String(raw ?? "").trim();
}

function tryParseUrl(raw: string): URL | null {
    const value = trimUrl(raw);
    if (!value) return null;
    try {
        return new URL(value.includes("://") ? value : `https://${value}`);
    } catch {
        return null;
    }
}

function youtubeIdFromUrl(url: URL): string | null {
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
        const id = url.pathname.split("/").filter(Boolean)[0];
        return id || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
        if (url.pathname === "/watch") return url.searchParams.get("v");
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
            return parts[1] || null;
        }
    }
    return null;
}

function vimeoIdFromUrl(url: URL): string | null {
    const host = url.hostname.replace(/^www\./, "");
    if (host === "vimeo.com" || host === "player.vimeo.com") {
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts[0] === "video") return parts[1] || null;
        // vimeo.com/123456789 or vimeo.com/channels/.../123
        const numeric = [...parts].reverse().find((part) => /^\d+$/.test(part));
        return numeric || null;
    }
    return null;
}

/** YouTube or Vimeo only — returns null when empty or unrecognized. */
export function parseVideoEmbed(raw: string): MediaEmbed | null {
    const url = tryParseUrl(raw);
    if (!url) return null;

    const youtubeId = youtubeIdFromUrl(url);
    if (youtubeId) {
        return {
            kind: "youtube",
            id: youtubeId,
            embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}`,
            sourceUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(youtubeId)}`,
            title: "YouTube video",
        };
    }

    const vimeoId = vimeoIdFromUrl(url);
    if (vimeoId) {
        return {
            kind: "vimeo",
            id: vimeoId,
            embedUrl: `https://player.vimeo.com/video/${encodeURIComponent(vimeoId)}`,
            sourceUrl: `https://vimeo.com/${encodeURIComponent(vimeoId)}`,
            title: "Vimeo video",
        };
    }

    return null;
}

/** Matterport / Kuula / generic https tour link. */
export function parseTourEmbed(raw: string): MediaEmbed | null {
    const url = tryParseUrl(raw);
    if (!url) return null;
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    const host = url.hostname.replace(/^www\./, "");
    if (host.endsWith("matterport.com")) {
        const model = url.searchParams.get("m");
        const embed = new URL(url.href);
        if (model && !embed.searchParams.has("play")) embed.searchParams.set("play", "1");
        return {
            kind: "tour",
            embedUrl: embed.toString(),
            sourceUrl: url.toString(),
            title: "Matterport tour",
        };
    }

    if (host.endsWith("kuula.co") || host.endsWith("kuula.com")) {
        return {
            kind: "tour",
            embedUrl: url.toString(),
            sourceUrl: url.toString(),
            title: "360° tour",
        };
    }

    // Any other https link — still try as iframe (many hosts block embed).
    return {
        kind: "tour",
        embedUrl: url.toString(),
        sourceUrl: url.toString(),
        title: "Virtual tour",
    };
}

export function hasNonEmptyUrl(raw: string): boolean {
    return trimUrl(raw).length > 0;
}
