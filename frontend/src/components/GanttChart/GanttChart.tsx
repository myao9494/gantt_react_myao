import { useEffect, useRef, useCallback, useState } from 'react';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import type { Task, Link, TaskKind, TaskFilter } from '../../types/gantt';
import {
  ContextMenu,
  getTaskContextMenuItems,
  getEmptyAreaContextMenuItems,
  type ContextMenuItem,
} from './ContextMenu';
import { reorderTasks } from '../../services/api';
import {
  OWNERS,
  KIND_TASKS,
  COLOR_OPTIONS,
  ZOOM_CONFIG,
  getTaskKindClass,
  formatDateString,
  formatEditDate,
} from '../../constants/gantt';
import '../../styles/gantt.css';
import { DateSettingModal } from './DateSettingModal';

interface GanttChartProps {
  tasks: Task[];
  links: Link[];
  timeScale: 'day' | 'month' | 'quarter' | 'year';
  gridCollapsed?: boolean;
  displaySize?: number;
  filter?: TaskFilter;
  expandAllTrigger?: number;
  collapseAllTrigger?: number;
  onTaskUpdate?: (id: number, task: Partial<Task>) => void;
  onTaskCreate?: (task: Partial<Task>) => void;
  onTaskDelete?: (id: number) => void;
  onTaskClone?: (id: number) => void;
  isPrintMode?: boolean;
  gridWidth: number;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}

// Get task hierarchy path
function getTaskHierarchy(taskId: string | number): string {
  try {
    let task = gantt.getTask(taskId);
    const hierarchy: string[] = [];

    while (task) {
      const idPrefix = task.id ? `[${task.id}]` : '';
      hierarchy.unshift(`${idPrefix}${task.text}`);

      if (task.parent && task.parent !== 0 && gantt.isTaskExists(task.parent)) {
        task = gantt.getTask(task.parent);
      } else {
        break;
      }
    }

    return hierarchy.join(' > ');
  } catch {
    return '';
  }
}

