import {
    Calendar,
    ChevronDown,
    ChevronUp,
    CloudUpload,
    Eye,
    History,
    RefreshCw,
    Settings,
    Wallet,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'expense_detail_data';

const App = () => {
    // --- STATES ---
    const [config, setConfig] = useState({
        scriptUrl: localStorage.getItem('google_script_url') || '',
        sheetUrl: localStorage.getItem('google_sheet_url') || '',
    });

    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [incomeItems, setIncomeItems] = useState([]);
    const [expenseItems, setExpenseItems] = useState([]);
    const [history, setHistory] = useState([]);
    const [activeModal, setActiveModal] = useState(null);
    const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sectionsOpen, setSectionsOpen] = useState({ income: true, expense: true });
    const [isLoaded, setIsLoaded] = useState(false); // Quan trọng: Chống ghi đè khi khởi tạo

    // --- EFFECTS ---

    // 1. Load dữ liệu từ LocalStorage khi mở app
    useEffect(() => {
        const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        setHistory(savedData);
        loadDataForMonth(selectedMonth, savedData);

        // Đánh dấu đã load xong sau một khoảng nghỉ ngắn
        setTimeout(() => setIsLoaded(true), 300);
    }, [selectedMonth]);

    // 2. AUTO-SAVE: Tự động cập nhật history và LocalStorage khi bạn nhập liệu
    useEffect(() => {
        if (!isLoaded) return; // Nếu chưa load xong dữ liệu cũ, không được chạy logic này

        const totalIncome = incomeItems.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
        const totalExp = expenseItems.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
        const remain = totalIncome - totalExp;

        const entry = {
            date: selectedMonth,
            income: totalIncome,
            incomeItems: incomeItems.filter((i) => i.name || i.amount),
            totalExp,
            remain,
            items: expenseItems.filter((i) => i.name || i.amount),
        };

        setHistory((prev) => {
            const newHistory = [...prev];
            const idx = newHistory.findIndex((h) => h.date === selectedMonth);
            if (idx > -1) newHistory[idx] = entry;
            else newHistory.push(entry);

            const sorted = newHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
            return sorted;
        });
    }, [incomeItems, expenseItems, selectedMonth, isLoaded]);

    // --- LOGIC FUNCTIONS ---
    const loadDataForMonth = (month, currentHistory) => {
        const data = currentHistory.find((item) => item.date === month);
        if (data) {
            setIncomeItems(
                data.incomeItems.length
                    ? data.incomeItems
                    : [{ id: Date.now(), name: '', amount: '', date: `${month}-01` }],
            );
            setExpenseItems(
                data.items.length ? data.items : [{ id: Date.now() + 1, name: '', amount: '', date: `${month}-01` }],
            );
        } else {
            setIncomeItems([{ id: Date.now(), name: 'Lương', amount: '', date: `${month}-01` }]);
            setExpenseItems([{ id: Date.now() + 1, name: '', amount: '', date: `${month}-01` }]);
        }
    };

    const handleMonthChange = (e) => {
        const newMonth = e.target.value;
        setSelectedMonth(newMonth);
        loadDataForMonth(newMonth, history);
    };

    const addItem = (type) => {
        const newItem = { id: Date.now(), name: '', amount: '', date: `${selectedMonth}-01` };
        if (type === 'income') setIncomeItems([...incomeItems, newItem]);
        else setExpenseItems([...expenseItems, newItem]);
    };

    const removeItem = (id, type) => {
        if (type === 'income') setIncomeItems(incomeItems.filter((i) => i.id !== id));
        else setExpenseItems(expenseItems.filter((i) => i.id !== id));
    };

    const updateItem = (id, field, value, type) => {
        const setter = type === 'income' ? setIncomeItems : setExpenseItems;
        const items = type === 'income' ? incomeItems : expenseItems;
        const processedValue = field === 'amount' ? (value === '' ? 0 : Number(value)) : value;
        setter(items.map((i) => (i.id === id ? { ...i, [field]: processedValue } : i)));
    };

    const syncToGoogle = async () => {
        if (!config.scriptUrl) return window.alert('Vui lòng dán Web App URL!');
        if (!window.confirm('Đồng bộ dữ liệu hiện tại lên Google Sheets?')) return;

        setIsLoading(true);
        const historyData = JSON.parse(localStorage.getItem('expense_detail_data')) || [];

        const payload = {
            action: 'sync_history',
            history: historyData,
        };

        try {
            await fetch(config.scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(payload),
            });

            alert('Đã gửi yêu cầu đồng bộ Lịch sử!');
        } catch (e) {
            window.alert('Lỗi: ' + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    async function loadFromGoogle() {
        if (!config.scriptUrl) return window.alert('Vui lòng điền Web App URL!');
        if (!window.confirm('Hành động này sẽ ghi đè dữ liệu trên máy bằng dữ liệu từ Sheets. Tiếp tục?')) return;

        setIsLoading(true);
        try {
            const res = await fetch(config.scriptUrl + '?action=get_history');
            const data = await res.json();
            localStorage.setItem('expense_detail_data', JSON.stringify(data));
            loadDataForMonth(selectedMonth, data);
            window.alert('Đã tải dữ liệu từ Sheets thành công!');
        } catch (e) {
            alert('Lỗi tải dữ liệu: ' + e.message);
        } finally {
            setIsLoading(false);
        }
    }

    // --- THỐNG KÊ ---
    const currentYear = selectedMonth.split('-')[0];
    const monthlyData = history.find((h) => h.date === selectedMonth);
    const monthlyRemain = monthlyData ? monthlyData.remain : 0;
    const yearlyRemain = history.filter((h) => h.date.startsWith(currentYear)).reduce((s, h) => s + h.remain, 0);
    const totalRemain = history.reduce((s, h) => s + h.remain, 0);

    const formatVND = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8 text-slate-800">
            {/* LOADING OVERLAY */}
            {isLoading && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
                    <div className="text-center space-y-4">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-slate-600 border-t-white rounded-full animate-spin mx-auto" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-white font-black text-xl tracking-tight">Đang xử lý...</p>
                            <p className="text-slate-300 text-sm font-medium">Vui lòng chờ trong giây lát</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto space-y-6">
                {/* CONFIG SECTION */}
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Settings size={16} /> Cấu hình Google Sheets
                    </h4>
                    <div className="grid gap-4">
                        <input
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Google Script Web App URL..."
                            value={config.scriptUrl}
                            onChange={(e) => {
                                setConfig({ ...config, scriptUrl: e.target.value });
                                localStorage.setItem('google_script_url', e.target.value);
                            }}
                        />
                        <input
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Google Sheet URL..."
                            value={config.sheetUrl}
                            onChange={(e) => {
                                setConfig({ ...config, sheetUrl: e.target.value });
                                localStorage.setItem('google_sheet_url', e.target.value);
                            }}
                        />
                    </div>
                </section>

                {/* MAIN CONTROL */}
                <section className="bg-white p-4 md:p-6 rounded-3xl shadow-md border border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                            <Wallet className="text-blue-600" /> Quản lý Thu Chi
                        </h2>
                        <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl w-fit">
                            <Calendar size={18} className="text-slate-500 ml-2" />
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={handleMonthChange}
                                className="bg-transparent font-bold outline-none p-1 text-sm md:text-base"
                            />
                        </div>
                    </div>

                    {/* INCOME LIST */}
                    <div className="mb-6">
                        <button
                            onClick={() => setSectionsOpen({ ...sectionsOpen, income: !sectionsOpen.income })}
                            className="flex items-center justify-between w-full mb-4 text-emerald-600 font-bold bg-emerald-50 p-3 rounded-xl"
                        >
                            <span className="flex items-center gap-2">💰 Các khoản thu</span>
                            {sectionsOpen.income ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>

                        {sectionsOpen.income && (
                            <div className="space-y-4">
                                {incomeItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="relative p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-3 md:flex-row md:items-center"
                                    >
                                        <div className="grid grid-cols-2 gap-2 md:flex md:gap-2">
                                            <input
                                                type="date"
                                                value={item.date}
                                                onChange={(e) => updateItem(item.id, 'date', e.target.value, 'income')}
                                                className="w-full md:w-32 p-2.5 border rounded-xl text-sm bg-white"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Số tiền"
                                                value={item.amount}
                                                onChange={(e) =>
                                                    updateItem(item.id, 'amount', e.target.value, 'income')
                                                }
                                                className="w-full md:w-32 p-2.5 border rounded-xl text-sm font-bold bg-white text-emerald-600"
                                            />
                                        </div>
                                        <div className="flex gap-2 w-full">
                                            <input
                                                type="text"
                                                placeholder="Tên khoản thu"
                                                value={item.name}
                                                onChange={(e) => updateItem(item.id, 'name', e.target.value, 'income')}
                                                className="flex-1 p-2.5 border rounded-xl text-sm bg-white"
                                            />
                                            <button
                                                onClick={() => removeItem(item.id, 'income')}
                                                className="p-2.5 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => addItem('income')}
                                    className="w-full py-3 border-2 border-dashed border-emerald-200 text-emerald-600 rounded-2xl font-bold hover:bg-emerald-50 transition-colors"
                                >
                                    + Thêm khoản thu
                                </button>
                            </div>
                        )}
                    </div>

                    {/* EXPENSE LIST */}
                    <div className="mb-8">
                        <button
                            onClick={() => setSectionsOpen({ ...sectionsOpen, expense: !sectionsOpen.expense })}
                            className="flex items-center justify-between w-full mb-4 text-rose-600 font-bold bg-rose-50 p-3 rounded-xl"
                        >
                            <span className="flex items-center gap-2">💸 Các khoản chi</span>
                            {sectionsOpen.expense ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>

                        {sectionsOpen.expense && (
                            <div className="space-y-4">
                                {expenseItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="relative p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-3 md:flex-row md:items-center"
                                    >
                                        <div className="grid grid-cols-2 gap-2 md:flex md:gap-2">
                                            <input
                                                type="date"
                                                value={item.date}
                                                onChange={(e) => updateItem(item.id, 'date', e.target.value, 'expense')}
                                                className="w-full md:w-32 p-2.5 border rounded-xl text-sm bg-white"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Số tiền"
                                                value={item.amount}
                                                onChange={(e) =>
                                                    updateItem(item.id, 'amount', e.target.value, 'expense')
                                                }
                                                className="w-full md:w-32 p-2.5 border rounded-xl text-sm font-bold bg-white text-rose-600"
                                            />
                                        </div>
                                        <div className="flex gap-2 w-full">
                                            <input
                                                type="text"
                                                placeholder="Tên khoản chi"
                                                value={item.name}
                                                onChange={(e) => updateItem(item.id, 'name', e.target.value, 'expense')}
                                                className="flex-1 p-2.5 border rounded-xl text-sm bg-white"
                                            />
                                            <button
                                                onClick={() => removeItem(item.id, 'expense')}
                                                className="p-2.5 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => addItem('expense')}
                                    className="w-full py-3 border-2 border-dashed border-rose-200 text-rose-600 rounded-2xl font-bold hover:bg-rose-50 transition-colors"
                                >
                                    + Thêm khoản chi
                                </button>
                            </div>
                        )}
                    </div>

                    {/* SYNC ACTIONS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                            onClick={syncToGoogle}
                            className="flex items-center justify-center gap-2 bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:scale-95 transition-transform"
                        >
                            <CloudUpload size={20} /> Đồng bộ
                        </button>
                        <button
                            onClick={() => setActiveModal('sheet')}
                            className="flex items-center justify-center gap-2 bg-slate-700 text-white p-4 rounded-2xl font-bold hover:scale-95 transition-transform"
                        >
                            <Eye size={20} /> Xem Sheet
                        </button>
                        <button
                            onClick={loadFromGoogle}
                            className="flex items-center justify-center gap-2 bg-amber-500 text-white p-4 rounded-2xl font-bold shadow-lg shadow-amber-100 hover:scale-95 transition-transform"
                        >
                            <RefreshCw size={20} /> Tải về
                        </button>
                    </div>
                </section>

                {/* SUMMARY CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-xl">
                        <p className="text-xs font-bold opacity-80 uppercase mb-1">Dư tháng {selectedMonth}</p>
                        <h3 className="text-xl font-black">{formatVND(monthlyRemain)}</h3>
                    </div>
                    <div className="bg-emerald-500 p-6 rounded-2xl text-white shadow-xl">
                        <p className="text-xs font-bold opacity-80 uppercase mb-1">Tích lũy năm {currentYear}</p>
                        <h3 className="text-xl font-black">{formatVND(yearlyRemain)}</h3>
                    </div>
                    <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-xl">
                        <p className="text-xs font-bold opacity-80 uppercase mb-1">Tổng tích lũy</p>
                        <h3 className="text-xl font-black">{formatVND(totalRemain)}</h3>
                    </div>
                </div>

                {/* HISTORY TABLE */}
                <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <History size={20} /> Lịch sử chi tiêu
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                                <tr>
                                    <th className="px-6 py-4">Tháng</th>
                                    <th className="px-6 py-4">Thu nhập</th>
                                    <th className="px-6 py-4">Còn dư</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {history.map((data, idx) => (
                                    <tr key={data.date} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-bold">{data.date}</td>
                                        <td className="px-6 py-4 font-medium">{formatVND(data.income)}</td>
                                        <td
                                            className={`px-6 py-4 font-bold ${data.remain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                                        >
                                            {formatVND(data.remain)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedHistoryIndex(idx);
                                                    setActiveModal('detail');
                                                }}
                                                className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold"
                                            >
                                                Chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {/* MODAL CHI TIẾT THÁNG */}
            {activeModal === 'detail' &&
                selectedHistoryIndex !== null &&
                (() => {
                    const data = history[selectedHistoryIndex];
                    // Tính toán nhanh số liệu trong modal
                    const totalInc = data.incomeItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
                    const totalExp = data.items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all">
                            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
                                {/* Header Modal */}
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800">
                                            Báo cáo tháng {data.date}
                                        </h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            Chi tiết dòng tiền đã lưu
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setActiveModal(null)}
                                        className="p-3 hover:bg-rose-50 hover:text-rose-500 text-slate-400 rounded-2xl transition-all"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                                    {/* Dashboard mini trong Modal */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">
                                                Tổng thu nhập
                                            </p>
                                            <p className="text-xl font-black text-emerald-700">{formatVND(totalInc)}</p>
                                        </div>
                                        <div className="bg-rose-50 p-4 rounded-3xl border border-rose-100">
                                            <p className="text-[10px] font-bold text-rose-600 uppercase mb-1">
                                                Tổng chi tiêu
                                            </p>
                                            <p className="text-xl font-black text-rose-700">{formatVND(totalExp)}</p>
                                        </div>
                                    </div>

                                    {/* Phần Khoản Thu (Collapsible bằng Details/Summary) */}
                                    <details className="group border border-slate-100 rounded-3xl overflow-hidden" open>
                                        <summary className="list-none p-4 bg-slate-50 cursor-pointer flex justify-between items-center hover:bg-slate-100 transition-all">
                                            <span className="font-bold text-emerald-700 flex items-center gap-2">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                Khoản thu thực tế
                                            </span>
                                            <ChevronDown
                                                size={18}
                                                className="group-open:rotate-180 transition-transform text-slate-400"
                                            />
                                        </summary>
                                        <div className="p-2">
                                            <table className="w-full text-sm">
                                                <tbody className="divide-y divide-slate-50">
                                                    {data.incomeItems.map((item, i) => (
                                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="py-3 px-3">
                                                                <span className="block font-bold text-slate-700">
                                                                    {item.name || 'Không tên'}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-medium italic">
                                                                    {item.date}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-3 text-right font-black text-emerald-600">
                                                                +{formatVND(item.amount)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>

                                    {/* Phần Khoản Chi (Collapsible) */}
                                    <details className="group border border-slate-100 rounded-3xl overflow-hidden" open>
                                        <summary className="list-none p-4 bg-slate-50 cursor-pointer flex justify-between items-center hover:bg-slate-100 transition-all">
                                            <span className="font-bold text-rose-700 flex items-center gap-2">
                                                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                                                Danh mục chi tiêu
                                            </span>
                                            <ChevronDown
                                                size={18}
                                                className="group-open:rotate-180 transition-transform text-slate-400"
                                            />
                                        </summary>
                                        <div className="p-2">
                                            <table className="w-full text-sm">
                                                <tbody className="divide-y divide-slate-50">
                                                    {data.items.map((item, i) => (
                                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="py-3 px-3">
                                                                <span className="block font-bold text-slate-700">
                                                                    {item.name || 'Không tên'}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-medium italic">
                                                                    {item.date}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-3 text-right font-black text-rose-600">
                                                                -{formatVND(item.amount)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>

                                    {/* Footer Modal - Con số cuối cùng */}
                                    <div className="mt-4 p-5 bg-indigo-600 rounded-[2rem] text-white flex justify-between items-center shadow-lg shadow-indigo-100">
                                        <div>
                                            <p className="text-[10px] font-bold opacity-70 uppercase">Số dư còn lại</p>
                                            <p className="text-2xl font-black">{formatVND(data.remain)}</p>
                                        </div>
                                        <div className="text-right">
                                            <div
                                                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${data.remain >= 0 ? 'bg-emerald-400/20 text-emerald-200' : 'bg-rose-400/20 text-rose-200'}`}
                                            >
                                                {data.remain >= 0 ? 'Thặng dư' : 'Thâm hụt'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

            {activeModal === 'sheet' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
                    <div className="bg-white w-full h-full max-w-6xl rounded-3xl overflow-hidden flex flex-col relative">
                        <button
                            onClick={() => setActiveModal(null)}
                            className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg"
                        >
                            <X />
                        </button>
                        <iframe src={config.sheetUrl} className="w-full flex-1 border-none" title="Google Sheets" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
