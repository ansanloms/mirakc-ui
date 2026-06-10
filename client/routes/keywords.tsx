import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { $api } from "../lib/api/client.ts";
import {
  addKeywordRule,
  fetchKeywordRules,
  type KeywordRule,
  type KeywordRuleInput,
  removeKeywordRule,
  updateKeywordRule,
} from "../lib/api/keyword-rules.ts";
import { useNow } from "../hooks/use-now.ts";
import { t } from "../locales/i18n.ts";
import LoadingTemplate from "../components/templates/Loading.tsx";
import KeywordRulesTemplate from "../components/templates/KeywordRules.tsx";

export const Route = createFileRoute("/keywords")({
  component: KeywordRulesPage,
});

/**
 * キーワード自動録画の管理ページ。ルールの取得・追加・更新・削除を行い、
 * 表示は templates/KeywordRules に委ねる。/api/keyword-rules は mirakc-ui
 * 自身の API のため、$api (mirakc の OpenAPI 由来) ではなく素の
 * TanStack Query を使う。一致プレビュー用の番組・サービスは $api で引く。
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
  const programs = $api.useQuery("get", "/programs");

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["keyword-rules"] });

  const save = useMutation({
    mutationFn: ({ input, id }: { input: KeywordRuleInput; id?: string }) =>
      id === undefined ? addKeywordRule(input) : updateKeywordRule(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (rule: KeywordRule) => removeKeywordRule(rule.id),
    onSuccess: invalidate,
  });

  const handleToggle = (rule: KeywordRule) => {
    const { id: _id, createdAt: _createdAt, ...input } = rule;
    save.mutate({ input: { ...input, enabled: !rule.enabled }, id: rule.id });
  };

  if (rules.isPending || services.isPending || programs.isPending) {
    return <LoadingTemplate label={t("keyword.loading")} />;
  }

  return (
    <KeywordRulesTemplate
      rules={rules.data ?? []}
      services={services.data ?? []}
      programs={programs.data ?? []}
      currentEpochMs={currentEpochMs}
      busy={save.isPending || remove.isPending}
      onSave={(input, id) => save.mutate({ input, id })}
      onToggle={handleToggle}
      onRemove={(rule) => remove.mutate(rule)}
      onBack={() => navigate({ to: "/" })}
    />
  );
}
