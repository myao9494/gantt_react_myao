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
  timeScale: 'day' | 'month' | 'quarter' | 'year';
  onTimeScaleChange: (scale: 'day' | 'month' | 'quarter' | 'year') => void;
  displaySize: number;
  onDisplaySizeChange: (size: number) => void;
  isPrintMode: boolean;
  onPrintModeToggle: () => void;
}

export function Header({
  filter,
  onFilterChange,
  onExpandAll,
  onCollapseAll,
  onExportCSV,
  onImportCSV,
  onAutoMoveTasks,
  timeScale,
  onTimeScaleChange,
  displaySize,
  onDisplaySizeChange,
  isPrintMode,
  onPrintModeToggle,
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
          isPrintMode={isPrintMode}
          onPrintModeToggle={onPrintModeToggle}
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
        />
        <input
          type="text"
          placeholder="プロジェクト検索..."
          className="search-input"
          value={filter.searchProject || ''}
          onChange={(e) =>
            onFilterChange({ ...filter, searchProject: e.target.value })
          }
        />

        <div className="toolbar-divider"></div>

        {/* Expand/Collapse */}
        <button className="btn" onClick={onExpandAll}>
          open
        </button>
        <button className="btn" onClick={onCollapseAll}>
          close
        </button>

        <div className="toolbar-divider"></div>

        {/* Date Range */}
        <span className="label">表示期間:</span>
        <button
          className={`btn ${filter.limitedPeriodEnabled ? 'active' : ''}`}
          onClick={() => onFilterChange({ ...filter, limitedPeriodEnabled: !filter.limitedPeriodEnabled })}
        >
          限定期間
        </button>
        <input
          type="text"
          className="number-input wide"
          value={dateStartInput}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const val = e.target.value;
            // 数字と-のみ許容（空文字、-のみ、-数字、数字のみ）
            if (val === '' || val === '-' || /^-?\d+$/.test(val)) {
              setDateStartInput(val);
            }
          }}
          onKeyDown={(e) => {
            // 矢印キーで前後の要素に移動
            if (e.key === 'ArrowRight' || e.key === 'Tab') {
              const input = e.currentTarget;
              // カーソルが末尾にある場合のみ移動
              if (input.selectionStart === input.value.length && e.key === 'ArrowRight') {
                e.preventDefault();
                const next = input.parentElement?.querySelector('.number-input.wide:nth-of-type(2)') as HTMLInputElement;
                if (next) next.focus();
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
          value={dateEndInput}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '' || val === '-' || /^-?\d+$/.test(val)) {
              setDateEndInput(val);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              const input = e.currentTarget;
              if (input.selectionStart === 0) {
                e.preventDefault();
                const inputs = input.parentElement?.querySelectorAll('.number-input.wide');
                if (inputs && inputs.length > 0) {
                  (inputs[0] as HTMLInputElement).focus();
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
          >
            未完了
          </button>
          <button
            className={`btn ${filter.showCompleted ? 'active' : ''}`}
            onClick={() => onFilterChange({ ...filter, showCompleted: true })}
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
          >
            全て
          </button>
          <button
            className={`btn ${filter.showType === 'task' ? 'active' : ''}`}
            onClick={() => onFilterChange({ ...filter, showType: 'task' })}
          >
            task
          </button>
          <button
            className={`btn ${filter.showType === 'project' ? 'active' : ''}`}
            onClick={() => onFilterChange({ ...filter, showType: 'project' })}
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
          >
            日
          </button>
          <button
            className={`btn ${timeScale === 'month' ? 'active' : ''}`}
            onClick={() => onTimeScaleChange('month')}
          >
            月
          </button>
          <button
            className={`btn ${timeScale === 'quarter' ? 'active' : ''}`}
            onClick={() => onTimeScaleChange('quarter')}
          >
            四
          </button>
          <button
            className={`btn ${timeScale === 'year' ? 'active' : ''}`}
            onClick={() => onTimeScaleChange('year')}
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
