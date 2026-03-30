export default function HikerSVG() {
  return (
    <svg width="200" height="360" viewBox="0 0 400 380" xmlns="http://www.w3.org/2000/svg">
      <g className="leg-left">
        <rect x="172" y="240" width="26" height="72" rx="10" fill="#37474F" />
        <path
          d="M165 308 Q172 298 185 298 Q196 298 200 306 Q202 313 196 317 Q185 321 168 319 Q162 316 165 308Z"
          fill="#4E342E"
        />
        <line x1="170" y1="309" x2="194" y2="309" stroke="#fff" strokeWidth="1.2" opacity="0.6" />
        <line x1="171" y1="313" x2="193" y2="313" stroke="#fff" strokeWidth="1.2" opacity="0.6" />
        <path d="M163 318 Q183 322 202 318" stroke="#3E2723" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>

      <g className="leg-right">
        <rect x="202" y="240" width="26" height="72" rx="10" fill="#37474F" />
        <path
          d="M200 308 Q205 298 218 298 Q229 298 233 306 Q235 313 229 317 Q218 321 201 319 Q196 316 200 308Z"
          fill="#4E342E"
        />
        <line x1="203" y1="309" x2="227" y2="309" stroke="#fff" strokeWidth="1.2" opacity="0.6" />
        <line x1="204" y1="313" x2="226" y2="313" stroke="#fff" strokeWidth="1.2" opacity="0.6" />
        <path d="M197 318 Q216 322 236 318" stroke="#3E2723" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>

      <rect x="170" y="233" width="60" height="12" rx="5" fill="#455A64" />
      <rect x="170" y="185" width="60" height="52" rx="10" fill="#1565C0" />
      <line x1="200" y1="187" x2="200" y2="232" stroke="#64B5F6" strokeWidth="1.5" strokeDasharray="4,3" />

      <g className="arm-left">
        <path d="M172 195 Q148 210 143 238" stroke="#1565C0" strokeWidth="18" fill="none" strokeLinecap="round" />
        <ellipse cx="142" cy="246" rx="11" ry="9" fill="#FF7043" />
      </g>

      <g className="arm-right">
        <path d="M228 195 Q252 210 257 238" stroke="#1565C0" strokeWidth="18" fill="none" strokeLinecap="round" />
        <ellipse cx="258" cy="246" rx="11" ry="9" fill="#FF7043" />
      </g>

      <ellipse cx="164" cy="168" rx="7" ry="9" fill="#EAB88A" />
      <ellipse cx="236" cy="168" rx="7" ry="9" fill="#EAB88A" />
      <circle cx="200" cy="162" r="36" fill="#F5CBA7" />

      <path d="M165 158 Q168 125 200 122 Q232 125 235 158 Z" fill="#1B5E20" />
      <rect x="165" y="154" width="70" height="11" rx="4" fill="#154020" />
      <path d="M162 161 Q200 170 238 161 Q242 174 200 176 Q158 174 162 161Z" fill="#154020" />
      <circle cx="200" cy="123" r="5" fill="#4CAF50" />

      <path d="M183 153 Q190 149 197 153" stroke="#5D4037" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M203 153 Q210 149 217 153" stroke="#5D4037" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="190" cy="160" rx="7" ry="7" fill="white" />
      <ellipse cx="210" cy="160" rx="7" ry="7" fill="white" />
      <circle cx="191" cy="161" r="4.5" fill="#3E2723" />
      <circle cx="211" cy="161" r="4.5" fill="#3E2723" />
      <circle cx="193" cy="159" r="1.5" fill="white" />
      <circle cx="213" cy="159" r="1.5" fill="white" />
      <ellipse cx="200" cy="168" rx="4" ry="3" fill="#EAA07A" opacity="0.7" />
      <path d="M186 174 Q200 185 214 174" stroke="#C67840" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="180" cy="170" r="8" fill="#F48FB1" opacity="0.28" />
      <circle cx="220" cy="170" r="8" fill="#F48FB1" opacity="0.28" />
    </svg>
  );
}