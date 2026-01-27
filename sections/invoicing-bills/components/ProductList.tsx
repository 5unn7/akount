import { Plus, Search, Package, Edit2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { ProductListProps } from '../types'
// TODO: Import useSpotlight hook - either copy locally or import from shared location
// import { useSpotlight } from '../../shell/components/useSpotlight'

export function ProductList({ products, onEdit, onDelete, onCreate }: ProductListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatTaxRate = (rate: number) => {
    return `${(rate * 100).toFixed(0)}%`
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
                Products & Services
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 font-[family-name:var(--font-body)]">
                Catalog of reusable line items
              </p>
            </div>
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white text-sm rounded-lg font-semibold transition-colors shadow-sm font-[family-name:var(--font-body)]"
            >
              <Plus className="w-4 h-4" />
              New Product
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products and services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-slate-300 dark:border-slate-600/50 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent font-[family-name:var(--font-body)]"
            />
          </div>
        </div>

        {/* Product List */}
        {filteredProducts.length > 0 ? (
          <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700/50 overflow-hidden">
            <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
              {filteredProducts.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  onEdit={() => onEdit?.(product.id)}
                  onDelete={() => onDelete?.(product.id)}
                  formatCurrency={formatCurrency}
                  formatTaxRate={formatTaxRate}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700/50 px-6 py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
              <Package className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-900 dark:text-white font-semibold mb-1 font-[family-name:var(--font-body)]">
              No products found
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-[family-name:var(--font-body)]">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Add your first product or service to get started'}
            </p>
          </div>
        )}

        {/* Results Count */}
        {filteredProducts.length > 0 && (
          <div className="mt-3 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 font-[family-name:var(--font-body)]">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>
        )}
    </div>
  )
}

interface ProductRowProps {
  product: {
    id: string
    name: string
    description: string
    defaultPrice: number
    taxRate: number
    category: string
    unit: string
  }
  onEdit: () => void
  onDelete: () => void
  formatCurrency: (amount: number) => string
  formatTaxRate: (rate: number) => string
}

function ProductRow({ product, onEdit, onDelete, formatCurrency, formatTaxRate }: ProductRowProps) {
  // TODO: Uncomment when useSpotlight is available
  // const { elementRef, spotlightStyle } = useSpotlight()

  return (
    <div
      // ref={elementRef}
      // style={spotlightStyle}
      className="relative px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/30"
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
          <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate font-[family-name:var(--font-body)]">
                {product.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1 font-[family-name:var(--font-body)]">
                {product.description}
              </p>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 dark:text-white font-[family-name:var(--font-mono)]">
                  {formatCurrency(product.defaultPrice)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-[family-name:var(--font-body)]">
                  per {product.unit}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={onEdit}
                  className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full font-[family-name:var(--font-body)]">
              {product.category}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-[family-name:var(--font-body)]">
              Tax: {formatTaxRate(product.taxRate)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
