import React from 'react';
import { Settlement } from '../types';
import { PEOPLE_DETAILS } from '../constants';

interface BalanceSummaryProps {
  settlements: Settlement[] | null;
  hasExpenses: boolean;
}

export const BalanceSummary: React.FC<BalanceSummaryProps> = ({ settlements, hasExpenses }) => {
    
    const renderContent = () => {
        if (!hasExpenses) {
            return <p className="text-gray-400 text-center py-4">أضف بعض المصاريف لعرض ملخص التسوية هنا.</p>;
        }

        if (settlements === null) {
            return (
                <div className="text-center py-4">
                    <svg className="animate-spin mx-auto h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-400 mt-2">...جاري حساب التسوية</p>
                </div>
            );
        }

        if (settlements.length === 0) {
            return (
                <div className="text-center py-4 bg-green-900/50 rounded-lg">
                  <p className="text-lg font-semibold text-green-300">🎉 كل الحسابات مسواة!</p>
                  <p className="text-gray-400">لا أحد مدين لأحد. عمل رائع!</p>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {settlements.map((settlement, index) => {
                    const fromDetails = PEOPLE_DETAILS[settlement.from];
                    const toDetails = PEOPLE_DETAILS[settlement.to];
                    return (
                        <div key={index} className="bg-gray-700/80 p-4 rounded-lg transition-all hover:bg-gray-700/60">
                            <p className="text-gray-200 leading-relaxed text-lg text-center">
                                <span className={`font-bold mx-1.5 px-2 py-0.5 rounded ${fromDetails.bgColor} ${fromDetails.textColor}`}>{settlement.from}</span>
                                عليه
                                <span className="font-mono font-bold text-white bg-gray-900/50 rounded-md px-3 py-1 mx-1.5">{settlement.amount.toFixed(2)}</span>
                                لـ
                                <span className={`font-bold mx-1.5 px-2 py-0.5 rounded ${toDetails.bgColor} ${toDetails.textColor}`}>{settlement.to}</span>
                            </p>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-white">التسوية النهائية</h3>
            </div>
            {renderContent()}
        </div>
    );
};