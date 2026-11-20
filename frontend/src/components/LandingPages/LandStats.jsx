import React from 'react';
import { Reveal, CountUp, Marquee, SplitText } from './Motion';

const stats = [
  { n: 500, s: '+', l: 'Students onboarded' },
  { n: 120, s: '+', l: 'Hiring companies' },
  { n: 92, s: '%', l: 'Placement rate' },
  { n: 4, s: '', l: 'Role dashboards' },
];
const steps = [
  { t: 'Create your profile', d: 'Sign up, add academics and upload your resume.' },
  { t: 'Apply to openings', d: 'Browse eligible jobs and apply in one click.' },
  { t: 'Track every stage', d: 'See status updates and notices as they happen.' },
  { t: 'Get the offer', d: 'Upload your offer letter and close the loop.' },
];

export default function LandStats() {
  return (
    <section className="bg-indigo-950 text-white py-16 overflow-hidden">
      <div className="text-indigo-200/90 mb-14 opacity-90">
        <Marquee items={['Resume uploads', 'Job posting', 'Live notices', 'Offer letters', 'Analytics']} />
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((x, i) => (
          <Reveal key={i} delay={i * 100}>
            <div className="text-5xl md:text-6xl font-bold playfair bg-gradient-to-r from-teal-300 to-amber-300 bg-clip-text text-transparent">
              <CountUp to={x.n} suffix={x.s} />
            </div>
            <p className="mt-2 text-sm text-indigo-200">{x.l}</p>
          </Reveal>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-20">
        <h3 className="text-3xl md:text-4xl font-bold playfair text-center mb-12"><SplitText text="From signup to offer in four steps" /></h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <Reveal key={i} delay={i * 120}>
              <div className="h-full rounded-3xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors duration-300">
                <span className="text-amber-300 font-bold text-sm">0{i + 1}</span>
                <h4 className="text-lg font-semibold mt-2 mb-1">{s.t}</h4>
                <p className="text-sm text-indigo-200">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
