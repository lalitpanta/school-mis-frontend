import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { formatDate } from '../../utils/formatDate';

const EventModal = ({ isOpen, onClose, event, onSave, onDelete }) => {
  const isEdit = !!event?.id;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      title: event?.title || '',
      start: event?.start ? formatDate(event.start, 'yyyy-MM-dd') : '',
      end:   event?.end   ? formatDate(event.end,   'yyyy-MM-dd') : '',
      description: event?.description || '',
      type: event?.type || 'holiday',
    },
  });

  const onSubmit = async (data) => {
    await onSave?.({
      ...data,
      start: new Date(data.start),
      end:   new Date(data.end),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Event' : 'New Event'}
      size="sm"
      footer={
        <>
          {isEdit && (
            <Button variant="danger" size="sm" onClick={() => { onDelete?.(event.id); onClose(); }}>
              Delete
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button loading={isSubmitting} onClick={handleSubmit(onSubmit)} size="sm">
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Title *</label>
          <input
            {...register('title', { required: 'Title is required' })}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            placeholder="Event title"
          />
          {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Start Date *</label>
            <input type="date" {...register('start', { required: true })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">End Date *</label>
            <input type="date" {...register('end', { required: true })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
          <select {...register('type')}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="holiday">Holiday</option>
            <option value="exam">Exam</option>
            <option value="event">School Event</option>
            <option value="meeting">Meeting</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
          <textarea {...register('description')} rows={3}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
            placeholder="Optional description..."
          />
        </div>
      </form>
    </Modal>
  );
};

export default EventModal;
