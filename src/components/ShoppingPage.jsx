import { CheckCircle, Circle, CloudUpload, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const ShoppingPage = () => {
    const [items, setItems] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'Cần thiết',
        expectedDate: '',
    });

    // Load dữ liệu ban đầu
    useEffect(() => {
        const saved = localStorage.getItem('shopping_list');
        if (saved) setItems(JSON.parse(saved));
    }, []);

    const saveToLocal = (newItems) => {
        setItems(newItems);
        localStorage.setItem('shopping_list', JSON.stringify(newItems));
    };

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

    // --- LOGIC GOOGLE SHEETS ---
    const getScriptUrl = () => localStorage.getItem('google_script_url');

    const syncToSheets = async () => {
        const confirmed = await showConfirm('Đồng bộ danh sách mua sắm lên Google Sheets?');
        if (!confirmed) return;
        setIsLoading(true);
        try {
            const response = await fetch(getScriptUrl(), {
                method: 'POST',
                body: JSON.stringify({
                    action: 'sync_shopping',
                    data: items,
                }),
            });
            await response.text();
            showToast('Đã đồng bộ thành công!');
        } catch (e) {
            showToast('Lỗi đồng bộ: ' + e.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const loadFromSheets = async () => {
        const confirmed = await showConfirm('Tải dữ liệu từ Sheets về sẽ ghi đè máy này. Tiếp tục?');
        if (!confirmed) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${getScriptUrl()}?action=get_shopping`);
            const data = await res.json();
            saveToLocal(data);
            showToast('Tải dữ liệu thành công!');
        } catch (e) {
            showToast('Lỗi tải dữ liệu: ' + e.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // --- THAO TÁC ITEM ---
    const handleAddItem = () => {
        if (!formData.name) return;
        const newItem = {
            id: Date.now(),
            ...formData,
            price: Number(formData.price) || 0,
            bought: false,
            createdAt: new Date().toISOString(),
        };
        saveToLocal([newItem, ...items]);
        setFormData({ name: '', price: '', category: 'Cần thiết', expectedDate: '' });
        setIsOpen(false);
    };

    const toggleBought = (id) => {
        const updated = items.map((item) => (item.id === id ? { ...item, bought: !item.bought } : item));
        saveToLocal(updated);
    };

    const deleteItem = (id) => {
        saveToLocal(items.filter((item) => item.id !== id));
    };

    const formatVND = (num) => new Intl.NumberFormat('vi-VN').format(num) + 'đ';

    return (
        <div className="relative pb-24">
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

            <div className={`max-w-6xl mx-auto px-4 pt-8 space-y-6 transition-all ${isOpen ? 'blur-md scale-95' : ''}`}>
                {/* Header */}
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900">Mua Sắm 🛒</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Lên kế hoạch sắm sửa
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={syncToSheets}
                            className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"
                        >
                            <CloudUpload size={20} />
                        </button>
                        <button
                            onClick={loadFromSheets}
                            className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </header>

                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    <Plus size={24} /> Thêm món đồ mới
                </button>

                {/* List */}
                <div className="space-y-3">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className={`bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 ${item.bought ? 'opacity-50' : ''}`}
                        >
                            <button onClick={() => toggleBought(item.id)}>
                                {item.bought ? (
                                    <CheckCircle size={24} className="text-emerald-500" />
                                ) : (
                                    <Circle size={24} className="text-slate-300" />
                                )}
                            </button>
                            <div className="flex-1 min-w-0">
                                <h4 className={`font-bold text-slate-800 ${item.bought ? 'line-through' : ''}`}>
                                    {item.name}
                                </h4>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400">
                                    <span className="text-indigo-500">{formatVND(item.price)}</span>
                                    {item.expectedDate && <span>• HẠN: {item.expectedDate}</span>}
                                </div>
                            </div>
                            <button
                                onClick={() => deleteItem(item.id)}
                                className="text-slate-200 hover:text-rose-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL - BOTTOM SHEET */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] p-8 animate-in slide-in-from-bottom duration-300">
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
                        <div className="space-y-5">
                            <input
                                className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-slate-900 font-bold"
                                placeholder="Tên món đồ..."
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                            {/* Grid chia 2 cho Giá và Ngày */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                                        Giá dự kiến
                                    </label>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-slate-900 font-black transition-all"
                                        placeholder="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                                        Ngày mua
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-slate-900 font-bold text-sm transition-all"
                                        value={formData.expectedDate}
                                        onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Ô chọn Loại (Cần thiết/Gia đình/Sở thích) - ĐÃ QUAY TRỞ LẠI */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                                    Phân loại món đồ
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-slate-900 font-bold appearance-none transition-all"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Cần thiết">🚨 Cần thiết (Mua ngay)</option>
                                        <option value="Gia đình">🏠 Đồ dùng gia đình</option>
                                        <option value="Sở thích">🎮 Sở thích cá nhân</option>
                                        <option value="Linh tinh">📦 Linh tinh khác</option>
                                    </select>
                                    {/* Icon mũi tên xuống cho đẹp */}
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="m6 9 6 6 6-6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleAddItem}
                                    className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black"
                                >
                                    Lưu vào giỏ
                                </button>
                            </div>
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

export default ShoppingPage;
