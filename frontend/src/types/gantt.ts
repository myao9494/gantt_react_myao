/** タスクの種類 */
export type TaskKind = 1 | 2 | 3; // 1: task, 2: project, 3: MS (milestone)

/** オーナーID */
export type OwnerId = 0 | 10 | 20 | 30; // 0: 自分, 10: 待, 20: サイン取, 30: 他

/** タスクデータ */
export interface Task {
  id: number;
  text: string;
  start_date: string; // "YYYY-MM-DD HH:mm:ss"
  end_date: string;
  duration: number;
  progress: number; // 0.0 ~ 1.0
  parent: number; // 0 = トップレベル
  kind_task: TaskKind;
  owner_id: OwnerId;
  sortorder: number;
  color?: string; // "#RRGGBBAA"
  textColor?: string;
  ToDo?: string;
  task_schedule?: string;
  folder?: string;
  url_adress?: string;
  mail?: string;
  memo?: string;
  hyperlink?: string;
  edit_date?: string; // カンマ区切りの編集日履歴
  // フロントエンド専用
  expanded?: boolean; // 展開状態（プロジェクトのみ）
  open?: boolean; // MLX Gantt用（expandedと同義）
  indent?: number; // 階層の深さ（表示用）
}

/** リンク（依存関係） */
export interface Link {
  id: number;
  source: number; // 元タスクID
  target: number; // 先タスクID
  type: 0 | 1 | 2 | 3; // 0:FS, 1:SS, 2:FF, 3:SF
}

/** APIレスポンス */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** フィルター条件 */
export interface TaskFilter {
  searchText?: string;
  searchProject?: string;
  showCompleted: boolean; // true: 全て, false: 未完了のみ
  showType: 'all' | 'task' | 'project';
  category?: string;
  owner?: string; // All/自分/待/サイン取/他
  limitedPeriodEnabled: boolean; // true: 限定期間有効, false: 全期間表示
  dateRangeStart?: number; // 日数（今日からの相対）
  dateRangeEnd?: number;
}

/** アプリ設定（localStorage保存） */
export interface AppSettings {
  darkMode: boolean;
  displaySize: number; // 50-200 (%)
  taskListCollapsed: boolean;
  timeScale: 'day' | 'month' | 'quarter' | 'year';
  filter: TaskFilter;
}

/** ガントチャートデータ */
export interface GanttData {
  tasks: Task[];
  links: Link[];
}

/** タスク作成リクエスト */
export interface CreateTaskRequest {
  text: string;
  start_date: string;
  end_date: string;
  parent?: number;
  kind_task?: TaskKind;
  owner_id?: OwnerId;
  progress?: number;
  color?: string;
  memo?: string;
}

/** タスク更新リクエスト */
export interface UpdateTaskRequest {
  text?: string;
  start_date?: string;
  end_date?: string;
  duration?: number;
  progress?: number;
  parent?: number;
  kind_task?: TaskKind;
  owner_id?: OwnerId;
  sortorder?: number;
  color?: string;
  textColor?: string;
  memo?: string;
  hyperlink?: string;
}
