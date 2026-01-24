import { useState, useEffect, useRef } from 'react';
import './Header.css';

interface HamburgerMenuProps {
    darkMode: boolean;
    toggleDarkMode: () => void;
    displaySize: number;
    onDisplaySizeChange: (size: number) => void;
    onAutoMoveTasks: () => void;
    onReloadData: () => void;
    onExportCSV: () => void;
    isPrintMode: boolean;
    onPrintModeToggle: () => void;
    gridWidth: number;
    onGridWidthChange: (width: number) => void;
}

export function HamburgerMenu({
    darkMode,
    toggleDarkMode,
    displaySize,
    onDisplaySizeChange,
    onAutoMoveTasks,
    onReloadData,
    onExportCSV,
    isPrintMode,
    onPrintModeToggle,
    gridWidth,
    onGridWidthChange,
}: HamburgerMenuProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);

    const handleAction = (action: () => void) => {
        action();
        setMenuOpen(false);
    };

    return (
        <div className="menu-container" ref={menuRef}>
            <button
                className={`hamburger-btn ${menuOpen ? 'active' : ''}`}
                onClick={() => setMenuOpen(!menuOpen)}
                title="設定メニュー"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            {menuOpen && (
                <div className="hamburger-menu">
                    <div className="menu-title">設定</div>

                    {/* Dark Mode */}
                    <div className="menu-item">
                        <label>
                            <span className="icon">🌙</span>
                            <span>ダークモード</span>
                        </label>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={darkMode}
                                onChange={toggleDarkMode}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <div className="menu-divider"></div>

                    {/* Display Size */}
                    <div className="menu-item">
                        <label>
                            <span className="icon">📏</span>
                            <span>表示サイズ</span>
                        </label>
                    </div>
                    <div className="menu-item size-control">
                        <input
                            type="range"
                            min="50"
                            max="200"
                            value={displaySize}
                            onChange={(e) => onDisplaySizeChange(Number(e.target.value))}
                        />
                        <span>{displaySize}%</span>
                    </div>

                    <div className="menu-item">
                        <label>
                            <span className="icon">↔</span>
                            <span>リスト幅</span>
                        </label>
                    </div>
                    <div className="menu-item size-control">
                        <input
                            type="range"
                            min="200"
                            max="800"
                            value={gridWidth}
                            onChange={(e) => onGridWidthChange(Number(e.target.value))}
                        />
                        <span>{gridWidth}px</span>
                    </div>

                    <div className="menu-divider"></div>

                    {/* Operations */}
                    <div className="menu-section-label">操作</div>

                    <button
                        className="menu-button"
                        onClick={() => handleAction(onAutoMoveTasks)}
                        title="未完了タスクの開始日を今日に移動"
                    >
                        <span className="icon">📅</span>
                        <span>task自動移動</span>
                    </button>

                    <button
                        className="menu-button"
                        onClick={() => handleAction(onReloadData)}
                    >
                        <span className="icon">🔄</span>
                        <span>データ読み込み</span>
                    </button>

                    <button
                        className="menu-button"
                        onClick={() => handleAction(onExportCSV)}
                    >
                        <span className="icon">📥</span>
                        <span>CSVエクスポート</span>
                    </button>

                    <div className="menu-divider"></div>

                    {/* Print Mode */}
                    <div className="menu-item">
                        <label>
                            <span className="icon">🖨️</span>
                            <span>印刷モード</span>
                        </label>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={isPrintMode}
                                onChange={() => handleAction(onPrintModeToggle)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                </div>
            )}
        </div>
    );
}
