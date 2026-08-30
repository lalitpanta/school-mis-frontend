import { timeAgo } from '../../utils/formatDate';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import clsx from 'clsx';

const iconMap = {
  success: <CheckCircle size={16} className="text-emerald-400" />,
  error:   <XCircle    size={16} className="text-red-400" />,
  warning: <AlertCircle size={16} className="text-amber-400" />,
  info:    <Info        size={16} className="text-indigo-400" />,
};

const RecentActivity = ({ activities = [] }) => {
  if (!activities.length) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Recent Activity</h3>
        <p className="text-sm text-slate-500 text-center py-6">No recent activity.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">Recent Activity</h3>
      <ul className="space-y-3">
        {activities.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">{iconMap[item.type] || iconMap.info}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-200 leading-snug">{item.message}</p>
              <p className="text-xs text-slate-500 mt-0.5">{timeAgo(item.createdAt)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentActivity;
