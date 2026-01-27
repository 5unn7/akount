import { Plus, Search, Filter, Mail, Phone, Building2, User } from 'lucide-react'
import { useState } from 'react'
import type { Client, Vendor } from '../types'
// TODO: Import useSpotlight hook - either copy locally or import from shared location
// import { useSpotlight } from '../../shell/components/useSpotlight'

interface ClientVendorListProps {
  clients: Client[]
  vendors: Vendor[]
  onViewClient?: (id: string) => void
  onEditClient?: (id: string) => void
  onDeleteClient?: (id: string) => void
  onCreateClient?: () => void
  onCreateInvoice?: (clientId: string) => void
  onViewVendor?: (id: string) => void
  onEditVendor?: (id: string) => void
  onDeleteVendor?: (id: string) => void
  onCreateVendor?: () => void
  onCreateBill?: (vendorId: string) => void
}

interface ContactCardProps {
  type: 'client' | 'vendor'
  name: string
  email: string
  phone: string
  outstanding: number
  currency: string
  onView?: () => void
  onEdit?: () => void
  onCreate?: () => void
}

function ContactCard({ type, name, email, phone, outstanding, currency, onView, onEdit, onCreate }: ContactCardProps) {
  // TODO: Uncomment when useSpotlight is available
  // const { elementRef, spotlightStyle } = useSpotlight()

  const formattedOutstanding = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(outstanding)

  return (
    <div
      // ref={elementRef}
      // style={spotlightStyle}
      className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700/50 p-4 hover:shadow-md dark:hover:shadow-slate-900/50 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <button onClick={onView} className="text-left group/name">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover/name:text-orange-600 dark:group-hover/name:text-orange-400 transition-colors font-[family-name:var(--font-body)]">
              {name}
            </h3>
          </button>
          <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
            type === 'client'
              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
              : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
          } font-[family-name:var(--font-body)]`}>
            {type === 'client' ? <User className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
            {type === 'client' ? 'Client' : 'Vendor'}
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-[family-name:var(--font-body)]">
            {type === 'client' ? 'Outstanding' : 'Owed'}
          </p>
          <p className={`text-sm font-bold mt-0.5 font-[family-name:var(--font-mono)] ${
            outstanding > 0
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}>
            {formattedOutstanding}
          </p>
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
          <a href={`mailto:${email}`} className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors truncate font-[family-name:var(--font-body)]">
            {email}
          </a>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
          <a href={`tel:${phone}`} className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-[family-name:var(--font-body)]">
            {phone}
          </a>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCreate}
          className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            type === 'client'
              ? 'bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white'
              : 'bg-violet-500 hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700 text-white'
          } font-[family-name:var(--font-body)]`}
        >
          {type === 'client' ? 'New Invoice' : 'New Bill'}
        </button>
        <button
          onClick={onEdit}
          className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-md transition-colors font-[family-name:var(--font-body)]"
        >
          Edit
        </button>
      </div>
    </div>
  )
}

export function ClientVendorList({
  clients,
  vendors,
  onViewClient,
  onEditClient,
  onCreateClient,
  onCreateInvoice,
  onViewVendor,
  onEditVendor,
  onCreateVendor,
  onCreateBill,
}: ClientVendorListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'clients' | 'vendors'>('all')

  const allContacts = [
    ...clients.map(c => ({ ...c, type: 'client' as const })),
    ...vendors.map(v => ({ ...v, type: 'vendor' as const, totalOutstanding: v.totalOwed })),
  ]

  const filteredContacts = allContacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === 'all' || contact.type === typeFilter.replace('s', '') as 'client' | 'vendor'

    return matchesSearch && matchesType
  })

  const totalClients = clients.length
  const totalVendors = vendors.length
  const totalOutstanding = clients.reduce((sum, c) => sum + c.totalOutstanding, 0)
  const totalOwed = vendors.reduce((sum, v) => sum + v.totalOwed, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
                Contacts
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 font-[family-name:var(--font-body)]">
                Manage clients and vendors
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onCreateClient}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white text-sm rounded-lg font-semibold transition-colors shadow-sm font-[family-name:var(--font-body)]"
              >
                <Plus className="w-4 h-4" />
                Client
              </button>
              <button
                onClick={onCreateVendor}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-500 hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700 text-white text-sm rounded-lg font-semibold transition-colors shadow-sm font-[family-name:var(--font-body)]"
              >
                <Plus className="w-4 h-4" />
                Vendor
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-200 dark:border-slate-700/50">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide font-[family-name:var(--font-body)]">
                Clients
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-[family-name:var(--font-mono)]">
                {totalClients}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-200 dark:border-slate-700/50">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide font-[family-name:var(--font-body)]">
                Vendors
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-[family-name:var(--font-mono)]">
                {totalVendors}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-200 dark:border-slate-700/50">
              <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide font-[family-name:var(--font-body)]">
                AR Outstanding
              </p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-1 font-[family-name:var(--font-mono)]">
                {formatCurrency(totalOutstanding)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-200 dark:border-slate-700/50">
              <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide font-[family-name:var(--font-body)]">
                AP Owed
              </p>
              <p className="text-xl font-bold text-violet-600 dark:text-violet-400 mt-1 font-[family-name:var(--font-mono)]">
                {formatCurrency(totalOwed)}
              </p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-300 dark:border-slate-600/50 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent font-[family-name:var(--font-body)]"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors font-[family-name:var(--font-body)] ${
                  typeFilter === 'all'
                    ? 'bg-slate-900 dark:bg-slate-700 text-white'
                    : 'bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600/50 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter('clients')}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors font-[family-name:var(--font-body)] ${
                  typeFilter === 'clients'
                    ? 'bg-orange-500 dark:bg-orange-600 text-white'
                    : 'bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600/50 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                Clients
              </button>
              <button
                onClick={() => setTypeFilter('vendors')}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors font-[family-name:var(--font-body)] ${
                  typeFilter === 'vendors'
                    ? 'bg-violet-500 dark:bg-violet-600 text-white'
                    : 'bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600/50 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                Vendors
              </button>
            </div>
          </div>
        </div>

        {/* Contact Grid */}
        {filteredContacts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                type={contact.type}
                name={contact.name}
                email={contact.email}
                phone={contact.phone}
                outstanding={contact.totalOutstanding}
                currency={contact.currency}
                onView={contact.type === 'client' ? () => onViewClient?.(contact.id) : () => onViewVendor?.(contact.id)}
                onEdit={contact.type === 'client' ? () => onEditClient?.(contact.id) : () => onEditVendor?.(contact.id)}
                onCreate={contact.type === 'client' ? () => onCreateInvoice?.(contact.id) : () => onCreateBill?.(contact.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700/50 px-6 py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
              <Search className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-900 dark:text-white font-semibold mb-1 font-[family-name:var(--font-body)]">
              No contacts found
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-[family-name:var(--font-body)]">
              {searchQuery || typeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add your first client or vendor to get started'}
            </p>
          </div>
        )}
    </div>
  )
}