export function GanttChart({
  tasks,
  links,
  timeScale,
  gridCollapsed = false,
  displaySize = 100,
  filter,
  expandAllTrigger = 0,
  collapseAllTrigger = 0,
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  onTaskClone,
  isPrintMode = false,
  gridWidth,
}: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const filterRef = useRef<TaskFilter | undefined>(filter);
  // onTaskUpdateをイベントハンドラ内で使用するためのref
  const onTaskUpdateRef = useRef(onTaskUpdate);
  // onTaskUpdateが変更されたらrefを更新
  useEffect(() => {
    onTaskUpdateRef.current = onTaskUpdate;
  }, [onTaskUpdate]);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    items: [],
  });

  const [dateModal, setDateModal] = useState<{
    isOpen: boolean;
    taskId: number | null;
    initialDate: Date;
    initialDuration: number;
  }>({
    isOpen: false,
    taskId: null,
    initialDate: new Date(),
    initialDuration: 1,
  });

  // Batch move loop prevention
  const ignoreMoveEvent = useRef(false);
  const isInternalChange = useRef(false);

  // Context menu callbacks
  const handleEditTask = useCallback((taskId: number) => {
    gantt.showLightbox(taskId);
  }, []);

  const handleDeleteTask = useCallback(
    (taskId: number) => {
      if (confirm('このタスクを削除しますか？')) {
        if (onTaskDelete) {
          onTaskDelete(taskId);
        }
        gantt.deleteTask(taskId);
      }
    },
    [onTaskDelete]
  );

  const handleSetProgress = useCallback(
    (taskId: number, progress: number) => {
      const task = gantt.getTask(taskId);
      task.progress = progress;
      gantt.updateTask(taskId);
      if (onTaskUpdate) {
        onTaskUpdate(taskId, { progress });
      }
    },
    [onTaskUpdate]
  );

  // Owner変更のハンドラ
  const handleSetOwner = useCallback(
    (taskId: number, ownerId: number) => {
      const task = gantt.getTask(taskId);
      task.owner_id = ownerId;
      gantt.updateTask(taskId);
      if (onTaskUpdate) {
        onTaskUpdate(taskId, { owner_id: ownerId as 0 | 10 | 20 | 30 });
      }
    },
    [onTaskUpdate]
  );

  // Task Kind変更のハンドラ
  const handleSetKind = useCallback(
    (taskId: number, kind: string) => {
      const task = gantt.getTask(taskId);
      task.kind_task = kind;
      gantt.updateTask(taskId);
      if (onTaskUpdate) {
        onTaskUpdate(taskId, { kind_task: kind as unknown as TaskKind });
      }
    },
    [onTaskUpdate]
  );

  // Bar Color変更のハンドラ
  const handleSetColor = useCallback(
    (taskId: number, color: string) => {
      const task = gantt.getTask(taskId);
      task.color = color;
      gantt.updateTask(taskId);
      if (onTaskUpdate) {
        onTaskUpdate(taskId, { color });
      }
    },
    [onTaskUpdate]
  );

  // Text Color変更のハンドラ
  const handleSetTextColor = useCallback(
    (taskId: number, textColor: string) => {
      const task = gantt.getTask(taskId);
      task.textColor = textColor;
      gantt.updateTask(taskId);
      if (onTaskUpdate) {
        onTaskUpdate(taskId, { textColor });
      }
    },
    [onTaskUpdate]
  );

  const handleAddChild = useCallback(
    (parentId: number, kind: TaskKind) => {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 7);

      const newTask: Partial<Task> = {
        text: kind === 2 ? '新規プロジェクト' : '新規タスク',
        start_date: formatDateString(today),
        end_date: formatDateString(endDate),
        duration: 7,
        progress: 0,
        parent: parentId,
        kind_task: kind,
        owner_id: 0,
      };

      if (onTaskCreate) {
        onTaskCreate(newTask);
      }
    },
    [onTaskCreate]
  );

  const handleCopyTask = useCallback(
    (taskId: number) => {
      if (onTaskClone) {
        onTaskClone(taskId);
      }
    },
    [onTaskClone]
  );

  const handleAddNewTask = useCallback(
    (date: Date | null, kind: TaskKind) => {
      const startDate = date || new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const newTask: Partial<Task> = {
        text: kind === 2 ? '新規プロジェクト' : '新規タスク',
        start_date: formatDateString(startDate),
        end_date: formatDateString(endDate),
        duration: 7,
        progress: 0,
        parent: 0,
        kind_task: kind,
        owner_id: 0,
      };

      if (onTaskCreate) {
        onTaskCreate(newTask);
      }
    },
    [onTaskCreate]
  );

  // 期間設定モーダルを開く
  const handleSetTimePeriod = useCallback((taskId: number) => {
    const task = gantt.getTask(taskId);
    setDateModal({
      isOpen: true,
      taskId: taskId,
      initialDate: task.start_date ? new Date(task.start_date) : new Date(),
      initialDuration: Number(task.duration) || 1,
    });
  }, []);

  // 期間設定保存
  const handleSaveDate = useCallback((startDate: Date, duration: number) => {
    if (dateModal.taskId) {
      const task = gantt.getTask(dateModal.taskId);
      // dates must be objects for gantt
      task.start_date = startDate;
      task.duration = duration;
      const endDate = gantt.calculateEndDate({ start_date: startDate, duration: duration, task: task });
      task.end_date = endDate;

      gantt.updateTask(dateModal.taskId);

      if (onTaskUpdate) {
        onTaskUpdate(dateModal.taskId, {
          start_date: formatDateString(startDate),
          duration: duration,
          end_date: formatDateString(endDate),
        });
      }
    }
    setDateModal(prev => ({ ...prev, isOpen: false }));
  }, [dateModal.taskId, onTaskUpdate]);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  // Initialize gantt (only once)
  useEffect(() => {
    if (!containerRef.current || initialized.current) return;

    // Enable plugins
    gantt.plugins({
      keyboard_navigation: true,
      undo: true,
      marker: true,
      multiselect: true,
    });

    // Basic config
    gantt.config.date_format = '%Y-%m-%d %H:%i:%s';
    gantt.config.order_branch = true;
    gantt.config.order_branch_free = true;
    gantt.config.sort = true;
    gantt.config.open_tree_initially = true;
    gantt.config.keyboard_navigation_cells = true;
    gantt.config.row_height = 27;
    gantt.config.multiselect = true;

    // Undo config
    gantt.config.undo = true;
    gantt.config.undo_steps = 10;

    // タイムラインの表示範囲を設定（1年前から1年後まで）
    // fit_tasksをfalseにしてタスクに合わせた自動フィットを無効化
    gantt.config.fit_tasks = false;
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearLater = new Date(today);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    gantt.config.start_date = oneYearAgo;
    gantt.config.end_date = oneYearLater;

    // Register server lists for lightbox
    // kind_task, owner_id, color, textColorはコンテキストメニューで設定するため、リスト登録は不要かもしれないが
    // 互換性維持のため残しておくか、使用箇所がないなら削除可能。
    // Lightboxで使用しないなら削除しても良いが、一応残しておく。
    gantt.serverList('kind_task', KIND_TASKS.map(k => ({ key: k.key, label: k.label })));
    gantt.serverList('owner_id', OWNERS.map(o => ({ key: o.key, label: o.label })));
    gantt.serverList('color', COLOR_OPTIONS.map(c => ({ key: c.key, label: c.label })));
    gantt.serverList('textColor', COLOR_OPTIONS.map(c => ({ key: c.key, label: c.label })));

    // Lightbox configuration (matching original app)
    // コンテキストメニューに移動した項目（kind, owner, barColor, textColor）を削除
    (gantt.config.lightbox as any).sections = [
      {
        name: 'hierarchy',
        height: 22,
        type: 'template',
        map_to: 'hierarchy_path',
      },
      { name: 'description', height: 35, map_to: 'text', type: 'textarea', focus: true },
      { name: 'hyperlink', height: 30, map_to: 'hyperlink', type: 'textarea' },
      { name: 'ToDo', height: 60, map_to: 'ToDo', type: 'textarea' },
      { name: 'memo', height: 60, map_to: 'memo', type: 'textarea' },
      { name: 'task_schedule', height: 60, map_to: 'task_schedule', type: 'textarea' },
      // {
      //   name: 'kind',
      //   height: 22,
      //   map_to: 'kind_task',
      //   type: 'select',
      //   options: gantt.serverList('kind_task'),
      // },
      // {
      //   name: 'owner',
      //   height: 22,
      //   map_to: 'owner_id',
      //   type: 'select',
      //   options: gantt.serverList('owner_id'),
      // },
      // { name: 'time', type: 'duration', map_to: 'auto' },
      // {
      //   name: 'barColor',
      //   height: 22,
      //   map_to: 'color',
      //   type: 'select',
      //   options: gantt.serverList('color'),
      // },
      // {
      //   name: 'textColor',
      //   height: 22,
      //   map_to: 'textColor',
      //   type: 'select',
      //   options: gantt.serverList('textColor'),
      // },
      { name: 'edit_date', height: 35, map_to: 'edit_date', type: 'textarea' },
    ];

    // Lightbox labels
    gantt.locale.labels.section_hierarchy = '';
    gantt.locale.labels.section_description = 'タスク名';
    gantt.locale.labels.section_hyperlink = 'hyperlink';
    gantt.locale.labels.section_ToDo = 'ToDo';
    gantt.locale.labels.section_memo = 'memo';
    gantt.locale.labels.section_task_schedule = 'task_schedule';
    // gantt.locale.labels.section_kind = 'kind_task';
    // gantt.locale.labels.section_owner = 'owner';
    // gantt.locale.labels.section_barColor = 'Color';
    // gantt.locale.labels.section_textColor = 'Text Color';
    gantt.locale.labels.section_edit_date = 'edit_date';

    // Hierarchy template for lightbox
    if (gantt.form_blocks && gantt.form_blocks.template) {
      gantt.form_blocks.template.set_value = function (node: any, _value: any, task: any) {
        node.innerHTML = `<div class="hierarchy-path">${getTaskHierarchy(task.id)}</div>`;
      };
    }

    // Columns configuration
    // add/clone/owner列は削除し、右クリックメニューで操作する
    gantt.config.columns = [
      {
        name: 'text',
        label: 'Task name',
        tree: true,
        width: '*', // 幅を自動調整
        resize: true,
      },
    ];

    // Templates
    gantt.templates.task_class = (_start: Date, _end: Date, task: any) => {
      return getTaskKindClass(task.kind_task);
    };

    gantt.templates.rightside_text = (_start: Date, _end: Date, task: any) => {
      if (String(task.kind_task) === '2') {
        return '';
      }

      const idPrefix = task.id ? `[${task.id}]` : '';
      const currentTaskInfo = idPrefix ? `${idPrefix} ${task.text}` : task.text;

      let parentInfo = '';
      try {
        if (task.parent && task.parent !== 0 && gantt.isTaskExists(task.parent)) {
          const parentTask = gantt.getTask(task.parent);
          if (parentTask) {
            const parentIdPrefix = parentTask.id ? `[${parentTask.id}]` : '';
            parentInfo = parentIdPrefix ? `${parentIdPrefix} ${parentTask.text}` : parentTask.text;
          }
        }
      } catch {
        // Parent task not found
      }

      const displayText = parentInfo
        ? `${currentTaskInfo} > ${parentInfo}`
        : currentTaskInfo;

      if (task.hyperlink) {
        return `<a href="${task.hyperlink}" target="_blank">${displayText}</a>`;
      }
      return displayText;
    };

    gantt.templates.task_text = (_start: Date, _end: Date, task: any) => {
      if (String(task.kind_task) === '1' || String(task.kind_task) === '3') {
        return '';
      }

      const idPrefix = task.id ? `[${task.id}]` : '';
      const label = idPrefix ? `${idPrefix}${task.text}` : task.text;

      if (task.hyperlink) {
        return `<a href="${task.hyperlink}" target="_blank">${label}</a>`;
      }
      return label;
    };

    gantt.templates.timeline_cell_class = (_task: any, date: Date) => {
      if (date.getDay() === 0 || date.getDay() === 6) {
        return 'weekend';
      }
      return '';
    };

    // Open all tasks by default
    gantt.attachEvent('onTaskLoading', (task: any) => {
      task.$open = true;
      return true;
    });

    // Set initial edit_date for new tasks
    gantt.attachEvent('onTaskCreated', (task: any) => {
      const today = new Date();
      const formatDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
      task.duration = 1;
      task.start_date = today;
      task.edit_date = formatDate;
      task.kind_task = '1';
      task.owner_id = 0;
      return true;
    });

    // Update edit_date on task update and save to backend
    // タスク更新時にedit_dateを更新し、バックエンドに保存
    // Helper to save task to backend
    const saveTask = (id: string | number, task: any) => {
      if (onTaskUpdateRef.current && typeof Number(id) === 'number') {
        // Prevent undo stack clearing on re-render
        isInternalChange.current = true;

        const numericId = Number(id);
        onTaskUpdateRef.current(numericId, {
          text: task.text,
          start_date: task.start_date instanceof Date ? formatDateString(task.start_date) : task.start_date,
          end_date: task.end_date instanceof Date ? formatDateString(task.end_date) : task.end_date,
          duration: task.duration,
          progress: task.progress,
          parent: task.parent || 0,
          kind_task: task.kind_task,
          owner_id: task.owner_id,
          sortorder: task.sortorder, // sortorderも保存
          hyperlink: task.hyperlink,
          ToDo: task.ToDo,
          memo: task.memo,
          task_schedule: task.task_schedule,
          edit_date: task.edit_date,
          color: task.color,
          textColor: task.textColor,
        });
      }
    };

    // Update edit_date on task update and save to backend
    // タスク更新時にedit_dateを更新し、バックエンドに保存
    gantt.attachEvent('onAfterTaskUpdate', (id: any, task: any) => {
      const today = new Date();
      const todayStr = formatEditDate(today);
      if (task.edit_date) {
        if (!task.edit_date.split(',').includes(todayStr)) {
          task.edit_date = task.edit_date + ',' + todayStr;
        }
      } else {
        task.edit_date = todayStr;
      }

      // API経由でバックエンドに保存
      saveTask(id, task);
      return true;
    });

    // Handle Undo/Redo persistence
    const handleUndoRedo = (command: any) => {
      // コマンドの影響を受けたタスクを特定して保存
      if (command && command.commands) {
        command.commands.forEach((cmd: any) => {
          if (cmd.entity === 'task') {
            const taskId = cmd.id;
            if (gantt.isTaskExists(taskId)) {
              const task = gantt.getTask(taskId);
              saveTask(taskId, task);
            }
          }
        });
      }
    };

    gantt.attachEvent('onAfterUndo', handleUndoRedo);
    gantt.attachEvent('onAfterRedo', handleUndoRedo);

    // Handle Task Reordering
    gantt.attachEvent('onAfterTaskMove', (id: string | number, parent: string | number, tindex: number) => {
      if (ignoreMoveEvent.current) return true;

      // Handle multi-select move
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selectedTasks = (gantt as any).getSelectedTasks ? (gantt as any).getSelectedTasks() : [];

      if (selectedTasks.length > 1 && selectedTasks.map(String).includes(String(id))) {
        ignoreMoveEvent.current = true;

        let offset = 1;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        selectedTasks.forEach((sid: any) => {
          if (String(sid) !== String(id)) {
            // Move other selected tasks to immediately follow the dragged task
            gantt.moveTask(sid, tindex + offset, parent);
            offset++;
          }
        });

        ignoreMoveEvent.current = false;
      }

      // id: moved task id
      // parent: new parent id
      // tindex: new index (0-based)

      // Get all children of the new parent (siblings including the moved task)
      const children = gantt.getChildren(parent);

      const items = children.map((childId, index) => {
        return {
          id: Number(childId),
          sortorder: index,
          parent: Number(parent),
        };
      });

      // Send batch update to backend
      isInternalChange.current = true;
      reorderTasks({ items });

      return true;
    });

    // Update hierarchy display when lightbox opens
    gantt.attachEvent('onLightbox', (taskId: any) => {
      const task = gantt.getTask(taskId);
      task.hierarchy_path = getTaskHierarchy(taskId);

      setTimeout(() => {
        const descriptionField = document.querySelector('.gantt_cal_ltext textarea') as HTMLTextAreaElement;
        if (descriptionField) {
          descriptionField.focus();
        }
      }, 0);
    });

    gantt.attachEvent('onBeforeLightbox', (id: any) => {
      const task = gantt.getTask(id);
      task.hierarchy_path = getTaskHierarchy(id);
      return true;
    });

    // Context menu event
    gantt.attachEvent('onContextMenu', (taskId: string | number | null, _linkId: string | number | null, event: MouseEvent) => {
      event.preventDefault();

      if (taskId) {
        try {
          const task = gantt.getTask(taskId);
          const items = getTaskContextMenuItems(Number(taskId), task.kind_task, {
            onEdit: handleEditTask,
            onDelete: handleDeleteTask,
            onSetProgress: handleSetProgress,
            onSetOwner: handleSetOwner,
            onSetKind: handleSetKind,
            onSetColor: handleSetColor,
            onSetTextColor: handleSetTextColor,
            onSetTimePeriod: handleSetTimePeriod,
            onAddChild: handleAddChild,
            onCopy: handleCopyTask,
          });
          setContextMenu({
            visible: true,
            x: event.clientX,
            y: event.clientY,
            items,
          });
        } catch {
          // Task not found
        }
      } else {
        const items = getEmptyAreaContextMenuItems(null, {
          onAddProject: (date) => handleAddNewTask(date, 2),
          onAddTask: (date) => handleAddNewTask(date, 1),
        });
        setContextMenu({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          items,
        });
      }

      return false;
    });

    // Initialize zoom
    if (gantt.ext && gantt.ext.zoom) {
      gantt.ext.zoom.init(ZOOM_CONFIG as any);
      gantt.ext.zoom.setLevel(timeScale);
    }

    // Initialize gantt
    gantt.init(containerRef.current);

    // Add today marker
    gantt.addMarker({
      start_date: new Date(),
      css: 'today',
      text: 'Now',
    });

    initialized.current = true;

    return () => {
      gantt.clearAll();
    };
  }, [handleEditTask, handleDeleteTask, handleSetProgress, handleSetOwner, handleSetKind, handleSetColor, handleSetTextColor, handleSetTimePeriod, handleAddChild, handleCopyTask, handleAddNewTask, timeScale]);

  // Load data when tasks/links change
  useEffect(() => {
    if (!initialized.current) return;

    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }

    const ganttTasks = tasks.map((task) => ({
      ...task,
      open: task.expanded !== false,
    }));

    // Convert link types to strings for DHTMLX compatibility
    const ganttLinks = links.map((link) => ({
      ...link,
      type: String(link.type),
    }));

    gantt.clearAll();
    gantt.parse({ data: ganttTasks, links: ganttLinks });

    // Re-add today marker (clearAll removes markers)
    gantt.addMarker({
      start_date: new Date(),
      css: 'today',
      text: 'Now',
    });
  }, [tasks, links]);

  // Update zoom level when timeScale changes
  useEffect(() => {
    if (initialized.current && gantt.ext && gantt.ext.zoom) {
      gantt.ext.zoom.setLevel(timeScale);
    }
  }, [timeScale]);

  // Handle grid collapse/expand - グリッド折りたたみ時にチャートを拡張
  useEffect(() => {
    if (!initialized.current) return;

    // 印刷モード時は無視（印刷モード用のEffectで制御）
    if (isPrintMode) return;

    // グリッドの表示/非表示を設定
    if (gridCollapsed) {
      gantt.config.show_grid = false;
    } else {
      gantt.config.show_grid = true;
      gantt.config.grid_width = gridWidth;
    }

    // サイズを再計算して再描画
    gantt.render();
  }, [gridCollapsed, isPrintMode, gridWidth]);

  // Handle Print Mode
  useEffect(() => {
    if (!initialized.current) return;

    if (isPrintMode) {
      // Print View Configuration
      gantt.config.show_grid = false;

      // Simplify task text for print - display on right side
      gantt.templates.task_text = () => '';
      gantt.templates.rightside_text = (_start: Date, _end: Date, task: any) => {
        return task.text;
      };

      // Scroll to today
      gantt.showDate(new Date());

    } else {
      // Restore Normal View Configuration
      if (gridCollapsed) {
        gantt.config.show_grid = false;
      } else {
        gantt.config.show_grid = true;
        gantt.config.grid_width = gridWidth;
      }

      // Restore templates (matching initialization)
      gantt.templates.task_text = (_start: Date, _end: Date, task: any) => {
        if (String(task.kind_task) === '1' || String(task.kind_task) === '3') {
          return '';
        }
        const idPrefix = task.id ? `[${task.id}]` : '';
        const label = idPrefix ? `${idPrefix}${task.text}` : task.text;
        if (task.hyperlink) {
          return `<a href="${task.hyperlink}" target="_blank">${label}</a>`;
        }
        return label;
      };

      gantt.templates.rightside_text = (_start: Date, _end: Date, task: any) => {
        if (String(task.kind_task) === '2') {
          return '';
        }
        const idPrefix = task.id ? `[${task.id}]` : '';
        const currentTaskInfo = idPrefix ? `${idPrefix} ${task.text}` : task.text;
        let parentInfo = '';
        try {
          if (task.parent && task.parent !== 0 && gantt.isTaskExists(task.parent)) {
            const parentTask = gantt.getTask(task.parent);
            if (parentTask) {
              const parentIdPrefix = parentTask.id ? `[${parentTask.id}]` : '';
              parentInfo = parentIdPrefix ? `${parentIdPrefix} ${parentTask.text}` : parentTask.text;
            }
          }
        } catch { }
        const displayText = parentInfo ? `${currentTaskInfo} > ${parentInfo}` : currentTaskInfo;
        if (task.hyperlink) {
          return `<a href="${task.hyperlink}" target="_blank">${displayText}</a>`;
        }
        return displayText;
      };
    }

    gantt.render();
  }, [isPrintMode, gridCollapsed, gridWidth]);


  // Render
  // Gantt container needs to be wrapped or have the modal adjacent
  // But GanttChart returns pure DOM initialization in useEffect.
  // We need to return JSX. 
  // The current component structure returns:
  /*
    return () => {
      gantt.clearAll();
    };
  }, [handleEditTask, ...]); 
  */
  // Wait, the component currently does NOT return JSX at the end of the functional component?
  // Let me check the full file content again to see where the return statement is.
  // Ah, I need to see the end of the file.

  // Checking the file content previously viewed:
  // It ends with useEffect hooks. I haven't seen the `return` statement of the component `GanttChart`.
  // I need to find where to put the Modal in the return JSX key.

  // Let's assume standard React component structure.

  // Since I cannot see the return statement in the previous view_file output (it was truncated),
  // I should probably view the end of the file first.

  // Changing strategy: I will apply the other changes first, then view the end of the file to add the modal to JSX.

  // I will just apply the logic changes for now.
  // And I will assume the return statement is at the end.



  // Expand all tasks - オリジナルアプリと同じ方式でgantt内部を直接操作
  useEffect(() => {
    if (!initialized.current || expandAllTrigger === 0) return;

    gantt.eachTask(function (task) {
      task.$open = true;
    });
    gantt.render();
  }, [expandAllTrigger]);

  // Collapse all tasks - オリジナルアプリと同じ方式でgantt内部を直接操作
  useEffect(() => {
    if (!initialized.current || collapseAllTrigger === 0) return;

    gantt.eachTask(function (task) {
      task.$open = false;
    });
    gantt.render();
  }, [collapseAllTrigger]);

  // Update display size when displaySize changes
  useEffect(() => {
    if (!initialized.current) return;

    const scale = displaySize / 100;

    // Update gantt config
    gantt.config.scale_height = Math.round(60 * scale);
    gantt.config.row_height = Math.round(27 * scale);
    gantt.config.min_column_width = Math.round(30 * scale);

    // Calculate font sizes (minimum 8px)
    const baseFontSize = Math.max(8, Math.round(12 * scale));
    const taskContentFontSize = Math.max(8, Math.round(10 * scale));
    const sideContentFontSize = Math.max(8, Math.round(11 * scale));

    // Update or create dynamic style element
    let styleElement = document.getElementById('gantt-scale-style');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'gantt-scale-style';
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = `
      /* 基本的なフォントサイズ */
      .gantt_scale_cell, 
      .gantt_grid_head_cell, 
      .gantt_task_cell, 
      .gantt_grid_data,
      .gantt_row,
      .gantt_cell,
      .gantt_grid_data .gantt_cell.gantt_last_cell,
      .gantt_grid_scale .gantt_grid_head_cell,
      .gantt_grid_data .gantt_row.odd:hover, 
      .gantt_grid_data .gantt_row:hover {
        font-size: ${baseFontSize}px !important;
      }
      
      /* タスクコンテンツのフォントサイズ */
      .gantt_task_content {
        font-size: ${taskContentFontSize}px !important;
      }
      
      /* サイドコンテンツのフォントサイズ */
      .gantt_side_content {
        font-size: ${sideContentFontSize}px !important;
      }
      
      /* 階層パスのフォントサイズ */
      .hierarchy-path {
        font-size: ${baseFontSize}px !important;
      }
      
      /* ライトボックスのフォントサイズ */
      .gantt_cal_light,
      .gantt_cal_light .gantt_cal_ltext .gantt_section_time,
      .gantt_cal_light .gantt_cal_larea,
      .gantt_cal_light .gantt_cal_ltext textarea,
      .gantt_cal_light select,
      .gantt_cal_light input {
        font-size: ${baseFontSize}px !important;
      }
    `;

    // Re-render gantt to apply changes
    gantt.render();
  }, [displaySize]);

  // Search filter handling using gantt's onBeforeTaskDisplay
  // 検索フィルタリング処理: onBeforeTaskDisplayイベントを使用して
  // 親タスクを維持しながら子タスクが孤立しないようにする
  useEffect(() => {
    if (!initialized.current) return;

    // Update filter ref
    filterRef.current = filter;

    // detach previous event if exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventId = gantt.attachEvent('onBeforeTaskDisplay', function (id: string | number, task: any) {
      const currentFilter = filterRef.current;
      if (!currentFilter) return true;

      // Search text filter - check if task or any child matches
      if (currentFilter.searchText) {
        const searchLower = currentFilter.searchText.toLowerCase();

        // Check if current task matches
        const taskMatches = task.text?.toLowerCase().includes(searchLower);

        // Check if any child matches (to keep parents visible)
        let childMatches = false;
        if (gantt.hasChild(id)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          gantt.eachTask(function (child: any) {
            if (child.text?.toLowerCase().includes(searchLower)) {
              childMatches = true;
            }
          }, id);
        }

        if (!taskMatches && !childMatches) {
          return false;
        }
      }

      // Type filter (task/project)
      // タイプフィルタ: task=kind_task 1のみ, project=kind_task 2のみ
      if (currentFilter.showType && currentFilter.showType !== 'all') {
        const targetKind = currentFilter.showType === 'task' ? 1 : 2;
        if (task.kind_task !== targetKind) {
          return false;
        }
      }

      // Search project filter (for kind_task === 2)
      if (currentFilter.searchProject && task.kind_task === 2) {
        const searchLower = currentFilter.searchProject.toLowerCase();
        if (!task.text.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Date range filter（表示期間モード）
      // 'all': 全期間表示
      // 'before_today': 今日と過去のタスクのみ表示
      // 'limited': dateRangeで指定した範囲を表示
      if (currentFilter.periodMode === 'all') {
        // 全期間表示 - フィルターなし
      } else if (currentFilter.periodMode === 'before_today') {
        // 今日と過去のみ表示
        const today = new Date();
        today.setHours(23, 59, 59, 999); // 今日の終わりまで

        // タスクの開始日を取得
        const taskStartDate = task.start_date ? new Date(task.start_date) : null;

        if (taskStartDate) {
          // タスクの開始日が今日より後なら非表示
          if (taskStartDate > today) {
            // 子タスクがあるかチェック（親は表示を維持）
            if (!gantt.hasChild(id)) {
              return false;
            }
          }
        }
      } else if (currentFilter.periodMode === 'limited') {
        // dateRangeで指定した範囲のタスクのみ表示
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const rangeStart = currentFilter.dateRangeStart || 0;
        const rangeEnd = currentFilter.dateRangeEnd || 0;

        // 開始日を計算（今日 + rangeStart日）
        const startBoundary = new Date(today);
        startBoundary.setDate(startBoundary.getDate() + rangeStart);

        // 終了日を計算（今日 + rangeEnd日）
        const endBoundary = new Date(today);
        endBoundary.setDate(endBoundary.getDate() + rangeEnd);

        // タスクの日付を取得
        const taskStartDate = task.start_date ? new Date(task.start_date) : null;
        const taskEndDate = task.end_date ? new Date(task.end_date) : null;

        if (taskStartDate && taskEndDate) {
          taskStartDate.setHours(0, 0, 0, 0);
          taskEndDate.setHours(0, 0, 0, 0);

          // タスクが指定期間と重なっているかチェック
          // タスクの終了日が開始境界より前、またはタスクの開始日が終了境界より後なら非表示
          if (taskEndDate < startBoundary || taskStartDate > endBoundary) {
            // 子タスクがあるかチェック（親は表示を維持）
            if (!gantt.hasChild(id)) {
              return false;
            }
          }
        }
      }

      return true;
    });

    // Trigger refresh to apply filter
    gantt.refreshData();

    return () => {
      gantt.detachEvent(eventId);
    };
  }, [filter?.searchText, filter?.searchProject, filter?.showType, filter?.periodMode, filter?.dateRangeStart, filter?.dateRangeEnd]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const modifierPressed = e.ctrlKey || e.metaKey;

      if (modifierPressed && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          gantt.redo();
        } else {
          gantt.undo();
        }
        return;
      }

      if (modifierPressed && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        gantt.redo();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div
      className={`gantt-container ${gridCollapsed ? 'grid-collapsed' : ''}`}
      ref={containerRef}
      tabIndex={-1}
    >
      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={closeContextMenu}
        />
      )}
      <DateSettingModal
        isOpen={dateModal.isOpen}
        onClose={() => setDateModal(prev => ({ ...prev, isOpen: false }))}
        onSave={handleSaveDate}
        initialDate={dateModal.initialDate}
        initialDuration={dateModal.initialDuration}
      />
    </div>
  );
}
