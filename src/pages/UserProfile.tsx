import React, { useState } from 'react';
import { User as UserIcon, Package, Heart, Settings, LogOut, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Order, Product } from '../types';

interface UserProfileProps {
  user: User;
  setUser: (user: User | null) => void;
  orders: Order[];
  wishlist: Product[];
  removeFromWishlist: (productId: string) => void;
  setActivePage: (page: string) => void;
}

export const UserProfile = ({ user, setUser, orders, wishlist, removeFromWishlist, setActivePage }: UserProfileProps) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...user });
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUser(formData);
    setIsEditing(false);
    setMessage({ type: 'success', text: 'Profile updated successfully!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleLogout = () => {
    setUser(null);
    setActivePage('home');
  };

  return (
    <div className="py-20 bg-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar */}
          <aside className="w-full md:w-64 space-y-2">
            <div className="p-6 bg-white rounded-3xl shadow-sm mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 mx-auto">
                <UserIcon size={32} />
              </div>
              <h3 className="text-center font-bold">{user.firstName} {user.lastName}</h3>
              <p className="text-center text-xs text-primary/40 truncate">{user.email}</p>
            </div>
            
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'profile' ? 'bg-primary text-cream shadow-lg' : 'hover:bg-primary/5 text-primary/70'}`}
            >
              <UserIcon size={20} />
              <span className="font-bold text-sm uppercase tracking-widest">Profile</span>
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'orders' ? 'bg-primary text-cream shadow-lg' : 'hover:bg-primary/5 text-primary/70'}`}
            >
              <Package size={20} />
              <span className="font-bold text-sm uppercase tracking-widest">Orders</span>
            </button>
            <button 
              onClick={() => setActiveTab('wishlist')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'wishlist' ? 'bg-primary text-cream shadow-lg' : 'hover:bg-primary/5 text-primary/70'}`}
            >
              <Heart size={20} />
              <span className="font-bold text-sm uppercase tracking-widest">Wishlist</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-primary text-cream shadow-lg' : 'hover:bg-primary/5 text-primary/70'}`}
            >
              <Settings size={20} />
              <span className="font-bold text-sm uppercase tracking-widest">Settings</span>
            </button>
            <div className="pt-8">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut size={20} />
                <span className="font-bold text-sm uppercase tracking-widest">Logout</span>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-grow">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white p-10 rounded-3xl shadow-sm"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-serif">My Profile</h2>
                    {!isEditing && (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="text-sm font-bold uppercase tracking-widest text-secondary hover:underline"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>

                  {message.text && (
                    <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                      <span className="text-sm font-medium">{message.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-primary/50">First Name</label>
                      <input 
                        type="text" 
                        disabled={!isEditing}
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        className="w-full px-6 py-4 bg-cream/30 border border-primary/10 rounded-xl focus:outline-none disabled:opacity-50" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Last Name</label>
                      <input 
                        type="text" 
                        disabled={!isEditing}
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        className="w-full px-6 py-4 bg-cream/30 border border-primary/10 rounded-xl focus:outline-none disabled:opacity-50" 
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Email Address</label>
                      <input 
                        type="email" 
                        disabled={!isEditing}
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-6 py-4 bg-cream/30 border border-primary/10 rounded-xl focus:outline-none disabled:opacity-50" 
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Shipping Address</label>
                      <input 
                        type="text" 
                        disabled={!isEditing}
                        value={formData.address || ''}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        placeholder="123 Nature Way, Eco City, 90210"
                        className="w-full px-6 py-4 bg-cream/30 border border-primary/10 rounded-xl focus:outline-none disabled:opacity-50" 
                      />
                    </div>
                    {isEditing && (
                      <div className="md:col-span-2 flex gap-4 pt-4">
                        <button 
                          type="submit"
                          className="bg-primary text-cream px-10 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-accent transition-all"
                        >
                          Save Changes
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setFormData({...user});
                          }}
                          className="bg-cream text-primary px-10 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-primary/5 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </form>
                </motion.div>
              )}

              {activeTab === 'orders' && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-3xl font-serif mb-8">Order History</h2>
                  {orders.length === 0 ? (
                    <div className="bg-white p-20 rounded-3xl shadow-sm text-center">
                      <Package size={48} className="mx-auto mb-6 text-primary/10" />
                      <p className="text-primary/40 mb-8">You haven't placed any orders yet.</p>
                      <button 
                        onClick={() => setActivePage('catalog')}
                        className="text-sm font-bold uppercase tracking-widest border-b-2 border-primary pb-1"
                      >
                        Start Shopping
                      </button>
                    </div>
                  ) : (
                    orders.map((order: any) => (
                      <div key={order.id} className="bg-white p-8 rounded-3xl shadow-sm border border-primary/5">
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-6 pb-6 border-b border-primary/5">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-1">Order Number</p>
                            <p className="font-mono font-bold">#{order.id}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-1">Date</p>
                            <p className="font-medium">{order.date}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-1">Status</p>
                            <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-widest rounded-full">
                              {order.status}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-primary/40 mb-1">Tracking</p>
                            <p className="font-mono text-secondary text-sm">{order.trackingNumber}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-4 items-center">
                              <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-grow">
                                <h4 className="text-sm font-medium">{item.name}</h4>
                                <p className="text-[10px] text-primary/40 uppercase tracking-widest">{item.size} / {item.color}</p>
                              </div>
                              <p className="text-sm font-bold">${item.price.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-primary/5 flex justify-between items-center">
                          <p className="text-sm text-primary/60">Total Amount</p>
                          <p className="text-xl font-serif font-bold">${order.total.toFixed(2)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {activeTab === 'wishlist' && (
                <motion.div
                  key="wishlist"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white p-10 rounded-3xl shadow-sm"
                >
                  <h2 className="text-3xl font-serif mb-8">My Wishlist</h2>
                  {wishlist.length === 0 ? (
                    <div className="text-center py-10">
                      <Heart size={48} className="mx-auto mb-6 text-primary/10" />
                      <p className="text-primary/40 mb-8">Your wishlist is empty.</p>
                      <button 
                        onClick={() => setActivePage('catalog')}
                        className="text-sm font-bold uppercase tracking-widest border-b-2 border-primary pb-1"
                      >
                        Explore Products
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {wishlist.map((product: any) => (
                        <div key={product.id} className="group">
                          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-cream/30 mb-4">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            <button 
                              onClick={() => removeFromWishlist(product.id)}
                              className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-50 transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <h4 className="font-medium text-sm mb-1">{product.name}</h4>
                          <p className="text-sm font-bold">${product.price.toFixed(2)}</p>
                          <button 
                            onClick={() => {
                              setActivePage('product-detail');
                              // This would need to pass the product back up
                            }}
                            className="mt-4 w-full py-3 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-primary hover:text-cream transition-all"
                          >
                            View Product
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white p-10 rounded-3xl shadow-sm"
                >
                  <h2 className="text-3xl font-serif mb-8">Account Settings</h2>
                  <div className="space-y-8">
                    <section className="space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-primary/40 pb-2 border-b border-primary/5">Security</h4>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Password</p>
                          <p className="text-xs text-primary/40">Last changed 3 months ago</p>
                        </div>
                        <button className="text-xs font-bold uppercase tracking-widest text-secondary hover:underline">Change Password</button>
                      </div>
                    </section>
                    <section className="space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-primary/40 pb-2 border-b border-primary/5">Notifications</h4>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Email Newsletter</p>
                        <div className="w-12 h-6 bg-secondary rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-medium">Order Updates</p>
                        <div className="w-12 h-6 bg-secondary rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                        </div>
                      </div>
                    </section>
                    <section className="space-y-4 pt-8">
                      <button className="text-xs font-bold uppercase tracking-widest text-red-500 hover:underline">Delete Account</button>
                    </section>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};
