export function toAutoplayEmbedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("youtube.com")) {
      let videoId = parsed.searchParams.get("v");
      if (!videoId && parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/")[2] ?? null;
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0`;
      }
    }

    if (host === "youtu.be") {
      const videoId = parsed.pathname.replace(/^\//, "");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0`;
      }
    }

    if (host.includes("vimeo.com")) {
      const segments = parsed.pathname.split("/").filter(Boolean);
      const videoId = segments[segments.length - 1];
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&background=1`;
      }
    }

    parsed.searchParams.set("autoplay", "1");
    parsed.searchParams.set("mute", "1");
    parsed.searchParams.set("playsinline", "1");
    return parsed.toString();
  } catch {
    return url;
  }
}
