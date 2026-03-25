import { useEffect, useRef, useState } from "preact/hooks";
import { t } from "../../../locales/i18n.ts";
import styles from "./Player.module.css";

type Quality = "480p" | "720p" | "1024p";

type Props = {
  /**
   * ストリーム URL。
   */
  streamUrl: string | undefined;

  /**
   * 音声トラックインデックス（0: 主音声, 1: 副音声）。
   */
  audioTrackIndex: number;

  /**
   * 音声トラックを変更する。
   */
  onAudioTrackChange: (index: number) => void;

  /**
   * 画質。
   */
  quality: Quality;

  /**
   * 画質を変更する。
   */
  onQualityChange: (quality: Quality) => void;

  /**
   * 字幕表示状態。
   */
  captionVisible: boolean;

  /**
   * 字幕表示を切り替える。
   */
  onCaptionToggle: () => void;
};

type MpegtsPlayer = {
  pause: () => void;
  unload: () => void;
  detachMediaElement: () => void;
  destroy: () => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  attachMediaElement: (el: HTMLVideoElement) => void;
  load: () => void;
  play: () => void | Promise<void>;
};

type Aribb24Controller = {
  attachMedia: (media: HTMLVideoElement, container: HTMLElement) => void;
  detachMedia: () => void;
  attachFeeder: (feeder: unknown) => void;
  detachFeeder: () => void;
  attachRenderer: (renderer: unknown) => void;
  detachRenderer: (renderer: unknown) => void;
  show: () => void;
  hide: () => void;
};

type Aribb24Renderer = {
  destroy: () => void;
};

