import { timeAgo } from '../../utils/formatDate';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import clsx from 'clsx';

const iconMap = {
  success: <CheckCircle size={16} className="text-success" />,
  error:   <XCircle    size={16} className="text-danger" />,
  warning: <AlertCircle size={16} className="text-warning" />,
  info:    <Info        size={16} className="text-accent" />,
};

const RecentActivity = ({ activities = [] }) => {
  if (!activities.length) {
    return (
      <div className="bg-subtle border border-default rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-muted mb-4">Recent Activity</h3>
        <p className="text-sm text-muted text-center py-6">No recent activity.</p>
      </div>
    );
  }

  return (
    <div className="bg-subtle border border-default rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-muted mb-4">Recent Activity</h3>
      <ul className="space-y-3">
        {activities.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">{iconMap[item.type] || iconMap.info}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-primary leading-snug">{item.message}</p>
              <p className="text-xs text-muted mt-0.5">{timeAgo(item.createdAt)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentActivity;
