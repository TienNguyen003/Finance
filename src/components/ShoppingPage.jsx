import { CheckCircle, Circle, CloudUpload, GripVertical, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const ShoppingPage = () => {
    const [items, setItems] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [draggedId, setDraggedId] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
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

    const categoryOptions = useMemo(() => {
        const allCategories = items
            .map((item) => item.category)
            .filter((category, index, array) => category && array.indexOf(category) === index);
        return ['all', ...allCategories];
    }, [items]);

    const filteredItems = useMemo(() => {
        const keyword = searchKeyword.trim().toLowerCase();
        return items.filter((item) => {
            const statusMatch =
                statusFilter === 'all' ||
                (statusFilter === 'bought' && item.bought) ||
                (statusFilter === 'pending' && !item.bought);
            const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
            const keywordMatch = !keyword || item.name.toLowerCase().includes(keyword);
            return statusMatch && categoryMatch && keywordMatch;
        });
    }, [items, statusFilter, categoryFilter, searchKeyword]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredItems.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredItems, currentPage, itemsPerPage]);

    // Reset về trang 1 khi filter thay đổi
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, categoryFilter, searchKeyword]);

    const handleDragStart = (id) => {
        setDraggedId(id);
    };

    const handleDrop = (targetId) => {
        if (!draggedId || draggedId === targetId) {
            setDraggedId(null);
            setDragOverId(null);
            return;
        }

        const updated = [...items];
        const fromIndex = updated.findIndex((item) => item.id === draggedId);
        const toIndex = updated.findIndex((item) => item.id === targetId);

        if (fromIndex === -1 || toIndex === -1) {
            setDraggedId(null);
            setDragOverId(null);
            return;
        }

        const [movedItem] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, movedItem);
        saveToLocal(updated);
        setDraggedId(null);
        setDragOverId(null);
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
                            className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"
                        >
                            <CloudUpload size={20} /> Đồng bộ
                        </button>
                        <button
                            onClick={loadFromSheets}
                            className="flex items-center justify-center gap-2 p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all"
                        >
                            <RefreshCw size={20} /> Tải về
                        </button>
                    </div>
                </header>

                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    <Plus size={24} /> Thêm món đồ mới
                </button>

                <div className="bg-white rounded-[2rem] p-4 border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <input
                            type="text"
                            placeholder="Tìm món đồ..."
                            className="flex-1 p-3 bg-slate-50 rounded-xl outline-none border-2 border-transparent focus:border-slate-900 font-medium"
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                        <select
                            className="p-3 bg-slate-50 rounded-xl outline-none border-2 border-transparent focus:border-slate-900 font-bold"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="all">Tất cả loại</option>
                            {categoryOptions
                                .filter((category) => category !== 'all')
                                .map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                statusFilter === 'all'
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                        >
                            Tất cả ({items.length})
                        </button>
                        <button
                            onClick={() => setStatusFilter('pending')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                statusFilter === 'pending'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                            }`}
                        >
                            Chưa mua ({items.filter((item) => !item.bought).length})
                        </button>
                        <button
                            onClick={() => setStatusFilter('bought')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                statusFilter === 'bought'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                        >
                            Đã mua ({items.filter((item) => item.bought).length})
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="space-y-3">
                    {filteredItems.length === 0 && (
                        <div className="bg-white p-6 rounded-[2rem] border border-dashed border-slate-200 text-center text-slate-400 font-bold">
                            Không có món đồ nào theo bộ lọc hiện tại.
                        </div>
                    )}

                    {paginatedItems.map((item) => (
                        <div
                            key={item.id}
                            draggable
                            onDragStart={() => handleDragStart(item.id)}
                            onDragEnter={() => setDragOverId(item.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDragEnd={() => {
                                setDraggedId(null);
                                setDragOverId(null);
                            }}
                            onDrop={() => handleDrop(item.id)}
                            className={`bg-white p-5 rounded-[2rem] border shadow-sm flex items-center gap-4 transition-all ${
                                item.bought ? 'opacity-50' : ''
                            } ${dragOverId === item.id && draggedId !== item.id ? 'border-indigo-300' : 'border-slate-100'} ${
                                draggedId === item.id ? 'scale-[0.99] opacity-70' : ''
                            }`}
                        >
                            <span className="text-slate-300 cursor-grab active:cursor-grabbing">
                                <GripVertical size={18} />
                            </span>
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
                                    {item.category && <span>• {item.category}</span>}
                                    {item.expectedDate && (
                                        <span>• HẠN: {new Date(item.expectedDate).toLocaleDateString('vi-VN')}</span>
                                    )}
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

                    {/* PAGINATION */}
                    {filteredItems.length > itemsPerPage && (
                        <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                                <div className="text-sm font-bold text-slate-500">
                                    Đang xem{' '}
                                    <span className="text-slate-900">
                                        {(currentPage - 1) * itemsPerPage + 1}-
                                        {Math.min(currentPage * itemsPerPage, filteredItems.length)}
                                    </span>{' '}
                                    của <span className="text-slate-900">{filteredItems.length}</span> món
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 transition-all text-sm"
                                    >
                                        ← Trước
                                    </button>
                                    <div className="px-3 py-2 bg-slate-900 text-white rounded-xl font-black text-sm min-w-[60px] text-center">
                                        {currentPage}/{totalPages}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 transition-all text-sm"
                                    >
                                        Sau →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
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
                            <label className="text-[11px] font-black text-slate-500 uppercase ml-2 tracking-widest">
                                Tên món đồ
                            </label>
                            <input
                                className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-2 border-transparent focus:border-slate-900 font-bold"
                                placeholder="Tên món đồ..."
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                            {/* Grid chia 2 cho Giá và Ngày */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-black text-slate-500 uppercase ml-2 tracking-widest">
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
                                    <label className="text-[11px] font-black text-slate-500 uppercase ml-2 tracking-widest">
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
                                <label className="text-[11px] font-black text-slate-500 uppercase ml-2 tracking-widest">
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
