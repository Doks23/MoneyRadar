import React, { useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getMonthName, getCategoryColor, formatCurrency, formatNumberAbbreviated } from '../utils/helpers';
import { MonthlyExpense } from '../types';

interface MonthlyExpenseChartProps {
  data: MonthlyExpense[];
  currency: string;
  activeCategories: string[];
  onCategoryToggle: (category: string) => void;
  groupSmallSlices: boolean;
  smallCategorySet: Set<string>;
}

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    const monthName = label;
    const sortedPayload = [...payload].sort((a, b) => b.value - a.value);
    const totalValue = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);

    return (
      <div className="bg-white p-3 rounded-xl shadow-premium border border-surface-200 min-w-[200px]">
        <div className="flex justify-between items-baseline font-bold text-base mb-2 border-b border-surface-100 pb-2 text-surface-800">
            <span>{monthName}</span>
            <span className="text-sm font-mono">{formatCurrency(totalValue, currency, 0)}</span>
        </div>
        <ul className="space-y-1">
          {sortedPayload.map((p, index) => {
            if (p.value === 0) return null;
            return (
              <li key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: p.color }}></div>
                  <span className="text-surface-500">{p.name}:</span>
                </div>
                <span className="font-mono ml-4 font-semibold text-surface-700">{formatCurrency(p.value, currency, 0)}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
  return null;
};

const CustomBar = (props: any) => {
  const { x, y, width, height, fill } = props;
  if (width <= 0 || height <= 0) return null;
  return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} ry={4} stroke="#fff" strokeWidth={2} />;
};

export const MonthlyExpenseChart: React.FC<MonthlyExpenseChartProps> = ({ data, currency, activeCategories, onCategoryToggle, groupSmallSlices, smallCategorySet }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
    
  const { chartData, allCategories, averageExpense, yAxisTicks } = useMemo(() => {
    const categoryTotals = new Map<string, number>();
    let totalExpenseOverPeriod = 0;
    data.forEach(monthData => {
        monthData.expenses.forEach(expense => {
            const currentTotal = categoryTotals.get(expense.category) || 0;
            categoryTotals.set(expense.category, currentTotal + expense.amount);
            totalExpenseOverPeriod += expense.amount;
        });
    });
    const transformed = data.map(monthData => {
        const monthObject: { [key: string]: string | number } = { month: monthData.month, name: getMonthName(monthData.month) };
        let othersAmount = 0;
        monthData.expenses.forEach(expense => {
            if (groupSmallSlices && smallCategorySet.has(expense.category)) othersAmount += expense.amount;
            else monthObject[expense.category] = (monthObject[expense.category] as number || 0) + expense.amount;
        });
        if (othersAmount > 0) monthObject['Others'] = othersAmount;
        return monthObject;
    }).sort((a, b) => (a.month as string).localeCompare(b.month as string));

    let categoriesForLegend = Array.from(categoryTotals.keys());
    if (groupSmallSlices) categoriesForLegend = categoriesForLegend.filter(cat => !smallCategorySet.has(cat));
    categoriesForLegend.sort((a, b) => (categoryTotals.get(b) || 0) - (categoryTotals.get(a) || 0));
    if (groupSmallSlices && transformed.some(d => d['Others'])) categoriesForLegend.push('Others');

    const avg = data.length > 0 ? totalExpenseOverPeriod / data.length : 0;
    const maxMonthlyTotal = Math.max(0, ...transformed.map(monthData => 
        Object.entries(monthData).reduce((total, [key, value]) => 
            key !== 'month' && key !== 'name' && typeof value === 'number' ? total + value : total, 0)
    ));
    const ticks = [];
    const tickIncrement = 50000;
    const topTick = Math.ceil(maxMonthlyTotal / tickIncrement) * tickIncrement;
    for (let i = 0; i <= topTick; i += tickIncrement) ticks.push(i);
    if (ticks.length === 1 && ticks[0] === 0 && maxMonthlyTotal > 0) ticks.push(tickIncrement);
    return { chartData: transformed, allCategories: categoriesForLegend, averageExpense: avg, yAxisTicks: ticks };
  }, [data, groupSmallSlices, smallCategorySet]);

  const renderLegend = (props: { payload?: {dataKey: string, color: string, value: string}[] }) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {payload?.map((entry, index) => {
          const isActive = activeCategories.includes(entry.dataKey as string);
          const isOthers = entry.dataKey === 'Others';
          return (
            <div key={`item-${index}`}
              onClick={() => !isOthers && onCategoryToggle(entry.dataKey as string)}
              className={`flex items-center transition-opacity ${isOthers ? 'cursor-default' : 'cursor-pointer'} ${isActive || isOthers ? 'opacity-100' : 'opacity-40 hover:opacity-80'}`}>
              <div style={{ width: 10, height: 10, backgroundColor: entry.color, marginRight: 6, borderRadius: '2px' }}></div>
              <span className="text-sm text-surface-600">{entry.value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-card border border-surface-200 text-center h-full flex flex-col justify-center">
        <h2 className="text-lg font-display font-bold text-surface-900 mb-3">Monthly Expenses by Category</h2>
        <p className="text-surface-400 text-sm">No monthly expense data to display.</p>
      </div>
    );
  }

  return (
    <div ref={chartContainerRef} className="bg-white p-6 rounded-2xl shadow-card border border-surface-200 min-h-[450px]">
      <h2 className="text-lg font-display font-bold text-surface-900 mb-6">Monthly Expenses by Category</h2>
      <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716c' }} />
          <YAxis ticks={yAxisTicks} tickFormatter={(tick) => formatNumberAbbreviated(tick as number)} tick={{ fontSize: 11, fill: '#78716c' }} />
          <Tooltip cursor={{ fill: 'rgba(231, 229, 228, 0.5)' }} content={<CustomTooltip currency={currency} />} />
          <Legend verticalAlign="bottom" content={renderLegend} />
          {averageExpense > 0 && 
              <ReferenceLine y={averageExpense} label={{ value: `Avg: ${formatNumberAbbreviated(averageExpense)}`, position: 'insideTopLeft', fill: '#e11d48', fontSize: 10 }} stroke="#e11d48" strokeDasharray="3 3" />
          }
          {allCategories.map((category) => (
              <Bar key={category} dataKey={category} stackId="a"
                  fill={category === 'Others' ? '#a8a29e' : getCategoryColor(category)}
                  hide={!activeCategories.includes(category) && category !== 'Others'}
                  shape={<CustomBar />} />
          ))}
          </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
