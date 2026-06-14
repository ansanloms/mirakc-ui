/**
 * docs/api の OpenAPI から生成した component schema (internal-schemas.ts) を
 * 単一ソースに、リクエストボディを @cfworker/json-schema で構造検証する。
 *
 * 型・必須・配列要素・数値範囲などの「構造」はこのスキーマ検証が担う。
 * trim / 既定値 / `from <= to` / `anyEvent -> url 必須` など OpenAPI に
 * 表現できない正規化・相関チェックは各 parse 関数側に残す。
 *
 * `matchesSchema` は構造検証の真偽のみ返す。値を生成スキーマの型へ narrow
 * する型ガードは、ジェネリックな FromSchema が型の深さ爆発を招くため、具体
 * スキーマを知る各ドメインモジュール側でローカルに定義する。
 */
import { type Schema, Validator } from "@cfworker/json-schema";
import { internalSchemas } from "./internal-schemas.ts";

export type InternalSchemaName = keyof typeof internalSchemas;

const validators = new Map<InternalSchemaName, Validator>();

function validatorFor(name: InternalSchemaName): Validator {
  let validator = validators.get(name);
  if (validator === undefined) {
    // 生成された const は deeply readonly のため @cfworker の Schema 型へ通す。
    validator = new Validator(
      internalSchemas[name] as unknown as Schema,
      "2020-12",
    );
    validators.set(name, validator);
  }
  return validator;
}

/** value が name のスキーマに構造適合するかを判定する。 */
export function matchesSchema(
  name: InternalSchemaName,
  value: unknown,
): boolean {
  return validatorFor(name).validate(value).valid;
}

/**
 * 検証エラーの先頭を `<instanceLocation>: <error>` の形に整形して返す。
 * matchesSchema が false のときの API エラーメッセージに使う。
 */
export function schemaErrorOf(
  name: InternalSchemaName,
  value: unknown,
): string {
  const { errors } = validatorFor(name).validate(value);
  const first = errors[0];
  const at = first?.instanceLocation && first.instanceLocation !== "#"
    ? `${first.instanceLocation}: `
    : "";
  return `${at}${first?.error ?? "invalid request body"}`;
}
