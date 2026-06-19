/**
 * ブロック定義の集約登録（③ システム系）
 *
 * このモジュールを import すると、全ブロック定義がレジストリに登録される。
 * ブロックを追加する手順:
 *   1. definitions/<type>.tsx を作成（schema / defaultProps / Render / Editor）
 *   2. 下の allBlocks 配列に追加するだけ
 *
 * 多重 import / HMR でも registerBlock 内で上書き＆警告するため安全。
 * 副作用（登録）を確実に1回走らせるため、エントリ側で
 *   import '@/lib/blocks/definitions';
 * または ensureBlocksRegistered() を呼ぶこと。
 */
import { registerBlock, type BlockDefinition } from '../registry';
import { heroBlock } from './hero';
import { noticeBlock } from './notice';
import { richtextBlock } from './richtext';
import { emergencyBannerBlock } from './emergency-banner';
import { serviceLinksBlock } from './service-links';
import { faqBlock } from './faq';
import { breadcrumbBlock } from './breadcrumb';
import { contactBlock } from './contact';
import { orgGuideBlock } from './org-guide';
import { imageBlock } from './image';
import { spacerBlock } from './spacer';

/** 登録対象の全ブロック定義。新規ブロックはここに追加する。 */
const allBlocks: BlockDefinition<unknown>[] = [
  // 個々の BlockDefinition<TProps> を unknown に正規化して一覧化する。
  heroBlock as unknown as BlockDefinition<unknown>,
  noticeBlock as unknown as BlockDefinition<unknown>,
  richtextBlock as unknown as BlockDefinition<unknown>,
  emergencyBannerBlock as unknown as BlockDefinition<unknown>,
  serviceLinksBlock as unknown as BlockDefinition<unknown>,
  faqBlock as unknown as BlockDefinition<unknown>,
  breadcrumbBlock as unknown as BlockDefinition<unknown>,
  contactBlock as unknown as BlockDefinition<unknown>,
  orgGuideBlock as unknown as BlockDefinition<unknown>,
  imageBlock as unknown as BlockDefinition<unknown>,
  spacerBlock as unknown as BlockDefinition<unknown>,
];

let registered = false;

/** 全ブロックをレジストリに登録する（複数回呼んでも1回だけ実行）。 */
export function ensureBlocksRegistered(): void {
  if (registered) return;
  registered = true;
  for (const block of allBlocks) {
    registerBlock(block);
  }
}

// モジュール読み込み時に登録（`import '@/lib/blocks/definitions'` で副作用的に登録される）。
ensureBlocksRegistered();

export { heroBlock } from './hero';
export { noticeBlock } from './notice';
export { richtextBlock } from './richtext';
export { emergencyBannerBlock } from './emergency-banner';
export { serviceLinksBlock } from './service-links';
export { faqBlock } from './faq';
export { breadcrumbBlock } from './breadcrumb';
export { contactBlock } from './contact';
export { orgGuideBlock } from './org-guide';
export { imageBlock } from './image';
export { spacerBlock } from './spacer';
export type { HeroProps } from './hero';
export type { NoticeProps } from './notice';
export type { RichtextProps } from './richtext';
export type { EmergencyBannerProps } from './emergency-banner';
export type { ServiceLinksProps } from './service-links';
export type { FaqProps } from './faq';
export type { BreadcrumbProps } from './breadcrumb';
export type { ContactProps } from './contact';
export type { OrgGuideProps } from './org-guide';
export type { ImageProps } from './image';
export type { SpacerProps } from './spacer';
