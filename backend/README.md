# Backend (FastAPI + SQLite)

ガントチャートアプリケーションのバックエンドAPIです。

## 技術スタック

*   **Framework**: FastAPI
*   **Language**: Python 3.12+
*   **Database**: SQLite (`gantt.db`)
*   **ORM**: SQLAlchemy
*   **Package Manager**: uv

## 開発コマンド

### サーバー起動

`uv` を使用して依存関係解決と実行を同時に行います。

```bash
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### APIドキュメント

サーバー起動後、以下のURLでSwagger UIにアクセスできます。
`http://localhost:8000/docs`

## データベース

*   **SQLite**: `gantt.db` ファイルとして保存されます。
*   **自動作成**: ファイルが存在しない場合、アプリケーション起動時に自動的に作成・初期化されます。
*   **Git除外**: `gantt.db` は `.gitignore` に含まれているため、誤ってコミットされることはありません。

## CSVインポート/エクスポート

APIを通じてタスクデータのCSVインポート・エクスポートが可能です。
フォーマットの詳細は `../docs/SPECIFICATION.md` を参照してください。
