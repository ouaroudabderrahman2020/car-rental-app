import { Calculator, Calendar, FileType } from 'lucide-react';
import { useState } from 'react';
import ToolModal from '../components/ToolModal';

export default function Tools() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  
  const tools = [
    { name: 'Calculator', icon: Calculator, color: 'text-primary' },
    { name: 'Calendar', icon: Calendar, color: 'text-primary' },
    { name: 'Image to PDF', icon: FileType, color: 'text-primary' },
  ];

  return (
    <div className="min-h-full bg-muted-mint pb-12">
      <main className="w-full">
        <div className="py-12">
          <div className="max-w-[1440px] mx-auto px-margin text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-ink mb-12">Operational Tools</h1>
            
            {/* Tool Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {tools.map((tool) => (
                <button 
                  key={tool.name}
                  onClick={() => setSelectedTool(tool.name)}
                  className="group block bg-white p-8 border border-border-tint hover:border-primary transition-all duration-300 shadow-[0_4px_20px_rgba(19,27,46,0.04)] hover:shadow-[0_8px_30px_rgba(19,27,46,0.08)] industrial-shadow text-center cursor-pointer w-full"
                >
                  <div className="flex flex-col items-center gap-4">
                    <tool.icon className={`${tool.color} w-12 h-12 group-hover:scale-110 transition-transform duration-300`} />
                    <h3 className="font-bold text-midnight text-xl">{tool.name}</h3>
                    <div className="h-[2px] w-8 bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <ToolModal 
        isOpen={!!selectedTool} 
        onClose={() => setSelectedTool(null)} 
        toolName={selectedTool || ''} 
      />
    </div>
  );
}
