'use client';

import { useState } from 'react';
import Link from 'next/link';

const sections = [
  { id: 'overview', label: 'Overview', icon: '✦' },
  { id: 'colors', label: 'Colors', icon: '🎨' },
  { id: 'typography', label: 'Typography', icon: '𝐀' },
  { id: 'components', label: 'Components', icon: '⬡' },
  { id: 'patterns', label: 'Patterns', icon: '▦' },
];

export default function BrandPortalPage() {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/25">
              A
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold text-slate-900">Akount</h1>
              <p className="text-xs text-slate-500">Brand Portal</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  activeSection === section.id
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="mr-1.5">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {activeSection === 'overview' && <OverviewSection />}
        {activeSection === 'colors' && <ColorsSection />}
        {activeSection === 'typography' && <TypographySection />}
        {activeSection === 'components' && <ComponentsSection />}
        {activeSection === 'patterns' && <PatternsSection />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50/50 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-500">
          <p>Akount Design System v1.0 · Last updated February 2026</p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// OVERVIEW SECTION
// ============================================================================

function OverviewSection() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-6">
          <span>✨</span>
          <span>AI-Powered Financial Command Center</span>
        </div>
        <h1 className="font-heading text-5xl font-bold text-slate-900 mb-6">
          Bloomberg Terminal × Notion × Apple
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed">
          Akount's design language combines the data density of professional trading terminals,
          the clarity of modern productivity tools, and the calm sophistication of premium consumer products.
        </p>
      </section>

      {/* Brand Feelings */}
      <section>
        <h2 className="font-heading text-2xl font-bold text-slate-900 mb-8 text-center">
          Brand Personality
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { emoji: '🧠', label: 'Intelligent', desc: 'AI-driven insights without gimmicks' },
            { emoji: '🧾', label: 'Trustworthy', desc: 'Precision in every number' },
            { emoji: '🌍', label: 'Global', desc: 'Multi-currency, multi-jurisdiction' },
            { emoji: '🧘', label: 'Calm', desc: 'Complexity without stress' },
          ].map((item) => (
            <div
              key={item.label}
              className="p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-200/60 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
            >
              <div className="text-4xl mb-4">{item.emoji}</div>
              <h3 className="font-semibold text-slate-900 mb-1">{item.label}</h3>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Visual Direction */}
      <section className="grid md:grid-cols-2 gap-8">
        <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <h3 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">🎭</span>
            Skeuomorphism
          </h3>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-orange-400">▸</span>
              Physical depth and layering
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">▸</span>
              Realistic shadows that suggest affordance
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">▸</span>
              Tactile feedback on interactions
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">▸</span>
              Material surfaces that feel substantial
            </li>
          </ul>
        </div>
        <div className="p-8 rounded-2xl bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl border border-white/50 shadow-xl">
          <h3 className="font-heading text-xl font-bold mb-4 flex items-center gap-2 text-slate-900">
            <span className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">💎</span>
            Glassmorphism
          </h3>
          <ul className="space-y-3 text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-violet-500">▸</span>
              Frosted glass backgrounds
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-500">▸</span>
              Layered transparency
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-500">▸</span>
              Sophisticated light gradients
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-500">▸</span>
              Minimal borders, let blur do the work
            </li>
          </ul>
        </div>
      </section>

      {/* Core Principles */}
      <section>
        <h2 className="font-heading text-2xl font-bold text-slate-900 mb-8 text-center">
          Core Design Principles
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              num: '01',
              title: 'Clarity Over Decoration',
              desc: 'Data must be easier to read than to admire. Visual clarity impacts trust.',
            },
            {
              num: '02',
              title: 'Calm Complexity',
              desc: 'Advanced systems, zero visual stress. Complexity hidden behind simple controls.',
            },
            {
              num: '03',
              title: 'AI = Advisor',
              desc: 'Suggestions include confidence levels and reasoning, not just recommendations.',
            },
            {
              num: '04',
              title: 'Global-First',
              desc: 'Currency, tax, entity context always visible. Multi-jurisdiction by default.',
            },
            {
              num: '05',
              title: 'Trust-First UI',
              desc: 'Stable layouts, predictable patterns. Financial users value reliability.',
            },
            {
              num: '06',
              title: 'Assurance over Delight',
              desc: 'Optimize for confidence, not novelty. Professional aesthetic, minimal flourishes.',
            },
          ].map((principle) => (
            <div
              key={principle.num}
              className="p-6 rounded-xl border border-slate-200 hover:border-orange-300 transition-colors"
            >
              <span className="text-5xl font-heading font-bold text-slate-200">
                {principle.num}
              </span>
              <h3 className="font-semibold text-slate-900 mt-2 mb-2">{principle.title}</h3>
              <p className="text-sm text-slate-500">{principle.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// COLORS SECTION
// ============================================================================

function ColorsSection() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedColor(value);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const brandColors = [
    { name: 'Primary', hex: '#f97316', hsl: '24 94% 53%', desc: 'CTAs, brand identity' },
    { name: 'Secondary', hex: '#8b5cf6', hsl: '252 94% 67%', desc: 'AI, intelligence' },
  ];

  const financialColors = [
    { name: 'Income', hex: '#10b981', token: '--ak-finance-income', desc: 'Money in, positive' },
    { name: 'Expense', hex: '#ef4444', token: '--ak-finance-expense', desc: 'Money out, negative' },
    { name: 'Transfer', hex: '#3b82f6', token: '--ak-finance-transfer', desc: 'Internal movement' },
    { name: 'Liability', hex: '#f59e0b', token: '--ak-finance-liability', desc: 'Debt, obligations' },
    { name: 'Equity', hex: '#14b8a6', token: '--ak-finance-equity', desc: 'Assets, ownership' },
  ];

  const neutralScale = [
    { shade: '50', hex: '#f8fafc' },
    { shade: '100', hex: '#f1f5f9' },
    { shade: '200', hex: '#e2e8f0' },
    { shade: '300', hex: '#cbd5e1' },
    { shade: '400', hex: '#94a3b8' },
    { shade: '500', hex: '#64748b' },
    { shade: '600', hex: '#475569' },
    { shade: '700', hex: '#334155' },
    { shade: '800', hex: '#1e293b' },
    { shade: '900', hex: '#0f172a' },
  ];

  return (
    <div className="space-y-16">
      <section className="text-center max-w-2xl mx-auto">
        <h1 className="font-heading text-4xl font-bold text-slate-900 mb-4">Color System</h1>
        <p className="text-lg text-slate-600">
          Every color in Akount has semantic purpose. Financial data communicates meaning through color.
        </p>
      </section>

      {/* Brand Colors */}
      <section>
        <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">Brand Colors</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {brandColors.map((color) => (
            <div
              key={color.name}
              className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div
                className="h-32 flex items-end p-4"
                style={{ backgroundColor: color.hex }}
              >
                <span className="text-white font-bold text-2xl drop-shadow">{color.name}</span>
              </div>
              <div className="p-4 bg-white">
                <p className="text-sm text-slate-500 mb-3">{color.desc}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(color.hex)}
                    className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-sm font-mono transition-colors"
                  >
                    {copiedColor === color.hex ? '✓ Copied' : color.hex}
                  </button>
                  <button
                    onClick={() => copyToClipboard(color.hsl)}
                    className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-sm font-mono transition-colors"
                  >
                    {copiedColor === color.hsl ? '✓ Copied' : `hsl(${color.hsl})`}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Financial Semantic Colors */}
      <section>
        <h2 className="font-heading text-2xl font-bold text-slate-900 mb-2">Financial Semantic Colors</h2>
        <p className="text-slate-500 mb-6">Users recognize financial state without reading.</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {financialColors.map((color) => (
            <div
              key={color.name}
              className="rounded-xl overflow-hidden border border-slate-200"
            >
              <div
                className="h-24 flex items-center justify-center"
                style={{ backgroundColor: color.hex }}
              >
                <span className="text-white font-bold text-lg drop-shadow">{color.name}</span>
              </div>
              <div className="p-3 bg-white">
                <p className="text-xs text-slate-500 mb-2">{color.desc}</p>
                <button
                  onClick={() => copyToClipboard(color.hex)}
                  className="text-xs font-mono text-slate-600 hover:text-orange-600 transition-colors"
                >
                  {copiedColor === color.hex ? '✓' : color.hex}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Neutral Scale */}
      <section>
        <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">Neutral Scale (Slate)</h2>
        <div className="rounded-2xl overflow-hidden border border-slate-200">
          <div className="flex">
            {neutralScale.map((color) => (
              <button
                key={color.shade}
                onClick={() => copyToClipboard(color.hex)}
                className="flex-1 h-20 transition-transform hover:scale-110 hover:z-10 relative group"
                style={{ backgroundColor: color.hex }}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span
                    className={`text-xs font-mono px-2 py-1 rounded ${
                      parseInt(color.shade) > 400 ? 'bg-white/90 text-slate-900' : 'bg-slate-900/90 text-white'
                    }`}
                  >
                    {copiedColor === color.hex ? '✓' : color.hex}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="flex bg-white border-t border-slate-200">
            {neutralScale.map((color) => (
              <div key={color.shade} className="flex-1 p-2 text-center">
                <span className="text-xs font-mono text-slate-500">{color.shade}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Glass & Shadow */}
      <section>
        <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">Glass & Shadow Effects</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-white/50 backdrop-blur-sm border border-slate-200/60 shadow-sm">
            <h3 className="font-semibold mb-2">Light Glass</h3>
            <code className="text-xs text-slate-500">bg-white/50 backdrop-blur-sm</code>
          </div>
          <div className="p-6 rounded-xl bg-white/70 backdrop-blur-md border border-slate-200/40 shadow-md">
            <h3 className="font-semibold mb-2">Medium Glass</h3>
            <code className="text-xs text-slate-500">bg-white/70 backdrop-blur-md</code>
          </div>
          <div className="p-6 rounded-xl bg-white/90 backdrop-blur-xl border border-white/50 shadow-lg">
            <h3 className="font-semibold mb-2">Strong Glass</h3>
            <code className="text-xs text-slate-500">bg-white/90 backdrop-blur-xl</code>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// TYPOGRAPHY SECTION
// ============================================================================

function TypographySection() {
  return (
    <div className="space-y-16">
      <section className="text-center max-w-2xl mx-auto">
        <h1 className="font-heading text-4xl font-bold text-slate-900 mb-4">Typography</h1>
        <p className="text-lg text-slate-600">
          Three font families, each with a specific purpose. Authority, clarity, and precision.
        </p>
      </section>

      {/* Font Families */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="p-8 rounded-2xl border border-slate-200 bg-white">
          <div className="text-6xl font-heading font-bold text-slate-900 mb-4">Aa</div>
          <h3 className="font-heading text-xl font-bold mb-2">Newsreader</h3>
          <p className="text-sm text-slate-500 mb-4">Display & Headings</p>
          <div className="space-y-2 text-slate-600">
            <p className="font-heading text-2xl">Authority</p>
            <p className="font-heading text-xl">Seriousness</p>
            <p className="font-heading text-lg">Editorial weight</p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">Used for: H1, H2, H3, page titles</p>
          </div>
        </div>

        <div className="p-8 rounded-2xl border border-slate-200 bg-white">
          <div className="text-6xl font-sans font-bold text-slate-900 mb-4">Aa</div>
          <h3 className="font-semibold text-xl mb-2">Manrope</h3>
          <p className="text-sm text-slate-500 mb-4">Body & UI Text</p>
          <div className="space-y-2 text-slate-600">
            <p className="text-lg">Clean readability</p>
            <p className="text-base">Modern clarity</p>
            <p className="text-sm">Professional feel</p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">Used for: Body, labels, buttons, UI</p>
          </div>
        </div>

        <div className="p-8 rounded-2xl border border-slate-200 bg-white">
          <div className="text-6xl font-mono font-bold text-slate-900 mb-4">01</div>
          <h3 className="font-mono text-xl font-bold mb-2">JetBrains Mono</h3>
          <p className="text-sm text-slate-500 mb-4">Numbers & Data</p>
          <div className="space-y-2 font-mono text-slate-600">
            <p className="text-lg">$1,234.56</p>
            <p className="text-base tabular-nums">INV-00234</p>
            <p className="text-sm">87% confidence</p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">Used for: All monetary values, codes</p>
          </div>
        </div>
      </section>

      {/* Type Scale */}
      <section>
        <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">Type Scale</h2>
        <div className="space-y-6 p-8 rounded-2xl border border-slate-200 bg-white">
          {[
            { level: 'H1', size: '48px', font: 'Newsreader', weight: 'Bold', sample: 'Dashboard Overview' },
            { level: 'H2', size: '36px', font: 'Newsreader', weight: 'Bold', sample: 'Cash Position' },
            { level: 'H3', size: '28px', font: 'Newsreader', weight: 'Bold', sample: 'Recent Transactions' },
            { level: 'H4', size: '24px', font: 'Newsreader', weight: 'Semibold', sample: 'Account Summary' },
            { level: 'H5', size: '20px', font: 'Newsreader', weight: 'Semibold', sample: 'Card Title' },
            { level: 'Body', size: '16px', font: 'Manrope', weight: 'Regular', sample: 'Standard body text for descriptions and content.' },
            { level: 'Small', size: '14px', font: 'Manrope', weight: 'Regular', sample: 'Secondary text and form hints' },
            { level: 'Code', size: '14px', font: 'Mono', weight: 'Regular', sample: '$1,234.56 CAD' },
          ].map((item) => (
            <div key={item.level} className="flex items-baseline gap-6 pb-4 border-b border-slate-100 last:border-0">
              <div className="w-16 shrink-0">
                <span className="text-xs font-mono text-slate-400">{item.level}</span>
              </div>
              <div className="w-20 shrink-0">
                <span className="text-xs text-slate-400">{item.size}</span>
              </div>
              <div
                className={`flex-1 ${
                  item.font === 'Newsreader'
                    ? 'font-heading'
                    : item.font === 'Mono'
                    ? 'font-mono'
                    : 'font-sans'
                } ${item.weight === 'Bold' ? 'font-bold' : item.weight === 'Semibold' ? 'font-semibold' : ''}`}
                style={{ fontSize: item.size }}
              >
                {item.sample}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Money Rule */}
      <section className="p-8 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200">
        <h2 className="font-heading text-2xl font-bold text-slate-900 mb-4">
          ⚠️ Critical Rule: Money = Monospace
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-emerald-700 mb-2">✓ Correct</h3>
            <div className="p-4 rounded-lg bg-white border border-emerald-200">
              <span className="font-mono text-2xl tabular-nums">$1,234.56</span>
              <p className="text-xs text-slate-500 mt-2">JetBrains Mono, tabular-nums</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-red-700 mb-2">✗ Wrong</h3>
            <div className="p-4 rounded-lg bg-white border border-red-200">
              <span className="font-sans text-2xl">$1,234.56</span>
              <p className="text-xs text-slate-500 mt-2">Sans-serif (Manrope)</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Fixed-width fonts align digits vertically for easy scanning and signal technical precision.
        </p>
      </section>
    </div>
  );
}

// ============================================================================
// COMPONENTS SECTION
// ============================================================================

function ComponentsSection() {
  const [selectedVariant, setSelectedVariant] = useState('primary');
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [checkboxChecked, setCheckboxChecked] = useState(false);

  return (
    <div className="space-y-16">
      <section className="text-center max-w-2xl mx-auto">
        <h1 className="font-heading text-4xl font-bold text-slate-900 mb-4">Components</h1>
        <p className="text-lg text-slate-600">
          Interactive building blocks that combine to create the Akount experience.
        </p>
      </section>

      {/* Buttons */}
      <section>
        <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">Buttons</h2>
        <div className="p-8 rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-wrap gap-4 mb-8">
            <button className="px-4 py-2 rounded-[10px] bg-orange-500 text-white font-semibold shadow-sm hover:bg-orange-600 active:scale-[0.98] transition-all">
              Primary
            </button>
            <button className="px-4 py-2 rounded-[10px] bg-violet-100 text-violet-700 font-semibold hover:bg-violet-200 active:scale-[0.98] transition-all">
              Secondary
            </button>
            <button className="px-4 py-2 rounded-[10px] border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 active:scale-[0.98] transition-all">
              Ghost
            </button>
            <button className="px-4 py-2 rounded-[10px] bg-red-500 text-white font-semibold shadow-sm hover:bg-red-600 active:scale-[0.98] transition-all">
              Danger
            </button>
            <button className="px-4 py-2 rounded-[10px] bg-orange-500 text-white font-semibold opacity-50 cursor-not-allowed">
              Disabled
            </button>
            <button className="px-4 py-2 rounded-[10px] bg-orange-500 text-white font-semibold flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading
            </button>
          </div>
          <div className="flex gap-4">
            <button className="h-8 px-3 rounded-lg bg-orange-500 text-white text-sm font-semibold">Small</button>
            <button className="h-10 px-4 rounded-[10px] bg-orange-500 text-white text-base font-semibold">Medium</button>
            <button className="h-12 px-5 rounded-[10px] bg-orange-500 text-white text-lg font-semibold">Large</button>
          </div>
        </div>
      </section>

      {/* Inputs */}
      <section>
        <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">Inputs</h2>
        <div className="p-8 rounded-2xl border border-slate-200 bg-white">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Default Input</label>
              <input
                type="text"
                placeholder="Enter text..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full h-10 px-3 rounded-[10px] border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">With Error</label>
              <input
                type="text"
                placeholder="Invalid input"
                className="w-full h-10 px-3 rounded-[10px] border border-red-500 focus:ring-2 focus:ring-red-500/30 outline-none"
              />
              <p className="text-sm text-red-500">! This field is required</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Amount Input</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">CAD</span>
                <input
                  type="text"
                  placeholder="0.00"
                  className="w-full h-10 pl-12 pr-3 rounded-[10px] border border-slate-300 font-mono text-right focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Disabled</label>
              <input
                type="text"
                placeholder="Cannot edit"
                disabled
                className="w-full h-10 px-3 rounded-[10px] border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">Badges</h2>
        <div className="p-8 rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              ✓ Reconciled
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-sm font-medium bg-violet-50 text-violet-700 border border-violet-200">
              ✨ AI Categorized
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
              ⚠ Review Needed
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-600 border border-slate-200">
              🔒 Locked
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200">
              ✕ Error
            </span>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">Cards</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-5 rounded-[14px] bg-white/70 backdrop-blur-sm border border-slate-200/60 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-2">Default Card</h3>
            <p className="text-sm text-slate-500">Light glass effect with subtle shadow.</p>
          </div>
          <div className="p-5 rounded-[14px] bg-white/80 backdrop-blur-md border border-slate-200/40 shadow-lg">
            <h3 className="font-semibold text-slate-900 mb-2">Elevated Card</h3>
            <p className="text-sm text-slate-500">More prominent with larger shadow.</p>
          </div>
          <div className="p-5 rounded-[14px] bg-white/50 backdrop-blur-xl border border-white/30 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer">
            <h3 className="font-semibold text-slate-900 mb-2">Interactive Card</h3>
            <p className="text-sm text-slate-500">Hover me for effect!</p>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section>
        <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">KPI Cards</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-5 rounded-[14px] bg-white/70 backdrop-blur-sm border border-slate-200/60 shadow-sm">
            <h3 className="font-heading text-lg font-semibold text-slate-600 mb-3">Revenue</h3>
            <div className="font-mono text-3xl font-bold text-slate-900 tabular-nums">
              $45,200 <span className="text-lg font-normal text-slate-500">CAD</span>
            </div>
            <div className="flex items-center gap-2 mt-3 text-emerald-600">
              <span className="font-mono text-sm tabular-nums">↑ +$5,200 (+13%)</span>
              <span className="text-xs text-slate-500">vs. last month</span>
            </div>
          </div>
          <div className="p-5 rounded-[14px] bg-white/70 backdrop-blur-sm border border-slate-200/60 shadow-sm">
            <h3 className="font-heading text-lg font-semibold text-slate-600 mb-3">Expenses</h3>
            <div className="font-mono text-3xl font-bold text-slate-900 tabular-nums">
              $12,800 <span className="text-lg font-normal text-slate-500">CAD</span>
            </div>
            <div className="flex items-center gap-2 mt-3 text-red-500">
              <span className="font-mono text-sm tabular-nums">↑ +$2,100 (+19%)</span>
              <span className="text-xs text-slate-500">vs. last month</span>
            </div>
          </div>
          <div className="p-5 rounded-[14px] bg-white/70 backdrop-blur-sm border border-slate-200/60 shadow-sm">
            <h3 className="font-heading text-lg font-semibold text-slate-600 mb-3">Net Cash</h3>
            <div className="font-mono text-3xl font-bold text-emerald-600 tabular-nums">
              +$32,400 <span className="text-lg font-normal text-slate-500">CAD</span>
            </div>
            <div className="flex items-center gap-2 mt-3 text-emerald-600">
              <span className="font-mono text-sm tabular-nums">↑ +$3,100 (+11%)</span>
              <span className="text-xs text-slate-500">vs. last month</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI Components */}
      <section>
        <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">AI Components</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Insight Card */}
          <div className="rounded-[10px] border border-l-4 border-violet-200/50 border-l-violet-500 bg-violet-50/30 p-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-lg">
                💡
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-violet-600 text-sm">✨</span>
                  <h4 className="font-semibold text-slate-900">Tax Optimization</h4>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  You may deduct $48,000 for home office expenses.
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  <span>🇨🇦 Canadian Corp</span>
                  <span>Impact: +$12,500</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full w-[87%] bg-emerald-500 rounded-full" />
                  </div>
                  <span className="font-mono text-xs text-emerald-600">87%</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="px-3 py-1.5 text-sm font-medium rounded-md text-violet-700 hover:bg-violet-100">
                    Review
                  </button>
                  <button className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100">
                    Ignore
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Suggestion Chip */}
          <div className="space-y-4">
            <div className="rounded-lg border bg-violet-50/50 border-violet-200 p-3">
              <div className="flex items-start gap-2">
                <span className="text-violet-500">✨</span>
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="text-slate-500">AI Suggests: </span>
                    <span className="font-medium text-violet-700">Cloud Services</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1.5 w-12 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full w-[87%] bg-emerald-500 rounded-full" />
                    </div>
                    <span className="font-mono text-xs text-emerald-600">87%</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="px-2.5 py-1 text-xs font-semibold rounded-md bg-violet-600 text-white hover:bg-violet-700">
                      Apply
                    </button>
                    <button className="px-2.5 py-1 text-xs font-medium rounded-md text-slate-600 hover:bg-slate-200/50">
                      Ignore
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Confidence Badges */}
            <div className="p-4 rounded-lg border border-slate-200 bg-white">
              <h4 className="font-semibold text-slate-900 mb-3">Confidence Levels</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-20 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full w-[87%] bg-emerald-500 rounded-full" />
                  </div>
                  <span className="font-mono text-sm text-emerald-600">87%</span>
                  <span className="text-xs text-slate-500">High confidence</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-20 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full w-[65%] bg-amber-500 rounded-full" />
                  </div>
                  <span className="font-mono text-sm text-amber-600">65%</span>
                  <span className="text-xs text-slate-500">Medium confidence</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-20 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full w-[42%] bg-red-500 rounded-full" />
                  </div>
                  <span className="font-mono text-sm text-red-500">42%</span>
                  <span className="text-xs text-slate-500">Low confidence</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toast & Alerts */}
      <section>
        <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">Feedback</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 rounded-[10px] bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <span className="text-emerald-600">✓</span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Transaction saved</p>
                <p className="text-sm text-slate-600">Your changes have been saved.</p>
              </div>
            </div>
            <div className="p-4 rounded-[10px] bg-red-50 border border-red-200 flex items-start gap-3">
              <span className="text-red-600">✕</span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Failed to save</p>
                <p className="text-sm text-slate-600">Please try again later.</p>
              </div>
            </div>
            <div className="p-4 rounded-[10px] bg-amber-50 border border-amber-200 flex items-start gap-3">
              <span className="text-amber-600">⚠</span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Review required</p>
                <p className="text-sm text-slate-600">This entry needs approval.</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-[10px] bg-blue-50 border border-blue-200 flex items-start gap-3">
            <span className="text-blue-600">ℹ</span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Did you know?</p>
              <p className="text-sm text-slate-600">
                You can use keyboard shortcuts for faster navigation. Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-xs font-mono">⌘K</kbd> to open search.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// PATTERNS SECTION
// ============================================================================

function PatternsSection() {
  return (
    <div className="space-y-16">
      <section className="text-center max-w-2xl mx-auto">
        <h1 className="font-heading text-4xl font-bold text-slate-900 mb-4">Patterns</h1>
        <p className="text-lg text-slate-600">
          Composite UI patterns that combine components into complete experiences.
        </p>
      </section>

      {/* Transaction Table */}
      <section>
        <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">Transaction Table</h2>
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
          {/* Header */}
          <div className="grid grid-cols-[40px_100px_1fr_80px_140px_120px_60px] items-center px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div></div>
            <div>Date</div>
            <div>Description</div>
            <div>Entity</div>
            <div>Category</div>
            <div className="text-right">Amount</div>
            <div className="text-center">Status</div>
          </div>
          {/* Rows */}
          {[
            { date: '2025-12-15', desc: 'Amazon AWS', entity: '🇨🇦', cat: 'Cloud Services', amount: -120000, status: 'reconciled', ai: true },
            { date: '2025-12-14', desc: 'Stripe fees', entity: '🇺🇸', cat: 'Processing Fees', amount: -4500, status: 'reconciled', ai: false },
            { date: '2025-12-13', desc: 'Client payment', entity: '🇨🇦', cat: 'Revenue', amount: 500000, status: 'pending', ai: false },
            { date: '2025-12-12', desc: 'Office supplies', entity: '🇨🇦', cat: 'Uncategorized', amount: -8900, status: 'review', ai: true },
          ].map((tx, i) => (
            <div
              key={i}
              className="grid grid-cols-[40px_100px_1fr_80px_140px_120px_60px] items-center px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <div>
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-orange-500" />
              </div>
              <div className="text-sm text-slate-600">{tx.date}</div>
              <div className="text-sm font-medium text-slate-900">{tx.desc}</div>
              <div className="text-sm">{tx.entity}</div>
              <div className="text-sm flex items-center gap-1">
                {tx.ai && <span className="text-violet-500">✨</span>}
                <span className={tx.cat === 'Uncategorized' ? 'text-slate-400' : 'text-slate-700'}>{tx.cat}</span>
              </div>
              <div className={`font-mono text-sm text-right tabular-nums ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {tx.amount >= 0 ? '' : '−'}${Math.abs(tx.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-center">
                {tx.status === 'reconciled' && <span className="text-emerald-600">✓</span>}
                {tx.status === 'pending' && <span className="text-slate-400">○</span>}
                {tx.status === 'review' && <span className="text-amber-500">⚠</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Journal Entry */}
      <section>
        <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">Journal Entry Preview</h2>
        <div className="rounded-[14px] border border-slate-200 bg-white overflow-hidden max-w-2xl">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="font-heading font-semibold text-slate-900 mb-3">Journal Entry Preview</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Entity:</span>
                <span className="ml-2 font-medium">🇨🇦 Canadian Corp</span>
              </div>
              <div>
                <span className="text-slate-500">Period:</span>
                <span className="ml-2 font-medium">Q4 2025</span>
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-emerald-100 text-emerald-700">Open</span>
              </div>
              <div>
                <span className="text-slate-500">Date:</span>
                <span className="ml-2 font-medium">2025-12-31</span>
              </div>
            </div>
          </div>
          <div className="px-5 py-4">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="text-left pb-2">Account</th>
                  <th className="text-right pb-2 w-28">Debit</th>
                  <th className="text-right pb-2 w-28">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2">
                    <span className="font-mono text-xs text-slate-500 mr-2">5100</span>
                    <span className="text-sm">Cloud Services</span>
                  </td>
                  <td className="py-2 text-right font-mono text-sm tabular-nums">$1,200.00</td>
                  <td className="py-2"></td>
                </tr>
                <tr>
                  <td className="py-2">
                    <span className="font-mono text-xs text-slate-500 mr-2">1000</span>
                    <span className="text-sm">Chase Checking</span>
                  </td>
                  <td className="py-2"></td>
                  <td className="py-2 text-right font-mono text-sm tabular-nums">$1,200.00</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200">
                  <td className="pt-3 font-semibold">Total</td>
                  <td className="pt-3 text-right font-mono text-sm font-semibold tabular-nums">$1,200.00</td>
                  <td className="pt-3 text-right font-mono text-sm font-semibold tabular-nums">$1,200.00</td>
                </tr>
              </tfoot>
            </table>
            <div className="mt-4 p-3 rounded-lg bg-emerald-50 flex items-center gap-2">
              <span className="text-lg text-emerald-600">✓</span>
              <span className="text-sm font-medium text-emerald-700">Balanced</span>
            </div>
          </div>
          <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-3">
            <button className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-200/50">
              Cancel
            </button>
            <button className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100">
              Save Draft
            </button>
            <button className="px-4 py-2 text-sm font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600">
              Post to GL
            </button>
          </div>
        </div>
      </section>

      {/* Entity Badge */}
      <section>
        <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">Entity Badges</h2>
        <div className="flex flex-wrap gap-3 p-6 rounded-2xl border border-slate-200 bg-white">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 text-sm font-medium">
            🇨🇦 Canadian Corp
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 text-sm font-medium text-blue-700">
            🇺🇸 US LLC
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-50 text-sm font-medium text-purple-700">
            🇬🇧 UK Ltd
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 text-sm font-medium text-amber-700">
            🇮🇳 India Pvt
          </span>
        </div>
      </section>

      {/* Budget Progress */}
      <section>
        <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">Budget Progress</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'Marketing', budget: 500000, spent: 320000, period: 'Q4 2025' },
            { name: 'Cloud Infrastructure', budget: 200000, spent: 180000, period: 'Q4 2025' },
            { name: 'Travel', budget: 100000, spent: 110000, period: 'Q4 2025' },
          ].map((b) => {
            const pct = Math.round((b.spent / b.budget) * 100);
            const color = pct > 100 ? 'bg-red-500' : pct > 90 ? 'bg-amber-500' : 'bg-emerald-500';
            return (
              <div key={b.name} className="p-4 rounded-[14px] bg-white border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">{b.name}</h3>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{b.period}</span>
                </div>
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Budget:</span>
                    <span className="font-mono tabular-nums">${(b.budget / 100).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Spent:</span>
                    <span className={`font-mono tabular-nums ${pct > 100 ? 'text-red-600' : ''}`}>
                      ${(b.spent / 100).toLocaleString()} ({pct}%)
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                {pct > 100 && (
                  <p className="mt-2 text-xs text-red-600">Over budget by ${((b.spent - b.budget) / 100).toLocaleString()}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
