import React from 'react';
import { Expense } from '../types';
import { PEOPLE, PEOPLE_DETAILS } from '../constants';
import { MoneyIcon, ChartBarIcon, UserIcon } from './icons';

interface DashboardProps {
    expenses: Expense[];
}

export const Dashboard: React.FC<DashboardProps> = ({ expenses }) => {
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const contributions = PEOPLE.reduce((acc, person) => {
        acc[person] = expenses
            .filter(exp => exp.payer === person)
            .reduce((sum, exp) => sum + exp.amount, 0);
        return acc;
    }, {} as Record<typeof PEOPLE[number], number>);

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <ChartBarIcon className="w-7 h-7 text-blue-400" />
                <span>لوحة المعلومات</span>
            </h2>

            <div className="bg-gray-900/50 p-4 rounded-lg mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <MoneyIcon className="w-8 h-8 text-green-400" />
                    <div>
                        <p className="text-gray-400 text-sm">إجمالي المصاريف</p>
                        <p className="text-white text-2xl font-bold font-mono">
                            {totalExpenses.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-3">ملخص المساهمات</h3>
                <div className="space-y-4">
                    {PEOPLE.map(person => {
                        const personDetails = PEOPLE_DETAILS[person];
                        const contribution = contributions[person];
                        const percentage = totalExpenses > 0 ? (contribution / totalExpenses) * 100 : 0;

                        return (
                            <div key={person}>
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${personDetails.progressBarBg}`}></span>
                                        <span className={`${personDetails.textColor} font-semibold`}>{person}</span>
                                    </div>
                                    <span className="text-sm font-mono text-white">{contribution.toFixed(2)}</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2.5">
                                    <div 
                                        className={`${personDetails.progressBarBg} h-2.5 rounded-full transition-all duration-500`} 
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
