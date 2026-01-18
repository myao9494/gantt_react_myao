# Gantt Chart Application

React + FastAPI + SQLite で構築されたガントチャートアプリケーション。

[myao9494/gantt_chart_myao](https://github.com/myao9494/gantt_chart_myao)（DHTMLX Gantt + Node.js）をベースに再実装。

## 機能

- **ガントチャート表示**: タスクの階層表示、依存関係、進捗率表示
- **タスク管理**: 作成・編集・削除、ドラッグ&ドロップによる日程変更
- **右クリックメニュー**: 進捗設定、オーナー変更、タスク複製など
- **フィルター機能**: タスク名検索、完了/未完了、期間指定
- **ダークモード**: ライト/ダークテーマ切り替え
- **印刷モード**: 印刷用レイアウトに切り替え
- **CSVインポート/エクスポート**: データの入出力

## 技術スタック

| 層 | 技術 |
|---|---|
| Frontend | React 19, TypeScript, Vite, DHTMLX Gantt |
| Backend | FastAPI, SQLAlchemy, SQLite |
| Package Manager | pnpm (Frontend), uv (Backend) |

## ディレクトリ構成

```
gantt_react_myao/
├── frontend/          # React アプリケーション
│   ├── src/
│   │   ├── components/    # Reactコンポーネント
│   │   ├── constants/     # 共通定数
│   │   ├── contexts/      # React Context
│   │   ├── hooks/         # カスタムフック
│   │   ├── services/      # API通信
│   │   ├── styles/        # CSS
│   │   └── types/         # TypeScript型定義
│   └── package.json
├── backend/           # FastAPI アプリケーション
│   ├── main.py           # エントリーポイント
│   ├── database.py       # DB設定
│   ├── models.py         # SQLAlchemyモデル
│   ├── schemas.py        # Pydanticスキーマ
│   └── routers/          # APIルーター
├── docs/              # ドキュメント
│   ├── SPECIFICATION.md  # 詳細仕様書
│   └── claude.md         # 開発仕様まとめ
└── original_app/      # 元リポジトリ（参照用）
```

## セットアップ

### 前提条件

- Node.js 20+ (fnm推奨)
- Python 3.12+
- pnpm
- uv (Python パッケージマネージャー)

### バックエンド

```bash
cd backend
uv sync
uv run uvicorn main:app --reload
```

- APIサーバー: http://localhost:8000
- APIドキュメント: http://localhost:8000/docs
- 初回起動時に `gantt.db` が自動作成されます

### フロントエンド

```bash
cd frontend
pnpm install
pnpm dev
```

- 開発サーバー: http://localhost:5173

## 使い方

### 基本操作

| 操作 | 方法 |
|---|---|
| タスク作成 | 空白エリアを右クリック → 「新規タスク追加」 |
| タスク編集 | タスクをダブルクリック または 右クリック → 「タスク編集」 |
| タスク削除 | 右クリック → 「削除」 |
| 日程変更 | タスクバーをドラッグ |
| 進捗変更 | 右クリック → 「進捗設定」 |

### キーボードショートカット

| ショートカット | 機能 |
|---|---|
| `Ctrl + B` | タスクリスト表示/非表示 |
| `Ctrl + Z` | 元に戻す |
| `Ctrl + Y` / `Ctrl + Shift + Z` | やり直す |
| `Escape` | メニューを閉じる |

### フィルター

- **タスク名検索**: ヘッダーの検索ボックスに入力
- **完了/未完了**: 「未完了」「全て」ボタンで切り替え
- **タイプ**: 「task」「pro」ボタンで切り替え
- **期間**: 「限定期間」で表示範囲を指定

### データのインポート/エクスポート

- **エクスポート**: ヘッダーの「CSVエクスポート」ボタン
- **インポート**: 設定メニュー(☰) → 「データ読み込み」でCSVファイルを選択

## 設定

設定は `localStorage` に保存され、次回アクセス時に復元されます。

| 設定 | 説明 |
|---|---|
| ダークモード | テーマ切り替え（設定メニュー内） |
| 表示サイズ | ガントチャートのズーム率（設定メニュー内） |
| タイムスケール | 日/月/四半期/年の切り替え |
| フィルター | 検索条件、表示タイプなど |

## API

| Method | Endpoint | 説明 |
|---|---|---|
| GET | `/api/tasks` | 全タスク・リンク取得 |
| POST | `/api/tasks` | タスク作成 |
| PUT | `/api/tasks/{id}` | タスク更新 |
| DELETE | `/api/tasks/{id}` | タスク削除 |
| POST | `/api/tasks/{id}/clone` | タスク複製 |
| GET | `/api/export/csv` | CSVエクスポート |
| POST | `/api/import/csv` | CSVインポート |

詳細は http://localhost:8000/docs を参照。

## ドキュメント

- [詳細仕様書](docs/SPECIFICATION.md) - 機能仕様、データベース設計、API設計など
- [開発仕様まとめ](docs/claude.md) - 概要と注意事項

## ライセンス

個人利用を目的としています。DHTMLX Gantt のライセンス規定に従ってください。
