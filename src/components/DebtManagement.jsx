import { CloudUpload, RefreshCw, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';

const DebtPage = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [debts, setDebts] = useState([]);
    const [toast, setToast] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);

    // State cho Form
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        date: '',
        type: 'debt', // 'debt' hoặc 'loan'
    });

    // 1. Load dữ liệu khi vào trang
    useEffect(() => {
        const saved = localStorage.getItem('debts_list');
        if (saved) setDebts(JSON.parse(saved));
    }, [isLoading]);

    // 2. Tính toán tổng số tiền nợ/cho vay
    const totalDebt = debts.filter((d) => d.type === 'debt').reduce((sum, item) => sum + Number(item.amount), 0);

    const totalLoan = debts.filter((d) => d.type === 'loan').reduce((sum, item) => sum + Number(item.amount), 0);

    const formatVND = (amount) => new Intl.NumberFormat('vi-VN').format(amount) + 'đ';

    // Hàm show toast
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Hàm show confirm (thay window.confirm để tránh lỗi iOS)
    const showConfirm = (message) => {
        return new Promise((resolve) => {
            setConfirmDialog({ message, resolve });
        });
    };

    // 3. Hàm lưu khoản nợ
    const handleSaveDebt = () => {
        if (!formData.name || !formData.amount) {
            showToast('Vui lòng nhập đủ tên và số tiền!', 'error');
            return;
        }

        const newDebt = {
            id: Date.now(),
            ...formData,
            amount: Number(formData.amount),
            createdAt: new Date().toISOString(),
        };

        const updatedDebts = [newDebt, ...debts];
        setDebts(updatedDebts);
        localStorage.setItem('debts_list', JSON.stringify(updatedDebts));

        // Reset & Close
        setFormData({ name: '', amount: '', date: '', type: 'debt' });
        setIsOpen(false);
    };

    // 4. Hàm xóa khoản nợ (Đã trả)
    const deleteDebt = (id) => {
        const updated = debts.filter((d) => d.id !== id);
        setDebts(updated);
        localStorage.setItem('debts_list', JSON.stringify(updated));
    };

    async function syncLoansDebts() {
        const confirmed = await showConfirm('Đồng bộ dữ liệu hiện tại lên Google Sheets?');
        if (!confirmed) return;

        setIsLoading(true);
        const loansDebts = JSON.parse(localStorage.getItem('debts_list')) || [];
        const payload = {
            action: 'sync_loans',
            data: loansDebts,
        };

        try {
            await fetch(localStorage.getItem('google_script_url'), {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            showToast('Đồng bộ thành công!');
        } catch (e) {
            showToast('Lỗi đồng bộ Vay/Nợ: ' + e.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }

    async function loadLoans() {
        const confirmed = await showConfirm(
            'Hành động này sẽ ghi đè dữ liệu trên máy bằng dữ liệu từ Sheets. Tiếp tục?',
        );
        if (!confirmed) return;

        setIsLoading(true);
        try {
            const res = await fetch(localStorage.getItem('google_script_url') + '?action=get_loans');
            const data = await res.json();
            localStorage.setItem('debts_list', JSON.stringify(data));
            const saved = localStorage.getItem('debts_list');
            if (saved) setDebts(JSON.parse(saved));
            showToast('Đã tải dữ liệu từ Sheets thành công!');
        } catch (e) {
            showToast('Lỗi tải dữ liệu: ' + e.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-8 p-5 animate-in fade-in duration-500 max-w-6xl mx-auto">
            {/* TOAST NOTIFICATION */}
            {toast && (
                <div
                    className={`fixed top-4 right-4 z-[110] p-4 rounded-2xl shadow-lg animate-in slide-in-from-top-2 duration-300 flex items-center gap-3 ${
                        toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}
                >
                    <div
                        className={`w-2 h-2 rounded-full ${
                            toast.type === 'success' ? 'bg-emerald-200' : 'bg-rose-200'
                        } animate-pulse`}
                    ></div>
                    <span className="font-bold">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80">
                        <X size={18} />
                    </button>
                </div>
            )}

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

            <div
                className={`max-w-6xl mx-auto space-y-6 transition-all duration-500 ${isOpen ? 'blur-md scale-95' : ''}`}
            >
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Sổ Nợ 📖</h2>
                        <p className="text-sm text-slate-500 font-medium">Đừng để nợ nần làm rạn nứt tình anh em.</p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={syncLoansDebts}
                            className="flex items-center justify-center gap-2 bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-transform"
                        >
                            <CloudUpload size={20} /> Đồng bộ
                        </button>
                        <button
                            onClick={loadLoans}
                            className="flex items-center justify-center gap-2 bg-green-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-transform"
                        >
                            <RefreshCw size={20} /> Tải dữ liệu về
                        </button>
                    </div>
                </header>

                {/* Tổng quan nợ nhanh */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-[2.5rem] border border-rose-100 shadow-sm">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-1">
                            Mình đang nợ
                        </p>
                        <p className="text-xl font-black text-rose-600 tracking-tight">{formatVND(totalDebt)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-[2.5rem] border border-emerald-100 shadow-sm">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">
                            Người ta nợ
                        </p>
                        <p className="text-xl font-black text-emerald-600 tracking-tight">{formatVND(totalLoan)}</p>
                    </div>
                </div>

                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <span className="text-2xl">+</span> Ghi khoản nợ mới
                </button>

                {/* DANH SÁCH CÁC KHOẢN NỢ */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase ml-2 tracking-widest">
                        Danh sách chi tiết
                    </h3>
                    {debts.length === 0 ? (
                        <div className="text-center py-12 text-slate-300 font-medium italic">
                            Chưa có khoản nợ nào được ghi chép.
                        </div>
                    ) : (
                        debts.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center group"
                            >
                                <div className="flex gap-4 items-center">
                                    <div
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${item.type === 'debt' ? 'bg-rose-50' : 'bg-emerald-50'}`}
                                    >
                                        {item.type === 'debt' ? '💸' : '💰'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{item.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                            {item.date ? `Hạn: ${item.date}` : 'Không có hạn trả'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <p
                                        className={`font-black ${item.type === 'debt' ? 'text-rose-600' : 'text-emerald-600'}`}
                                    >
                                        {item.type === 'debt' ? '-' : '+'}
                                        {formatVND(item.amount)}
                                    </p>
                                    <button
                                        onClick={() => deleteDebt(item.id)}
                                        className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-900 hover:text-white"
                                    >
                                        ĐÃ XONG ✓
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* MODAL BOTTOM SHEET */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-0 p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[4px]"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="relative w-full max-w-xl bg-white rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-full zoom-in-95 duration-300 max-h-[95vh] overflow-y-auto">
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 hidden" />

                        <h3 className="text-2xl font-black text-slate-900 mb-8 text-center tracking-tight">
                            Ghi Chép Khoản Nợ 📝
                        </h3>

                        <div className="space-y-6">
                            {/* Type Selector */}
                            <div className="flex bg-slate-100 p-1 rounded-2xl">
                                <button
                                    onClick={() => setFormData({ ...formData, type: 'debt' })}
                                    className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${formData.type === 'debt' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    Nợ phải trả
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, type: 'loan' })}
                                    className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${formData.type === 'loan' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    Cho vay
                                </button>
                            </div>

                            {/* Name Input */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                                    Đối tượng / Nội dung
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Vd: Vay ngân hàng, Thằng bạn mượn..."
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none font-bold transition-all text-sm"
                                />
                            </div>

                            {/* Amount Input */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                                    Số tiền (VNĐ)
                                </label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0"
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none font-black transition-all"
                                />
                            </div>

                            {/* Date Input */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                                    Hạn trả (nếu có)
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none font-bold transition-all text-sm"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold active:scale-95 transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSaveDebt}
                                    className={`flex-[2] py-4 rounded-2xl font-black text-white shadow-xl active:scale-95 transition-all ${formData.type === 'debt' ? 'bg-rose-500 shadow-rose-100' : 'bg-emerald-500 shadow-emerald-100'}`}
                                >
                                    Lưu khoản nợ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CUSTOM CONFIRM DIALOG - FIX IOS ISSUE */}
            {confirmDialog && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6" style={{marginTop: 0}}>
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity" />
                    <div className="relative w-full max-w-sm bg-white rounded-[3rem] p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                                ⚠️
                            </div>
                            <p className="text-base font-bold text-slate-700 leading-relaxed">
                                {confirmDialog.message}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    confirmDialog.resolve(false);
                                    setConfirmDialog(null);
                                }}
                                className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-3xl font-black active:scale-95 transition-all uppercase text-xs tracking-widest"
                            >
                                HỦY
                            </button>
                            <button
                                onClick={() => {
                                    confirmDialog.resolve(true);
                                    setConfirmDialog(null);
                                }}
                                className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-lg shadow-indigo-100 active:scale-95 transition-all uppercase text-xs tracking-widest"
                            >
                                XÁC NHẬN
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebtPage;
