import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-[#0b1c2b]/80 backdrop-blur-xl rounded-xl border border-sky-500/15 my-4">
      <div className="p-3 bg-[#071522] border border-sky-500/20 rounded-full text-cyan-400 mb-3 shadow-sm">
        <Icon className="w-5 h-5 text-cyan-400" />
      </div>
      <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
      <p className="text-xs text-slate-400 font-light mt-1.5 max-w-sm leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 text-xs font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-700/60 hover:bg-cyan-900/60 rounded-lg transition-colors cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
