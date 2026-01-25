import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { Header } from './components/Header/Header';
import { GanttChart } from './components/GanttChart/GanttChart';
import { useLocalStorage } from './hooks/useLocalStorage';
import * as api from './services/api';
import { getOwnerLabel, formatDateString } from './constants/gantt';
import type { Task, Link, TaskFilter } from './types/gantt';
import './styles/variables.css';
import './App.css';

const defaultFilter: TaskFilter = {
  searchText: '',
  searchProject: '',
  showCompleted: false,
  showType: 'all',
  category: '',
  periodMode: 'all',  // デフォルトで全期間表示
  dateRangeStart: 0,
  dateRangeEnd: 0,
};

function AppContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useLocalStorage<TaskFilter>(
    'gantt_filter',
    defaultFilter
  );
  const [timeScale, setTimeScale] = useLocalStorage<
    'day' | 'month' | 'quarter' | 'year'
  >('gantt_timeScale', 'day');
  const [taskListCollapsed, setTaskListCollapsed] = useLocalStorage(
    'gantt_taskListCollapsed',
    false
  );
  const [displaySize, setDisplaySize] = useLocalStorage(
    'gantt_displaySize',
    100
  );
  const [gridWidth, setGridWidth] = useLocalStorage(
    'gantt_gridWidth',
    380
  );

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api.getTasks();
    if (result.success && result.data) {
      setTasks(result.data.tasks || []);
      setLinks(result.data.links || []);
    } else {
      setError(result.error || 'データの取得に失敗しました');
      // Use empty data if API fails
      setTasks([]);
      setLinks([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Task handlers
  const handleTaskUpdate = async (id: number, taskData: Partial<Task>) => {
    const result = await api.updateTask(id, taskData);
    if (result.success) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...taskData } : t))
      );
    }
  };

  const handleTaskCreate = async (taskData: Partial<Task>) => {
    const result = await api.createTask({
      text: taskData.text || '新規タスク',
      start_date: taskData.start_date || new Date().toISOString().split('T')[0] + ' 00:00:00',
      end_date: taskData.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 00:00:00',
      parent: taskData.parent,
      kind_task: taskData.kind_task,
      owner_id: taskData.owner_id,
    });
    if (result.success && result.data) {
      setTasks((prev) => [...prev, result.data!]);
    }
  };

  const handleTaskDelete = async (id: number) => {
    const result = await api.deleteTask(id);
    if (result.success && result.data) {
      const deletedIds = [result.data.deleted_id, ...result.data.deleted_children];
      setTasks((prev) => prev.filter((t) => !deletedIds.includes(t.id)));
    }
  };

  // Clone task handler
  const handleTaskClone = async (id: number) => {
    const result = await api.cloneTask(id);
    if (result.success && result.data) {
      setTasks((prev) => [...prev, result.data!]);
    }
  };

  // Expand/Collapse - トリガーカウンタを使用してGantt内部を直接操作
  const [expandAllTrigger, setExpandAllTrigger] = useState(0);
  const [collapseAllTrigger, setCollapseAllTrigger] = useState(0);

  const handleExpandAll = () => {
    setExpandAllTrigger((prev) => prev + 1);
  };

  const handleCollapseAll = () => {
    setCollapseAllTrigger((prev) => prev + 1);
  };

  // Export/Import
  const handleExportCSV = async () => {
    const blob = await api.exportCSV();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const now = new Date();
      const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
      a.href = url;
      a.download = `gantt_tasks_${timestamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImportCSV = async (file: File) => {
    const result = await api.importCSV(file);
    if (result.success) {
      await fetchData();
    } else {
      alert(result.error || 'インポートに失敗しました');
    }
  };

  // Task自動移動
  // 未完了タスクの開始日を今日に、プロジェクトの開始日を直近の月曜日に移動
  const handleAutoMoveTasks = async () => {
    // 今日の日付（時刻は00:00:00）
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 直近の月曜日を取得
    const getMostRecentMonday = (baseDate: Date): Date => {
      const result = new Date(baseDate);
      const day = result.getDay();
      const diff = (day + 6) % 7; // Monday=0, Sunday=6
      result.setDate(result.getDate() - diff);
      return result;
    };

    const recentMonday = getMostRecentMonday(today);
    let modifiedCount = 0;

    // 各タスクをチェックして移動
    for (const task of tasks) {
      // 完了済みはスキップ
      if (task.progress >= 1) {
        continue;
      }

      // タスクの開始日を取得
      const taskStartDate = task.start_date ? new Date(task.start_date) : null;
      if (!taskStartDate) continue;
      taskStartDate.setHours(0, 0, 0, 0);

      // 将来のタスクはスキップ（開始日が今日より後）
      if (taskStartDate.getTime() > today.getTime()) {
        continue;
      }

      let targetStart: Date;
      if (task.kind_task === 1) {
        // task: 今日に移動
        targetStart = today;
      } else if (task.kind_task === 2) {
        // project: 直近の月曜日に移動
        targetStart = recentMonday;
      } else {
        // MS等はスキップ
        continue;
      }

      // 既にターゲット日ならスキップ
      if (taskStartDate.getTime() === targetStart.getTime()) {
        continue;
      }

      // 新しい開始日と終了日を計算
      const duration = task.duration || 1;
      const newEndDate = new Date(targetStart);
      newEndDate.setDate(newEndDate.getDate() + duration);

      // API経由で更新
      await api.updateTask(task.id, {
        start_date: formatDateString(targetStart),
        end_date: formatDateString(newEndDate),
      });

      modifiedCount++;
    }

    // 結果を通知し、データをリロード
    if (modifiedCount > 0) {
      alert(`${modifiedCount}件のタスクを移動しました。`);
      await fetchData();
    } else {
      alert('移動対象のタスクがありません。');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+B - toggle task list
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        setTaskListCollapsed((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTaskListCollapsed]);

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // Search text and searchProject filters are now handled by gantt's onBeforeTaskDisplay
    // This ensures parent tasks remain visible when children match the search

    // Completed filter
    if (!filter.showCompleted && task.progress >= 1) {
      return false;
    }

    // Type filter is now handled by gantt's onBeforeTaskDisplay
    // This ensures parent tasks remain visible when needed

    // Owner filter
    if (filter.owner && filter.owner !== '') {
      const taskOwnerLabel = getOwnerLabel(task.owner_id);
      if (taskOwnerLabel !== filter.owner) {
        return false;
      }
    }

    return true;
  });

  // Print Mode
  const [isPrintMode, setIsPrintMode] = useState(false);

  const togglePrintMode = () => {
    setIsPrintMode((prev) => !prev);
  };

  if (loading) {
    return (
      <div className={`app ${isPrintMode ? 'print-mode' : ''}`}>
        <Header
          filter={filter}
          onFilterChange={setFilter}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
          onExportCSV={handleExportCSV}
          onImportCSV={handleImportCSV}
          onAutoMoveTasks={handleAutoMoveTasks}
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          displaySize={displaySize}
          onDisplaySizeChange={setDisplaySize}
          isPrintMode={isPrintMode}
          onPrintModeToggle={togglePrintMode}
          gridWidth={gridWidth}
          onGridWidthChange={setGridWidth}
        />
        <main className="main">
          <div className="loading">読み込み中...</div>
        </main>
      </div>
    );
  }

  return (
    <div className={`app ${isPrintMode ? 'print-mode' : ''}`}>
      <Header
        filter={filter}
        onFilterChange={setFilter}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onExportCSV={handleExportCSV}
        onImportCSV={handleImportCSV}
        onAutoMoveTasks={handleAutoMoveTasks}
        timeScale={timeScale}
        onTimeScaleChange={setTimeScale}
        displaySize={displaySize}
        onDisplaySizeChange={setDisplaySize}
        isPrintMode={isPrintMode}
        onPrintModeToggle={togglePrintMode}
        gridWidth={gridWidth}
        onGridWidthChange={setGridWidth}
      />
      <main className={`main ${taskListCollapsed ? 'collapsed' : ''}`}>
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={fetchData}>再試行</button>
          </div>
        )}
        <GanttChart
          tasks={filteredTasks}
          links={links}
          timeScale={timeScale}
          gridCollapsed={taskListCollapsed}
          displaySize={displaySize}
          filter={filter}
          expandAllTrigger={expandAllTrigger}
          collapseAllTrigger={collapseAllTrigger}
          onTaskUpdate={handleTaskUpdate}
          onTaskCreate={handleTaskCreate}
          onTaskDelete={handleTaskDelete}
          onTaskClone={handleTaskClone}
          isPrintMode={isPrintMode}
          gridWidth={gridWidth}
        />
      </main>

      {/* Collapse Toggle */}
      <button
        className={`collapse-toggle ${taskListCollapsed ? 'collapsed' : ''}`}
        onClick={() => setTaskListCollapsed(!taskListCollapsed)}
        title="タスクリスト表示/非表示 (Ctrl+B)"
        style={{ left: taskListCollapsed ? '8px' : `${gridWidth}px` }}
      >
        {taskListCollapsed ? '▶' : '◀'}
      </button>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
