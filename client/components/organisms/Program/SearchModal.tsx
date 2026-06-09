import { useEffect, useMemo, useRef, useState } from "react";

import type { components } from "../../../lib/api/schema.d.ts";
import Modal from "../../atoms/Modal.tsx";
import Icon from "../../atoms/Icon.tsx";
import ChannelBadge from "../../atoms/ChannelBadge.tsx";
import RecordingStatusBadge from "../../atoms/RecordingStatusBadge.tsx";
import { genreOf, genreVars } from "../../../lib/genre.ts";
import { useDebouncedValue } from "../../../hooks/use-debounced-value.ts";
import { formatMdHm } from "../../../lib/datetime.ts";
import { t } from "../../../locales/i18n.ts";
import styles from "./SearchModal.module.css";

type Program = components["schemas"]["MirakurunProgram"];
type Service = components["schemas"]["MirakurunService"];
type Schedule = components["schemas"]["WebRecordingSchedule"];

/** 検索の絞り込みタブ。URL の ?filter= に連動する。 */
export type FilterId = "all" | "reserved";

/** 検索キーワードの URL 反映を間引く時間 (ms)。 */
export const SEARCH_DEBOUNCE_MS = 250;

type Props = {
  /** 表示状況。 */
  open: boolean;

  /** モーダルを閉じる。 */
  onClose: () => void;

  /** 検索キーワード (URL の ?q=)。マウント時の初期値に使う。 */
  query: string;

  /** 検索キーワードを更新する (間引き済みの確定値で呼ばれる)。 */
  onQueryChange: (query: string) => void;

  /** 絞り込みタブ (URL の ?filter=)。 */
  filter: FilterId;

  /** 絞り込みタブを切り替える。 */
  onFilterChange: (filter: FilterId) => void;

  /** 検索対象の番組一覧。 */
  programs: Program[];

  /** サービス一覧 (チャンネル表記の解決に使う)。 */
  services: Service[];

  /** 録画予約一覧 (録画予約タブの母集合 = 録画対象の全 state)。 */
  schedules: Schedule[];

  /** 番組を選択する。 */
  onPick: (program: Program) => void;
};

/** 番組名に query が含まれるか。 */
function matchProgram(program: Program, query: string): boolean {
  if (!query) {
    return true;
  }
  return (program.name ?? "").includes(query);
}

