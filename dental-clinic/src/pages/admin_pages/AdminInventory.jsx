import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSidebar from '../adminsidebar';

const AdminInventory = ({admin, setAdmin}) => {
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals visibility states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({ itemName: '', category: 'Consumable', quantity: 0, reorderLevel: 5 });
  const [editFormData, setEditFormData] = useState({ _id: '', itemName: '', category: 'Consumable', quantity: 0, reorderLevel: 5 });
  const [deleteId, setDeleteId] = useState(null);
  
  // Custom feedback state
  const [feedback, setFeedback] = useState({ show: false, message: '', isError: false });

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/inventory`);
        const inventoryData = Array.isArray(res.data) 
          ? res.data 
          : res.data.items || res.data.data || res.data.supplies || [];

        setSupplies(inventoryData);
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
        setFeedback({ show: true, message: 'Failed to load inventory records from database.', isError: true });
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  // Add Item Handler
  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/inventory`, formData);
      const newItem = res.data.item || res.data.savedItem || res.data;
      setSupplies([newItem, ...supplies]);
      setShowAddModal(false);
      setFormData({ itemName: '', category: 'Consumable', quantity: 0, reorderLevel: 5 });
      setFeedback({ show: true, message: 'Item successfully added to inventory.', isError: false });
    } catch (error) {
      console.error('Failed to add item:', error);
      setFeedback({ show: true, message: 'Failed to add item.', isError: true });
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditFormData({
      _id: item._id,
      itemName: item.itemName || '',
      category: item.category || 'Consumable',
      quantity: item.quantity || 0,
      reorderLevel: item.reorderLevel || 5
    });
    setShowEditModal(true);
  };

  // Submit Edit Handler
  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/inventory/${editFormData._id}`, editFormData);
      const updatedItem = res.data.item || res.data.updatedItem || res.data;
      
      setSupplies(supplies.map(s => s._id === editFormData._id ? (updatedItem._id ? updatedItem : editFormData) : s));
      setShowEditModal(false);
      setFeedback({ show: true, message: 'Item successfully updated.', isError: false });
    } catch (error) {
      console.error('Failed to update item:', error);
      setFeedback({ show: true, message: 'Failed to update item.', isError: true });
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/inventory/${deleteId}`);
      setSupplies(supplies.filter(s => s._id !== deleteId));
      setShowDeleteModal(false);
      setDeleteId(null);
      setFeedback({ show: true, message: 'Item successfully deleted from inventory.', isError: false });
    } catch (error) {
      console.error('Failed to delete item:', error);
      setShowDeleteModal(false);
      setDeleteId(null);
      setFeedback({ show: true, message: 'Failed to delete item.', isError: true });
    }
  };

  // Quick Add & Subtract Quantity Handler
  const handleUpdateQuantity = async (e, id, delta) => {
    e.stopPropagation(); 
    const item = supplies.find(s => s._id === id);
    if (!item) return;
    
    const newQuantity = Math.max(0, Number(item.quantity) + delta);

    try {
      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/inventory/${id}`, { 
        quantity: newQuantity, 
        stock: newQuantity 
      });
      
      const updatedData = res.data.item || res.data;

      setSupplies(supplies.map(s => {
        if (s._id === id) {
          return typeof updatedData === 'object' && updatedData._id ? updatedData : { ...s, quantity: newQuantity };
        }
        return s;
      }));
    } catch (error) {
      console.error('Failed to update quantity:', error);
      setFeedback({ 
        show: true, 
        message: error.response?.data?.message || 'Could not update inventory quantity.', 
        isError: true 
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans relative">
      <AdminSidebar admin={admin} setAdmin={setAdmin} />

      <div className="flex-1 p-8 w-full">
        <div className="max-w-6xl mx-auto">
        
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventory & Supplies</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">Manage stock levels, materials, and medical consumables.</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-[#D4AF37] text-slate-950 font-bold px-5 py-2.5 rounded-lg shadow-sm hover:bg-amber-400 transition-colors text-sm cursor-pointer"
            >
              + Add New Item
            </button>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <th className="p-4">Item Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-center">In Stock (Adjust)</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-medium text-sm">Loading inventory data...</td></tr>
                  ) : supplies.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-medium text-sm">No items found in inventory.</td></tr>
                  ) : (
                    supplies.map((item) => {
                      const isLowStock = item.quantity <= item.reorderLevel;
                      return (
                        <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4">
                            <span className="font-bold text-slate-800 text-sm">{item.itemName}</span>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold">
                              {item.category}
                            </span>
                          </td>
                          
                          {/* CLICKABLE QUANTITY CONTROLS */}
                          <td className="p-4 text-center">
                            <div className="inline-flex items-center gap-2 bg-white border border-slate-300 px-3 py-1.5 rounded-xl shadow-xs relative z-10">
                              <button 
                                type="button"
                                onClick={(e) => handleUpdateQuantity(e, item._id, -1)}
                                disabled={item.quantity <= 0}
                                className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed font-black flex items-center justify-center text-sm cursor-pointer transition-colors select-none"
                                title="Subtract 1"
                              >
                                -
                              </button>
                              
                              <span className={`text-sm font-black min-w-[2.2rem] text-center ${isLowStock ? 'text-red-500' : 'text-slate-900'}`}>
                                {item.quantity}
                              </span>

                              <button 
                                type="button"
                                onClick={(e) => handleUpdateQuantity(e, item._id, 1)}
                                className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 hover:bg-slate-200 font-black flex items-center justify-center text-sm cursor-pointer transition-colors select-none"
                                title="Add 1"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          <td className="p-4 text-center">
                            {isLowStock ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Sufficient
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => handleOpenEdit(item)}
                              className="text-slate-400 hover:text-[#D4AF37] font-bold text-xs mr-3 transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleOpenDelete(item._id)}
                              className="text-slate-400 hover:text-red-500 font-bold text-xs transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add New Supply</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Item Name</label>
                <input 
                  type="text" name="itemName" required
                  value={formData.itemName} onChange={handleInputChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                <select 
                  name="category" 
                  value={formData.category} onChange={handleInputChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#D4AF37]"
                >
                  <option value="Consumable">Consumable</option>
                  <option value="Material">Material</option>
                  <option value="Medicine">Medicine</option>
                  <option value="Equipment">Equipment</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quantity</label>
                  <input 
                    type="number" name="quantity" required min="0"
                    value={formData.quantity} onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reorder Level</label>
                  <input 
                    type="number" name="reorderLevel" required min="0"
                    value={formData.reorderLevel} onChange={handleInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-2 rounded-lg text-sm hover:bg-slate-200 cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 bg-[#D4AF37] text-slate-950 font-bold py-2 rounded-lg text-sm hover:bg-amber-400 shadow-sm cursor-pointer">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Edit Supply Item</h2>
            <form onSubmit={handleUpdateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Item Name</label>
                <input 
                  type="text" name="itemName" required
                  value={editFormData.itemName} onChange={handleEditInputChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                <select 
                  name="category" 
                  value={editFormData.category} onChange={handleEditInputChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#D4AF37]"
                >
                  <option value="Consumable">Consumable</option>
                  <option value="Material">Material</option>
                  <option value="Medicine">Medicine</option>
                  <option value="Equipment">Equipment</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quantity</label>
                  <input 
                    type="number" name="quantity" required min="0"
                    value={editFormData.quantity} onChange={handleEditInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reorder Level</label>
                  <input 
                    type="number" name="reorderLevel" required min="0"
                    value={editFormData.reorderLevel} onChange={handleEditInputChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-2 rounded-lg text-sm hover:bg-slate-200 cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 bg-[#D4AF37] text-slate-950 font-bold py-2 rounded-lg text-sm hover:bg-amber-400 shadow-sm cursor-pointer">Update Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full mx-auto flex items-center justify-center text-xl mb-4">🗑️</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Inventory Item</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">Are you sure you want to permanently delete this item from the inventory?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-xl cursor-pointer">Cancel</button>
              <button onClick={handleConfirmDelete} className="flex-1 bg-red-600 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer hover:bg-red-700">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK MODAL */}
      {feedback.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm text-center">
            <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center text-xl mb-4 ${feedback.isError ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {feedback.isError ? '⚠️' : '✓'}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{feedback.isError ? 'Notice' : 'Success'}</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">{feedback.message}</p>
            <button 
              onClick={() => setFeedback({ show: false, message: '', isError: false })}
              className="w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-slate-800 cursor-pointer"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;