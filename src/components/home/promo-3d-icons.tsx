import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * 1. Call to Order / Instant Campus Chat
 * 3D telephone handset with floating magenta speech bubble (3 dots) on soft badge.
 */
export function CallToOrderIcon({ className = '', size = 120 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Call to Order Icon"
    >
      <defs>
        {/* Ambient shadow */}
        <filter id="co-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.25" />
        </filter>
        <filter id="co-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#ec4899" floodOpacity="0.35" />
        </filter>

        {/* Handset gradient */}
        <linearGradient id="co-phone-body" x1="30" y1="40" x2="110" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="35%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        <linearGradient id="co-phone-highlight" x1="40" y1="45" x2="70" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
        </linearGradient>

        {/* Bubble gradient */}
        <linearGradient id="co-bubble" x1="80" y1="30" x2="140" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#be185d" />
        </linearGradient>

        {/* White backing badge */}
        <radialGradient id="co-badge-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="85%" stopColor="#f8fafc" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.5" />
        </radialGradient>
      </defs>

      {/* Base glow backing */}
      <circle cx="80" cy="88" r="60" fill="url(#co-badge-bg)" filter="url(#co-shadow)" />

      {/* Speech Bubble with 3 dots */}
      <g filter="url(#co-soft-shadow)">
        <rect x="82" y="32" width="56" height="42" rx="21" fill="url(#co-bubble)" />
        <path d="M96 74 L88 84 L104 74 Z" fill="#ec4899" />
        {/* Bubble specular sheen */}
        <ellipse cx="102" cy="40" rx="14" ry="4" fill="#ffffff" fillOpacity="0.55" />
        {/* 3 Dots */}
        <circle cx="98" cy="53" r="3.5" fill="#ffffff" />
        <circle cx="110" cy="53" r="3.5" fill="#ffffff" />
        <circle cx="122" cy="53" r="3.5" fill="#ffffff" />
      </g>

      {/* 3D Telephone Handset */}
      <g filter="url(#co-shadow)">
        {/* Main Phone Handle & Arc */}
        <path
          d="M44 60 C38 48, 52 32, 64 38 L72 46 C77 51, 75 58, 69 62 L63 67 C66 76, 76 86, 85 89 L90 83 C94 77, 101 75, 106 80 L114 88 C120 100, 104 114, 92 108 C68 98, 48 78, 44 60 Z"
          fill="url(#co-phone-body)"
        />

        {/* Earpiece Cap */}
        <ellipse cx="56" cy="46" rx="13" ry="9" transform="rotate(-35 56 46)" fill="#60a5fa" />
        <ellipse cx="55" cy="45" rx="9" ry="6" transform="rotate(-35 55 45)" fill="#bfdbfe" />

        {/* Mouthpiece Cap */}
        <ellipse cx="102" cy="98" rx="13" ry="9" transform="rotate(-35 102 98)" fill="#1e40af" />
        <ellipse cx="101" cy="97" rx="9" ry="6" transform="rotate(-35 101 97)" fill="#3b82f6" />

        {/* Specular curved spine highlight */}
        <path
          d="M58 54 C54 62, 59 74, 68 83 C77 92, 89 97, 97 93"
          stroke="url(#co-phone-highlight)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/**
 * 2. CUSTECH Force / Student Ambassadors
 * Vibrant brand badge with bold 3D star and "FORCE" emblem.
 */
export function CustechForceIcon({ className = '', size = 120 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="CUSTECH Force Icon"
    >
      <defs>
        <filter id="cf-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#ea580c" floodOpacity="0.35" />
        </filter>
        <linearGradient id="cf-bg" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id="cf-star" x1="50" y1="30" x2="110" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
        <linearGradient id="cf-pill" x1="30" y1="110" x2="130" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f1f5f9" />
        </linearGradient>
      </defs>

      {/* Main Orange Shield / Rounded Container */}
      <rect x="22" y="20" width="116" height="120" rx="28" fill="url(#cf-bg)" filter="url(#cf-shadow)" />

      {/* Ambient Inner Glow Ring */}
      <rect x="26" y="24" width="108" height="112" rx="24" stroke="#ffedd5" strokeOpacity="0.4" strokeWidth="2" />

      {/* Top 3D Faceted Star */}
      <g filter="url(#cf-shadow)">
        <polygon
          points="80,32 87,48 104,50 91,62 95,78 80,69 65,78 69,62 56,50 73,48"
          fill="url(#cf-star)"
        />
        {/* Star highlight facet */}
        <polygon points="80,32 87,48 80,69 73,48" fill="#ffffff" fillOpacity="0.5" />
        <circle cx="80" cy="55" r="4" fill="#ffffff" fillOpacity="0.9" />
      </g>

      {/* "CUSTECH" & "FORCE" Typography */}
      <text
        x="80"
        y="93"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="15"
        letterSpacing="0.08em"
      >
        CUSTECH
      </text>
      <text
        x="80"
        y="108"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="17"
        letterSpacing="0.12em"
      >
        FORCE
      </text>

      {/* "JOIN NOW" Pill */}
      <rect x="42" y="116" width="76" height="18" rx="9" fill="url(#cf-pill)" />
      <text
        x="80"
        y="129"
        textAnchor="middle"
        fill="#c2410c"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="9.5"
        letterSpacing="0.08em"
      >
        JOIN NOW
      </text>
    </svg>
  );
}

/**
 * 3. Clearance Sales
 * 3D Red hanging price tag with white % cutout and metallic cord.
 */
export function ClearanceSalesIcon({ className = '', size = 120 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Clearance Sales Icon"
    >
      <defs>
        <filter id="cs-shadow" x="-15%" y="-15%" width="135%" height="135%">
          <feDropShadow dx="3" dy="8" stdDeviation="6" floodColor="#7f1d1d" floodOpacity="0.3" />
        </filter>
        <radialGradient id="cs-backdrop" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff7ed" />
          <stop offset="80%" stopColor="#ffedd5" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#fdba74" stopOpacity="0.3" />
        </radialGradient>
        <linearGradient id="cs-tag-front" x1="40" y1="40" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="45%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
        <linearGradient id="cs-tag-back" x1="30" y1="50" x2="90" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
      </defs>

      {/* Backdrop disc */}
      <circle cx="80" cy="85" r="58" fill="url(#cs-backdrop)" />

      {/* Rear Secondary Tag (Adds rich 3D depth) */}
      <g transform="rotate(-25 70 80)">
        <path
          d="M48 45 C48 40, 52 36, 57 36 L75 36 C79 36, 83 38, 86 41 L108 63 C113 68, 113 76, 108 81 L89 100 C84 105, 76 105, 71 100 L49 78 C46 75, 44 71, 44 67 Z"
          fill="url(#cs-tag-back)"
          opacity="0.85"
        />
      </g>

      {/* Hanging Loop String / Cord */}
      <path
        d="M62 36 C55 22, 75 14, 82 25 C88 35, 75 42, 70 42"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        filter="url(#cs-shadow)"
      />

      {/* Front Primary 3D Tag */}
      <g transform="rotate(-10 82 86)" filter="url(#cs-shadow)">
        <path
          d="M52 48 C52 43, 56 39, 61 39 L78 39 C82 39, 86 41, 89 44 L114 69 C119 74, 119 82, 114 87 L93 108 C88 113, 80 113, 75 108 L50 83 C47 80, 45 76, 45 72 Z"
          fill="url(#cs-tag-front)"
        />
        {/* Specular edge sheen */}
        <path
          d="M61 41 L78 41 C81 41, 84 42, 87 45 L112 70"
          stroke="#ffffff"
          strokeOpacity="0.45"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Grommet / Hole */}
        <circle cx="63" cy="50" r="5" fill="#7f1d1d" />
        <circle cx="63" cy="50" r="4" fill="#ffffff" fillOpacity="0.9" />
        <circle cx="63" cy="50" r="2.5" fill="#991b1b" />

        {/* 3D Embossed Percent Symbol % */}
        <g fill="#ffffff">
          {/* Top circle */}
          <circle cx="74" cy="69" r="5.5" />
          <circle cx="74" cy="69" r="2.5" fill="#ef4444" />
          {/* Slash bar */}
          <rect x="70" y="86" width="24" height="4.5" rx="2.2" transform="rotate(-45 70 86)" />
          {/* Bottom circle */}
          <circle cx="92" cy="85" r="5.5" />
          <circle cx="92" cy="85" r="2.5" fill="#ef4444" />
        </g>
      </g>
    </svg>
  );
}

/**
 * 4. Voucher Store / Mystery Gift Box
 * 3D Open golden carton box with ribbon confetti and floating green % voucher tag.
 */
export function VoucherBoxIcon({ className = '', size = 120 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Voucher Store Icon"
    >
      <defs>
        <filter id="vb-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="5" floodColor="#78350f" floodOpacity="0.28" />
        </filter>
        <linearGradient id="vb-box-front" x1="40" y1="90" x2="120" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="vb-box-flap" x1="30" y1="70" x2="80" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="vb-tag" x1="60" y1="35" x2="100" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>

      {/* Confetti Spiral Streamers */}
      <path
        d="M38 58 Q48 40 40 28 T50 16"
        stroke="#facc15"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M122 55 Q112 36 120 25 T112 12"
        stroke="#6ee7b7"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* 3D Open Box Interior Shadow */}
      <polygon points="45,95 80,110 115,95 80,82" fill="#78350f" />

      {/* Floating Scalloped / Rounded Discount Voucher Tag */}
      <g filter="url(#vb-shadow)">
        <rect x="62" y="32" width="36" height="46" rx="8" fill="url(#vb-tag)" transform="rotate(8 80 55)" />
        {/* Tag hanging hole */}
        <circle cx="80" cy="40" r="3" fill="#065f46" />
        <circle cx="80" cy="40" r="2" fill="#ffffff" />
        {/* White % on tag */}
        <text
          x="80"
          y="66"
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="sans-serif"
          fontWeight="900"
          fontSize="17"
        >
          %
        </text>
      </g>

      {/* 3D Box Front & Left/Right Faces */}
      <g filter="url(#vb-shadow)">
        {/* Left main wall */}
        <polygon points="40,95 80,114 80,144 40,125" fill="#d97706" />
        {/* Right main wall */}
        <polygon points="80,114 120,95 120,125 80,144" fill="#b45309" />
        {/* Center vertical seam */}
        <line x1="80" y1="114" x2="80" y2="144" stroke="#78350f" strokeWidth="1.5" />

        {/* Left Open Flap */}
        <polygon points="40,95 80,114 68,124 28,104" fill="url(#vb-box-flap)" />
        {/* Right Open Flap */}
        <polygon points="80,114 120,95 132,104 92,124" fill="url(#vb-box-flap)" />
        {/* Top-back Flaps */}
        <polygon points="40,95 80,82 72,72 32,84" fill="#f59e0b" />
        <polygon points="80,82 120,95 128,84 88,72" fill="#f59e0b" />
      </g>
    </svg>
  );
}