export default function ProgramSearchModal(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  // 入力欄のローカル状態 (単一ソース)。URL (?q=) からはマウント時にだけ seed し、
  // 以降は draft → URL の一方向で書き出す。controlled value を router の往復に
  // 直結すると IME 変換中に value が巻き戻り変換が壊れるため。
  const [draft, setDraft] = useState(props.query);
  const composingRef = useRef(false);

  // draft を間引いた確定キーワード。フィルタと URL 反映の両方に使う (打鍵ごとに
  // 数千件の番組を走査しないため)。
  const debounced = useDebouncedValue(draft, SEARCH_DEBOUNCE_MS);
  const { onQueryChange } = props;

  // 間引いた値を URL (?q=) へ反映する。IME 変換中は反映しない (compositionEnd で
  // 確定反映する)。debounced が props.query と同値 (マウント直後 / echo) なら何も
  // しない。
  useEffect(() => {
    if (composingRef.current) {
      return;
    }
    if (debounced === props.query) {
      return;
    }
    // props.query / onQueryChange を契機に含めると navigate の echo で再発火する
    // ため、間引き値の変化だけを契機にする。
    onQueryChange(debounced);
  }, [debounced]);

  useEffect(() => {
    if (props.open) {
      inputRef.current?.focus();
    }
  }, [props.open]);

  const findService = (program: Program): Service | undefined =>
    props.services.find(
      (s) =>
        s.networkId === program.networkId && s.serviceId === program.serviceId,
    );

  /** 番組 id → 録画スケジュール。行のステータスバッジ表示に使う。 */
  const scheduleByProgram = useMemo(() => {
    const map = new Map<Program["id"], Schedule>();
    for (const s of props.schedules) {
      map.set(s.program.id, s);
    }
    return map;
  }, [props.schedules]);

  const keyword = debounced.trim();
  const filter = props.filter;

  /** 結果一覧。null は「キーワード入力を促す」状態 (all かつ未入力)。 */
  const results = useMemo<Program[] | null>(() => {
    if (filter === "reserved") {
      // 録画予約 = 録画対象の全 state を新しい順に表示する。
      return [...props.schedules]
        .sort((a, b) => b.program.startAt - a.program.startAt)
        .map((s) => s.program)
        .filter((p) => matchProgram(p, keyword));
    }
    if (!keyword) {
      return null;
    }
    return props.programs.filter((p) => matchProgram(p, keyword));
  }, [filter, keyword, props.programs, props.schedules]);

  const filters: { id: FilterId; label: string; count?: number }[] = [
    { id: "all", label: t("search.filter.all") },
    {
      id: "reserved",
      label: t("search.filter.reserved"),
      count: props.schedules.length,
    },
  ];

  return (
    <Modal open={props.open} onClose={props.onClose} align="top" hideClose>
      <div className={styles.searchModal}>
        <div className={styles.head}>
          <Icon size={20}>search</Icon>
          <input
            ref={inputRef}
            className={styles.input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onCompositionStart={() => {
              composingRef.current = true;
            }}
            onCompositionEnd={(e) => {
              composingRef.current = false;
              // 変換確定値を即反映する (間引き待ちにしない)。
              onQueryChange(e.currentTarget.value);
            }}
            placeholder={t("search.placeholder")}
          />
          {draft && (
            <button
              type="button"
              className={styles.clear}
              onClick={() => {
                setDraft("");
                onQueryChange("");
              }}
              aria-label={t("common.close")}
            >
              <Icon size={14}>close</Icon>
            </button>
          )}
          <button
            type="button"
            className={styles.close}
            onClick={props.onClose}
          >
            {t("search.cancel")}
          </button>
        </div>

        <div className={styles.filters}>
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`${styles.filterTab} ${
                filter === f.id ? styles.filterTabActive : ""
              }`}
              onClick={() => props.onFilterChange(f.id)}
            >
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <span className={styles.filterCount}>{f.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className={styles.results}>
          {results === null
            ? (
              <div className={styles.empty}>
                <Icon size={38}>search</Icon>
                <p className={styles.emptyTitle}>{t("search.emptyPrompt")}</p>
                <span className={styles.emptyHint}>
                  {t("search.emptyHint")}
                </span>
              </div>
            )
            : results.length === 0
            ? (
              <div className={styles.empty}>
                <Icon size={38}>search_off</Icon>
                <p className={styles.emptyTitle}>{t("search.noResults")}</p>
              </div>
            )
            : (
              <ul className={styles.list}>
                {results.map((program) => {
                  const service = findService(program);
                  const genre = genreOf(program);
                  const schedule = scheduleByProgram.get(program.id);
                  return (
                    <li key={program.id}>
                      <button
                        type="button"
                        className={styles.row}
                        onClick={() => props.onPick(program)}
                      >
                        <span
                          className={styles.rowDot}
                          style={{ background: genreVars(genre.key).strong }}
                        />
                        <span className={styles.rowMain}>
                          <span className={styles.rowTitle}>
                            {program.name}
                          </span>
                          <span className={styles.rowMeta}>
                            {service && (
                              <ChannelBadge service={service} size="xs" />
                            )}
                            {service && <span>{service.name}</span>}
                            <span>
                              {formatMdHm(program.startAt)}
                            </span>
                          </span>
                        </span>
                        {schedule && (
                          <RecordingStatusBadge state={schedule.state} />
                        )}
                        <Icon size={16}>chevron_right</Icon>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
        </div>
      </div>
    </Modal>
  );
}
