export function toAutoplayEmbedUrl(url: string, options?: { muted?: boolean }): string {
  const muted = options?.muted ?? false;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("youtube.com")) {
      let videoId = parsed.searchParams.get("v");
      if (!videoId && parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/")[2] ?? null;
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&playsinline=1&loop=1&playlist=${videoId}&controls=${muted ? 0 : 1}&modestbranding=1&rel=0`;
      }
    }

    if (host === "youtu.be") {
      const videoId = parsed.pathname.replace(/^\//, "");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&playsinline=1&loop=1&playlist=${videoId}&controls=${muted ? 0 : 1}&modestbranding=1&rel=0`;
      }
    }

    if (host.includes("vimeo.com")) {
      const segments = parsed.pathname.split("/").filter(Boolean);
      const videoId = segments[segments.length - 1];
      if (videoId) {
        return muted
          ? `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&background=1`
          : `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=0&loop=1`;
      }
    }

    parsed.searchParams.set("autoplay", "1");
    parsed.searchParams.set("mute", muted ? "1" : "0");
    parsed.searchParams.set("playsinline", "1");
    return parsed.toString();
  } catch {
    return url;
  }
}
