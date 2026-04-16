'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Plane,
  Fuel,
  DollarSign,
  ShoppingCart,
  Shield,
  LogOut,
  Menu,
  X,
  Upload,
  Settings,
  User,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { DarkModeToggle } from './DarkModeToggle'
import { useState } from 'react'

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Travel Requests', href: '/travel', icon: Plane },
  { name: 'Fuel & Vehicle', href: '/fuel', icon: Fuel },
  { name: 'Petty Cash', href: '/petty-cash', icon: DollarSign },
  { name: 'Sales Orders', href: '/sales', icon: ShoppingCart, requiresSalesAccess: true },
  { name: 'Gate Pass', href: '/gate-pass', icon: Shield },
  { name: 'Bulk Upload', href: '/admin/bulk-upload', icon: Upload, adminOnly: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const hasSalesAccess =
    user?.role === 'administrator' ||
    user?.department === 'Commercial' ||
    user?.department === 'Inventory' ||
    user?.department === 'Finance' ||
    user?.permissions?.canAccessSales

  const isAdmin = user?.role === 'administrator'

  const filteredMenuItems = menuItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false
    if (item.requiresSalesAccess && !hasSalesAccess) return false
    return true
  })

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-primary-500 text-white shadow-lg hover:bg-primary-600 transition-colors"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-primary-700 to-primary-800 text-white transform transition-transform duration-300 ease-in-out z-40 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 shadow-xl`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-primary-600/50 bg-primary-800/50">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="font-bold text-lg">I</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wide">InyangeApps</h1>
                <p className="text-xs text-primary-200 font-medium">v1.0</p>
              </div>
            </div>
            <p className="text-xs text-primary-300 mt-2">Request Management System</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-white/15 text-white shadow-md'
                      : 'text-primary-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  <span className="font-medium text-sm">{item.name}</span>
                  {isActive && <div className="ml-auto w-1 h-6 bg-white rounded-full"></div>}
                </Link>
              )
            })}
          </nav>

          {/* User info and actions */}
          <div className="p-4 border-t border-primary-600/50 bg-primary-800/50">
            {/* User Profile Card */}
            <div className="mb-4 p-3 bg-primary-700/40 rounded-lg border border-primary-600/30">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-primary-400/30 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-primary-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user?.staffId || 'User'}</p>
                  <p className="text-xs text-primary-300">{user?.role || 'Staff'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-primary-200">
                  <span className="font-medium">Dept:</span> {user?.department || 'N/A'}
                </p>
                <p className="text-xs text-primary-200">
                  <span className="font-medium">Pos:</span> {user?.position || 'N/A'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <DarkModeToggle />
              <button
                onClick={logout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-600 transition-colors font-medium text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
