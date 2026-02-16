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
          className="p-2 rounded-lg bg-primary-500 text-white"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-primary-600 text-white transform transition-transform duration-300 ease-in-out z-40 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-primary-500">
            <h1 className="text-2xl font-bold">InyangeApps</h1>
            <p className="text-sm text-primary-200 mt-1">Request Management</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-500 text-white'
                      : 'text-primary-100 hover:bg-primary-500/50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User info and actions */}
          <div className="p-4 border-t border-primary-500">
            <div className="mb-4">
              <p className="text-sm font-semibold">{user?.staffId}</p>
              <p className="text-xs text-primary-200">{user?.department}</p>
              <p className="text-xs text-primary-200">{user?.position}</p>
            </div>
            <div className="flex items-center justify-between">
              <DarkModeToggle />
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Logout</span>
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
