"use client";

import { toAutoplayEmbedUrl } from "@/lib/video-embed";
import type { HookVideo } from "@/services/landing";

type Props = {
  video: HookVideo;
  fallbackTitle: string;
  className?: string;
};

export function LandingHookVideoPlayer({ video, fallbackTitle, className }: Props) {
  const title = video.title || fallbackTitle;

  if (video.kind === "embed") {
    return (
      <iframe
        title={title}
        src={toAutoplayEmbedUrl(video.video_url)}
        className={className ?? "aspect-video w-full"}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <video
      className={className ?? "aspect-video w-full object-cover"}
      src={video.video_url}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
    />
  );
}