/**
 * 5. Buy 2 Pay for 1 / Student Bundle Deals
 * 3D Royal-blue shopping basket with white handle and shining gold checkmark coin.
 */
export function Buy2Pay1BasketIcon({ className = '', size = 120 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Buy 2 Pay 1 Basket Icon"
    >
      <defs>
        <filter id="bp-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="2" dy="8" stdDeviation="5" floodColor="#1e3a8a" floodOpacity="0.32" />
        </filter>
        <filter id="bp-gold-glow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#ca8a04" floodOpacity="0.4" />
        </filter>
        <linearGradient id="bp-basket-body" x1="40" y1="70" x2="110" y2="135" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="40%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="bp-coin" x1="90" y1="80" x2="135" y2="135" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="30%" stopColor="#facc15" />
          <stop offset="80%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
      </defs>

      {/* Basket Handles */}
      <path
        d="M50 75 C45 35, 105 35, 100 75"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        filter="url(#bp-shadow)"
      />

      {/* 3D Shopping Basket */}
      <g filter="url(#bp-shadow)">
        {/* Basket Top Rim */}
        <rect x="30" y="68" width="90" height="12" rx="6" fill="#ffffff" />
        <rect x="33" y="70" width="84" height="8" rx="4" fill="#e2e8f0" />

        {/* Basket Main Tub (Tapered) */}
        <path
          d="M36 78 L45 126 C46 130, 50 133, 54 133 L96 133 C100 133, 104 130, 105 126 L114 78 Z"
          fill="url(#bp-basket-body)"
        />

        {/* Basket Slats / Vents */}
        <rect x="52" y="86" width="6" height="34" rx="3" fill="#ffffff" fillOpacity="0.8" />
        <rect x="66" y="86" width="6" height="34" rx="3" fill="#ffffff" fillOpacity="0.8" />
        <rect x="80" y="86" width="6" height="34" rx="3" fill="#ffffff" fillOpacity="0.8" />
        <rect x="94" y="86" width="6" height="24" rx="3" fill="#ffffff" fillOpacity="0.8" />
      </g>

      {/* Large 3D Gold Seal / Checkmark Coin in Front */}
      <g filter="url(#bp-gold-glow)">
        {/* Outer Coin Base */}
        <circle cx="106" cy="108" r="28" fill="url(#bp-coin)" />
        {/* Inner Coin Rim */}
        <circle cx="106" cy="108" r="23" stroke="#fef08a" strokeWidth="2.5" fill="#ca8a04" fillOpacity="0.3" />
        {/* Bold White Checkmark */}
        <path
          d="M96 108 L103 115 L118 99"
          stroke="#ffffff"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Coin Specular Glint */}
        <ellipse cx="100" cy="92" rx="9" ry="3.5" transform="rotate(-30 100 92)" fill="#ffffff" fillOpacity="0.65" />
      </g>
    </svg>
  );
}

