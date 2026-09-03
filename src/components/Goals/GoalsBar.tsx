import React from 'react';
import { WritingGoals } from '../../types';

interface Props {
  goals: WritingGoals;
  onChange: (g: WritingGoals) => void;
}

const audiences: WritingGoals['audience'][] = ['general', 'knowledgeable', 'expert'];
const formalities: WritingGoals['formality'][] = ['informal', 'neutral', 'formal'];
const domains: WritingGoals['domain'][] = ['general', 'academic', 'business', 'email', 'casual', 'creative'];
const intents: WritingGoals['intent'][] = ['inform', 'describe', 'convince', 'tellStory'];

const labelMap: Record<string, string> = {
  general: 'General', knowledgeable: 'Knowledgeable', expert: 'Expert',
  informal: 'Informal', neutral: 'Neutral', formal: 'Formal',
  academic: 'Academic', business: 'Business', email: 'Email', casual: 'Casual', creative: 'Creative',
  inform: 'Inform', describe: 'Describe', convince: 'Convince', tellStory: 'Tell Story',
};

const domainHint: Record<string, string> = {
  general: 'Balanced checks',
  academic: 'Strict: no contractions, no I/you',
  business: 'Formal, concise',
  email: 'Engaging, clear',
  casual: 'Relaxed: ignores fragments',
  creative: 'Permissive: bend rules',
};

export const GoalsBar: React.FC<Props> = ({ goals, onChange }) => {
  const Pill = ({ active, onClick, children }: any) => (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${active ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600 hover:bg-slate-700'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Writing Goals</h3>
        <span className="text-[11px] text-slate-500">{domainHint[goals.domain]}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div>
          <div className="text-[11px] font-semibold text-slate-400 mb-1.5 tracking-wide">Audience</div>
          <div className="flex gap-1.5 flex-wrap">
            {audiences.map(a => (
              <Pill key={a} active={goals.audience === a} onClick={() => onChange({ ...goals, audience: a })}>{labelMap[a]}</Pill>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-slate-400 mb-1.5 tracking-wide">Formality</div>
          <div className="flex gap-1.5 flex-wrap">
            {formalities.map(f => (
              <Pill key={f} active={goals.formality === f} onClick={() => onChange({ ...goals, formality: f })}>{labelMap[f]}</Pill>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-slate-400 mb-1.5 tracking-wide">Domain</div>
          <div className="flex gap-1.5 flex-wrap">
            {domains.map(d => (
              <Pill key={d} active={goals.domain === d} onClick={() => onChange({ ...goals, domain: d })}>{labelMap[d]}</Pill>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-slate-400 mb-1.5 tracking-wide">Intent</div>
          <div className="flex gap-1.5 flex-wrap">
            {intents.map(i => (
              <Pill key={i} active={goals.intent === i} onClick={() => onChange({ ...goals, intent: i })}>{labelMap[i]}</Pill>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
