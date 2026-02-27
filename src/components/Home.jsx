import React, { useEffect, useState } from 'react';
import { User, Wallet, ChevronRight, CreditCard, Layers, PieChart, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import config from '~/config';
import { getRandomQuote } from '~/assets/js/quote';

// 2. Định nghĩa hàm formatVND
const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount || 0);
};

const getFinancialData = () => {
    const rawData = localStorage.getItem('expense_detail_data');
    const months = rawData ? JSON.parse(rawData) : [];

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    let totalBalance = 0;
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    months.forEach((month) => {
        // income items
        month.incomeItems?.forEach((item) => {
            totalBalance += item.amount;
            if (month.date === currentMonth) {
                monthlyIncome += item.amount;
            }
        });

        // expense items
        month.items?.forEach((item) => {
            totalBalance -= item.amount;
            if (month.date === currentMonth) {
                monthlyExpense += item.amount;
            }
        });
    });

    return { totalBalance, monthlyIncome, monthlyExpense };
};

const HomePage = ({ setPage }) => {
    const [data, setData] = useState({ totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0 });

    useEffect(() => {
        // Lấy dữ liệu khi component mount
        const financialData = getFinancialData();
        setData(financialData);
    }, []);

    return (
        <div className="space-y-8 pt-10 pb-10 animate-in fade-in duration-500 max-w-6xl mx-auto">
            {/* Header Chào hỏi */}
            <header className="flex justify-between items-center px-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Chào! 👋</h1>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Hôm nay chi gì chưa?
                    </p>
                </div>
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <User size={24} />
                </div>
            </header>

            {/* Card Tổng số dư */}
            <Link
                to={config.routes.finance}
                className="block bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-[2.5rem] text-white shadow-xl"
            >
                <div>
                    <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-2">Tổng số dư khả dụng</p>
                    <h2 className="text-4xl font-black mb-6">{formatVND(data.totalBalance)}</h2>
                    <div className="flex gap-6">
                        <div>
                            <p className="text-[10px] font-bold opacity-60 uppercase">Thu tháng này</p>
                            <p className="text-sm font-bold">+{formatVND(data.monthlyIncome)}</p>
                        </div>
                        <div className="border-l border-white/20 pl-6">
                            <p className="text-[10px] font-bold opacity-60 uppercase">Chi tháng này</p>
                            <p className="text-sm font-bold">-{formatVND(data.monthlyExpense)}</p>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Hệ thống Menu Card */}
            <div className="grid grid-cols-1 gap-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Dịch vụ tài chính</p>

                {/* Card: Quản lý Thu Chi */}
                <div className="grid grid-cols-2 gap-4">
                    <Link to={config.routes.finance}>
                        <button
                            onClick={() => setPage('spending')}
                            className="w-full group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between text-left"
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Wallet size={28} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-lg">Quản lý Thu Chi</h3>
                                    <p className="text-xs text-slate-400 font-medium">Ghi chép dòng tiền hàng ngày</p>
                                </div>
                            </div>
                            <ChevronRight className="text-slate-300" size={20} />
                        </button>
                    </Link>
                    <Link to={config.routes.strategic}>
                        <button
                            onClick={() => setPage('strategic')}
                            className="w-full group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between text-left"
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Target size={28} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-lg">Quản lý Mục tiêu</h3>
                                    <p className="text-xs text-slate-400 font-medium">
                                        Theo dõi tiến độ đạt mục tiêu tài chính
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="text-slate-300" size={20} />
                        </button>
                    </Link>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Link to={config.routes.debt}>
                        {/* Card: Quản lý Nợ */}
                        <button
                            onClick={() => setPage('debt')}
                            className="w-full bg-rose-50 p-6 rounded-[2.5rem] border border-rose-100 text-left hover:bg-rose-100 transition-colors shadow-sm flex items-center gap-4"
                        >
                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-rose-900 leading-tight">Sổ Nợ</h3>
                                <p className="text-[10px] text-rose-600/70 font-bold uppercase mt-1">2 khoản nợ</p>
                            </div>
                        </button>
                    </Link>

                    {/* Card: Phân bổ Quỹ */}
                    <Link to={config.routes.fund}>
                        <button
                            onClick={() => setPage('fund')}
                            className="w-full bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100 text-left hover:bg-indigo-100 transition-colors shadow-sm flex items-center gap-4"
                        >
                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
                                <Layers size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-indigo-900 leading-tight">Chia Quỹ</h3>
                                <p className="text-[10px] text-indigo-600/70 font-bold uppercase mt-1">6 hũ</p>
                            </div>
                        </button>
                    </Link>
                </div>

                {/* Card: Báo cáo Analytics */}
                <Link to={config.routes.report}>
                    <button
                        onClick={() => setPage('analytics')}
                        className="w-full bg-slate-900 p-6 rounded-[2.5rem] text-left relative overflow-hidden group shadow-lg"
                    >
                        <div className="relative z-10 flex justify-between items-center">
                            <div>
                                <h3 className="font-black text-white text-lg">Báo cáo & Phân tích</h3>
                                <p className="text-xs text-slate-400 font-medium mt-1">Xem biểu đồ tiền tệ</p>
                            </div>
                            <PieChart
                                className="text-emerald-400 group-hover:rotate-12 transition-transform"
                                size={32}
                            />
                        </div>
                        <div className="absolute bottom-0 right-0 w-24 h-24 bg-emerald-500/10 -mb-8 -mr-8 rounded-full"></div>
                    </button>
                </Link>
            </div>

            <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 text-center">
                <p className="text-[12px] italic text-amber-700 font-medium leading-relaxed">"{getRandomQuote()}"</p>
            </div>
        </div>
    );
};

export default HomePage;