/**
 * 6. New Arrivals
 * 3D Golden parcel box with floating bright blue rosette badge stamped "NEW".
 */
export function NewArrivalBoxIcon({ className = '', size = 120 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="New Arrival Box Icon"
    >
      <defs>
        <filter id="na-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#78350f" floodOpacity="0.3" />
        </filter>
        <filter id="na-rosette-shadow" x="-15%" y="-15%" width="135%" height="135%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#0369a1" floodOpacity="0.4" />
        </filter>
        <linearGradient id="na-box-front" x1="40" y1="90" x2="120" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="na-box-flap" x1="30" y1="70" x2="80" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="na-rosette" x1="60" y1="25" x2="100" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="40%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
      </defs>

      {/* Decorative Swirl Spirals */}
      <path
        d="M36 50 Q48 30 38 18"
        stroke="#fde047"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M124 50 Q112 30 122 18"
        stroke="#38bdf8"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Box Interior Shadow */}
      <polygon points="45,95 80,110 115,95 80,82" fill="#78350f" />

      {/* Floating 3D Scalloped "NEW" Rosette Badge */}
      <g filter="url(#na-rosette-shadow)">
        {/* Scalloped Ring */}
        <circle cx="80" cy="50" r="26" fill="url(#na-rosette)" />
        {/* Inner Ring */}
        <circle cx="80" cy="50" r="21" stroke="#bae6fd" strokeWidth="2" strokeDasharray="3 3" />
        {/* Specular Highlight Arc */}
        <ellipse cx="76" cy="36" rx="10" ry="3.5" fill="#ffffff" fillOpacity="0.6" />
        {/* "NEW" Typography */}
        <text
          x="80"
          y="56"
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="sans-serif"
          fontWeight="900"
          fontSize="15"
          letterSpacing="0.08em"
        >
          NEW
        </text>
      </g>

      {/* 3D Box Body */}
      <g filter="url(#na-shadow)">
        {/* Left main wall */}
        <polygon points="40,95 80,114 80,144 40,125" fill="#d97706" />
        {/* Right main wall */}
        <polygon points="80,114 120,95 120,125 80,144" fill="#b45309" />
        <line x1="80" y1="114" x2="80" y2="144" stroke="#78350f" strokeWidth="1.5" />

        {/* Left Open Flap */}
        <polygon points="40,95 80,114 68,124 28,104" fill="url(#na-box-flap)" />
        {/* Right Open Flap */}
        <polygon points="80,114 120,95 132,104 92,124" fill="url(#na-box-flap)" />
        {/* Back Flaps */}
        <polygon points="40,95 80,82 72,72 32,84" fill="#f59e0b" />
        <polygon points="80,82 120,95 128,84 88,72" fill="#f59e0b" />
      </g>
    </svg>
  );
}

