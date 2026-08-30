import { useForm } from 'react-hook-form';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateFeeSettings, updateNotificationSettings } from '../../api/settingsApi';
import Button from '../common/Button';

const Toggle = ({ label, name, register }) => (
  <label className="flex items-center gap-3 cursor-pointer">
    <div className="relative flex-shrink-0">
      <input type="checkbox" {...register(name)} className="sr-only peer" />
      <div className="w-10 h-5 rounded-full transition-colors peer-checked:bg-indigo-600"
        style={{ background: 'var(--border-dim)' }} />
      <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5 shadow" />
    </div>
    <span className="text-sm" style={{ color: 'var(--text-1)' }}>{label}</span>
  </label>
);

const FeesNotifications = ({ feeData = {}, notifData = {} }) => {
  const [saving, setSaving] = useState(false);
  const feeForm   = useForm({ defaultValues: feeData });
  const notifForm = useForm({ defaultValues: notifData });

  const saveFees  = async (d) => { setSaving(true); try { await updateFeeSettings(d); toast.success('Fee settings saved!'); } catch { toast.error('Failed.'); } finally { setSaving(false); } };
  const saveNotif = async (d) => { setSaving(true); try { await updateNotificationSettings(d); toast.success('Notifications saved!'); } catch { toast.error('Failed.'); } finally { setSaving(false); } };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-6" style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)' }}>
        <h2 className="text-base font-semibold mb-5" style={{ color:'var(--text-1)' }}>Fee Settings</h2>
        <form onSubmit={feeForm.handleSubmit(saveFees)} className="grid md:grid-cols-2 gap-5">
          {[{name:'currency',label:'Currency Code',placeholder:'NPR'},{name:'lateFeePercent',label:'Late Fee (%)',type:'number'},{name:'dueDayOfMonth',label:'Due Day of Month',type:'number'}]
            .map(({name,label,type='text',placeholder})=>(
              <div key={name}>
                <label className="mis-label">{label}</label>
                <input type={type} {...feeForm.register(name)} placeholder={placeholder} className="mis-input" />
              </div>
            ))}
          <div className="md:col-span-2 flex justify-end"><Button loading={saving} type="submit">Save Fee Settings</Button></div>
        </form>
      </div>

      <div className="rounded-2xl p-6" style={{ background:'var(--bg-card)', border:'1px solid var(--border-card)' }}>
        <h2 className="text-base font-semibold mb-5" style={{ color:'var(--text-1)' }}>Notification Settings</h2>
        <form onSubmit={notifForm.handleSubmit(saveNotif)} className="space-y-4">
          {['emailEnabled','smsEnabled','feeReminder','attendanceAlert'].map((name,i)=>(
            <Toggle key={name} name={name} register={notifForm.register}
              label={['Enable Email Notifications','Enable SMS Notifications','Send Fee Reminders','Send Attendance Alerts'][i]} />
          ))}
          <div className="flex justify-end pt-2"><Button loading={saving} type="submit">Save Notifications</Button></div>
        </form>
      </div>
    </div>
  );
};

export default FeesNotifications;