export default function WatchPlayer(props: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const captionContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<MpegtsPlayer | null>(null);
  const aribb24Ref = useRef<
    { controller: Aribb24Controller; renderer: Aribb24Renderer } | null
  >(null);
  const [error, setError] = useState<string | undefined>(undefined);

  // captionVisible prop の変化を aribb24 コントローラーに反映
  useEffect(() => {
    if (!aribb24Ref.current) return;
    if (props.captionVisible) {
      aribb24Ref.current.controller.show();
    } else {
      aribb24Ref.current.controller.hide();
    }
  }, [props.captionVisible]);

  useEffect(() => {
    if (!props.streamUrl || !videoRef.current || !captionContainerRef.current) {
      return;
    }

    setError(undefined);

    let destroyed = false;

    const init = async () => {
      const [mpegtsModule, aribb24Module] = await Promise.all([
        import("mpegts.js"),
        import("aribb24.js"),
      ]);

      if (destroyed) return;

      const mpegts = mpegtsModule.default;

      if (!mpegts.isSupported()) {
        setError(t("watch.error.mseNotSupported"));
        return;
      }

      // mpegts.js プレーヤー初期化
      const player = mpegts.createPlayer(
        {
          type: "mpegts",
          isLive: true,
          url: props.streamUrl,
        },
        {
          enableStashBuffer: false,
          liveBufferLatencyChasing: true,
          liveBufferLatencyMaxLatency: 5.0,
          liveBufferLatencyMinRemain: 2.0,
        },
      ) as unknown as MpegtsPlayer;

      const mpegtsEvents =
        (mpegts as unknown as { Events: Record<string, string> })
          .Events;

      player.on(mpegtsEvents.ERROR, (_errorType: unknown) => {
        if (!destroyed) {
          setError(t("watch.error.playback"));
        }
      });

      // aribb24.js 字幕コントローラー初期化
      const { Controller, MPEGTSFeeder, CanvasMainThreadRenderer } =
        aribb24Module;
      const controller = new Controller() as unknown as Aribb24Controller;
      const feeder = new MPEGTSFeeder();
      const renderer =
        new CanvasMainThreadRenderer() as unknown as Aribb24Renderer;

      controller.attachFeeder(feeder);
      controller.attachRenderer(renderer);
      controller.attachMedia(videoRef.current!, captionContainerRef.current!);

      // 字幕表示状態を初期化
      if (!props.captionVisible) {
        controller.hide();
      }

      // mpegts.js の字幕イベントを aribb24.js に流す
      type PesData = {
        data: ArrayLike<number>;
        pts?: number;
        dts?: number;
        nearest_pts?: number;
      };

      player.on(mpegtsEvents.PES_PRIVATE_DATA_ARRIVED, (data: unknown) => {
        const d = data as PesData;
        (feeder as unknown as {
          feedB24: (buf: ArrayBuffer, pts: number, dts: number) => void;
        }).feedB24(
          new Uint8Array(d.data).buffer,
          ((d.pts ?? d.nearest_pts) ?? 0) / 1000,
          ((d.dts ?? d.nearest_pts) ?? 0) / 1000,
        );
      });

      player.on(
        mpegtsEvents.TIMED_ID3_METADATA_ARRIVED,
        (data: unknown) => {
          const d = data as PesData;
          (feeder as unknown as {
            feedID3: (buf: ArrayBuffer, pts: number, dts: number) => void;
          }).feedID3(
            new Uint8Array(d.data).buffer,
            ((d.pts ?? d.nearest_pts) ?? 0) / 1000,
            ((d.dts ?? d.nearest_pts) ?? 0) / 1000,
          );
        },
      );

      player.attachMediaElement(videoRef.current!);
      player.load();

      const playResult = player.play();
      if (
        playResult &&
        typeof (playResult as Promise<void>).catch === "function"
      ) {
        (playResult as Promise<void>).catch(() => {
          // autoplay blocked — user interaction needed
        });
      }

      playerRef.current = player;
      aribb24Ref.current = { controller, renderer };
    };

    init();

    return () => {
      destroyed = true;

      if (aribb24Ref.current) {
        try {
          aribb24Ref.current.controller.detachMedia();
          aribb24Ref.current.controller.detachFeeder();
          aribb24Ref.current.controller.detachRenderer(
            aribb24Ref.current.renderer,
          );
          aribb24Ref.current.renderer.destroy();
        } catch {
          // ignore cleanup errors
        }
        aribb24Ref.current = null;
      }

      if (playerRef.current) {
        try {
          playerRef.current.pause();
          playerRef.current.unload();
          playerRef.current.detachMediaElement();
          playerRef.current.destroy();
        } catch {
          // ignore cleanup errors
        }
        playerRef.current = null;
      }
    };
  }, [props.streamUrl]);

  if (!props.streamUrl) {
    return (
      <div class={styles.placeholder}>
        <p>{t("watch.selectService")}</p>
      </div>
    );
  }

  return (
    <div class={styles.container}>
      <div class={styles.playerContainer}>
        <video
          ref={videoRef}
          class={styles.video}
          controls
          autoplay
          muted
        />
        <div ref={captionContainerRef} class={styles.captionContainer} />
      </div>
      {error && <p class={styles.error}>{error}</p>}
      <div class={styles.controls}>
        <div class={styles.controlGroup}>
          <button
            type="button"
            class={styles.controlBtn}
            data-active={props.captionVisible}
            onClick={props.onCaptionToggle}
          >
            {props.captionVisible
              ? t("watch.caption.hide")
              : t("watch.caption.show")}
          </button>
        </div>
        <div class={styles.controlGroup}>
          <button
            type="button"
            class={styles.controlBtn}
            data-active={props.audioTrackIndex === 0}
            onClick={() => props.onAudioTrackChange(0)}
          >
            {t("watch.audio.main")}
          </button>
          <button
            type="button"
            class={styles.controlBtn}
            data-active={props.audioTrackIndex === 1}
            onClick={() => props.onAudioTrackChange(1)}
          >
            {t("watch.audio.sub")}
          </button>
        </div>
        <div class={styles.controlGroup}>
          {(["480p", "720p", "1024p"] as Quality[]).map((q) => (
            <button
              key={q}
              type="button"
              class={styles.controlBtn}
              data-active={props.quality === q}
              onClick={() => props.onQualityChange(q)}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
