export const PEOPLE = ["إسماعيل", "يوسف", "أحمد"] as const;

export const PEOPLE_DETAILS: {
    [key in typeof PEOPLE[number]]: {
        bgColor: string;
        textColor: string;
        borderColor: string;
        progressBarBg: string;
    }
} = {
    "إسماعيل": {
        bgColor: 'bg-sky-500/20',
        textColor: 'text-sky-300',
        borderColor: 'border-sky-500/30',
        progressBarBg: 'bg-sky-500',
    },
    "يوسف": {
        bgColor: 'bg-emerald-500/20',
        textColor: 'text-emerald-300',
        borderColor: 'border-emerald-500/30',
        progressBarBg: 'bg-emerald-500',
    },
    "أحمد": {
        bgColor: 'bg-amber-500/20',
        textColor: 'text-amber-300',
        borderColor: 'border-amber-500/30',
        progressBarBg: 'bg-amber-500',
    }
};
