import { useEffect, useState } from 'react';

const STORAGE_KEY = 'smart_savings_v5';

export default function StrategicFinance() {
    // Thay đổi dòng này:
    const [goals, setGoals] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ name: '', target: '', deadline: '', note: '' });

    // useEffect(() => {
    //     const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    //     setGoals(saved);
    // }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    }, [goals]);

    const formatMoney = (amount) =>
        new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);

    const clearForm = () => {
        setEditingId(null);
        setForm({ name: '', target: '', deadline: '', note: '' });
    };

    const handleSubmit = () => {
        if (!form.name || form.target <= 0 || !form.deadline) {
            alert('Vui lòng nhập đầy đủ thông tin mục tiêu!');
            return;
        }

        if (editingId) {
            setGoals((prev) =>
                prev.map((g) => (g.id === editingId ? { ...g, ...form, target: Number(form.target) } : g)),
            );
        } else {
            setGoals((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    ...form,
                    target: Number(form.target),
                    current: 0,
                    note: form.note || 'Hành trình vạn dặm bắt đầu từ một bước chân.',
                },
            ]);
        }
        clearForm();
    };

    const updateProgress = (id) => {
        const amount = prompt('Số tiền giao dịch (Nhập số âm để rút):');
        if (amount !== null && !isNaN(amount) && amount !== '') {
            setGoals((prev) =>
                prev.map((g) => {
                    if (g.id === id) {
                        const newVal = Math.max(g.current + Number(amount), 0);
                        return { ...g, current: newVal };
                    }
                    return g;
                }),
            );
        }
    };

    const totalValue = goals.reduce((sum, g) => sum + g.current, 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.target, 0);
    const overallPercent = totalTarget > 0 ? (totalValue / totalTarget) * 100 : 0;

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* --- HERO SECTION --- */}
                <header className="relative overflow-hidden bg-indigo-700 rounded-[2rem] p-8 mb-8 text-white shadow-2xl shadow-indigo-200">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight mb-2">My Strategic Finance</h1>
                            <p className="opacity-80 font-medium">Làm chủ tài chính, kiến tạo tương lai.</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 w-full md:w-auto min-w-[240px]">
                            <p className="text-xs uppercase tracking-widest font-bold opacity-70 mb-1">
                                Tổng tài sản hiện có
                            </p>
                            <p className="text-3xl font-black">{formatMoney(totalValue)}</p>
                            <div className="mt-3 w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-emerald-400 h-full transition-all duration-700"
                                    style={{ width: `${overallPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                    {/* Decorative Circle */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500 rounded-full opacity-20 blur-3xl"></div>
                </header>

                {/* --- FORM SECTION --- */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-12">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-lg">
                            +
                        </span>
                        {editingId ? 'Cập nhật mục tiêu' : 'Thiết lập mục tiêu mới'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-500 ml-1">Tên mục tiêu</label>
                            <input
                                type="text"
                                placeholder="Ví dụ: Mua Macbook Pro"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 p-4 rounded-2xl transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-500 ml-1">Số tiền mục tiêu</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={form.target}
                                onChange={(e) => setForm({ ...form, target: e.target.value })}
                                className="w-full bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 p-4 rounded-2xl transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-500 ml-1">Hạn chót (Deadline)</label>
                            <input
                                type="date"
                                value={form.deadline}
                                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                                className="w-full bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 p-4 rounded-2xl transition-all"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-semibold text-slate-500 ml-1">Ghi chú động lực</label>
                            <input
                                type="text"
                                placeholder="Lý do bạn muốn đạt được điều này?"
                                value={form.note}
                                onChange={(e) => setForm({ ...form, note: e.target.value })}
                                className="w-full bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 p-4 rounded-2xl transition-all"
                            />
                        </div>
                        <div className="flex items-end gap-3">
                            <button
                                onClick={handleSubmit}
                                className="flex-grow bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-4 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95"
                            >
                                {editingId ? 'Lưu thay đổi' : 'Kích hoạt mục tiêu'}
                            </button>
                            {editingId && (
                                <button
                                    onClick={clearForm}
                                    className="bg-slate-200 hover:bg-slate-300 p-4 rounded-2xl font-bold transition-all"
                                >
                                    Hủy
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- LIST SECTION --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {goals.length === 0 ? (
                        <div className="col-span-full py-24 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-medium">Chưa có kế hoạch nào. Hãy bắt đầu ngay!</p>
                        </div>
                    ) : (
                        goals.map((goal) => {
                            const percent = Math.min((goal.current / goal.target) * 100, 100).toFixed(1);
                            const remains = Math.max(goal.target - goal.current, 0);
                            const diffTime = new Date(goal.deadline) - new Date();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44);

                            return (
                                <div
                                    key={goal.id}
                                    className="group bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all duration-300"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors tracking-tight">
                                                {goal.name}
                                            </h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-1 italic">
                                                Deadline: {new Date(goal.deadline).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setGoals(goals.filter((g) => g.id !== goal.id))}
                                                className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-xl transition-all"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-2xl mb-6">
                                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                            "{goal.note}"
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase">Tiến độ</p>
                                                <p className="text-2xl font-black text-indigo-600">{percent}%</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-400 uppercase">Mục tiêu</p>
                                                <p className="font-bold text-slate-700">{formatMoney(goal.target)}</p>
                                            </div>
                                        </div>

                                        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-1">
                                            <div
                                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000 relative"
                                                style={{ width: `${percent}%` }}
                                            >
                                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                    Còn lại cần nạp
                                                </span>
                                                <span className="font-bold text-emerald-600">
                                                    {remains > 0
                                                        ? formatMoney(Math.ceil(remains / Math.max(diffMonths, 1))) +
                                                          '/tháng'
                                                        : 'Đã đủ!'}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                    Thời gian
                                                </span>
                                                <p
                                                    className={`text-sm font-bold ${diffDays < 7 ? 'text-rose-500' : 'text-slate-600'}`}
                                                >
                                                    {diffDays > 0 ? `${diffDays} ngày nữa` : 'Đã đến hạn'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex gap-3">
                                        <button
                                            onClick={() => updateProgress(goal.id)}
                                            className="flex-grow bg-slate-900 hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95 flex justify-center items-center gap-2"
                                        >
                                            <span>Cập nhật số dư</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingId(goal.id);
                                                setForm({ ...goal });
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                                        >
                                            Sửa
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

// Icon đơn giản bằng SVG
function TrashIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
        </svg>
    );
}
