import React from 'react';
import { Expense } from '../types';
import { TrashIcon, UserIcon, MoneyIcon, DownloadIcon, UploadIcon } from './icons';
import { PEOPLE_DETAILS } from '../constants';

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onClearAll: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDeleteExpense, onClearAll, onExport, onImport }) => {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <h3 className="text-xl font-bold text-white mb-2">قائمة المصاريف</h3>
        <p className="text-gray-400">لا توجد مصاريف حتى الآن.</p>
        <p className="text-gray-500 mt-2">أضف مصروفاً جديداً لبدء الاستخدام!</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
       <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-2xl font-bold text-white">قائمة المصاريف</h3>
        {expenses.length > 0 && (
            <div className="flex items-center gap-2">
                 <label className="cursor-pointer flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-3 py-1.5 rounded-md transition-colors">
                    <UploadIcon className="w-4 h-4" />
                    <span>استيراد</span>
                    <input type="file" accept=".json" className="hidden" onChange={onImport} />
                </label>
                 <button
                  onClick={onExport}
                  className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 hover:bg-green-500/10 px-3 py-1.5 rounded-md transition-colors"
                  aria-label="تصدير جميع المصاريف"
                >
                  <DownloadIcon className="w-4 h-4" />
                  <span>تصدير</span>
                </button>
                <button
                  onClick={onClearAll}
                  className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-md transition-colors"
                  aria-label="مسح جميع المصاريف"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>مسح الكل</span>
                </button>
            </div>
        )}
      </div>
      <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 -mr-2">
        {expenses.map((expense) => {
          const payerDetails = PEOPLE_DETAILS[expense.payer];
          return (
          <div key={expense.id} className="bg-gray-700/80 p-4 rounded-lg shadow-md relative group transition-all hover:bg-gray-700/60">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-lg text-white">{expense.description}</p>
                <div className="flex items-center text-sm text-green-400 mt-2">
                  <MoneyIcon className="w-5 h-5 ml-2 text-gray-400" />
                  <span className="font-mono">{expense.amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center text-sm mt-1.5">
                   <UserIcon className="w-5 h-5 ml-2 text-gray-400" />
                   <span className="text-gray-300">دفع بواسطة:</span>
                   <span className={`font-semibold ml-2 ${payerDetails.textColor}`}>{expense.payer}</span>
                   <span className={`w-2 h-2 rounded-full ${payerDetails.progressBarBg}`}></span>
                </div>
              </div>
              <button
                onClick={() => onDeleteExpense(expense.id)}
                className="absolute top-3 left-3 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 focus:opacity-100 focus:ring-2 focus:ring-red-500"
                aria-label="حذف المصروف"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-600/70">
                <p className="text-xs text-gray-400 mb-2">المشاركون:</p>
                <div className="flex flex-wrap gap-2">
                    {expense.participants.map(p => {
                        const pDetails = PEOPLE_DETAILS[p];
                        return (
                          <span key={p} className={`text-xs font-medium px-2.5 py-1 rounded-full ${pDetails.bgColor} ${pDetails.textColor}`}>{p}</span>
                    )})}
                </div>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
};
