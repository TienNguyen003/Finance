import { CloudUpload, RefreshCw, X } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

const FundPage = () => {
    const [isSettingOpen, setIsSettingOpen] = useState(false);
    const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
    const [selectedFund, setSelectedFund] = useState(null);
    const [inputAmount, setInputAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState(null);

    // 1. Tỷ lệ % của các hũ (Lưu vào localStorage)
    const [ratios, setRatios] = useState(() => {
        const saved = localStorage.getItem('fund_ratios');
        return saved
            ? JSON.parse(saved)
            : {
                  necessity: 55,
                  education: 10,
                  enjoyment: 10,
                  investment: 10,
                  saving: 10,
                  give: 5,
              };
    });
    const [toast, setToast] = useState(null);

    // 2. Số dư thực tế của từng hũ (Lưu vào localStorage)
    const [balances, setBalances] = useState(() => {
        const saved = localStorage.getItem('fund_balances');
        return saved
            ? JSON.parse(saved)
            : {
                  necessity: 0,
                  education: 0,
                  enjoyment: 0,
                  investment: 0,
                  saving: 0,
                  give: 0,
              };
    });

    // 3. TỰ ĐỘNG TÍNH TỔNG TIỀN (Derived State)
    const totalBalance = useMemo(() => {
        return Object.values(balances).reduce((a, b) => a + b, 0);
    }, [balances]);

    const formatVND = (amount) => new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
    const totalPercentage = Object.values(ratios).reduce((a, b) => a + b, 0);

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

    // Effect lưu dữ liệu khi có thay đổi
    useEffect(() => {
        localStorage.setItem('fund_balances', JSON.stringify(balances));
    }, [balances]);

    useEffect(() => {
        localStorage.setItem('fund_ratios', JSON.stringify(ratios));
    }, [ratios]);

    // Hàm chia tiền tự động
    const distributeMoney = (amount) => {
        const numAmount = Number(amount);
        if (numAmount === 0 || isNaN(numAmount)) return;

        const newBalances = { ...balances };
        Object.keys(ratios).forEach((key) => {
            newBalances[key] += (numAmount * ratios[key]) / 100;
        });
        setBalances(newBalances);
        setInputAmount('');
    };

    const configFund = {
        necessity: { label: 'Thiết yếu', icon: '🏠', color: 'text-indigo-600', bg: 'bg-indigo-50' },
        education: { label: 'Giáo dục', icon: '🎓', color: 'text-orange-500', bg: 'bg-orange-50' },
        enjoyment: { label: 'Hưởng thụ', icon: '🥳', color: 'text-rose-500', bg: 'bg-rose-50' },
        investment: { label: 'Đầu tư', icon: '📈', color: 'text-emerald-500', bg: 'bg-emerald-50' },
        saving: { label: 'Tiết kiệm', icon: '🏦', color: 'text-blue-500', bg: 'bg-blue-50' },
        give: { label: 'Cho đi', icon: '🎁', color: 'text-purple-500', bg: 'bg-purple-50' },
    };

    async function syncFundBalances() {
        const confirmed = await showConfirm('Đồng bộ dữ liệu hiện tại lên Google Sheets?');
        if (!confirmed) return;

        setIsLoading(true);
        const fundBalances = JSON.parse(localStorage.getItem('fund_balances')) || {};
        const payload = {
            action: 'sync_funds',
            data: fundBalances,
        };

        try {
            await fetch(localStorage.getItem('google_script_url'), {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            showToast('Đồng bộ thành công!');
        } catch (e) {
            showToast('Lỗi đồng bộ Quỹ: ' + e.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }

    async function loadFunds() {
        const confirmed = await showConfirm(
            'Hành động này sẽ ghi đè dữ liệu trên máy bằng dữ liệu từ Sheets. Tiếp tục?',
        );
        if (!confirmed) return;

        setIsLoading(true);
        try {
            const res = await fetch(localStorage.getItem('google_script_url') + '?action=get_funds');
            const data = await res.json();
            setBalances(data);
            localStorage.setItem('fund_balances', JSON.stringify(data));
            showToast('Đã tải dữ liệu từ Sheets thành công!');
        } catch (e) {
            showToast('Lỗi tải dữ liệu: ' + e.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-8 p-5 animate-in fade-in duration-500 max-w-6xl mx-auto">
            {' '}
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
                className={`max-w-6xl mx-auto space-y-6 transition-all duration-500 ${isSettingOpen || isAddMoneyOpen ? 'blur-md scale-95 opacity-50' : ''}`}
            >
                <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 decoration-indigo-500">6 CHIẾC HŨ 🏺</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                            Hệ thống quản lý tài chính cá nhân
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={syncFundBalances}
                            className="flex items-center justify-center gap-2 bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-transform"
                        >
                            <CloudUpload size={20} /> Đồng bộ
                        </button>
                        <button
                            onClick={loadFunds}
                            className="flex items-center justify-center gap-2 bg-green-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-transform"
                        >
                            <RefreshCw size={20} /> Tải về
                        </button>
                        <button
                            onClick={() => setIsSettingOpen(true)}
                            className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 text-xl hover:bg-slate-900 hover:text-white transition-all active:scale-90"
                        >
                            ⚙️
                        </button>
                    </div>
                </header>

                {/* CARD TỔNG TIỀN - SIÊU SANG TRỌNG */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-20 -mt-20"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-[2px] bg-indigo-500"></div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">
                                Tổng tài sản khả dụng
                            </p>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter mb-4 drop-shadow-md">
                            {formatVND(totalBalance)}
                        </h1>
                        <div className="flex gap-4">
                            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                                    Số lượng hũ
                                </p>
                                <p className="text-sm font-black text-emerald-400">06 Đơn vị</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                                    Trạng thái
                                </p>
                                <p className="text-sm font-black text-blue-400">Đã cân đối</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ô NẠP TIỀN - FIX LỖI TRÀN NÚT */}
                <div className="bg-white p-1.5 md:p-3 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                    <div className="pl-3 md:pl-5 text-lg md:text-2xl">💵</div>

                    <input
                        type="number"
                        inputMode="decimal"
                        placeholder="Vừa có tiền về?"
                        value={inputAmount}
                        onChange={(e) => setInputAmount(e.target.value)}
                        className="flex-1 w-full min-w-0 bg-transparent p-3 md:p-4 outline-none font-black text-base md:text-xl text-slate-900 placeholder:text-slate-300"
                    />

                    <button
                        onClick={() => distributeMoney(inputAmount)}
                        className="bg-slate-900 hover:bg-indigo-600 text-white px-4 md:px-10 py-3 md:py-5 rounded-[1.2rem] md:rounded-[2rem] font-black shadow-lg active:scale-95 transition-all text-[10px] md:text-xs tracking-widest whitespace-nowrap"
                    >
                        CHIA TIỀN
                    </button>
                </div>

                {/* GRID CÁC HŨ CHI TIẾT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.keys(configFund).map((key) => (
                        <div
                            key={key}
                            onClick={() => {
                                setSelectedFund(key);
                                setIsAddMoneyOpen(true);
                            }}
                            className="bg-white p-7 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer active:scale-95 flex flex-col group relative overflow-hidden"
                        >
                            <div
                                className={`w-14 h-14 ${configFund[key].bg} rounded-[1.5rem] flex items-center justify-center mb-6 text-3xl group-hover:rotate-12 transition-transform`}
                            >
                                {configFund[key].icon}
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                                {configFund[key].label}
                            </p>
                            <div className="flex justify-between items-end">
                                <p className={`text-xl font-black ${configFund[key].color} tracking-tighter`}>
                                    {formatVND(balances[key])}
                                </p>
                                <div className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded-lg text-slate-500">
                                    {ratios[key]}%
                                </div>
                            </div>
                            {/* Thanh tiến độ nhỏ trang trí */}
                            <div className="mt-4 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${configFund[key].color.replace('text', 'bg')} opacity-30`}
                                    style={{ width: `${ratios[key]}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="text-center text-[12px] text-slate-500 font-bold uppercase tracking-[0.3em] py-4">
                    Tài chính minh bạch • Cuộc sống an nhàn
                </p>
            </div>
            {/* MODAL ĐIỀU CHỈNH SỐ DƯ TRỰC TIẾP */}
            {isAddMoneyOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{marginTop: 0}}>
                    <div
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity"
                        onClick={() => setIsAddMoneyOpen(false)}
                    />
                    <div className="relative w-full max-w-sm bg-white rounded-[3rem] p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                        <div className="text-center mb-8">
                            <div
                                className={`w-20 h-20 ${configFund[selectedFund]?.bg} rounded-full flex items-center justify-center mx-auto mb-4 text-4xl shadow-inner`}
                            >
                                {configFund[selectedFund]?.icon}
                            </div>
                            <h3 className="text-2xl font-black tracking-tight text-slate-900">
                                Hũ {configFund[selectedFund]?.label}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic text-balance">
                                Cộng thêm số dương hoặc trừ đi số âm
                            </p>
                        </div>

                        <input
                            type="number"
                            autoFocus
                            id="editBalanceInput"
                            placeholder="Số tiền (Ví dụ: -50000)"
                            className="w-full p-4 bg-slate-50 rounded-3xl mb-8 outline-none text-xl text-center border-2 border-transparent focus:border-indigo-500 transition-all shadow-inner"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsAddMoneyOpen(false)}
                                className="flex-1 py-5 font-bold text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                HỦY
                            </button>
                            <button
                                onClick={() => {
                                    const val = Number(document.getElementById('editBalanceInput').value);
                                    setBalances((prev) => ({ ...prev, [selectedFund]: prev[selectedFund] + val }));
                                    setIsAddMoneyOpen(false);
                                }}
                                className="flex-[2] py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-lg shadow-indigo-100 active:scale-95 transition-all uppercase text-xs tracking-widest"
                            >
                                XÁC NHẬN
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* MODAL CẤU HÌNH TỶ LỆ % */}
            {isSettingOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{marginTop: 0}}>
                    <div
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity"
                        onClick={() => setIsSettingOpen(false)}
                    />
                    <div className="relative w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-10 duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-3xl font-black tracking-tighter text-slate-900">CẤU HÌNH %</h3>
                            <div
                                className={`px-5 py-2 rounded-2xl text-xs font-black shadow-sm ${totalPercentage === 100 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100 animate-bounce'}`}
                            >
                                {totalPercentage}/100%
                            </div>
                        </div>

                        <div className="space-y-8 overflow-y-auto pr-4 custom-scrollbar pb-4">
                            {Object.keys(ratios).map((key) => (
                                <div key={key} className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{configFund[key].icon}</span>
                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                                {configFund[key].label}
                                            </span>
                                        </div>
                                        <span className={`font-black text-lg ${configFund[key].color}`}>
                                            {ratios[key]}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={ratios[key]}
                                        onChange={(e) => setRatios({ ...ratios, [key]: Number(e.target.value) })}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-50">
                            <p className="text-[10px] text-slate-400 font-bold uppercase text-center mb-4 italic tracking-tight">
                                {totalPercentage !== 100
                                    ? '⚠️ Tổng tỷ lệ phải bằng 100% mới có thể lưu!'
                                    : '✅ Tỷ lệ đã hợp lệ, có thể lưu ngay.'}
                            </p>
                            <button
                                disabled={totalPercentage !== 100}
                                onClick={() => {
                                    localStorage.setItem('fund_ratios', JSON.stringify(ratios));
                                    setIsSettingOpen(false);
                                }}
                                className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black disabled:bg-slate-100 disabled:text-slate-300 transition-all active:scale-95 shadow-xl shadow-slate-200 uppercase text-xs tracking-[0.2em]"
                            >
                                LƯU TỶ LỆ MỚI
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* CUSTOM CONFIRM DIALOG - FIX IOS ISSUE */}
            {confirmDialog && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
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

export default FundPage;
