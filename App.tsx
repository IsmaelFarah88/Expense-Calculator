
import React, { useState, useCallback, useEffect } from 'react';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { BalanceSummary } from './components/BalanceSummary';
import { Dashboard } from './components/Dashboard';
import { Expense, Person, Settlement } from './types';
import { PEOPLE } from './constants';
import { 
  dbGetExpenses,
  dbAddExpense,
  dbDeleteExpense,
  dbClearAllExpenses,
  dbImportExpenses
} from './lib/database';

const App: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [settlements, setSettlements] = useState<Settlement[] | null>(null);

  const refreshExpenses = useCallback(async () => {
      try {
          const loadedExpenses = await dbGetExpenses();
          setExpenses(loadedExpenses);
      } catch (error) {
          console.error("Failed to load expenses from database:", error);
          alert("فشل تحميل المصاريف من قاعدة البيانات.");
          setExpenses([]);
      }
  }, []);

  useEffect(() => {
    refreshExpenses();
  }, [refreshExpenses]);

  const addExpense = useCallback(async (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: new Date().toISOString() + Math.random(),
    };
    await dbAddExpense(newExpense);
    await refreshExpenses();
  }, [refreshExpenses]);

  const deleteExpense = useCallback(async (id: string) => {
    await dbDeleteExpense(id);
    await refreshExpenses();
  }, [refreshExpenses]);
  
  const clearAllData = useCallback(async () => {
    if (!expenses || expenses.length === 0) return;
    const isConfirmed = window.confirm("هل أنت متأكد أنك تريد حذف جميع المصاريف؟ لا يمكن التراجع عن هذا الإجراء.");
    if (isConfirmed) {
      await dbClearAllExpenses();
      await refreshExpenses();
    }
  }, [expenses, refreshExpenses]);

  const handleExport = useCallback(() => {
    if (!expenses || expenses.length === 0) {
      alert("لا توجد بيانات لتصديرها.");
      return;
    }
    const dataStr = JSON.stringify(expenses, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [expenses]);

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isConfirmed = window.confirm("سيؤدي الاستيراد إلى الكتابة فوق البيانات الحالية. هل تريد المتابعة؟");
    if (!isConfirmed) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File is not valid text.");
        const importedExpenses = JSON.parse(text);
        
        if (Array.isArray(importedExpenses) && (importedExpenses.length === 0 || (importedExpenses[0].hasOwnProperty('id') && importedExpenses[0].hasOwnProperty('description') && importedExpenses[0].hasOwnProperty('amount')))) {
          await dbImportExpenses(importedExpenses);
          await refreshExpenses();
          alert("تم استيراد البيانات بنجاح!");
        } else {
          throw new Error("ملف JSON غير صالح أو لا يطابق البنية المطلوبة.");
        }
      } catch (error) {
        console.error("Failed to import data:", error);
        alert(`فشل استيراد البيانات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      } finally {
        event.target.value = ''; 
      }
    };
    reader.onerror = () => {
        alert("فشل في قراءة الملف.");
        event.target.value = '';
    }
    reader.readAsText(file);
  }, [refreshExpenses]);

  useEffect(() => {
    if (expenses === null) {
        setSettlements([]);
        return;
    }

    const calculateSettlements = () => {
        if (expenses.length === 0) {
            setSettlements([]);
            return;
        }
        setSettlements(null); // Show loading state

        setTimeout(() => {
            const netBalances = PEOPLE.reduce((acc, p) => ({ ...acc, [p]: 0 }), {} as Record<Person, number>);

            expenses.forEach(expense => {
              const { payer, amount, participants } = expense;
              if (participants.length === 0) return;
              const share = amount / participants.length;
              netBalances[payer] += amount;
              participants.forEach(participant => {
                netBalances[participant] -= share;
              });
            });
            
            const creditors: { person: Person, amount: number }[] = [];
            const debtors: { person: Person, amount: number }[] = [];

            for (const person of PEOPLE) {
                const balance = netBalances[person];
                if (balance > 0.01) {
                    creditors.push({ person: person as Person, amount: balance });
                } else if (balance < -0.01) {
                    debtors.push({ person: person as Person, amount: -balance });
                }
            }

            const newSettlements: Settlement[] = [];
            let debtorIndex = 0;
            let creditorIndex = 0;

            while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
                const debtor = debtors[debtorIndex];
                const creditor = creditors[creditorIndex];
                const amountToSettle = Math.min(debtor.amount, creditor.amount);

                if (amountToSettle > 0.01) {
                    newSettlements.push({
                        from: debtor.person,
                        to: creditor.person,
                        amount: amountToSettle,
                    });
                }
                
                debtor.amount -= amountToSettle;
                creditor.amount -= amountToSettle;

                if (debtor.amount < 0.01) {
                    debtorIndex++;
                }
                if (creditor.amount < 0.01) {
                    creditorIndex++;
                }
            }
            
            setSettlements(newSettlements);
        }, 200);
    };

    calculateSettlements();
  }, [expenses]);

  if (expenses === null) {
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
            <svg className="animate-spin h-12 w-12 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h2 className="text-xl font-semibold mt-4">جاري تحميل البيانات...</h2>
            <p className="text-gray-400 mt-1">قد يستغرق هذا بعض الوقت عند التشغيل لأول مرة.</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            حاسبة المصاريف المشتركة
          </h1>
          <p className="text-gray-400 mt-2">
            بياناتك محفوظة بأمان في متصفحك.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <ExpenseForm onAddExpense={addExpense} />
            <BalanceSummary 
                settlements={settlements} 
                hasExpenses={expenses.length > 0} 
            />
          </div>

          <div className="lg:col-span-3 space-y-6">
            <Dashboard expenses={expenses} />
            <ExpenseList 
                expenses={expenses} 
                onDeleteExpense={deleteExpense} 
                onClearAll={clearAllData}
                onExport={handleExport}
                onImport={handleImport}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
