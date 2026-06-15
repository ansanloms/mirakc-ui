import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { $api } from "../../lib/api/client.ts";
import {
  fetchKeywordRules,
  type KeywordRule,
  removeKeywordRule,
  updateKeywordRule,
} from "../../lib/api/keyword-rules.ts";
import { buildChannelGroups } from "../../lib/service.ts";
import { useNow } from "../../hooks/use-now.ts";
import { t } from "../../locales/i18n.ts";
import LoadingTemplate from "../../components/templates/Loading.tsx";
import KeywordRulesTemplate from "../../components/templates/KeywordRules.tsx";

export const Route = createFileRoute("/settings/keywords")({
  component: KeywordRulesPage,
});

/**
 * キーワード自動録画の管理ページ (レイアウト)。一覧の取得・トグル・削除を
 * 行い、表示は templates/KeywordRules に委ねる。登録/編集モーダルは子ルート
 * (/settings/keywords/new, /settings/keywords/$ruleId) が描画し、`<Outlet/>`
 * としてこの上に重なる。/api/keyword-rules は mirakc-ui 自身の API のため、
 * $api (mirakc の OpenAPI 由来) ではなく素の TanStack Query を使う。
 */
function KeywordRulesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = t("keyword.title");
  }, []);

  // 「今後 7 日間」の起点。分単位で追従させる。
  const currentEpochMs = useNow(60_000);

  const rules = useQuery({
    queryKey: ["keyword-rules"],
    queryFn: () => fetchKeywordRules(),
  });
  const services = $api.useQuery("get", "/services");
  const channels = $api.useQuery("get", "/channels");
  const programs = $api.useQuery("get", "/programs");

  // 条件チップは channel 単位で表示する。配下サービスはバッジ用にフル解決する。
  const channelGroups = useMemo(
    () => buildChannelGroups(channels.data ?? [], services.data ?? []),
    [channels.data, services.data],
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["keyword-rules"] });

  // 有効/停止トグル (全項目上書きの PUT)。
  const toggle = useMutation({
    mutationFn: (rule: KeywordRule) => {
      const { id: _id, createdAt: _createdAt, ...input } = rule;
      return updateKeywordRule(rule.id, {
        ...input,
        enabled: !rule.enabled,
      });
    },
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (rule: KeywordRule) => removeKeywordRule(rule.id),
    onSuccess: invalidate,
  });

  if (
    rules.isPending || services.isPending || channels.isPending ||
    programs.isPending
  ) {
    return <LoadingTemplate label={t("keyword.loading")} />;
  }

  return (
    <KeywordRulesTemplate
      rules={rules.data ?? []}
      services={services.data ?? []}
      channels={channelGroups}
      programs={programs.data ?? []}
      currentEpochMs={currentEpochMs}
      busy={toggle.isPending || remove.isPending}
      onAdd={() => navigate({ to: "/settings/keywords/new" })}
      onEdit={(rule) =>
        navigate({
          to: "/settings/keywords/$ruleId",
          params: { ruleId: rule.id },
        })}
      onToggle={(rule) => toggle.mutate(rule)}
      onRemove={(rule) => remove.mutate(rule)}
      onBackToSettings={() => navigate({ to: "/settings" })}
      onOpenWatch={() => navigate({ to: "/watch" })}
      onBack={() => navigate({ to: "/" })}
    >
      <Outlet />
    </KeywordRulesTemplate>
  );
}
