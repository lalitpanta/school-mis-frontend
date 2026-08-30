import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, TrendingUp, Users, Activity, FileText, 
  Search, Plus, Filter, CreditCard, Download, Receipt
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';

const FeeManagementPage = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [stats, setStats] = useState({ dailyCollection: 0, totalExpected: 0, totalCollected: 0, outstanding: 0 });
  const [categories, setCategories] = useState([]);
  const [structures, setStructures] = useState([]);
  const [studentFees, setStudentFees] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchCategories();
    fetchStructures();
    fetchStudentFees();
    fetchReceipts();
    fetchClasses();
    fetchStudents();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/v1/fees/dashboard-stats');
      if (res.data.success) setStats(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/v1/fees/categories');
      if (res.data.success) setCategories(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchStructures = async () => {
    try {
      const res = await api.get('/v1/fees/structures');
      if (res.data.success) setStructures(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchStudentFees = async () => {
    try {
      const res = await api.get('/v1/fees/student-fees');
      if (res.data.success) setStudentFees(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchReceipts = async () => {
    try {
      const res = await api.get('/v1/fees/receipts');
      if (res.data.success) setReceipts(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get('/v1/settings/classrooms');
      if (res.data.data) setClasses(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/v1/settings/students');
      if (res.data.data) setStudents(res.data.data);
    } catch (e) { console.error(e); }
  };

  // State for forms
  const [newCatName, setNewCatName] = useState('');
  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/v1/fees/categories', { name: newCatName, description: '' });
      if (res.data.success) {
        toast.success('Category added');
        setNewCatName('');
        fetchCategories();
      }
    } catch (err) { toast.error('Failed to add category'); }
  };

  const [newStructure, setNewStructure] = useState({
    category_id: '',
    class_id: '',
    amount: '',
    frequency: 'monthly',
    late_fee_type: 'fixed',
    late_fee_amount: 0,
    academic_year: new Date().getFullYear().toString(),
    student_type: 'all'
  });

  const handleAddStructure = async (e) => {
    e.preventDefault();
    if (!newStructure.category_id || !newStructure.amount) {
      toast.error('Category and amount are required');
      return;
    }
    
    const payload = {
      ...newStructure,
      class_id: newStructure.class_id === '' ? null : newStructure.class_id
    };
    
    try {
      const res = await api.post('/v1/fees/structures', payload);
      if (res.data.success) {
        toast.success('Fee structure added');
        setNewStructure({ ...newStructure, amount: '', category_id: '' });
        fetchStructures();
      }
    } catch (err) { toast.error('Failed to add fee structure'); }
  };

  const [paymentData, setPaymentData] = useState({ student_id: '', payment_mode: 'cash', amount_paid: 0, student_fee_id: '' });
  
  const handleCollectPayment = async (e) => {
    e.preventDefault();
    if (!paymentData.student_id || !paymentData.student_fee_id || !paymentData.amount_paid) {
      toast.error("Please fill required fields");
      return;
    }
    try {
      const payload = {
        student_id: paymentData.student_id,
        payment_mode: paymentData.payment_mode,
        items: [{
          student_fee_id: paymentData.student_fee_id,
          amount_paid: paymentData.amount_paid,
          late_fee_paid: 0
        }]
      };
      const res = await api.post('/v1/fees/pay', payload);
      if (res.data.success) {
        toast.success('Payment collected');
        fetchStats();
        fetchStudentFees();
        fetchReceipts();
      }
    } catch (err) { toast.error('Failed to collect payment'); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen" style={{ color: 'var(--text-1)' }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Fee Management</h1>
          <p className="text-sm opacity-70 mt-1">Manage structures, collections, and receipts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/10">
        {['dashboard', 'structures', 'ledger', 'collect', 'receipts'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 hover:bg-white/10 opacity-70 hover:opacity-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-xl hover:border-indigo-500/50 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <IndianRupee size={24} />
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-1">₹{Number(stats.dailyCollection).toLocaleString()}</h3>
              <p className="text-sm opacity-60">Today's Collection</p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-xl hover:border-emerald-500/50 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-1">₹{Number(stats.totalCollected).toLocaleString()}</h3>
              <p className="text-sm opacity-60">Total Collected</p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-xl hover:border-rose-500/50 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Activity size={24} />
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-1">₹{Number(stats.outstanding).toLocaleString()}</h3>
              <p className="text-sm opacity-60">Outstanding Due</p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-xl hover:border-blue-500/50 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <FileText size={24} />
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-1">₹{Number(stats.totalExpected).toLocaleString()}</h3>
              <p className="text-sm opacity-60">Total Expected</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'structures' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">Fee Structures</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs uppercase opacity-50 border-b border-white/10">
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Class</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Frequency</th>
                    <th className="pb-3">Late Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {structures.map((s) => (
                    <tr key={s.id} className="hover:bg-white/5">
                      <td className="py-3 text-sm font-medium">{s.category_name}</td>
                      <td className="py-3 text-sm opacity-70">{s.class_name || 'All'}</td>
                      <td className="py-3 text-sm font-bold text-indigo-400">₹{s.amount}</td>
                      <td className="py-3 text-sm capitalize opacity-70">{s.frequency}</td>
                      <td className="py-3 text-sm opacity-70">{s.late_fee_type === 'fixed' ? `₹${s.late_fee_amount}` : `${s.late_fee_amount}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold mb-4">Add Structure</h2>
              <form onSubmit={handleAddStructure} className="space-y-3">
                <select 
                  value={newStructure.category_id}
                  onChange={(e) => setNewStructure({...newStructure, category_id: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select Category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select 
                  value={newStructure.class_id}
                  onChange={(e) => setNewStructure({...newStructure, class_id: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Classes (Global)</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input 
                  type="number" 
                  value={newStructure.amount}
                  onChange={(e) => setNewStructure({...newStructure, amount: e.target.value})}
                  placeholder="Amount (₹)" 
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
                <select 
                  value={newStructure.frequency}
                  onChange={(e) => setNewStructure({...newStructure, frequency: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="one-time">One-time</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-3 py-2 transition-colors">
                  Save Structure
                </button>
              </form>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold mb-4">Categories</h2>
              <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="New Category..." 
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-3 py-2 transition-colors">
                  <Plus size={16} />
                </button>
              </form>
              <ul className="space-y-2">
                {categories.map((c) => (
                  <li key={c.id} className="text-sm opacity-70 px-3 py-2 bg-black/20 rounded-lg">{c.name}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Student Fee Ledger</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase opacity-50 border-b border-white/10">
                  <th className="pb-3">Student</th>
                  <th className="pb-3">Class</th>
                  <th className="pb-3">Fee Head</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-right">Paid</th>
                  <th className="pb-3 text-right">Balance</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {studentFees.map((sf) => (
                  <tr key={sf.id} className="hover:bg-white/5">
                    <td className="py-3 text-sm">
                      <div className="font-semibold">{sf.student_name}</div>
                      <div className="text-xs opacity-50">Adm: {sf.admission_no}</div>
                    </td>
                    <td className="py-3 text-sm opacity-70">{sf.class_name}</td>
                    <td className="py-3 text-sm font-medium">{sf.fee_category_name}</td>
                    <td className="py-3 text-sm text-right font-medium">₹{sf.amount}</td>
                    <td className="py-3 text-sm text-right text-emerald-400 font-medium">₹{sf.paid_amount}</td>
                    <td className="py-3 text-sm text-right text-rose-400 font-bold">₹{sf.balance}</td>
                    <td className="py-3 text-sm text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                        sf.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                        sf.status === 'partial' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-rose-500/20 text-rose-400'
                      }`}>
                        {sf.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'collect' && (
        <div className="max-w-xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <CreditCard className="text-indigo-400" /> Collect Payment
          </h2>
          <form onSubmit={handleCollectPayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 opacity-70">Select Student</label>
              <select 
                value={paymentData.student_id}
                onChange={(e) => setPaymentData({...paymentData, student_id: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select a student...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name} (Adm: {s.admission_no})</option>)}
              </select>
            </div>
            
            {paymentData.student_id && (
              <div>
                <label className="block text-sm font-medium mb-1 opacity-70">Select Fee Dues</label>
                <select 
                  value={paymentData.student_fee_id}
                  onChange={(e) => {
                    const id = e.target.value;
                    const fee = studentFees.find(f => f.id == id);
                    setPaymentData({...paymentData, student_fee_id: id, amount_paid: fee ? fee.balance : 0});
                  }}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select due fee...</option>
                  {studentFees.filter(f => f.student_id == paymentData.student_id && f.status !== 'paid').map(f => (
                    <option key={f.id} value={f.id}>{f.fee_category_name} - Balance: ₹{f.balance}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1 opacity-70">Amount (₹)</label>
              <input 
                type="number" 
                value={paymentData.amount_paid}
                onChange={(e) => setPaymentData({...paymentData, amount_paid: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 opacity-70">Payment Mode</label>
              <select 
                value={paymentData.payment_mode}
                onChange={(e) => setPaymentData({...paymentData, payment_mode: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI / QR</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-4 py-3 mt-4 transition-colors">
              Process Payment
            </button>
          </form>
        </div>
      )}

      {activeTab === 'receipts' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Payment Receipts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase opacity-50 border-b border-white/10">
                  <th className="pb-3">Receipt No.</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Student</th>
                  <th className="pb-3">Mode</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5">
                    <td className="py-3 text-sm font-medium text-indigo-400">{r.receipt_number}</td>
                    <td className="py-3 text-sm opacity-70">{new Date(r.payment_date).toLocaleDateString()}</td>
                    <td className="py-3 text-sm font-semibold">{r.student_name}</td>
                    <td className="py-3 text-sm capitalize opacity-70">{r.payment_mode.replace('_', ' ')}</td>
                    <td className="py-3 text-sm text-right font-bold text-emerald-400">₹{r.total_amount}</td>
                    <td className="py-3 text-center">
                      <button className="p-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-colors">
                        <Receipt size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default FeeManagementPage;
