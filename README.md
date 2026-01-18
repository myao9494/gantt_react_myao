# Gantt Chart Application (React + FastAPI)

React (Frontend) と FastAPI (Backend) を使用した、モダンなガントチャートアプリケーションです。
DHTMLX Gantt ライブラリをベースに、使いやすいUIと強力なタスク管理機能を提供します。

## 機能概要

*   **ガントチャート**: タスクの階層表示、依存関係、進捗管理、ズーム機能
*   **タスク管理**: 作成、編集、削除、複製、移動、オーナー変更
*   **印刷モード (Print View)**: 印刷用に最適化された表示（横スクロール調整機能付き）
*   **データ管理**: CSVインポート/エクスポート
*   **ダークモード**: テーマ切り替え対応

詳細な仕様は [docs/claude.md](docs/claude.md) および [docs/SPECIFICATION.md](docs/SPECIFICATION.md) を参照してください。

## 必要要件

*   **Node.js**: バージョン管理に `fnm` を推奨（`.node-version` を参照）
*   **Package Manager**: `pnpm`
*   **Python**: バージョン管理に `uv` を推奨

## クイックスタート

### 1. バックエンド (Backend)

```bash
cd backend
# 依存関係のインストールとサーバー起動 (uvを使用)
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
APIサーバーが `http://localhost:8000` で起動します。
APIドキュメント: `http://localhost:8000/docs`

※ 初回起動時に `gantt.db` (SQLite) が自動的に作成されます。

### 2. フロントエンド (Frontend)

別のターミナルで実行してください。

```bash
cd frontend
# 依存関係のインストール
pnpm install

# 開発サーバー起動
pnpm dev
```
アプリケーションが `http://localhost:5173` (または表示されるURL) で起動します。

## ディレクトリ構成

*   `frontend/`: React + TypeScript + Vite アプリケーション
*   `backend/`: FastAPI + SQLite アプリケーション
*   `docs/`: 仕様書などのドキュメント
*   `original_app/`: 参考元のアプリケーション（参照用）

## ライセンス

個人利用を目的としています。DHTMLX Gantt のライセンス規定に従ってください。
