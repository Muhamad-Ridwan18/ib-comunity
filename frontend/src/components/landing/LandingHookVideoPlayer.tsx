"use client";

import { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { toAutoplayEmbedUrl } from "@/lib/video-embed";
import type { HookVideo } from "@/services/landing";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/utils";

type Props = {
  video: HookVideo;
  fallbackTitle: string;
  className?: string;
};

export function LandingHookVideoPlayer({ video, fallbackTitle, className }: Props) {
  const { t } = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [embedSrc, setEmbedSrc] = useState(() => toAutoplayEmbedUrl(video.video_url, { muted: true }));

  const title = video.title || fallbackTitle;
  const frameClass = className ?? "aspect-video w-full";

  const toggleSound = () => {
    const nextMuted = !muted;

    if (video.kind === "file" && videoRef.current) {
      videoRef.current.muted = nextMuted;
      if (!nextMuted) {
        void videoRef.current.play().catch(() => {
          /* ignore */
        });
      }
      setMuted(nextMuted);
      return;
    }

    setMuted(nextMuted);
    setEmbedSrc(toAutoplayEmbedUrl(video.video_url, { muted: nextMuted }));
  };

  return (
    <div className="group relative overflow-hidden bg-black">
      {video.kind === "embed" ? (
        <iframe
          key={embedSrc}
          title={title}
          src={embedSrc}
          className={frameClass}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          className={cn(frameClass, "object-cover")}
          src={video.video_url}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      )}

      <button
        type="button"
        onClick={toggleSound}
        className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-black/75"
        aria-label={muted ? t("landing.unmute") : t("landing.mute")}
      >
        {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        {muted ? t("landing.unmute") : t("landing.mute")}
      </button>
    </div>
  );
}
