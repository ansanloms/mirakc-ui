import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from "react";
import type { components } from "../../../lib/api/schema.d.ts";
import { genreOf, genreVars } from "../../../lib/genre.ts";
import type { LiveComment } from "../../../lib/live-comment.ts";
import { t } from "../../../locales/i18n.ts";
import Icon from "../../atoms/Icon.tsx";
import ChannelBadge from "../../atoms/ChannelBadge.tsx";
import CommentFeed from "./CommentFeed.tsx";
import styles from "./Player.module.css";
import { qualities, type Quality } from "../../../../server/lib/quality.ts";

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
  /** ストリーム URL。 */
  streamUrl: string | undefined;

  /** 音声トラックインデックス（audios 配列内の位置）。 */
  audioTrackIndex: number;

  /** 音声トラックを変更する。 */
  onAudioTrackChange: (index: number) => void;

  /** 利用可能な音声トラック一覧 (現在オンエア中の番組由来)。 */
  audios: AudioInfo[];

  /** 画質。 */
  quality: Quality;

  /** 画質を変更する。 */
  onQualityChange: (quality: Quality) => void;

  /** 字幕表示状態。 */
  captionVisible: boolean;

  /** 字幕表示を切り替える。 */
  onCaptionToggle: () => void;

  /**
   * サービス選択操作のタイムスタンプ (user gesture trigger)。
   * 値が変わるたびに muted を解除する。0 は「未選択」扱いで無視する。
   */
  serviceSelectedAt: number;

  /** 視聴中の番組 (stage の表示に使う)。 */
  program?: components["schemas"]["MirakurunProgram"];

  /** 視聴中のサービス (stage の ch バッジに使う)。 */
  service?: components["schemas"]["MirakurunService"];

  /**
   * 実況コメント (映像上のオーバーレイ表示用)。指定すると右端に開閉タブが
   * 出る。undefined ならオーバーレイ自体を出さない。
   */
  comments?: LiveComment[];

  /**
   * mpegts.js モジュールのローダー。既定は esm.sh からの動的 import。
   * テスト時はフェイクに差し替えて、外部ストリームライブラリの読み込みを断つ。
   */
  loadMpegts?: () => Promise<typeof import("mpegts.js")>;

  /**
   * aribb24.js モジュールのローダー。既定は npm からの動的 import。
   * テスト時はフェイクに差し替える。
   */
  loadAribb24?: () => Promise<typeof import("aribb24.js")>;
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

/** プレイヤーのエラー表示情報。 */
type PlayerError = {
  /** 見出し。 */
  title: string;
  /** 案内文。 */
  description?: string;
  /** エラーコード等の詳細 (モノスペース表示)。 */
  code?: string;
  /** 再試行可能か (再試行ボタンを出すか)。 */
  retryable: boolean;
};

