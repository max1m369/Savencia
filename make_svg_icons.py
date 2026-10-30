# Create SVG files for Moscow, Ufa, and Belebey icons

svg_moscow = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80" fill="none" stroke="#004b62" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <!-- Ground line -->
  <line x1="6" y1="74" x2="74" y2="74" stroke-width="2" />
  
  <!-- Kremlin wall left -->
  <path d="M 8,74 L 8,56 L 14,56 L 14,60 L 18,60 L 18,56 L 24,56 L 24,74" fill="#f0fdf4" fill-opacity="0.2"/>
  <path d="M 10,56 L 12,52 L 14,56" />
  <path d="M 20,56 L 22,52 L 24,56" />
  <!-- Small left turret -->
  <rect x="24" y="52" width="6" height="22" />
  <path d="M 24,52 L 27,42 L 30,52 Z" />

  <!-- Kremlin wall right -->
  <path d="M 56,74 L 56,52 L 62,52 L 62,74" />
  <path d="M 56,52 L 59,42 L 62,52 Z" />
  <path d="M 62,74 L 62,56 L 68,56 L 68,60 L 72,60 L 72,56 L 74,56 L 74,74" />
  <path d="M 64,56 L 66,52 L 68,56" />

  <!-- Main Spasskaya Tower Body -->
  <!-- Lower level -->
  <rect x="30" y="46" width="20" height="28" fill="#ffffff" fill-opacity="0.9"/>
  <!-- Central arched gate -->
  <path d="M 36,74 L 36,62 C 36,58 44,58 44,62 L 44,74" fill="#004b62" stroke="none"/>
  
  <!-- Middle clock tier -->
  <rect x="33" y="34" width="14" height="12" fill="#ffffff" />
  <!-- Chimes clock face -->
  <circle cx="40" cy="40" r="4.5" stroke="#de6a09" stroke-width="1.2" fill="#fff7ed"/>
  <line x1="40" y1="40" x2="40" y2="37.5" stroke="#de6a09" stroke-width="1.2" />
  <line x1="40" y1="40" x2="42" y2="40" stroke="#de6a09" stroke-width="1.2" />

  <!-- Upper octagonal tier -->
  <path d="M 35,34 L 37,24 L 43,24 L 45,34" fill="#ffffff"/>
  
  <!-- Tent roof spire -->
  <path d="M 37,24 L 40,8 L 43,24 Z" fill="#004b62" fill-opacity="0.15" />
  <line x1="40" y1="8" x2="40" y2="4" stroke-width="1.5" />
  
  <!-- Ruby Star on top -->
  <polygon points="40,2 41.2,5 44,5 41.8,6.8 42.6,9.5 40,7.8 37.4,9.5 38.2,6.8 36,5 38.8,5" fill="#de6a09" stroke="#de6a09" stroke-width="0.8"/>