/**
 * 7. Free Items (₦0.00) / Campus Giveaways
 * 3D Purple/Emerald treasure gift chest with floating golden "₦0" coin and sparkling stars.
 */
export function FreeItemsGiftIcon({ className = '', size = 120 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Free Items Giveaway Icon"
    >
      <defs>
        <filter id="fi-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#4c1d95" floodOpacity="0.3" />
        </filter>
        <filter id="fi-gold-glow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#ca8a04" floodOpacity="0.4" />
        </filter>
        <linearGradient id="fi-chest" x1="40" y1="80" x2="120" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="40%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#6b21a8" />
        </linearGradient>
        <linearGradient id="fi-coin" x1="60" y1="30" x2="100" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>

      {/* Floating Sparkle Stars */}
      <polygon points="42,40 45,47 52,48 47,53 48,60 42,56 36,60 37,53 32,48 39,47" fill="#facc15" />
      <polygon points="118,36 120,42 126,43 122,47 123,53 118,50 113,53 114,47 110,43 116,42" fill="#38bdf8" />

      {/* Floating ₦0 (Zero Naira) Gold Medal / Seal */}
      <g filter="url(#fi-gold-glow)">
        <circle cx="80" cy="48" r="25" fill="url(#fi-coin)" />
        <circle cx="80" cy="48" r="21" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 2" />
        <text
          x="80"
          y="56"
          textAnchor="middle"
          fill="#581c87"
          fontFamily="sans-serif"
          fontWeight="900"
          fontSize="17"
          letterSpacing="0.02em"
        >
          ₦0
        </text>
        <ellipse cx="76" cy="34" rx="9" ry="3" fill="#ffffff" fillOpacity="0.65" />
      </g>

      {/* 3D Donation Gift Box / Chest */}
      <g filter="url(#fi-shadow)">
        {/* Chest Main Body */}
        <rect x="36" y="90" width="88" height="48" rx="14" fill="url(#fi-chest)" />
        {/* Gold Trim Band */}
        <rect x="36" y="106" width="88" height="8" fill="#facc15" />
        {/* Vertical Gold Ribbon */}
        <rect x="74" y="90" width="12" height="48" fill="#facc15" />
        {/* Gold Clasp in Center */}
        <rect x="72" y="103" width="16" height="14" rx="4" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
        <circle cx="80" cy="110" r="2.5" fill="#713f12" />

        {/* Chest Lid */}
        <rect x="32" y="80" width="96" height="15" rx="7.5" fill="#a855f7" />
        <rect x="34" y="82" width="92" height="5" rx="2.5" fill="#ffffff" fillOpacity="0.4" />
      </g>
    </svg>
  );
}

