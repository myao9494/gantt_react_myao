import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { HamburgerMenu } from './HamburgerMenu';
import type { TaskFilter } from '../../types/gantt';
import './Header.css';

interface HeaderProps {
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onExportCSV: () => void;
  onImportCSV: (file: File) => void;
  onAutoMoveTasks: () => void;
  onDiffCompare: () => void; // 差分比較
  timeScale: 'day' | 'month' | 'quarter' | 'year';
  onTimeScaleChange: (scale: 'day' | 'month' | 'quarter' | 'year') => void;
  displaySize: number;
  onDisplaySizeChange: (size: number) => void;
  isPrintMode: boolean;
  onPrintModeToggle: () => void;
  gridWidth: number;
  onGridWidthChange: (width: number) => void;
}

export function Header({
  filter,
  onFilterChange,
  onExpandAll,
  onCollapseAll,
  onExportCSV,
  onImportCSV,
  onAutoMoveTasks,
  onDiffCompare,
  timeScale,
  onTimeScaleChange,
  displaySize,
  onDisplaySizeChange,
  isPrintMode,
  onPrintModeToggle,
  gridWidth,
  onGridWidthChange,
}: HeaderProps) {
  const { darkMode, toggleDarkMode } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 入力中の値を保持（"-"や空文字も許容）
  const [dateStartInput, setDateStartInput] = useState(String(filter.dateRangeStart ?? 0));
  const [dateEndInput, setDateEndInput] = useState(String(filter.dateRangeEnd ?? 0));

  // filter値が外部から変更された場合に同期
  useEffect(() => {
    setDateStartInput(String(filter.dateRangeStart ?? 0));
  }, [filter.dateRangeStart]);

  useEffect(() => {
    setDateEndInput(String(filter.dateRangeEnd ?? 0));
  }, [filter.dateRangeEnd]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportCSV(file);
      e.target.value = '';
    }
  };

  const handleReloadData = () => {
    fileInputRef.current?.click();
  };

  // ヘッダーツールバー内のフォーカス可能な要素を見つけるヘルパー関数
  const findFocusableElements = (): HTMLElement[] => {
    const toolbar = document.querySelector('.toolbar');
    if (!toolbar) return [];
    const elements = toolbar.querySelectorAll('button:not([disabled]), input:not([disabled]):not([type="file"]), select:not([disabled])');
    return Array.from(elements) as HTMLElement[];
  };

  // 次のフォーカス可能な要素に移動
  const focusNextElement = (current: HTMLElement) => {
    const elements = findFocusableElements();
    const currentIndex = elements.indexOf(current);
    if (currentIndex !== -1 && currentIndex < elements.length - 1) {
      elements[currentIndex + 1].focus();
    }
  };

  // 前のフォーカス可能な要素に移動
  const focusPrevElement = (current: HTMLElement) => {
    const elements = findFocusableElements();
    const currentIndex = elements.indexOf(current);
    if (currentIndex > 0) {
      elements[currentIndex - 1].focus();
    }
  };

  // ボタン用の矢印キーハンドラ
  const handleButtonArrowKeys = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusNextElement(e.currentTarget);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusPrevElement(e.currentTarget);
    }
  };

  // 入力フィールド用の矢印キーハンドラ（カーソル位置を考慮）
  const handleInputArrowKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const input = e.currentTarget;
    if (e.key === 'ArrowRight' && input.selectionStart === input.value.length) {
      e.preventDefault();
      focusNextElement(input);
    } else if (e.key === 'ArrowLeft' && input.selectionStart === 0) {
      e.preventDefault();
      focusPrevElement(input);
    }
  };

  // select用の矢印キーハンドラ
  const handleSelectArrowKeys = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    // Selectでは上下矢印がオプション選択に使われるため、左右のみ処理
    if (e.key === 'ArrowRight') {
      e.stopPropagation();
      e.preventDefault();
      focusNextElement(e.currentTarget);
    } else if (e.key === 'ArrowLeft') {
      e.stopPropagation();
      e.preventDefault();
      focusPrevElement(e.currentTarget);
    }
  };

  return (
    <header className="header">
      <div className="toolbar">
        {/* Logo */}
        <div className="logo">G</div>

        {/* Hamburger Menu - Replaces setting menu and extra buttons */}
        <HamburgerMenu
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          displaySize={displaySize}
          onDisplaySizeChange={onDisplaySizeChange}
          onAutoMoveTasks={onAutoMoveTasks}
          onReloadData={handleReloadData}
          onExportCSV={onExportCSV}
          onDiffCompare={onDiffCompare}
          isPrintMode={isPrintMode}
          onPrintModeToggle={onPrintModeToggle}
          gridWidth={gridWidth}
          onGridWidthChange={onGridWidthChange}
        />

        <div className="toolbar-divider"></div>

        {/* Search */}
        <input
          type="text"
          placeholder="タスク検索..."
          className="search-input"
          value={filter.searchText || ''}
          onChange={(e) =>
            onFilterChange({ ...filter, searchText: e.target.value })
          }
          onKeyDown={handleInputArrowKeys}
        />
        <input
          type="text"
          placeholder="プロジェクト検索..."
          className="search-input"
          value={filter.searchProject || ''}
          onChange={(e) =>
            onFilterChange({ ...filter, searchProject: e.target.value })
          }
          onKeyDown={handleInputArrowKeys}
        />

        <div className="toolbar-divider"></div>

        {/* Expand/Collapse */}
        <button className="btn" onClick={onExpandAll} onKeyDown={handleButtonArrowKeys}>
          open
        </button>
        <button className="btn" onClick={onCollapseAll} onKeyDown={handleButtonArrowKeys}>
          close
        </button>

        <div className="toolbar-divider"></div>


        {/* Date Range */}
        <span className="label">表示期間:</span>
        <div className="btn-group">
          <button
            className={`btn ${filter.periodMode === 'all' ? 'active' : ''}`}
            onClick={() => onFilterChange({ ...filter, periodMode: 'all' })}
            onKeyDown={handleButtonArrowKeys}
          >
            ALL
          </button>
          <button
            className={`btn ${filter.periodMode === 'before_today' ? 'active' : ''}`}
            onClick={() => onFilterChange({ ...filter, periodMode: 'before_today' })}
            onKeyDown={handleButtonArrowKeys}
          >
            今日以前
          </button>
          <button
            className={`btn ${filter.periodMode === 'limited' ? 'active' : ''}`}
            onClick={() => onFilterChange({ ...filter, periodMode: 'limited' })}
            onKeyDown={handleButtonArrowKeys}
          >
            期間限定
          </button>
        </div>
        <input
          type="text"
          className="number-input wide"
          disabled={filter.periodMode !== 'limited'}
          value={dateStartInput}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '' || val === '-' || /^-?\d+$/.test(val)) {
              setDateStartInput(val);
            }
          }}
          onKeyDown={(e) => {
            e.stopPropagation(); // DHTMLX干渉防止

            if (e.key === 'Enter') {
              // 確定（フォーカスは維持し、値を適用）
              const num = Number(dateStartInput) || 0;
              const clamped = Math.max(-1000, Math.min(1000, num));
              if (String(clamped) !== dateStartInput) {
                setDateStartInput(String(clamped));
              }
              onFilterChange({ ...filter, dateRangeStart: clamped });
              e.currentTarget.select(); // 再選択して連続入力を容易に
              return;
            }

            if (e.key === 'ArrowRight') {
              const input = e.currentTarget;
              if (input.selectionStart === input.value.length) {
                e.preventDefault();
                // 次のinputを探す (spanをスキップ)
                let next = input.nextElementSibling as HTMLElement;
                while (next) {
                  if (next.tagName === 'INPUT') {
                    (next as HTMLInputElement).focus();
                    return;
                  }
                  next = next.nextElementSibling as HTMLElement;
                }
              }
            }

            if (e.key === 'ArrowLeft') {
              const input = e.currentTarget;
              if (input.selectionStart === 0) {
                e.preventDefault();
                // 前のbuttonを探す
                let prev = input.previousElementSibling as HTMLElement;
                while (prev) {
                  if (prev.tagName === 'BUTTON') {
                    prev.focus();
                    return;
                  }
                  prev = prev.previousElementSibling as HTMLElement;
                }
              }
            }
          }}
          onBlur={() => {
            const num = Number(dateStartInput) || 0;
            const clamped = Math.max(-1000, Math.min(1000, num));
            setDateStartInput(String(clamped));
            onFilterChange({ ...filter, dateRangeStart: clamped });
          }}
        />
        <span tabIndex={-1}>~</span>
        <input
          type="text"
          className="number-input wide"
          disabled={filter.periodMode !== 'limited'}
          value={dateEndInput}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '' || val === '-' || /^-?\d+$/.test(val)) {
              setDateEndInput(val);
            }
          }}
          onKeyDown={(e) => {
            e.stopPropagation();

            if (e.key === 'Enter') {
              const num = Number(dateEndInput) || 0;
              const clamped = Math.max(-1000, Math.min(1000, num));
              if (String(clamped) !== dateEndInput) {
                setDateEndInput(String(clamped));
              }
              onFilterChange({ ...filter, dateRangeEnd: clamped });
              e.currentTarget.select();
              return;
            }

            if (e.key === 'ArrowLeft') {
              const input = e.currentTarget;
              if (input.selectionStart === 0) {
                e.preventDefault();
                // 前のinputを探す (spanをスキップ)
                let prev = input.previousElementSibling as HTMLElement;
                while (prev) {
                  if (prev.tagName === 'INPUT') {
                    (prev as HTMLInputElement).focus();
                    return;
                  }
                  prev = prev.previousElementSibling as HTMLElement;
                }
              }
            }

            if (e.key === 'ArrowRight') {
              const input = e.currentTarget;
              if (input.selectionStart === input.value.length) {
                // 次の要素（未完了ボタン）へ
                // input2 -> div.btn-group -> button
                e.preventDefault();
                // 親の次の要素を探すか、DOM構造決め打ち
                // Structure: ... input1, span, input2, div.toolbar-divider, div.btn-group ...
                // input2.nextElementSibling is div.toolbar-divider
                let next = input.nextElementSibling as HTMLElement;
                while (next) {
                  if (next.tagName === 'BUTTON' || (next.tagName === 'DIV' && next.classList.contains('btn-group'))) {
                    if (next.classList.contains('btn-group')) {
                      const btn = next.querySelector('button');
                      if (btn) { btn.focus(); return; }
                    }
                    if (next.tagName === 'BUTTON') {
                      next.focus(); return;
                    }
                  }
                  next = next.nextElementSibling as HTMLElement;
                }
              }
            }
          }}
          onBlur={() => {
            const num = Number(dateEndInput) || 0;
            const clamped = Math.max(-1000, Math.min(1000, num));
            setDateEndInput(String(clamped));
            onFilterChange({ ...filter, dateRangeEnd: clamped });
          }}
        />

        <div className="toolbar-divider"></div>

        {/* Completed Filter */}
        <div className="btn-group">
          <button
            className={`btn ${!filter.showCompleted ? 'active' : ''}`}
            onClick={() => onFilterChange({ ...filter, showCompleted: false })}
            onKeyDown={handleButtonArrowKeys}
          >
            未完了
          </button>
          <button
            className={`btn ${filter.showCompleted ? 'active' : ''}`}
            onClick={() => onFilterChange({ ...filter, showCompleted: true })}
            onKeyDown={handleButtonArrowKeys}
          >
            全て
          </button>
        </div>

        <div className="toolbar-divider"></div>

        {/* Type Filter */}
        <div className="btn-group">
          <button
            className={`btn ${filter.showType === 'all' ? 'active' : ''}`}
            onClick={() => onFilterChange({ ...filter, showType: 'all' })}
            onKeyDown={handleButtonArrowKeys}
          >
            全て
          </button>
          <button
            className={`btn ${filter.showType === 'task' ? 'active' : ''}`}
            onClick={() => onFilterChange({ ...filter, showType: 'task' })}
            onKeyDown={handleButtonArrowKeys}
          >
            task
          </button>
          <button
            className={`btn ${filter.showType === 'project' ? 'active' : ''}`}
            onClick={() => onFilterChange({ ...filter, showType: 'project' })}
            onKeyDown={handleButtonArrowKeys}
          >
            pro
          </button>
        </div>

        {/* Owner Filter */}
        <select
          className="select-input"
          value={filter.owner || ''}
          onChange={(e) =>
            onFilterChange({ ...filter, owner: e.target.value })
          }
          onKeyDown={handleSelectArrowKeys}
        >
          <option value="">All</option>
          <option value="自分">自分</option>
          <option value="待">待</option>
          <option value="サイン取">サイン取</option>
          <option value="他">他</option>
        </select>

        <div className="toolbar-divider"></div>

        {/* Time Scale */}
        <div className="btn-group">
          <button
            className={`btn ${timeScale === 'day' ? 'active' : ''}`}
            onClick={() => onTimeScaleChange('day')}
            onKeyDown={handleButtonArrowKeys}
          >
            日
          </button>
          <button
            className={`btn ${timeScale === 'month' ? 'active' : ''}`}
            onClick={() => onTimeScaleChange('month')}
            onKeyDown={handleButtonArrowKeys}
          >
            月
          </button>
          <button
            className={`btn ${timeScale === 'quarter' ? 'active' : ''}`}
            onClick={() => onTimeScaleChange('quarter')}
            onKeyDown={handleButtonArrowKeys}
          >
            四
          </button>
          <button
            className={`btn ${timeScale === 'year' ? 'active' : ''}`}
            onClick={() => onTimeScaleChange('year')}
            onKeyDown={handleButtonArrowKeys}
          >
            年
          </button>
        </div>

        {/* Hidden File Input for Import */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Previous buttons (auto move, import, export) are moved to HamburgerMenu */}
      </div>
    </header>
  );
}
