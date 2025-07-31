
import React, { useState } from 'react';
import { Person, Expense } from '../types';
import { PEOPLE, PEOPLE_DETAILS } from '../constants';
import { GoogleGenAI, Type } from '@google/genai';
import { SparklesIcon } from './icons';


interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payer, setPayer] = useState<Person>(PEOPLE[0]);
  const [participants, setParticipants] = useState<Person[]>([]);
  const [error, setError] = useState<string | null>(null);

  // AI-related state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAiParse = async () => {
    if (!aiPrompt.trim()) {
      setAiError("يرجى إدخال وصف للمصروف.");
      return;
    }
    setIsParsing(true);
    setAiError(null);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const schema = {
        type: Type.OBJECT,
        properties: {
          description: { 
            type: Type.STRING,
            description: "وصف موجز للمصروف."
          },
          amount: {
            type: Type.NUMBER,
            description: "المبلغ الإجمالي للمصروف."
          },
          payer: {
            type: Type.STRING,
            enum: PEOPLE,
            description: "الشخص الذي دفع المبلغ."
          },
          participants: {
            type: Type.ARRAY,
            description: "الأشخاص المشاركون في هذا المصروف.",
            items: {
              type: Type.STRING,
              enum: PEOPLE,
            },
          },
        },
        required: ["description", "amount", "payer", "participants"],
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `من فضلك قم بتحليل نص المصروف التالي واستخرج البيانات المطلوبة. أسماء الأشخاص المتاحين هي: ${PEOPLE.join(', ')}. النص هو: "${aiPrompt}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        }
      });
      
      const parsedData = JSON.parse(response.text.trim());

      if (parsedData.description && parsedData.amount && parsedData.payer && parsedData.participants) {
          setDescription(parsedData.description);
          setAmount(String(parsedData.amount));
          setPayer(parsedData.payer);
          setParticipants(parsedData.participants);
          setAiPrompt('');
      } else {
          throw new Error("لم يتمكن الذكاء الاصطناعي من استخراج كافة المعلومات المطلوبة.");
      }

    } catch (e) {
      console.error("AI parsing failed:", e);
      const errorMessage = e instanceof Error ? e.message : 'حدث خطأ غير متوقع.';
      setAiError(`فشل التحليل: ${errorMessage} يرجى المحاولة مرة أخرى أو إدخال البيانات يدوياً.`);
    } finally {
      setIsParsing(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!description || !numericAmount || numericAmount <= 0) {
      setError('يرجى إدخال وصف ومبلغ صحيح.');
      return;
    }
    if (participants.length === 0) {
      setError('يرجى إختيار مشارك واحد على الأقل.');
      return;
    }
    setError(null);
    await onAddExpense({
      description,
      amount: numericAmount,
      payer,
      participants,
    });
    setDescription('');
    setAmount('');
    setParticipants([]);
    setPayer(PEOPLE[0]);
  };
  
  const handleParticipantChange = (person: Person) => {
    setParticipants(prev =>
      prev.includes(person)
        ? prev.filter(p => p !== person)
        : [...prev, person]
    );
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-4">إضافة مصروف جديد</h2>
      
      <div className="mb-6 bg-gray-900/50 p-4 rounded-lg border border-blue-500/30">
        <label htmlFor="ai-prompt" className="flex items-center gap-2 text-lg font-semibold text-blue-300 mb-2">
          <SparklesIcon className="w-6 h-6"/>
          <span>جرب الإضافة بالذكاء الاصطناعي</span>
        </label>
        <p className="text-sm text-gray-400 mb-3">
            اكتب تفاصيل المصروف، وسيقوم النظام بملء الحقول تلقائياً. مثال: "دفع يوسف 150 لوجبة عشاء لي ولأحمد".
        </p>
        <div className="flex gap-2">
            <input
                id="ai-prompt"
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="flex-grow bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل وصف المصروف هنا..."
                disabled={isParsing}
            />
            <button
                type="button"
                onClick={handleAiParse}
                disabled={isParsing || !aiPrompt}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
            >
                {isParsing ? (
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : <SparklesIcon className="w-5 h-5"/>}
                <span>{isParsing ? '...جاري التحليل' : 'تحليل'}</span>
            </button>
        </div>
        {aiError && <p className="text-red-400 text-sm mt-2">{aiError}</p>}
      </div>

      <div className="flex items-center text-center my-4">
        <div className="flex-grow border-t border-gray-600"></div>
        <span className="flex-shrink mx-4 text-gray-400 font-semibold">أو قم بالإدخال يدوياً</span>
        <div className="flex-grow border-t border-gray-600"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">الوصف</label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="مثال: عشاء"
          />
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">المبلغ</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="150"
          />
        </div>
        <div>
          <label htmlFor="payer" className="block text-sm font-medium text-gray-300 mb-1">الدافع</label>
          <select
            id="payer"
            value={payer}
            onChange={(e) => setPayer(e.target.value as Person)}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {PEOPLE.map(person => (
              <option key={person} value={person}>{person}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">المشاركون</label>
          <div className="grid grid-cols-3 gap-2">
            {PEOPLE.map(person => {
                const details = PEOPLE_DETAILS[person];
                const isSelected = participants.includes(person);
                const selectedClasses = `${details.progressBarBg} text-white font-bold`;
                const unselectedClasses = 'bg-gray-700 text-gray-300 hover:bg-gray-600';
              return (
              <label key={person} className={`flex items-center justify-center p-3 rounded-md cursor-pointer transition-colors ${isSelected ? selectedClasses : unselectedClasses}`}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleParticipantChange(person)}
                  className="hidden"
                />
                <span className="text-sm font-semibold">{person}</span>
              </label>
            )})}
          </div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
          إضافة المصروف
        </button>
      </form>
    </div>
  );
};
