/**
 * レンダリングエンジン（③ システム系）
 *
 * PageLayout（BlockInstance[]）を受け取り、各ブロックをレジストリ経由で解決して順に描画する。
 * 未知の type は安全にスキップ（開発時のみ警告）。
 *
 * - 各ブロックの「見た目」は definition.Render（②が実装）に委譲する。
 * - PageRenderer 自体はサーバーコンポーネントとして動作可能（公開ページで使用）。
 *   ブロック定義は副作用的に登録される（'@/lib/blocks/definitions' を import）。
 *
 * 共有契約 types.ts（①管理）を import する。
 */
import type React from 'react';
import { ensureBlocksRegistered } from './definitions';
import { getBlockDefinition } from './registry';
import type { BlockInstance, PageLayout } from './types';

// ブロック定義の登録を保証（PageRenderer 単体で import されても解決可能にする）。
ensureBlocksRegistered();

export interface PageRendererProps {
  /** 描画するページ配置（公開サイトでは publishedLayout を渡す） */
  layout: PageLayout;
}

/** 1つの BlockInstance をレジストリ経由で解決して描画する。未知 type は null。 */
function renderBlock(instance: BlockInstance): React.ReactNode {
  const definition = getBlockDefinition(instance.type);
  if (!definition) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[PageRenderer] 未登録のブロック type "${instance.type}" をスキップしました (id=${instance.id})。`,
      );
    }
    return null;
  }

  // schema/Render は definition の TProps に整合しているが、
  // レジストリ上は unknown 化されているため、ここで props を解決して渡す。
  const Render = definition.Render as React.FC<{ props: unknown }>;
  return <Render props={instance.props} />;
}

/** PageLayout を順に描画するレンダリングエンジン本体。 */
const PageRenderer: React.FC<PageRendererProps> = ({ layout }) => {
  return (
    <>
      {layout.map((instance) => {
        const node = renderBlock(instance);
        if (node === null) return null;
        // ブロックインスタンスIDを key に使用（並び替え時の安定性のため）。
        return <div key={instance.id} data-block-instance={instance.id}>{node}</div>;
      })}
    </>
  );
};

export default PageRenderer;
