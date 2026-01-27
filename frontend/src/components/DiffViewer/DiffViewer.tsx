/**
 * 差分ビューアコンポーネント
 * CSVファイルと現在のタスクを比較し、追加・削除・変更を視覚的に表示する
 */

import { useState, useCallback, useMemo } from 'react';
import type { Task } from '../../types/gantt';
import type { DiffResult } from '../../types/diff';
import { compareTasks, parseCSVToTasks } from '../../utils/diffUtils';
import './DiffViewer.css';

interface DiffViewerProps {
    currentTasks: Task[];
    onClose: () => void;
}

type TabType = 'all' | 'added' | 'deleted' | 'modified';

export function DiffViewer({ currentTasks, onClose }: DiffViewerProps) {
    const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [fileTasks, setFileTasks] = useState<Task[]>([]); // CSVから読み込んだタスクを保持
    const [excludeDateFields, setExcludeDateFields] = useState<boolean>(true); // デフォルトで日付を除外

    // ファイル選択ハンドラ
    const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setError(null);

        try {
            const text = await file.text();
            const parsed = parseCSVToTasks(text);

            if (parsed.length === 0) {
                setError('CSVファイルからタスクを読み込めませんでした。フォーマットを確認してください。');
                return;
            }

            setFileTasks(parsed); // 読み込んだタスクを保持
            const result = compareTasks(currentTasks, parsed, { excludeDateFields });
            setDiffResult(result);
            setExpandedIds(new Set()); // リセット
        } catch (err) {
            setError(err instanceof Error ? err.message : 'ファイルの読み込みに失敗しました');
        }
    }, [currentTasks, excludeDateFields]);

    // 日付除外オプション変更時に再比較
    const handleExcludeDateChange = useCallback((checked: boolean) => {
        setExcludeDateFields(checked);
        if (fileTasks.length > 0) {
            const result = compareTasks(currentTasks, fileTasks, { excludeDateFields: checked });
            setDiffResult(result);
        }
    }, [currentTasks, fileTasks]);

    // タブに応じた表示データ
    const displayTasks = useMemo(() => {
        if (!diffResult) return [];

        switch (activeTab) {
            case 'added':
                return diffResult.added;
            case 'deleted':
                return diffResult.deleted;
            case 'modified':
                return diffResult.modified;
            case 'all':
            default:
                return [
                    ...diffResult.added,
                    ...diffResult.deleted,
                    ...diffResult.modified,
                ];
        }
    }, [diffResult, activeTab]);

    // 詳細展開トグル
    const toggleExpand = (id: number) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // 差分アイコン
    const getDiffIcon = (type: string) => {
        switch (type) {
            case 'added':
                return '➕';
            case 'deleted':
                return '➖';
            case 'modified':
                return '✏️';
            default:
                return '';
        }
    };

    // 差分タイプのラベル
    const getDiffLabel = (type: string) => {
        switch (type) {
            case 'added':
                return '追加';
            case 'deleted':
                return '削除';
            case 'modified':
                return '変更';
            default:
                return '';
        }
    };

    return (
        <div className="diff-viewer-overlay" onClick={onClose}>
            <div className="diff-viewer-modal" onClick={e => e.stopPropagation()}>
                <div className="diff-viewer-header">
                    <h2>📊 差分比較</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="diff-viewer-content">
                    {/* ファイル選択 */}
                    <div className="file-selector">
                        <label className="file-input-label">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileSelect}
                                className="file-input"
                            />
                            <span className="file-btn">📂 CSVファイルを選択</span>
                        </label>
                        {fileName && <span className="file-name">{fileName}</span>}
                    </div>

                    {/* 比較オプション */}
                    <div className="compare-options">
                        <label className="option-checkbox">
                            <input
                                type="checkbox"
                                checked={excludeDateFields}
                                onChange={(e) => handleExcludeDateChange(e.target.checked)}
                            />
                            <span>開始日・終了日を比較から除外</span>
                        </label>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    {/* 差分結果 */}
                    {diffResult && (
                        <>
                            {/* サマリー */}
                            <div className="diff-summary">
                                <div className="summary-item added">
                                    <span className="icon">➕</span>
                                    <span className="label">追加</span>
                                    <span className="count">{diffResult.summary.addedCount}</span>
                                </div>
                                <div className="summary-item deleted">
                                    <span className="icon">➖</span>
                                    <span className="label">削除</span>
                                    <span className="count">{diffResult.summary.deletedCount}</span>
                                </div>
                                <div className="summary-item modified">
                                    <span className="icon">✏️</span>
                                    <span className="label">変更</span>
                                    <span className="count">{diffResult.summary.modifiedCount}</span>
                                </div>
                                <div className="summary-item unchanged">
                                    <span className="icon">✓</span>
                                    <span className="label">変更なし</span>
                                    <span className="count">{diffResult.summary.unchangedCount}</span>
                                </div>
                            </div>

                            {/* タブ */}
                            <div className="diff-tabs">
                                <button
                                    className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('all')}
                                >
                                    すべて ({diffResult.summary.addedCount + diffResult.summary.deletedCount + diffResult.summary.modifiedCount})
                                </button>
                                <button
                                    className={`tab-btn added ${activeTab === 'added' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('added')}
                                >
                                    追加 ({diffResult.summary.addedCount})
                                </button>
                                <button
                                    className={`tab-btn deleted ${activeTab === 'deleted' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('deleted')}
                                >
                                    削除 ({diffResult.summary.deletedCount})
                                </button>
                                <button
                                    className={`tab-btn modified ${activeTab === 'modified' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('modified')}
                                >
                                    変更 ({diffResult.summary.modifiedCount})
                                </button>
                            </div>

                            {/* 差分リスト */}
                            <div className="diff-list">
                                {displayTasks.length === 0 ? (
                                    <div className="no-diffs">該当する差分がありません</div>
                                ) : (
                                    displayTasks.map((diff) => (
                                        <div
                                            key={`${diff.type}-${diff.task.id}`}
                                            className={`diff-item ${diff.type}`}
                                        >
                                            <div
                                                className="diff-item-header"
                                                onClick={() => diff.type === 'modified' && toggleExpand(diff.task.id)}
                                            >
                                                <span className="diff-icon">{getDiffIcon(diff.type)}</span>
                                                <span className="diff-type-label">{getDiffLabel(diff.type)}</span>
                                                <span className="task-id">ID: {diff.task.id}</span>
                                                <span className="task-name">{diff.task.text}</span>
                                                {diff.type === 'modified' && (
                                                    <span className="expand-icon">
                                                        {expandedIds.has(diff.task.id) ? '▼' : '▶'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* 変更詳細（modifiedのみ） */}
                                            {diff.type === 'modified' && expandedIds.has(diff.task.id) && diff.changes && (
                                                <div className="diff-item-details">
                                                    <table className="changes-table">
                                                        <thead>
                                                            <tr>
                                                                <th>フィールド</th>
                                                                <th>旧値（ファイル）</th>
                                                                <th>新値（現在）</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {diff.changes.map((change, idx) => (
                                                                <tr key={idx}>
                                                                    <td className="field-name">{change.field}</td>
                                                                    <td className="old-value">{change.oldValue || '-'}</td>
                                                                    <td className="new-value">{change.newValue || '-'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}

                    {!diffResult && !error && (
                        <div className="initial-message">
                            <p>📋 CSVファイルを選択すると、現在のタスクとの差分を比較できます。</p>
                            <ul>
                                <li><span className="icon-added">➕</span> <strong>追加:</strong> 現在存在するが、ファイルにはないタスク</li>
                                <li><span className="icon-deleted">➖</span> <strong>削除:</strong> ファイルにはあるが、現在は存在しないタスク</li>
                                <li><span className="icon-modified">✏️</span> <strong>変更:</strong> 同じIDで内容が変わったタスク</li>
                            </ul>
                        </div>
                    )}
                </div>

                <div className="diff-viewer-footer">
                    <button className="btn-close" onClick={onClose}>閉じる</button>
                </div>
            </div>
        </div>
    );
}
