import { Plus, FileText } from 'lucide-react'
import type {
  JournalEntry,
  JournalLine,
  GLAccount,
  Entity,
} from '../types'
import { JournalEntryRow } from './JournalEntryRow'

interface JournalEntryListProps {
  journalEntries: JournalEntry[]
  journalLines: JournalLine[]
  glAccounts: GLAccount[]
  entities: Entity[]
  onCreateEntry?: (entry: Partial<JournalEntry>) => void
  onPostEntry?: (entryId: string) => void
}

export function JournalEntryList({
  journalEntries,
  journalLines,
  glAccounts,
  entities,
  onCreateEntry,
  onPostEntry,
}: JournalEntryListProps) {
  const getEntityName = (entityId: string) => {
    return entities.find(e => e.id === entityId)?.name || 'Unknown'
  }

  const getGLAccountName = (glAccountId: string) => {
    return glAccounts.find(gl => gl.id === glAccountId)?.name || 'Unknown'
  }

  const getEntryLines = (entryId: string) => {
    return journalLines.filter(line => line.journalEntryId === entryId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-[family-name:var(--font-heading)]">
            Journal Entries
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 font-[family-name:var(--font-body)]">
            Manual accounting adjustments and postings
          </p>
        </div>
        <button
          onClick={() => onCreateEntry?.({})}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500 text-white rounded-lg transition-colors font-medium font-[family-name:var(--font-body)]"
        >
          <Plus className="w-4 h-4" />
          Create Journal Entry
        </button>
      </div>

      {/* Entries List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Table Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-850">
          <div className="grid grid-cols-12 gap-4 items-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide font-[family-name:var(--font-body)]">
            <div className="col-span-2">Entry Number</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-4">Memo</div>
            <div className="col-span-2">Entity</div>
            <div className="col-span-1">Amount</div>
            <div className="col-span-1">Status</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {journalEntries.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 font-medium font-[family-name:var(--font-body)] mb-1">
                No journal entries yet
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 font-[family-name:var(--font-body)]">
                Create your first manual entry to adjust account balances
              </p>
            </div>
          ) : (
            journalEntries.map((entry) => {
              const lines = getEntryLines(entry.id)

              return (
                <JournalEntryRow
                  key={entry.id}
                  entry={entry}
                  lines={lines}
                  getEntityName={getEntityName}
                  getGLAccountName={getGLAccountName}
                  onPostEntry={onPostEntry}
                />
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
