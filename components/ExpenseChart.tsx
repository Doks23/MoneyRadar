import React, { useMemo, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getCategoryColor, formatCurrency } from '../utils/helpers';
import { ExpenseByCategory, MonthlyExpense } from '../types';

interface ExpenseChartProps {
  data: ExpenseByCategory[];
  monthlyData: MonthlyExpense[];
  currency: string;
  activeCategories: string[];
  onCategoryToggle: (category: string) => void;
  groupSmallSlices: boolean;
  smallCategorySet: Set<string>;
  selectedMonth: string;
}

const MIN_PERCENT_FOR_LABEL = 0.03;

const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, name, fill } = props;
    if (percent < MIN_PERCENT_FOR_LABEL || !name) return null;

    const RADIAN = Math.PI / 180;
    const radiusInner = innerRadius + (outerRadius - innerRadius) * 0.5;
    const xInner = cx + radiusInner * Math.cos(-midAngle * RADIAN);
    const yInner = cy + radiusInner * Math.sin(-midAngle * RADIAN);
    const sin = Math.sin(-midAngle * RADIAN);
    const cos = Math.cos(-midAngle * RADIAN);
    const sx = cx + (outerRadius + 4) * cos;
    const sy = cy + (outerRadius + 4) * sin;
    const mx = cx + (outerRadius + 20) * cos;
    const my = cy + (outerRadius + 20) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g style={{ pointerEvents: 'none' }}>
            <text x={xInner} y={yInner} fill="white" textAnchor="middle" dominantBaseline="central" className="font-bold text-sm">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={3} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} textAnchor={textAnchor} fill="#44403c" dominantBaseline="central" className="text-xs font-semibold">
                {name}
            </text>
        </g>
    );
};

const CustomTooltip = ({ active, payload, currency, numMonths }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const { name, value } = data;
    const percent = payload[0].percent;
    const average = numMonths > 0 ? value / numMonths : 0;

    return (
      <div className="bg-white p-3 border border-surface-200 rounded-xl shadow-premium text-sm">
        <p className="font-bold text-surface-800 mb-1">{name}</p>
        <p className="text-surface-600">
          <span className="font-semibold">{formatCurrency(value, currency)}</span>
          {typeof percent === 'number' && !isNaN(percent) && (
            <span className="text-xs ml-1">({(percent * 100).toFixed(1)}%)</span>
          )}
        </p>
        {numMonths > 1 && name !== 'Others' && (
          <p className="text-surface-400 text-xs mt-1">Avg: {formatCurrency(average, currency, 0)}/month</p>
        )}
      </div>
    );
  }
  return null;
};

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ data, monthlyData, currency, activeCategories, onCategoryToggle, groupSmallSlices, smallCategorySet, selectedMonth }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const chartData = useMemo(() => {
    let sourceData: ExpenseByCategory[];
    if (selectedMonth === 'all') {
      sourceData = data;
    } else {
      const month = monthlyData.find(m => m.month === selectedMonth);
      sourceData = month ? month.expenses : [];
    }
    
    const sortedData = sourceData
      .filter(item => item.amount > 0)
      .map(item => ({ name: item.category, value: item.amount }))
      .sort((a, b) => b.value - a.value);

    if (!groupSmallSlices) return sortedData;

    const mainSlices: { name: string; value: number }[] = [];
    let othersValue = 0;
    for (const item of sortedData) {
        if (smallCategorySet.has(item.name)) othersValue += item.value;
        else mainSlices.push(item);
    }
    if (othersValue > 0) mainSlices.push({ name: 'Others', value: othersValue });
    return mainSlices;
  }, [data, monthlyData, selectedMonth, groupSmallSlices, smallCategorySet]);
  
  const numMonths = useMemo(() => selectedMonth !== 'all' ? 1 : (monthlyData.length || 1), [monthlyData, selectedMonth]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-card border border-surface-200 text-center h-full flex flex-col justify-center">
        <h2 className="text-lg font-display font-bold text-surface-900 mb-3">Expense Breakdown</h2>
        <p className="text-surface-400 text-sm">No expense data to display for the selected period.</p>
      </div>
    );
  }

  return (
    <div ref={chartContainerRef} className="bg-white p-6 rounded-2xl shadow-card border border-surface-200 min-h-[450px]">
      <h2 className="text-lg font-display font-bold text-surface-900 mb-6">Expense Breakdown</h2>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
          <Pie
            data={chartData}
            cx="50%" cy="50%"
            labelLine={false} label={renderCustomLabel}
            innerRadius={80} outerRadius={120}
            paddingAngle={5} fill="#8884d8"
            dataKey="value" nameKey="name"
            cornerRadius={10} stroke="#fff" strokeWidth={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.name === 'Others' ? '#a8a29e' : getCategoryColor(entry.name)}
                style={{
                    opacity: activeCategories.includes(entry.name) || entry.name === 'Others' ? 1 : 0.3,
                    transition: 'opacity 0.2s ease-in-out',
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip currency={currency} numMonths={numMonths} />} cursor={{ fill: 'rgba(230, 230, 230, 0.5)' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