/**
 * 8. AI Customer Support
 * 3D friendly robot assistant with support headset, glowing visor, and antenna.
 */
export function AiCustomerSupportIcon({ className = '', size = 120 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AI Customer Support Icon"
    >
      <defs>
        <filter id="ai-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#064e3b" floodOpacity="0.32" />
        </filter>
        <filter id="ai-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#34d399" floodOpacity="0.5" />
        </filter>
        <linearGradient id="ai-head" x1="40" y1="45" x2="120" y2="125" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ecfdf5" />
          <stop offset="40%" stopColor="#d1fae5" />
          <stop offset="100%" stopColor="#a7f3d0" />
        </linearGradient>
        <linearGradient id="ai-visor" x1="50" y1="65" x2="110" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#064e3b" />
          <stop offset="100%" stopColor="#022c22" />
        </linearGradient>
        <linearGradient id="ai-headphone" x1="20" y1="60" x2="40" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>

      {/* Antenna & Signal Orb */}
      <line x1="80" y1="24" x2="80" y2="46" stroke="#059669" strokeWidth="4" strokeLinecap="round" />
      <circle cx="80" cy="22" r="7" fill="#34d399" filter="url(#ai-glow)" />
      <circle cx="80" cy="22" r="3.5" fill="#ffffff" />

      {/* Headset Arc over Head */}
      <path
        d="M32 78 C32 46, 128 46, 128 78"
        stroke="#047857"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />

      {/* 3D Robot Head */}
      <g filter="url(#ai-shadow)">
        <rect x="38" y="46" width="84" height="74" rx="24" fill="url(#ai-head)" />
        {/* Specular edge */}
        <rect x="42" y="50" width="76" height="66" rx="20" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.8" />

        {/* Visor Screen */}
        <rect x="48" y="62" width="64" height="34" rx="12" fill="url(#ai-visor)" />

        {/* Glowing Eyes */}
        <circle cx="66" cy="79" r="6" fill="#34d399" filter="url(#ai-glow)" />
        <circle cx="66" cy="79" r="2.5" fill="#ffffff" />
        <circle cx="94" cy="79" r="6" fill="#34d399" filter="url(#ai-glow)" />
        <circle cx="94" cy="79" r="2.5" fill="#ffffff" />

        {/* Friendly Mouth Accent */}
        <path d="M72 104 Q80 110 88 104" stroke="#059669" strokeWidth="3" strokeLinecap="round" fill="none" />
      </g>

      {/* Left Earcup */}
      <g filter="url(#ai-shadow)">
        <rect x="28" y="68" width="12" height="30" rx="6" fill="url(#ai-headphone)" />
        <rect x="30" y="70" width="8" height="26" rx="4" fill="#047857" />
      </g>

      {/* Right Earcup & Microphone Boom */}
      <g filter="url(#ai-shadow)">
        <rect x="120" y="68" width="12" height="30" rx="6" fill="url(#ai-headphone)" />
        <rect x="122" y="70" width="8" height="26" rx="4" fill="#047857" />

        {/* Mic Arm curving to mouth */}
        <path
          d="M126 88 C126 114, 108 122, 94 122"
          stroke="#047857"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Mic Capsule */}
        <circle cx="92" cy="122" r="6" fill="#10b981" />
        <circle cx="92" cy="122" r="3" fill="#ffffff" />
      </g>
    </svg>
  );
}

