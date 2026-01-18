# Frontend (React + TypeScript + Vite)

ガントチャートアプリケーションのフロントエンド部分です。

## 技術スタック

*   **Framework**: React
*   **Language**: TypeScript
*   **Build Tool**: Vite
*   **Gantt Library**: DHTMLX Gantt
*   **Package Manager**: pnpm

## 開発コマンド

### インストール

```bash
pnpm install
```

### 開発サーバー起動

```bash
pnpm dev
```
`http://localhost:5173` で起動します。バックエンドAPI (`http://localhost:8000`) が起動している必要があります。

### ビルド

```bash
pnpm build
```
`dist/` ディレクトリに静的ファイルが出力されます。

### Lint

```bash
pnpm lint
```

## 主なコンポーネント

*   `src/components/GanttChart`: ガントチャートのメインコンポーネント
*   `src/components/Header`: ヘッダー、ハンバーガーメニュー
*   `src/styles`: CSSファイル（`print.css` などの印刷用スタイル含む）
