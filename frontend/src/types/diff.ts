/**
 * 差分比較機能用の型定義
 * CSVファイルと現在のタスクを比較して、追加・削除・変更を表示する
 */

import type { Task } from './gantt';

/** 差分の種類 */
export type DiffType = 'added' | 'deleted' | 'modified' | 'unchanged';

/** フィールドの変更情報 */
export interface FieldChange {
    field: string;      // フィールド名
    oldValue: string;   // 旧値
    newValue: string;   // 新値
}

/** タスク差分情報 */
export interface TaskDiff {
    type: DiffType;           // 差分の種類
    task: Task;               // タスク（新しい方。deletedの場合は旧）
    originalTask?: Task;      // 変更前のタスク（modifiedの場合のみ）
    changes?: FieldChange[];  // 変更されたフィールド（modifiedの場合のみ）
}

/** 差分結果 */
export interface DiffResult {
    added: TaskDiff[];       // 追加されたタスク
    deleted: TaskDiff[];     // 削除されたタスク
    modified: TaskDiff[];    // 変更されたタスク
    unchanged: TaskDiff[];   // 変更なしのタスク
    summary: {
        addedCount: number;
        deletedCount: number;
        modifiedCount: number;
        unchangedCount: number;
    };
}
