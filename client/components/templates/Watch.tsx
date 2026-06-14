import { type ComponentProps, useMemo } from "react";
import { formatHm, formatMd, formatWeekday } from "../../lib/datetime.ts";
import { extractProgramMarks } from "../../lib/program-status.ts";
import type { components } from "../../lib/api/schema.d.ts";
import type { ChannelType } from "../../lib/service.ts";
import type { LiveComment } from "../../lib/live-comment.ts";
import type { CommentSourceId } from "../../../server/lib/comments/types.ts";
import WatchPlayer from "../organisms/Watch/Player.tsx";
import TabPanel from "../organisms/Watch/TabPanel.tsx";
import type { TabId } from "../organisms/Watch/TabPanel.tsx";
import SelectTab from "../organisms/Watch/SelectTab.tsx";
import type { ChannelEntry } from "../organisms/Watch/SelectTab.tsx";
import InfoTab from "../organisms/Watch/InfoTab.tsx";
import LiveCommentTab from "../organisms/Watch/LiveCommentTab.tsx";
import ChannelBadge from "../atoms/ChannelBadge.tsx";
import ProgramMarks from "../atoms/ProgramMarks.tsx";
import PageHeader from "../organisms/PageHeader.tsx";
import ColorSchemeToggle from "../../islands/ColorSchemeToggle.tsx";
import { t } from "../../locales/i18n.ts";
import styles from "./Watch.module.css";

type Service = components["schemas"]["MirakurunService"];
type Program = components["schemas"]["MirakurunProgram"];
type PlayerProps = ComponentProps<typeof WatchPlayer>;

type Props = {
  // header
  /** 番組表へ戻る。 */
  onBack: () => void;

  /** 設定ポータル (/settings) へ遷移する。 */
  onOpenSettings: () => void;

  // player
  streamUrl: PlayerProps["streamUrl"];
  audioTrackIndex: PlayerProps["audioTrackIndex"];
  onAudioTrackChange: PlayerProps["onAudioTrackChange"];
  audios: PlayerProps["audios"];
  quality: PlayerProps["quality"];
  onQualityChange: PlayerProps["onQualityChange"];
  captionVisible: PlayerProps["captionVisible"];
  onCaptionToggle: PlayerProps["onCaptionToggle"];
  serviceSelectedAt: PlayerProps["serviceSelectedAt"];

  /** 視聴中の番組 / サービス。 */
  program?: Program;
  service?: Service;

  // 番組選択タブ
  channelType: ChannelType;
  onChangeChannelType: (channelType: ChannelType) => void;
  channels: ChannelEntry[];
  activeServiceId?: number;
  onSelectService: (service: Service) => void;

  // 右パネルタブ
  tab: TabId;
  onChangeTab: (tab: TabId) => void;

  // 実況コメント
  comments: LiveComment[];
  liveConnected: boolean;
  /** 候補の取得元 (フィルタチップ。複数あると取得元バッジ・フィルタを出す)。 */
  liveSources: CommentSourceId[];
  /** 表示中の取得元。 */
  liveSelectedSources: CommentSourceId[];
  /** 取得元の表示 ON/OFF を切り替える。 */
  onToggleLiveSource: (id: CommentSourceId) => void;
  /** ユーザ投稿。未対応 (受信専用) なら省略する。 */
  onPostComment?: (text: string) => void;
};

/** 番組視聴ページ。トップバー + プレイヤー + 右パネル(3 タブ)。 */
export default function Watch(props: Props) {
  const { program, service } = props;
  // program.name からステータス記号 ([字] 等) を抽出し、表示名から除去する。
  const { name: programName, marks } = useMemo(
    () => extractProgramMarks(program?.name),
    [program?.name],
  );

  return (
    <div className="app-root">
      <PageHeader
        icon="live_tv"
        title={t("watch.title")}
        subtitle={t("watch.subtitle")}
        links={[
          { icon: "grid_view", label: t("watch.back"), onClick: props.onBack },
          {
            icon: "settings",
            label: t("settings.open"),
            onClick: props.onOpenSettings,
          },
        ]}
      >
        <ColorSchemeToggle />
      </PageHeader>

      <div className={styles.grid}>
        <main className={styles.main}>
          <WatchPlayer
            streamUrl={props.streamUrl}
            audioTrackIndex={props.audioTrackIndex}
            onAudioTrackChange={props.onAudioTrackChange}
            audios={props.audios}
            quality={props.quality}
            onQualityChange={props.onQualityChange}
            captionVisible={props.captionVisible}
            onCaptionToggle={props.onCaptionToggle}
            serviceSelectedAt={props.serviceSelectedAt}
            program={program}
            service={service}
            comments={props.comments}
            sources={props.liveSources}
          />
          {program && (
            <div className={styles.underPlayer}>
              <h1 className={styles.title}>
                {programName}
                <ProgramMarks marks={marks} variant="title" />
              </h1>
              <div className={styles.meta}>
                {service && <ChannelBadge service={service} size="sm" />}
                {service && <span className={styles.ch}>{service.name}</span>}
                <span className={styles.dot}>·</span>
                <span>
                  {formatMd(program.startAt)}
                  ({formatWeekday(program.startAt)}){"　"}
                  {formatHm(program.startAt)} –{" "}
                  {formatHm(program.startAt + program.duration)}
                </span>
              </div>
            </div>
          )}
        </main>

        <TabPanel
          tab={props.tab}
          onChangeTab={props.onChangeTab}
          liveCount={props.comments.length}
        >
          {props.tab === "select" && (
            <SelectTab
              channelType={props.channelType}
              onChangeChannelType={props.onChangeChannelType}
              channels={props.channels}
              activeServiceId={props.activeServiceId}
              onSelect={props.onSelectService}
            />
          )}
          {props.tab === "info" && program && service && (
            <InfoTab program={program} service={service} />
          )}
          {props.tab === "live" && (
            <LiveCommentTab
              comments={props.comments}
              connected={props.liveConnected}
              sources={props.liveSources}
              selectedSources={props.liveSelectedSources}
              onToggleSource={props.onToggleLiveSource}
              onPost={props.onPostComment}
            />
          )}
        </TabPanel>
      </div>
    </div>
  );
}
