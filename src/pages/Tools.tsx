import { Calculator, Calendar, FileType, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import BaseModal from '../components/BaseModal';
import { PageHeader } from '../components/PageHeader';
import Section2 from '../components/Section2';
/* removed FormSection import */
import CalculatorTool from '../components/tools/CalculatorTool';
import CalendarTool from '../components/tools/CalendarTool';
import ImageToPdf from '../components/tools/ImageToPdf';

export default function Tools() {
  const { t } = useTranslation();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  
  const tools = [
    { name: t('tools.calculator'), key: 'Calculator', icon: Calculator, color: 'text-primary' },
    { name: t('tools.calendar'), key: 'Calendar', icon: Calendar, color: 'text-primary' },
    { name: t('tools.imageToPdf'), key: 'Image to PDF', icon: FileType, color: 'text-primary' },
  ];

  const renderTool = () => {
    switch (selectedTool) {
      case 'Calculator': return <CalculatorTool />;
      case 'Calendar': return <CalendarTool />;
      case 'Image to PDF': return <ImageToPdf />;
      default: return null;
    }
  };

  const getToolTitle = () => {
    const tool = tools.find(t => t.key === selectedTool);
    return tool ? tool.name : '';
  };

  return (
    <Layout>
      <div className="min-h-full bg-white pb-12">
        <PageHeader 
          title="Tools"
          className="p-6 md:p-10"
        />
        <main className="w-full">
          <div className="pt-6 pb-12 px-4">
            <div className="max-w-[1440px] mx-auto">
              <Section2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto py-8">
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
              </Section2>
            </div>
          </div>
      </main>

      <BaseModal 
        isOpen={!!selectedTool} 
        onClose={() => setSelectedTool(null)} 
        title={getToolTitle()}
        maxWidth={selectedTool === 'Image to PDF' ? 'max-w-4xl' : 'max-w-2xl'}
        noScroll={true}
      >
        <div className="h-[80vh] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          {renderTool()}
        </div>
      </BaseModal>
    </div>
  </Layout>
);
}
