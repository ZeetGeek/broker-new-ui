export function listedLabel(listedHoursAgo: number): string {
    if (listedHoursAgo < 1) return "Just now";
    if (listedHoursAgo < 24) {
        return listedHoursAgo === 1 ? "1 hour ago" : `${listedHoursAgo} hours ago`;
    }
    const days = Math.floor(listedHoursAgo / 24);
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
}

export function competitionLabel(count: number): string {
    if (count === 0) return "Open — no requests yet";
    if (count === 1) return "1 broker already requested";
    return `${count} brokers requested`;
}

export function competitionTone(count: number): "open" | "warm" | "busy" {
    if (count === 0) return "open";
    if (count === 1) return "warm";
    return "busy";
}