</svg>"""

svg_ufa = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80" fill="none" stroke="#004b62" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <!-- Ground cliff line / Pedestal rock -->
  <line x1="6" y1="74" x2="74" y2="74" stroke-width="2" />
  <path d="M 12,74 C 18,73 24,70 28,64 C 32,58 46,57 52,62 C 58,67 66,72 70,74" fill="#004b62" fill-opacity="0.1" />
  <!-- Rock texture lines -->
  <line x1="26" y1="68" x2="36" y2="74" stroke-width="1.2" />
  <line x1="42" y1="65" x2="50" y2="74" stroke-width="1.2" />

  <!-- Horse Body & Legs -->
  <!-- Rearing front legs -->
  <path d="M 32,54 C 28,48 24,40 22,34 L 20,35" stroke-width="2" />
  <path d="M 34,51 C 31,44 28,37 28,31 L 26,32" stroke-width="1.8" />
  <!-- Horse barrel/body -->
  <path d="M 30,52 C 34,48 42,47 50,50 C 56,52 60,56 61,63" fill="#ffffff" stroke-width="2"/>
  <!-- Hind legs planted on rock -->
  <path d="M 52,51 L 56,62 L 54,67" stroke-width="2" />
  <path d="M 48,52 L 49,63 L 47,66" stroke-width="1.8" />
  <!-- Horse neck and head -->
  <path d="M 33,48 C 30,42 29,36 31,31 C 32,28 34,27 36,29 C 38,32 37,38 41,44" fill="#ffffff" stroke-width="2"/>
  <path d="M 32,28 L 33,26" stroke-width="1.5" /> <!-- Ear -->
  <!-- Horse tail flowing back -->
  <path d="M 60,56 C 66,60 68,67 67,72" stroke-width="1.8" stroke-dasharray="1,1" />

  <!-- Rider: Salavat Yulaev -->
  <!-- Torso & Cloak -->
  <path d="M 44,44 L 43,30 C 43,26 47,26 48,30 L 49,44" fill="#ffffff" stroke-width="2" />
  <!-- Head & traditional Bashkir fur cap (Bureck) -->
  <circle cx="45" cy="22" r="4" fill="#004b62" fill-opacity="0.2"/>
  <path d="M 41,20 C 41,17 49,17 49,20 Z" fill="#de6a09" stroke="#de6a09" />
  <!-- Raised arm with whip pointing high -->
  <path d="M 42,30 C 38,24 35,16 33,10" stroke="#de6a09" stroke-width="2.2" />
  <path d="M 33,10 L 31,6" stroke="#de6a09" stroke-width="1.5" /> <!-- Whip / lash -->
  <!-- Left hand holding reins -->
  <path d="M 46,34 L 38,35" stroke-width="1.5" />
</svg>"""

svg_belebey = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80" fill="none" stroke="#004b62" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <!-- Ground line -->
  <line x1="6" y1="74" x2="74" y2="74" stroke-width="2" />
  
  <!-- Base frame skid -->
  <rect x="14" y="70" width="54" height="4" fill="#004b62" fill-opacity="0.1" />

  <!-- Triangular Samson Post / A-Frame Tower -->
  <line x1="42" y1="28" x2="30" y2="70" stroke-width="2.2" />
  <line x1="42" y1="28" x2="54" y2="70" stroke-width="2.2" />
  <line x1="33" y1="58" x2="51" y2="58" stroke-width="1.5" />
  <line x1="37" y1="44" x2="47" y2="44" stroke-width="1.5" />

  <!-- Walking Beam (Балансир) pivoted at (42, 28) -->
  <!-- Beam tilted: left side up, right side down -->
  <line x1="16" y1="20" x2="62" y2="34" stroke="#004b62" stroke-width="3.5" />
  <!-- Center pivot bearing -->
  <circle cx="42" cy="28" r="3" fill="#de6a09" stroke="#004b62" stroke-width="1.5" />

  <!-- Horsehead (головка балансира) on the left -->
  <path d="M 16,14 C 12,18 12,24 16,30 L 17,20 Z" fill="#de6a09" stroke="#de6a09" stroke-width="1.5" />

  <!-- Polished Rod / Wellhead hanging from horsehead -->
  <line x1="12" y1="26" x2="12" y2="66" stroke="#475569" stroke-width="1.5" />
  <!-- Wellhead equipment / stuffing box -->
  <rect x="9" y="66" width="6" height="4" fill="#004b62" />

  <!-- Counterweight & Pitman arm on the right -->
  <!-- Pitman arm -->
  <line x1="60" y1="34" x2="58" y2="52" stroke-width="2" />
  <!-- Rotating crank and counterweight -->
  <circle cx="58" cy="56" r="6" fill="#ffffff" stroke="#de6a09" stroke-width="1.5" />
  <path d="M 54,54 C 56,50 64,52 62,60 Z" fill="#de6a09" stroke="#de6a09" />
  
  <!-- Motor housing box on skid -->
  <rect x="62" y="62" width="8" height="8" fill="#004b62" fill-opacity="0.2" />
</svg>"""

with open('icon_moscow.svg', 'w', encoding='utf-8') as f:
    f.write(svg_moscow)
with open('icon_ufa.svg', 'w', encoding='utf-8') as f:
    f.write(svg_ufa)
with open('icon_belebey.svg', 'w', encoding='utf-8') as f:
    f.write(svg_belebey)

print("Created icon_moscow.svg, icon_ufa.svg, icon_belebey.svg successfully!")
