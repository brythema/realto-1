import React from 'react';
import { MessageCircle } from 'lucide-react';

export const WhatsAppFloatingButton: React.FC = () => {
  const defaultText = encodeURIComponent(
    'Hello Realto Admin Concierge, I am browsing the Realto marketplace and have an inquiry regarding verified property listings and inspection schedules.'
  );
  const waUrl = `https://wa.me/2348007325866?text=${defaultText}`;

  return (
    <aside aria-label="Support contacts" className="fixed bottom-6 right-6 z-40">
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Realto Concierge on WhatsApp"
        className="flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 group border-2 border-white/20"
      >
        <MessageCircle className="w-5 h-5 text-white fill-white" />
        <span className="hidden sm:inline font-bold">Realto Concierge</span>
      </a>
    </aside>
  );
};
