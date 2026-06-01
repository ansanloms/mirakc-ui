import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from "react";
import { t } from "../../../locales/i18n.ts";
import Icon from "../../atoms/Icon.tsx";
import styles from "./Player.module.css";

type Quality = "480p" | "720p" | "1024p";

/**
 * MirakurunProgram.audios の各エントリ。ARIB の音声トラック情報。
 */
type AudioInfo = {
  componentType: number;
  isMain: boolean;
  langs: string[];
  samplingRate: number;
};

type Props = {
  /**
   * ストリーム URL。
   */
  streamUrl: string | undefined;

  /**
   * 音声トラックインデックス（audios 配列内の位置）。
   */
  audioTrackIndex: number;

  /**
   * 音声トラックを変更する。
   */
  onAudioTrackChange: (index: number) => void;

  /**
   * 利用可能な音声トラック一覧 (現在オンエア中の番組由来)。
   */
  audios: AudioInfo[];

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

  /**
   * サービス選択操作のタイムスタンプ (user gesture trigger)。
   * 値が変わるたびに muted を解除する。0 は「未選択」扱いで無視する。
   */
  serviceSelectedAt: number;
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
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const captionContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<MpegtsPlayer | null>(null);
  const aribb24Ref = useRef<
    { controller: Aribb24Controller; renderer: Aribb24Renderer } | null
  >(null);
  const [error, setError] = useState<string | undefined>(undefined);
  // autoplay 通過のため初期 muted=true。volume / muted は React state を「真」
  // として useEffect で video element に同期する一方向フロー。volumechange
  // listener は持たない (フルスクリーン等で外部要因で v.muted が変わっても
  // 次の render で必ず state 値に上書きされる)。
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // controls の表示状態。マウス移動 / タップで表示し、操作が止まると自動で隠す。
  // CSS の :hover は (any-hover: hover) 環境でしか効かず、タッチスクリーン付き PC や
  // 一部環境では hover 判定が無効 (hover:none) になるため、JS でポインタ操作を
  // 検知して補う。
  const [controlsVisible, setControlsVisible] = useState(false);
  const hideTimerRef = useRef<number | undefined>(undefined);

  // captionVisible prop の変化を aribb24 コントローラーに反映
  useEffect(() => {
    if (!aribb24Ref.current) {
      return;
    }
    if (props.captionVisible) {
      aribb24Ref.current.controller.show();
    } else {
      aribb24Ref.current.controller.hide();
    }
  }, [props.captionVisible]);

  // React state → video element 同期 (一方向)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) {
      return;
    }
    v.muted = muted;
    v.volume = volume;
  }, [muted, volume]);

  // user gesture (サービスリストクリック) で unmute する。
  // ページ初回ロード (props.serviceSelectedAt === 0) では発火しないので
  // 直リンク `/watch/<id>` は muted のまま autoplay を通す。
  useEffect(() => {
    if (props.serviceSelectedAt === 0) {
      return;
    }
    setMuted(false);
  }, [props.serviceSelectedAt]);

  // fullscreenchange を listen して state 同期
  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(
        document.fullscreenElement === playerContainerRef.current,
      );
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
    };
  }, []);

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

      if (destroyed) {
        return;
      }

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

  const handleToggleMute = () => {
    setMuted((prev) => !prev);
  };

  const handleVolumeInput = (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setVolume(value);
    setMuted(value === 0);
  };

  // ポインタ操作で controls を表示し、2.5 秒操作が無ければ自動で隠す
  // (動画プレイヤーの定番 UX)。controls 上でマウスが動いている間も発火するため
  // 操作中は消えない。
  const revealControls = () => {
    setControlsVisible(true);
    if (hideTimerRef.current !== undefined) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 2500);
  };

  // video 領域のタップ (touch) は controls の表示を反転する。
  const handleVideoPointerDown = (e: ReactPointerEvent<HTMLVideoElement>) => {
    if (e.pointerType !== "touch") {
      return;
    }
    setControlsVisible((prev) => !prev);
  };

  // アンマウント時に自動非表示タイマーを掃除する。
  useEffect(() => {
    return () => {
      if (hideTimerRef.current !== undefined) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const handleToggleFullscreen = () => {
    const el = playerContainerRef.current;
    if (!el) {
      return;
    }
    if (document.fullscreenElement) {
      const r = document.exitFullscreen();
      if (r && typeof r.catch === "function") {
        r.catch(() => {});
      }
    } else {
      const r = el.requestFullscreen();
      if (r && typeof r.catch === "function") {
        r.catch(() => {});
      }
    }
  };

  if (!props.streamUrl) {
    return (
      <div className={styles.placeholder}>
        <p>{t("watch.selectService")}</p>
      </div>
    );
  }

  const sliderValue = muted ? 0 : volume;

  return (
    <div className={styles.container}>
      <div
        ref={playerContainerRef}
        className={`${styles.playerContainer} ${
          controlsVisible ? styles.controlsVisible : ""
        }`}
        onPointerMove={revealControls}
      >
        <video
          ref={videoRef}
          className={styles.video}
          autoPlay
          muted
          disablePictureInPicture
          onPointerDown={handleVideoPointerDown}
        />
        <div ref={captionContainerRef} className={styles.captionContainer} />
        {
          /*
           * 音声 / 画質 select は UI / URL state には反映されるが、実際の
           * stream 切替はトランスコード API が未配線のため未動作。
           * トランスコード層が入る PR (#11 / #16) で stream URL に反映される
           * 配線が入る。字幕 toggle / 音量 / フルスクリーンは実動作する。
           */
        }
        <div className={styles.controls}>
          <div className={styles.controlsLeft}>
            <div className={styles.volumeGroup}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={handleToggleMute}
                aria-label={muted
                  ? t("watch.player.unmute")
                  : t("watch.player.mute")}
              >
                <Icon size={20}>
                  {sliderValue === 0 ? "volume_off" : "volume_up"}
                </Icon>
              </button>
              <input
                type="range"
                className={styles.volumeSlider}
                min={0}
                max={1}
                step={0.01}
                value={sliderValue}
                onChange={handleVolumeInput}
                aria-label={t("watch.player.volume")}
              />
            </div>

            <label
              className={styles.toggle}
              aria-label={t("watch.caption.label")}
            >
              <span className={styles.toggleLabel} aria-hidden="true">
                <Icon size={20}>closed_caption</Icon>
              </span>
              <input
                type="checkbox"
                className={styles.toggleInput}
                checked={props.captionVisible}
                onChange={props.onCaptionToggle}
              />
              <span className={styles.toggleSwitch} aria-hidden="true" />
            </label>
          </div>

          <div className={styles.controlsRight}>
            <label
              className={styles.selectField}
              aria-label={t("watch.audio.label")}
            >
              <span className={styles.selectLabel} aria-hidden="true">
                <Icon size={20}>audiotrack</Icon>
              </span>
              <select
                className={styles.select}
                value={String(props.audioTrackIndex)}
                onChange={(e) =>
                  props.onAudioTrackChange(
                    Number((e.target as HTMLSelectElement).value),
                  )}
              >
                {props.audios.length === 0
                  ? <option value="0">{t("watch.audio.main")}</option>
                  : props.audios.map((a, i) => {
                    const base = a.isMain
                      ? t("watch.audio.main")
                      : t("watch.audio.sub");
                    const lang = a.langs.length > 0
                      ? ` (${a.langs.join("/")})`
                      : "";
                    return (
                      <option key={i} value={String(i)}>{base}{lang}</option>
                    );
                  })}
              </select>
            </label>
            <label className={styles.selectField}>
              <span className={styles.selectLabel}>
                {t("watch.quality.label")}
              </span>
              <select
                className={styles.select}
                value={props.quality}
                onChange={(e) =>
                  props.onQualityChange(
                    (e.target as HTMLSelectElement).value as Quality,
                  )}
              >
                {(["480p", "720p", "1024p"] as Quality[]).map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={handleToggleFullscreen}
              aria-label={isFullscreen
                ? t("watch.player.exitFullscreen")
                : t("watch.player.fullscreen")}
            >
              <Icon size={20}>
                {isFullscreen ? "fullscreen_exit" : "fullscreen"}
              </Icon>
            </button>
          </div>
        </div>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
