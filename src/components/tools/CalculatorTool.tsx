import React, { useState } from 'react';

export default function Calculator() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [lastResult, setLastResult] = useState<number | null>(null);

  const handleNumber = (num: string) => {
    setDisplay(prev => prev === '0' ? num : prev + num);
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    try {
      const fullEq = equation + display;
      // Note: In a real app we'd use a math library, but for a basic UI-focused tool:
      const result = eval(fullEq.replace(/[^-+/*\d.]/g, ''));
      setDisplay(String(result));
      setEquation('');
      setLastResult(result);
    } catch {
      setDisplay('Error');
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
    setLastResult(null);
  };

  const btnClass = "h-16 bg-white industrial-shadow font-black text-xl hover:bg-ink/5 active:scale-[0.98] transition-all border-1.5 border-midnight-ink/10";
  const opClass = "h-16 bg-midnight-ink text-white industrial-shadow font-black text-xl hover:bg-primary active:scale-[0.98] transition-all";

  return (
    <div className="w-full max-w-sm mx-auto p-4 space-y-6">
      <div className="bg-white p-6 border-b-4 border-midnight-ink industrial-shadow text-right">
        <div className="text-xs text-midnight-ink/40 h-4 font-bold uppercase tracking-widest">{equation}</div>
        <div className="text-4xl font-black text-midnight-ink truncate">{display}</div>
      </div>

      <div className="grid grid-cols-4 gap-3 font-sans">
        <button onClick={clear} className={`${btnClass} col-span-2 text-red-500`}>AC</button>
        <button onClick={() => setDisplay(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev)} className={btnClass}>+/-</button>
        <button onClick={() => handleOperator('/')} className={opClass}>÷</button>

        <button onClick={() => handleNumber('7')} className={btnClass}>7</button>
        <button onClick={() => handleNumber('8')} className={btnClass}>8</button>
        <button onClick={() => handleNumber('9')} className={btnClass}>9</button>
        <button onClick={() => handleOperator('*')} className={opClass}>×</button>

        <button onClick={() => handleNumber('4')} className={btnClass}>4</button>
        <button onClick={() => handleNumber('5')} className={btnClass}>5</button>
        <button onClick={() => handleNumber('6')} className={btnClass}>6</button>
        <button onClick={() => handleOperator('-')} className={opClass}>-</button>

        <button onClick={() => handleNumber('1')} className={btnClass}>1</button>
        <button onClick={() => handleNumber('2')} className={btnClass}>2</button>
        <button onClick={() => handleNumber('3')} className={btnClass}>3</button>
        <button onClick={() => handleOperator('+')} className={opClass}>+</button>

        <button onClick={() => handleNumber('0')} className={`${btnClass} col-span-2`}>0</button>
        <button onClick={() => handleNumber('.')} className={btnClass}>.</button>
        <button onClick={calculate} className={`${opClass} bg-primary`}>=</button>
      </div>
    </div>
  );
}
