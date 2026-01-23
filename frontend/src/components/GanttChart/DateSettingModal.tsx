import { useState, useEffect } from 'react';
import '../../styles/gantt.css'; // Ensure we have access to common styles if needed

interface DateSettingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (startDate: Date, duration: number) => void;
    initialDate: Date;
    initialDuration: number;
}

export function DateSettingModal({
    isOpen,
    onClose,
    onSave,
    initialDate,
    initialDuration,
}: DateSettingModalProps) {
    const [startDate, setStartDate] = useState<string>('');
    const [duration, setDuration] = useState<number>(1);

    useEffect(() => {
        if (isOpen) {
            const year = initialDate.getFullYear();
            const month = String(initialDate.getMonth() + 1).padStart(2, '0');
            const day = String(initialDate.getDate()).padStart(2, '0');
            setStartDate(`${year}-${month}-${day}`);
            setDuration(initialDuration);
        }
    }, [isOpen, initialDate, initialDuration]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!startDate || duration < 1) return;
        const date = new Date(startDate);
        // Maintain time part if necessary, but gantt usually works with date boundaries
        // We'll set it to 00:00:00 as per formatDateString usage
        date.setHours(0, 0, 0, 0);
        onSave(date, Number(duration));
    };

    return (
        <div className="gantt-modal-overlay">
            <div className="gantt-modal-content">
                <h3>期間設定</h3>
                <div className="gantt-modal-field">
                    <label>開始日:</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div className="gantt-modal-field">
                    <label>期間 (日):</label>
                    <input
                        type="number"
                        min="1"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                    />
                </div>
                <div className="gantt-modal-actions">
                    <button onClick={onClose} className="gantt-modal-cancel">
                        キャンセル
                    </button>
                    <button onClick={handleSave} className="gantt-modal-save">
                        保存
                    </button>
                </div>
            </div>
            <style>{`
        .gantt-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .gantt-modal-content {
          background: white;
          padding: 20px;
          border-radius: 8px;
          width: 300px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .gantt-modal-content h3 {
          margin-top: 0;
          margin-bottom: 20px;
          font-size: 1.2em;
          color: #333;
        }
        .gantt-modal-field {
          margin-bottom: 15px;
        }
        .gantt-modal-field label {
          display: block;
          margin-bottom: 5px;
          font-size: 0.9em;
          color: #666;
        }
        .gantt-modal-field input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
        }
        .gantt-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
        .gantt-modal-actions button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9em;
        }
        .gantt-modal-cancel {
          background-color: #f5f5f5;
          color: #333;
        }
        .gantt-modal-cancel:hover {
          background-color: #e0e0e0;
        }
        .gantt-modal-save {
          background-color: #007bff;
          color: white;
        }
        .gantt-modal-save:hover {
          background-color: #0056b3;
        }
      `}</style>
        </div>
    );
}
