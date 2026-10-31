'use client';

import React, { useState } from 'react';
import { flagUrl } from '@/lib/countries';

export function Flag({ code, size = 80, className = '' }: { code: string; size?: 40 | 80 | 160; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className={`inline-grid place-items-center bg-slate-100 text-[10px] font-bold text-slate-600 rounded-sm ${className}`}>
        {code}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={flagUrl(code, size)}
      alt={`${code} flag`}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover rounded-sm ring-1 ring-white/10 ${className}`}
    />
  );
}
