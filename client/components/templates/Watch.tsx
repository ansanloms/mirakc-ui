import type { ComponentProps } from "react";
import { Link } from "@tanstack/react-router";
import { formatHm, formatMd, formatWeekday } from "../../lib/datetime.ts";
import type { components } from "../../lib/api/schema.d.ts";
import type { ChannelType } from "../../lib/service.ts";
import type { LiveComment } from "../../lib/live-comment.ts";
import WatchPlayer from "../organisms/Watch/Player.tsx";
import TabPanel from "../organisms/Watch/TabPanel.tsx";
import type { TabId } from "../organisms/Watch/TabPanel.tsx";
import SelectTab from "../organisms/Watch/SelectTab.tsx";
import type { ChannelEntry } from "../organisms/Watch/SelectTab.tsx";
import InfoTab from "../organisms/Watch/InfoTab.tsx";
import LiveCommentTab from "../organisms/Watch/LiveCommentTab.tsx";
import ChannelBadge from "../atoms/ChannelBadge.tsx";
import Icon from "../atoms/Icon.tsx";
import ColorSchemeToggle from "../../islands/ColorSchemeToggle.tsx";
import { t } from "../../locales/i18n.ts";
import styles from "./Watch.module.css";

type Service = components["schemas"]["MirakurunService"];
type Program = components["schemas"]["MirakurunProgram"];
type PlayerProps = ComponentProps<typeof WatchPlayer>;

type Props = {
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
  onPostComment: (text: string) => void;
};

/** 番組視聴ページ。トップバー + プレイヤー + 右パネル(3 タブ)。 */
export default function Watch(props: Props) {
  const { program, service } = props;

  return (
    <div className="app-root">
      <header className={styles.topbar}>
        <Link className={styles.backLink} to="/program">
          <Icon size={18}>chevron_left</Icon>
          <span>{t("watch.back")}</span>
        </Link>
        <ColorSchemeToggle />
      </header>

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
          />
          {program && (
            <div className={styles.underPlayer}>
              <h1 className={styles.title}>{program.name ?? ""}</h1>
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
              onPost={props.onPostComment}
            />
          )}
        </TabPanel>
      </div>
    </div>
  );
}
