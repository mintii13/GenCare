import React, { useState, useEffect } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';
import api from '../../../services/api';

interface Consultant {
  _id: string;
  full_name: string;
}

interface WorkingDay {
  start_time: string;
  end_time: string;
  break_start?: string;
  break_end?: string;
  is_available: boolean;
}

interface WeeklySchedule {
  week_start_date: string;
  week_end_date: string;
  working_days: {
    [key: string]: WorkingDay;
  };
}

const dayNames = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];
const dayLabels = [
  'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'
];

interface TableRow {
  day: string;
  working: string;
  break: string;
  status: string;
}

const ConsultantSchedule: React.FC = () => {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [consultantId, setConsultantId] = useState('');
  const [weekStart, setWeekStart] = useState('');
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/consultant/list').then((res: any) => {
      setConsultants(res.data.consultants || []);
    });
  }, []);

  const handleFetchSchedule = async () => {
    setMessage('');
    setSchedule(null);
    if (!consultantId || !weekStart) return;
    try {
      const res = await api.get(`/weekly-schedule?consultant_id=${consultantId}&week_start_date=${weekStart}`);
      if (res.data.success && res.data.data?.schedule) {
        setSchedule(res.data.data.schedule);
      } else {
        setMessage(res.data.message || 'Không tìm thấy lịch tuần này!');
      }
    } catch (err) {
      setMessage('Có lỗi khi lấy lịch làm việc.');
    }
  };

  // Tự động fetch khi chọn đủ
  useEffect(() => {
    if (consultantId && weekStart) handleFetchSchedule();
    // eslint-disable-next-line
  }, [consultantId, weekStart]);

  // Tính ngày đầu tuần (thứ 2)
  const getMonday = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when Sunday
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };

  // Chuẩn bị dữ liệu cho bảng
  const tableData: TableRow[] = schedule
    ? dayNames.map((day, idx) => {
        const wd = schedule.working_days[day];
        return {
          day: dayLabels[idx],
          working: wd && wd.is_available ? `${wd.start_time} - ${wd.end_time}` : '-',
          break: wd && wd.is_available && wd.break_start && wd.break_end ? `${wd.break_start} - ${wd.break_end}` : '-',
          status: wd && wd.is_available ? 'Làm việc' : 'Không làm việc',
        };
      })
    : [];

  const columns: TableColumn<TableRow>[] = [
    { name: 'Thứ', selector: row => row.day, sortable: true },
    { name: 'Giờ làm việc', selector: row => row.working, sortable: false },
    { name: 'Giờ nghỉ', selector: row => row.break, sortable: false },
    { name: 'Trạng thái', selector: row => row.status, sortable: false, cell: row => (
      <span style={{ color: row.status === 'Làm việc' ? '#1976d2' : '#aaa', fontWeight: 600 }}>{row.status}</span>
    ) },
  ];

  return (
    <div className="consultant-schedule-container">
      <h2>Lịch làm việc của chuyên gia</h2>
      <div className="schedule-form">
        <label>
          Chuyên gia:
          <select value={consultantId} onChange={e => setConsultantId(e.target.value)} required>
            <option value="">-- Chọn chuyên gia --</option>
            {consultants.map(c => (
              <option key={c._id} value={c._id}>{c.full_name}</option>
            ))}
          </select>
        </label>
        <label>
          Chọn ngày bất kỳ trong tuần:
          <input type="date" value={weekStart} onChange={e => setWeekStart(getMonday(e.target.value))} required />
        </label>
      </div>
      {message && <div className="message">{message}</div>}
      {schedule && (
        <div className="schedule-table-wrapper">
          <DataTable
            columns={columns}
            data={tableData}
            noHeader
            highlightOnHover
            striped
            pagination={false}
          />
          <div className="week-range">
            Tuần: {schedule.week_start_date} - {schedule.week_end_date}
          </div>
        </div>
      )}
      <style>{`
        .consultant-schedule-container { max-width: 800px; margin: 40px auto; padding: 24px; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #eee; }
        .schedule-form { display: flex; gap: 24px; margin-bottom: 24px; }
        label { display: flex; flex-direction: column; font-weight: 500; }
        select, input[type=date] { margin-top: 4px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 16px; }
        .message { margin: 16px 0; color: #d32f2f; font-weight: 600; }
        .schedule-table-wrapper { margin-top: 24px; }
        .week-range { margin-top: 12px; font-size: 15px; color: #1976d2; text-align: right; }
      `}</style>
    </div>
  );
};

export default ConsultantSchedule; 