import React from 'react';
import pharmSuite from "../assets/pharmSuite.png"
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LogOut,
  Receipt,
  Layers
} from 'lucide-react';


const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItemClass = (path) =>
    `group relative mx-3 my-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`;

  const handleLogout = () => {
    localStorage.removeItem('pharmsuite_token');
    localStorage.removeItem('pharmsuite_user');
    navigate('/signin', { replace: true });
  };

  return (
    <div className="fixed left-0 top-0 flex h-full w-64 flex-col border-r border-gray-100 bg-white z-10">
      
      {/* Logo Section */}
      <div className="flex items-center gap-3 p-6">
        <img src={pharmSuite} alt="PharmSuite logo" className="h-8 w-auto object-contain" />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 flex flex-col py-2">
        <p className="px-6 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Main
        </p>
        
        <Link 
          to="/dashboard" 
          className={navItemClass('/dashboard')}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="ml-3">Dashboard</span>
        </Link>

        <Link 
          to="/inventory" 
          className={navItemClass('/inventory')}
        >
          <Package className="h-5 w-5" />
          <span className="ml-3">Inventory</span>
        </Link>
        
        <Link 
          to="/stock" 
          className={navItemClass('/stock')}
        >
          <Layers className="h-5 w-5" />
          <span className="ml-3">Stock</span>
        </Link>

        <Link 
          to="/pos" 
          className={navItemClass('/pos')}
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="ml-3">Point of Sale</span>
        </Link>

        <Link
          to="/sales"
          className={navItemClass('/sales')}
        >
          <Receipt className="h-5 w-5" />
          <span className="ml-3">Sales</span>
        </Link>

      </nav> 

      {/* Logout Button */}
      <div className="mt-auto px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;