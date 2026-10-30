with open('variant6_colorful_terminal.mjml', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Remove "ИНФОРМАЦИОННАЯ РАССЫЛКА В ПОЧТЕ // SAVENCIA-EVENT"
target_info = """        <mj-text font-family="'Courier New', monospace" font-size="10px" font-weight="bold" color="#64748b" letter-spacing="1.2px" padding="6px 0 0 0">
          ИНФОРМАЦИОННАЯ РАССЫЛКА В ПОЧТЕ // SAVENCIA-EVENT
        </mj-text>"""
if target_info in text:
    text = text.replace(target_info, "")
    print("Removed target_info successfully.")
else:
    print("Warning: target_info not matched directly, attempting regex/strip")
    import re
    text = re.sub(r'<mj-text[^>]*>\s*ИНФОРМАЦИОННАЯ РАССЫЛКА В ПОЧТЕ[^<]*</mj-text>', '', text)
    print("Regex replaced info text.")

# 2. Remove "// ТЕМА ПИСЬМА: ОФИЦИАЛЬНЫЙ АНОНС"
target_tema = """          <div style="font-family:'Courier New', monospace; font-size:11px; font-weight:bold; color:#38bdf8; letter-spacing:2px; text-transform:uppercase; margin-bottom:6px;">
            // ТЕМА ПИСЬМА: ОФИЦИАЛЬНЫЙ АНОНС
          </div>"""
if target_tema in text:
    text = text.replace(target_tema, "")
    print("Removed target_tema successfully.")
else:
    import re
    text = re.sub(r'<div[^>]*>\s*//\s*ТЕМА ПИСЬМА:[^<]*</div>', '', text)
    print("Regex replaced tema text.")

# 3. Center green status badge:
# Add css classes and rules
media_old = """.hero-sign { display: none !important; }"""
media_new = """.hero-sign { display: none !important; }
        .status-col { width: 100% !important; text-align: center !important; margin-top: 10px !important; }
        .status-text div { text-align: center !important; }
        .status-badge { margin: 6px auto 0 auto !important; }"""
text = text.replace(media_old, media_new)

# Update green badge column and inner styling
badge_col_old = """      <mj-column width="45%" vertical-align="middle">
        <mj-text align="right" padding="0">
          <div style="display:inline-block; background-color:#f0fdf4; border:1.5px solid #22c55e; border-radius:4px; padding:6px 12px; text-align:right;">"""

badge_col_new = """      <mj-column width="45%" vertical-align="middle" css-class="status-col">
        <mj-text align="right" padding="0" css-class="status-text">
          <div class="status-badge" style="display:inline-block; background-color:#f0fdf4; border:1.5px solid #22c55e; border-radius:4px; padding:6px 14px; text-align:center;">"""

if badge_col_old in text:
    text = text.replace(badge_col_old, badge_col_new)
    print("Replaced badge column and inner styling.")
else:
    import re
    text = re.sub(
        r'<mj-column width="45%" vertical-align="middle">\s*<mj-text align="right" padding="0">\s*<div style="display:inline-block; background-color:#f0fdf4; border:1.5px solid #22c55e; border-radius:4px; padding:6px 12px; text-align:right;">',
        badge_col_new,
        text
    )
    print("Regex replaced badge column.")

# 4. Update SV-2026 to SV-2027 throughout
text = text.replace('SV-2026', 'SV-2027').replace('Savencia 2026', 'Savencia 2027')

with open('variant6_colorful_terminal.mjml', 'w', encoding='utf-8') as f:
    f.write(text)

print("variant6_colorful_terminal.mjml updated successfully!")