/**
 * 9. Join Our WhatsApp Community
 * 3D emerald green WhatsApp chat bubble with connection sparkles & community crowd emblem.
 */
export function WhatsappCommunityIcon({ className = '', size = 120 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Join WhatsApp Community Icon"
    >
      <defs>
        <filter id="wa-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#065f46" floodOpacity="0.35" />
        </filter>
        <filter id="wa-glow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#22c55e" floodOpacity="0.4" />
        </filter>
        <linearGradient id="wa-bubble-grad" x1="30" y1="30" x2="130" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="40%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
        <linearGradient id="wa-badge-grad" x1="40" y1="40" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f0fdf4" />
        </linearGradient>
      </defs>

      {/* Broadcast Waves */}
      <path
        d="M32 40 C18 55, 18 105, 32 120"
        stroke="#86efac"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />
      <path
        d="M128 40 C142 55, 142 105, 128 120"
        stroke="#86efac"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />

      {/* Main 3D WhatsApp Bubble */}
      <g filter="url(#wa-shadow)">
        <circle cx="80" cy="78" r="48" fill="url(#wa-bubble-grad)" />
        {/* Tail pointing bottom-left */}
        <path d="M48 108 L36 128 L64 120 Z" fill="#15803d" />
        {/* Specular sheen on bubble top */}
        <ellipse cx="76" cy="46" rx="24" ry="8" fill="#ffffff" fillOpacity="0.4" />
      </g>

      {/* Inner White Community Plate */}
      <g filter="url(#wa-glow)">
        <circle cx="80" cy="78" r="34" fill="url(#wa-badge-grad)" />

        {/* 3 User Silhouettes (Community Network) */}
        {/* Center Leader Figure */}
        <circle cx="80" cy="68" r="7" fill="#15803d" />
        <path d="M68 90 C68 82, 92 82, 92 90 Z" fill="#15803d" />

        {/* Left Community Member */}
        <circle cx="65" cy="72" r="5" fill="#22c55e" />
        <path d="M56 89 C56 83, 74 83, 74 89 Z" fill="#22c55e" />

        {/* Right Community Member */}
        <circle cx="95" cy="72" r="5" fill="#22c55e" />
        <path d="M86 89 C86 83, 104 83, 104 89 Z" fill="#22c55e" />

        {/* Chat message dot nodes */}
        <circle cx="73" cy="98" r="2.5" fill="#16a34a" />
        <circle cx="80" cy="98" r="2.5" fill="#16a34a" />
        <circle cx="87" cy="98" r="2.5" fill="#16a34a" />
      </g>
    </svg>
  );
}