export default function WatchPlayer(props: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const captionContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<MpegtsPlayer | null>(null);
  const aribb24Ref = useRef<
    { controller: Aribb24Controller; renderer: Aribb24Renderer } | null
  >(null);
  const [error, setError] = useState<PlayerError | undefined>(undefined);
  // 受信中 (チューニング / バッファリング) 中は true。streamUrl セット時に true、
  // <video> の playing で false、waiting で再度 true。実際の再生状態に追従する。
  const [buffering, setBuffering] = useState(false);
  // 再試行カウンタ。インクリメントで streamUrl の effect を再実行し再受信する。
  const [retryNonce, setRetryNonce] = useState(0);
  // autoplay 通過のため初期 muted=true。volume / muted は React state を「真」
  // として useEffect で video element に同期する一方向フロー。volumechange
  // listener は持たない (フルスクリーン等で外部要因で v.muted が変わっても
  // 次の render で必ず state 値に上書きされる)。
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // 映像上のコメントオーバーレイの開閉状態。
  const [commentsOpen, setCommentsOpen] = useState(false);
  // controls の表示状態。マウス移動 / タップで表示し、操作が止まると自動で隠す。
  const [controlsVisible, setControlsVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  // 音声 / 画質のポップメニュー。
  const [menu, setMenu] = useState<"audio" | "quality" | null>(null);

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
    setBuffering(true);

    let destroyed = false;

    // 実際の再生状態に追従して受信中オーバーレイを出し入れする。
    // playing = 映像が流れ始めた / waiting = データ待ちで停止した。
    const video = videoRef.current;
    const handlePlaying = () => {
      if (!destroyed) {
        setBuffering(false);
      }
    };
    const handleWaiting = () => {
      if (!destroyed) {
        setBuffering(true);
      }
    };
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("waiting", handleWaiting);

    const loadMpegts = props.loadMpegts ?? (() => import("mpegts.js"));
    const loadAribb24 = props.loadAribb24 ?? (() => import("aribb24.js"));

    const init = async () => {
      const [mpegtsModule, aribb24Module] = await Promise.all([
        loadMpegts(),
        loadAribb24(),
      ]);

      if (destroyed) {
        return;
      }

      const mpegts = mpegtsModule.default;

      if (!mpegts.isSupported()) {
        setError({ title: t("watch.error.mseNotSupported"), retryable: false });
        setBuffering(false);
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

      player.on(
        mpegtsEvents.ERROR,
        (errorType: unknown, errorDetail: unknown) => {
          if (!destroyed) {
            const detail = [errorType, errorDetail]
              .filter((v): v is string => typeof v === "string" && v.length > 0)
              .join(" / ");
            setError({
              title: t("watch.error.title"),
              description: t("watch.error.description"),
              code: detail ? t("watch.error.code", { detail }) : undefined,
              retryable: true,
            });
            setBuffering(false);
          }
        },
      );

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

      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("waiting", handleWaiting);

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
  }, [props.streamUrl, retryNonce]);

  const handleRetry = () => {
    setError(undefined);
    setBuffering(true);
    setRetryNonce((n) => n + 1);
  };

  const handleToggleMute = () => {
    setMuted((prev) => !prev);
  };

  const handleVolumeInput = (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setVolume(value);
    setMuted(value === 0);
  };

  // ポインタ操作で controls を表示し、2.6 秒操作が無ければ自動で隠す。
  const revealControls = () => {
    setControlsVisible(true);
    if (hideTimerRef.current !== undefined) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
      setMenu(null);
    }, 2600);
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

  // 「チャンネルを選択してください」はストリームも選択中サービスも無いときだけ出す。
  // サービス選択済み (= streamUrl がまだ無いだけ) のときはプレイヤー面を見せる。
  if (!props.streamUrl && !props.service) {
    return (
      <div className={styles.placeholder}>
        <p>{t("watch.selectService")}</p>
      </div>
    );
  }

  const sliderValue = muted ? 0 : volume;
  const genre = props.program ? genreOf(props.program) : undefined;
  const stageBg = genre
    ? `radial-gradient(120% 120% at 50% 30%, color-mix(in oklab, ${
      genreVars(genre.key).strong
    } 42%, #05070b) 0%, #05070b 72%)`
    : "#05070b";

  const audioLabel = (index: number): string => {
    const a = props.audios[index];
    if (!a) {
      return t("watch.audio.main");
    }
    const base = a.isMain ? t("watch.audio.main") : t("watch.audio.sub");
    const lang = a.langs.length > 0 ? ` (${a.langs.join("/")})` : "";
    return `${base}${lang}`;
  };
  const audioOptions = props.audios.length > 0
    ? props.audios.map((_, i) => i)
    : [0];

  return (
    <div className={styles.container}>
      <div
        ref={playerContainerRef}
        className={`${styles.player} ${
          controlsVisible ? styles.controlsVisible : ""
        }`}
        onPointerMove={revealControls}
        tabIndex={0}
      >
        <div className={styles.stage} style={{ background: stageBg }} />
        <video
          ref={videoRef}
          className={styles.video}
          autoPlay
          muted
          disablePictureInPicture
          onPointerDown={handleVideoPointerDown}
        />
        <div ref={captionContainerRef} className={styles.captionContainer} />

        {props.comments !== undefined && (
          <>
            <div
              className={`${styles.comments} ${
                commentsOpen ? styles.commentsOpen : ""
              }`}
              aria-hidden={!commentsOpen}
            >
              <CommentFeed comments={props.comments} onVideo />
            </div>
            <button
              type="button"
              className={`${styles.commentsToggle} ${
                commentsOpen ? styles.commentsToggleOpen : ""
              }`}
              onClick={() => setCommentsOpen((prev) => !prev)}
              aria-label={commentsOpen
                ? t("watch.live.overlayHide")
                : t("watch.live.overlayShow")}
              title={t("watch.tab.live")}
            >
              <span className={styles.commentsToggleIcon}>
                <Icon size={20}>chevron_right</Icon>
              </span>
            </button>
          </>
        )}

        {buffering && !error && (
          <div className={styles.buffering}>
            <div className={styles.bufInner}>
              <div className={styles.bufSpinner} />
              <div className={styles.bufLabel}>
                {props.service && (
                  <ChannelBadge service={props.service} size="sm" />
                )}
                {props.service
                  ? t("watch.buffering.receiving", { name: props.service.name })
                  : t("watch.buffering.receivingUnknown")}
                <span className={styles.bufDots}>
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className={styles.playerError} role="alert">
            <div className={styles.errInner}>
              <span className={styles.errIc}>
                <Icon size={32}>warning</Icon>
              </span>
              <h3 className={styles.errTitle}>{error.title}</h3>
              {error.description && (
                <p className={styles.errText}>{error.description}</p>
              )}
              {error.code && (
                <span className={styles.errCode}>{error.code}</span>
              )}
              {error.retryable && (
                <button
                  type="button"
                  className={styles.errRetry}
                  onClick={handleRetry}
                >
                  <Icon size={18}>refresh</Icon>
                  {t("watch.error.retry")}
                </button>
              )}
            </div>
          </div>
        )}

        <div className={styles.controls}>
          <div className={styles.ctrlRow}>
            <div className={styles.volumeGroup}>
              <button
                type="button"
                className={styles.cbtn}
                onClick={handleToggleMute}
                aria-label={muted
                  ? t("watch.player.unmute")
                  : t("watch.player.mute")}
              >
                <Icon size={22}>
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

            <button
              type="button"
              className={`${styles.cbtn} ${styles.cc} ${
                props.captionVisible ? styles.ccOn : ""
              }`}
              onClick={props.onCaptionToggle}
              aria-label={props.captionVisible
                ? t("watch.caption.hide")
                : t("watch.caption.show")}
              aria-pressed={props.captionVisible}
            >
              <Icon size={24}>closed_caption</Icon>
            </button>

            <span className={styles.spacer} />

            <div className={styles.menuWrap}>
              <button
                type="button"
                className={`${styles.cbtn} ${styles.txt}`}
                onClick={() => setMenu((m) => (m === "audio" ? null : "audio"))}
                aria-label={t("watch.audio.label")}
              >
                {audioLabel(props.audioTrackIndex)}
              </button>
              {menu === "audio" && (
                <div
                  className={styles.popmenu}
                  onMouseLeave={() => setMenu(null)}
                >
                  <div className={styles.popHead}>{t("watch.audio.label")}</div>
                  {audioOptions.map((i) => (
                    <button
                      key={i}
                      type="button"
                      className={`${styles.popOpt} ${
                        i === props.audioTrackIndex ? styles.popOptActive : ""
                      }`}
                      onClick={() => {
                        props.onAudioTrackChange(i);
                        setMenu(null);
                      }}
                    >
                      {audioLabel(i)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.menuWrap}>
              <button
                type="button"
                className={`${styles.cbtn} ${styles.txt}`}
                onClick={() =>
                  setMenu((m) => (m === "quality" ? null : "quality"))}
                aria-label={t("watch.quality.label")}
              >
                {props.quality}
              </button>
              {menu === "quality" && (
                <div
                  className={styles.popmenu}
                  onMouseLeave={() => setMenu(null)}
                >
                  <div className={styles.popHead}>
                    {t("watch.quality.label")}
                  </div>
                  {qualities.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className={`${styles.popOpt} ${
                        q === props.quality ? styles.popOptActive : ""
                      }`}
                      onClick={() => {
                        props.onQualityChange(q);
                        setMenu(null);
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className={styles.cbtn}
              onClick={handleToggleFullscreen}
              aria-label={isFullscreen
                ? t("watch.player.exitFullscreen")
                : t("watch.player.fullscreen")}
            >
              <Icon size={22}>
                {isFullscreen ? "fullscreen_exit" : "fullscreen"}
              </Icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
