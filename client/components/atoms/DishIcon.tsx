// SVG はインラインで書かず assets/images に外出しし、svgr (?react) で React
// コンポーネントとして取り込む。stroke="currentColor" のため、配置先の color を
// 継承してテーマに追従する。
import DishSvg from "../../assets/images/dish.svg?react";

type Props = {
  /** サイズ (px)。 */
  size?: number;
};

/**
 * パラボラアンテナ (皿) のアイコン。BS/CS 等の未接続を表す空状態で使う。
 * Material Symbols に近い意匠が無いため独自 SVG。
 */
export default function DishIcon({ size = 40 }: Props) {
  return <DishSvg width={size} height={size} aria-hidden="true" />;
}
