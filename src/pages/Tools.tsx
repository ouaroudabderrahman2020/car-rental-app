import { Calculator, Calendar, FileType } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import ToolModal from '../components/ToolModal';

export default function Tools() {
  const { t } = useTranslation();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  
  const tools = [
    { name: t('tools.calculator'), key: 'Calculator', icon: Calculator, color: 'text-primary' },
    { name: t('tools.calendar'), key: 'Calendar', icon: Calendar, color: 'text-primary' },
    { name: t('tools.imageToPdf'), key: 'Image to PDF', icon: FileType, color: 'text-primary' },
  ];

  return (
    <Layout title={t('tools.title')}>
      <div className="min-h-full bg-white pb-12">
        <main className="w-full">
          <div className="py-12">
            <div className="max-w-[1440px] mx-auto px-margin v-section-gap text-center">
              {/* Tool Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {tools.map((tool) => (
                <button 
                  key={tool.key}
                  onClick={() => setSelectedTool(tool.key)}
                  className="group block bg-white p-8 border border-slate-200 hover:border-primary transition-all duration-300 shadow-sm hover:shadow-md text-center cursor-pointer w-full"
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
  </Layout>
);
}
