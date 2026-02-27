import React, { useState, useEffect, useMemo } from 'react';

const AnalyticsPage = () => {
    const [allData, setAllData] = useState([]);
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);

    useEffect(() => {
        const rawData = localStorage.getItem('expense_detail_data');
        if (rawData) {
            const parsedData = JSON.parse(rawData);
            setAllData(parsedData);
            // Mặc định chọn tháng mới nhất khi vừa vào trang
            setSelectedMonthIndex(parsedData.length - 1);
        }
    }, []);

    // Logic tính toán báo cáo dựa trên tháng được chọn
    const stats = useMemo(() => {
        if (allData.length === 0 || selectedMonthIndex < 0) return null;

        const currentMonth = allData[selectedMonthIndex];
        const prevMonth = selectedMonthIndex > 0 ? allData[selectedMonthIndex - 1] : null;

        // CHIA TUẦN
        const weeklyExpenses = [0, 0, 0, 0];
        currentMonth.items.forEach((item) => {
            const day = parseInt(item.date.split('-')[2]);
            if (day <= 7) weeklyExpenses[0] += item.amount;
            else if (day <= 14) weeklyExpenses[1] += item.amount;
            else if (day <= 21) weeklyExpenses[2] += item.amount;
            else weeklyExpenses[3] += item.amount;
        });

        const maxWeekly = Math.max(...weeklyExpenses, 1);
        const chartData = weeklyExpenses.map((amount, index) => ({
            label: `Tuần ${index + 1}`,
            amount: amount,
            height: Math.max((amount / maxWeekly) * 90, 8), // Tối ưu chiều cao cột
        }));

        // PHÂN LOẠI HẠNG MỤC
        const categories = currentMonth.items.reduce((acc, item) => {
            let cat = 'Khác';
            const name = item.name.toLowerCase();
            if (name.includes('ăn') || name.includes('bánh') || name.includes('nước')) cat = 'Ăn uống';
            else if (name.includes('quần áo') || name.includes('giày')) cat = 'Mua sắm';
            else if (name.includes('nhà')) cat = 'Tiền nhà';
            else if (name.includes('nợ')) cat = 'Trả nợ';
            acc[cat] = (acc[cat] || 0) + item.amount;
            return acc;
        }, {});

        const topCatName = Object.keys(categories).reduce((a, b) => (categories[a] > categories[b] ? a : b), 'Chưa có');

        const percentChange = prevMonth
            ? Math.round(((currentMonth.totalExp - prevMonth.totalExp) / prevMonth.totalExp) * 100)
            : 0;

        return {
            ...currentMonth,
            percentChange,
            chartData,
            topCategory: {
                name: topCatName,
                amount: categories[topCatName] || 0,
                percent:
                    currentMonth.totalExp > 0 ? Math.round((categories[topCatName] / currentMonth.totalExp) * 100) : 0,
            },
        };
    }, [allData, selectedMonthIndex]);

    const formatVND = (amount) => new Intl.NumberFormat('vi-VN').format(amount) + 'đ';

    if (allData.length === 0)
        return <div className="p-10 text-center font-black opacity-20 text-2xl">CHƯA CÓ DỮ LIỆU</div>;
    if (!stats) return null;

    return (
        <div className="space-y-6 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto px-4">
            {/* BỘ CHỌN THÁNG - Dạng Tab cuộn ngang */}
            <div className="pt-8 overflow-x-auto no-scrollbar flex gap-2 sticky top-0 bg-slate-50/80 backdrop-blur-md z-30 py-4">
                {allData.map((data, index) => (
                    <button
                        key={data.date}
                        onClick={() => setSelectedMonthIndex(index)}
                        className={`px-6 py-2 rounded-2xl font-black text-sm whitespace-nowrap transition-all ${
                            selectedMonthIndex === index
                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 scale-105'
                                : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
                        }`}
                    >
                        {data.date}
                    </button>
                ))}
            </div>

            <header className="px-2 flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Báo Cáo 📊</h2>
                    <p className="text-sm text-slate-500 font-medium italic">Tháng {stats.date} tiêu pha ra sao?</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dư cuối tháng</p>
                    <p className="text-2xl font-black text-indigo-600 tracking-tighter">{formatVND(stats.remain)}</p>
                </div>
            </header>

            {/* CARD BIỂU ĐỒ */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                <div className="flex justify-between items-start mb-12 relative z-10">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                            Tổng chi tiêu
                        </p>
                        <p className="text-4xl font-black text-slate-900 tracking-tighter">
                            {formatVND(stats.totalExp)}
                        </p>
                    </div>
                    {selectedMonthIndex > 0 && (
                        <div
                            className={`px-4 py-2 rounded-2xl font-black text-xs border flex items-center gap-1 ${
                                stats.percentChange <= 0
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    : 'bg-rose-50 text-rose-600 border-rose-100'
                            }`}
                        >
                            {stats.percentChange <= 0 ? '↓' : '↑'} {Math.abs(stats.percentChange)}%
                        </div>
                    )}
                </div>

                <div className="flex items-end justify-between gap-4 h-56 px-2">
                    {stats.chartData.map((week, index) => (
                        <div key={index} className="flex-1 group relative flex flex-col items-center gap-4">
                            {/* Số tiền khi hover */}
                            <div className="absolute -top-10 bg-slate-900 text-white text-[10px] px-3 py-1.5 rounded-xl group-hover:opacity-100 transition-all font-bold whitespace-nowrap z-20 shadow-xl pointer-events-none">
                                {formatVND(week.amount)}
                            </div>

                            <div
                                className={`w-full max-w-[50px] rounded-2xl transition-all duration-[1s] ease-out-back relative overflow-hidden ${
                                    week.amount === Math.max(...stats.chartData.map((w) => w.amount)) && week.amount > 0
                                        ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-lg shadow-indigo-100'
                                        : 'bg-slate-100 hover:bg-slate-200'
                                }`}
                                style={{ height: `${week.height}%` }}
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-50" />
                            </div>
                            <span
                                className={`text-[10px] font-black uppercase tracking-tighter ${
                                    week.amount > 0 ? 'text-slate-900' : 'text-slate-300'
                                }`}
                            >
                                {week.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* CARD HẠNG MỤC NẶNG ĐÔ */}
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />

                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-6">Top Hạng Mục</p>

                <div className="flex justify-between items-end mb-8">
                    <h4 className="text-3xl font-black text-white">{stats.topCategory.name}</h4>
                    <span className="text-4xl font-black text-emerald-400 tracking-tighter">
                        {stats.topCategory.percent}%
                    </span>
                </div>

                <div className="space-y-6">
                    <div className="flex justify-between text-xs font-bold opacity-50 tracking-wide uppercase">
                        <span>Đã tiêu: {formatVND(stats.topCategory.amount)}</span>
                        <span>Mục tiêu: {formatVND(5000000)}</span>
                    </div>
                    <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                        <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-[1.5s]"
                            style={{ width: `${stats.topCategory.percent}%` }}
                        />
                    </div>
                </div>

                <p className="mt-10 text-sm italic text-slate-400 font-medium leading-relaxed border-t border-white/5 pt-6">
                    {stats.topCategory.name === 'Ăn uống'
                        ? '💡 Bí kíp: Tháng này ăn hàng hơi nhiều đó nha, tự nấu cơm mang đi làm là dư ngay vài triệu!'
                        : '💡 Ghi chú: Hãy cân nhắc xem các khoản chi này có giúp ích cho tương lai không nhé.'}
                </p>
            </div>
        </div>
    );
};

export default AnalyticsPage;
