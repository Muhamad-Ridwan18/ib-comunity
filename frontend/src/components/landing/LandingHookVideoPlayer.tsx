"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { toAutoplayEmbedUrl, toEmbedUrl } from "@/lib/video-embed";
import type { HookVideo } from "@/services/landing";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/utils";

type Props = {
  video: HookVideo;
  fallbackTitle: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  showControls?: boolean;
  showSoundToggle?: boolean;
  onPlay?: () => void;
  paused?: boolean;
};

export function LandingHookVideoPlayer({
  video,
  fallbackTitle,
  className,
  autoPlay = true,
  loop = true,
  showControls,
  showSoundToggle = true,
  onPlay,
  paused = false,
}: Props) {
  const { t } = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(autoPlay ? false : true);
  const [embedSrc, setEmbedSrc] = useState(() =>
    autoPlay
      ? toAutoplayEmbedUrl(video.video_url, { muted: false })
      : toEmbedUrl(video.video_url, { autoplay: false, muted: true, loop, controls: true }),
  );

  const title = video.title || fallbackTitle;
  const frameClass = className ?? "aspect-video w-full";
  const controls = showControls ?? !autoPlay;

  useEffect(() => {
    const el = videoRef.current;
    if (!el || video.kind !== "file") return;

    if (paused) {
      el.pause();
      return;
    }

    if (!autoPlay) return;

    el.muted = false;
    el.volume = 1;
    void el.play()
      .then(() => onPlay?.())
      .catch(() => {
        el.muted = true;
        setMuted(true);
        void el.play()
          .then(() => onPlay?.())
          .catch(() => {
            /* ignore */
          });
      });
  }, [video.video_url, video.kind, autoPlay, paused, onPlay]);

  useEffect(() => {
    if (video.kind !== "embed" || !paused) return;
    setEmbedSrc(toEmbedUrl(video.video_url, { autoplay: false, muted: true, loop, controls: true }));
  }, [paused, video.kind, video.video_url, loop]);

  const toggleSound = () => {
    const nextMuted = !muted;

    if (video.kind === "file" && videoRef.current) {
      videoRef.current.muted = nextMuted;
      if (!nextMuted) {
        videoRef.current.volume = 1;
        void videoRef.current.play().catch(() => {
          /* ignore */
        });
      }
      setMuted(nextMuted);
      return;
    }

    setMuted(nextMuted);
    setEmbedSrc(
      autoPlay
        ? toAutoplayEmbedUrl(video.video_url, { muted: nextMuted })
        : toEmbedUrl(video.video_url, { autoplay: false, muted: nextMuted, loop, controls: true }),
    );
  };

  const handleVideoPlay = () => {
    onPlay?.();
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
          className={cn(frameClass, "object-contain")}
          src={video.video_url}
          autoPlay={autoPlay && !paused}
          loop={loop}
          playsInline
          controls={controls}
          preload={autoPlay ? "auto" : "metadata"}
          onPlay={handleVideoPlay}
        />
      )}

      {showSoundToggle && autoPlay ? (
        <button
          type="button"
          onClick={toggleSound}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-black/75"
          aria-label={muted ? t("landing.unmute") : t("landing.mute")}
        >
          {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          {muted ? t("landing.unmute") : t("landing.mute")}
        </button>
      ) : null}
    </div>
  );
}
