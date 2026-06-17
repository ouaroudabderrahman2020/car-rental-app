import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Delete, Divide, Equal, Minus, Percent, Plus, X, History as HistoryIcon } from 'lucide-react';

export default function Calculator() {
  const [display, setDisplay] = useState('0'); // Active typing (Black)
  const [equation, setEquation] = useState(''); // Jumped-up equation (Black/Grey)
  const [isCalculated, setIsCalculated] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  // 1. Dynamic Scaling Logic for the whole Tool
  useEffect(() => {
    if (!containerRef) return;
    const updateScale = () => {
      const parent = containerRef.parentElement;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      const scaleX = (parentRect.width - 40) / 400;
      const scaleY = (parentRect.height - 40) / 700;
      const newScale = Math.min(scaleX, scaleY);
      setScale(Math.max(0.4, Math.min(newScale, 1.02)));
    };
    const observer = new ResizeObserver(updateScale);
    if (containerRef.parentElement) observer.observe(containerRef.parentElement);
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [containerRef]);

  // 2. Logic for handling big numbers on screen
  const getFontSize = (text: string) => {
    if (text.length <= 8) return 'text-7xl';
    if (text.length <= 12) return 'text-5xl';
    if (text.length <= 16) return 'text-4xl';
    return 'text-2xl'; // Minimum readable size for long digits
  };

  const handleNumber = useCallback((num: string) => {
    if (isCalculated) {
      // Fresh Start Rule: Wipe screen if typing a number after =
      setDisplay(num === '.' ? '0.' : num);
      setEquation('');
      setIsCalculated(false);
      return;
    }
    setDisplay(prev => {
      if (num === '.' && prev.includes('.')) return prev;
      if (prev.length > 18) return prev; // Limit input length
      return prev === '0' ? num : prev + num;
    });
  }, [isCalculated]);

  const handleOperator = useCallback((op: string) => {
    const currentNum = display.endsWith('.') ? display.slice(0, -1) : display;
    
    if (isCalculated) {
      // Continue from result
      setEquation(currentNum + ' ' + op);
      setDisplay('0');
      setIsCalculated(false);
      return;
    }

    // Jump-Up Logic: Current number moves up with operator
    setEquation(prev => prev === '' ? currentNum + ' ' + op : prev + currentNum + ' ' + op);
    setDisplay('0');
  }, [display, isCalculated]);

  const calculate = useCallback(() => {
    if (isCalculated || equation === '') return;
    try {
      const currentNum = display.endsWith('.') ? display.slice(0, -1) : display;
      const fullExpression = equation + ' ' + currentNum;
      
      const sanitized = fullExpression.replace(/÷/g, '/').replace(/×/g, '*').replace(/%/g, '/100');
      const result = new Function(`return ${sanitized}`)();
      
      if (!Number.isFinite(result)) throw new Error();

      // Format result: scientific notation if too big, or max 8 decimals
      let resString;
      if (Math.abs(result) > 1e12) {
        resString = result.toExponential(4);
      } else {
        resString = Number(result.toFixed(8)).toString();
      }

      setEquation(fullExpression + ' =');
      setDisplay(resString);
      setIsCalculated(true);
      setHistory(prev => [`${fullExpression} = ${resString}`, ...prev].slice(0, 20));
    } catch {
      setDisplay('Error');
    }
  }, [display, equation, isCalculated]);

  const btnBase = "h-full flex items-center justify-center rounded-2xl font-bold transition-all active:scale-90 border shadow-sm";
  const btnClasses = {
    num: `${btnBase} bg-white text-slate-900 text-2xl border-slate-200 hover:bg-slate-50`,
    op: `${btnBase} bg-slate-100 text-emerald-600 text-2xl border-slate-200 hover:bg-emerald-50`,
    equal: `${btnBase} bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-600 shadow-lg shadow-emerald-100`,
    special: `${btnBase} bg-slate-50 text-red-500 text-xl border-slate-200 hover:bg-red-50`
  };

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden bg-slate-100/50 p-4">
      <div 
        ref={setContainerRef}
        style={{ transform: `scale(${scale})`, width: '400px', height: '700px', position: 'relative' }}
        className="flex flex-col gap-4 p-6 bg-white rounded-[3rem] border border-slate-300 shadow-2xl overflow-hidden"
      >
        {/* Header Controls */}
        <div className="flex justify-between items-center px-2 shrink-0">
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Scientific Tool</span>
          <button 
            onClick={() => setShowHistory(true)} 
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <HistoryIcon className="w-3 h-3" /> HISTORY
          </button>
        </div>

        {/* Dual Row Display Area */}
        <div className="flex-none bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex flex-col justify-end items-end min-h-[200px] overflow-hidden">
          {/* Top Row: The Equation (Readable High Contrast) */}
          <div className="text-2xl text-slate-500 font-bold h-10 w-full text-right overflow-hidden flex items-center justify-end">
            {equation}
          </div>
          
          {/* Bottom Row: The Typing/Result (Green when calculated) */}
          <div className={`w-full font-black text-right leading-none transition-all duration-200 ${getFontSize(display)} ${isCalculated ? 'text-emerald-500' : 'text-slate-900'}`}>
            {display}
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="flex-1 grid grid-cols-4 gap-3">
          <button onClick={() => {setDisplay('0'); setEquation(''); setIsCalculated(false);}} className={btnClasses.special}>AC</button>
          <button onClick={() => setDisplay(prev => prev.length > 1 ? prev.slice(0,-1) : '0')} className={btnClasses.op}><Delete /></button>
          <button onClick={() => handleOperator('%')} className={btnClasses.op}><Percent /></button>
          <button onClick={() => handleOperator('÷')} className={btnClasses.op}><Divide /></button>

          {[7,8,9].map(n => <button key={n} onClick={() => handleNumber(n.toString())} className={btnClasses.num}>{n}</button>)}
          <button onClick={() => handleOperator('×')} className={btnClasses.op}><X /></button>

          {[4,5,6].map(n => <button key={n} onClick={() => handleNumber(n.toString())} className={btnClasses.num}>{n}</button>)}
          <button onClick={() => handleOperator('-')} className={btnClasses.op}><Minus /></button>

          {[1,2,3].map(n => <button key={n} onClick={() => handleNumber(n.toString())} className={btnClasses.num}>{n}</button>)}
          <button onClick={() => handleOperator('+')} className={btnClasses.op}><Plus /></button>

          <button onClick={() => handleNumber('0')} className={`${btnClasses.num} col-span-2 justify-start ps-10`}>0</button>
          <button onClick={() => handleNumber('.')} className={btnClasses.num}>.</button>
          <button onClick={calculate} className={btnClasses.equal}><Equal className="w-10 h-10" /></button>
        </div>

        {/* History Overlay thing (Absolute Positioning prevents layout shifts) */}
        {showHistory && (
          <div className="absolute inset-0 z-50 bg-white flex flex-col p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-xl tracking-tight">CALCULATION HISTORY</h3>
              <button 
                onClick={() => setShowHistory(false)} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar">
              {history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 italic">No history recorded</div>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-700 break-all leading-relaxed">
                    {h}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}