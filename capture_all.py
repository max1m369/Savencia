import subprocess
import tempfile
import shutil
import os

chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
workspace = r"g:\ПРОФИ\Елена Котсерова - Сцена\СИМА"
brain = r"C:\Users\desig\.gemini\antigravity\brain\76be1657-1fcf-4d1c-a641-5ed8b432f4da"
ws_url = "file:///" + workspace.replace("\\", "/")

with open(os.path.join(workspace, 'index.html'), 'r', encoding='utf-8') as f:
    em_base = f.read()

with tempfile.TemporaryDirectory() as tmp:
    # 1. Capture full email scrolls for all variants 1..7
    variants = [(f'v{i}_full.png', f'variant{i}.html') for i in range(1, 8)]
    for vname, vfile in variants:
        out_path = os.path.join(workspace, vname)
        cmd = [
            chrome, "--headless=new", f"--user-data-dir={tmp}",
            f"--screenshot={out_path}", "--window-size=650,2300",
            f"{ws_url}/{vfile}"
        ]
        subprocess.run(cmd, capture_output=True)
        print(f"Captured {vname}")

    # 2. Capture dual-screen emulator for variants 1..7
    for num in [str(i) for i in range(1, 8)]:
        vfile = f'variant{num}.html'
        out_name = f'variant{num}_emulator.png'
        out_path = os.path.join(workspace, out_name)
        
        # Modify active button and iframe src in emulator
        mod = em_base.replace("let currentVariant = 'variant1.html';", f"let currentVariant = '{vfile}';")
        mod = mod.replace('src="variant1.html"', f'src="{vfile}"')
        
        tmp_em_name = f'_temp_em_{num}.html'
        tmp_em_path = os.path.join(workspace, tmp_em_name)
        with open(tmp_em_path, 'w', encoding='utf-8') as f:
            f.write(mod)

        tmp_url = f"{ws_url}/{tmp_em_name}"
        subprocess.run([
            chrome, "--headless=new", f"--user-data-dir={tmp}",
            f"--screenshot={out_path}", "--window-size=1550,1050",
            tmp_url
        ], capture_output=True)

        if os.path.exists(tmp_em_path):
            os.remove(tmp_em_path)
        print(f"Captured {out_name}")

# Copy all screenshots and assets to brain directory
all_files = [f"v{i}_full.png" for i in range(1, 8)] + [f"variant{i}_emulator.png" for i in range(1, 8)] + [
    "g-poster.svg", "g-poster.png", "g-logo.png",
    "A_clean_cinematic_hero.png", "hero-v1.png",
    "icon_moscow.svg", "icon_moscow.png", "icon_ufa.svg", "icon_ufa.png", "icon_belebey.svg", "icon_belebey.png", "hero_v1_festive.jpg", "barcode.png",
    "icons-remember-01.svg", "icons-remember-02.svg", "icons-remember-03.svg",
    "remember-icon-01.png", "remember-icon-02.png", "remember-icon-03.png",
    "remember-bg-01.png", "remember-bg-02.png", "remember-bg-03.png",
    "v1-icon-mood-orange.png", "v1-icon-pass-blue.png", "v1-icon-time-green.png",
    "v2-icon-mood-blue.png", "v2-icon-pass-orange.png", "v2-icon-time-green.png"
]
for fname in all_files:
    src = os.path.join(workspace, fname)
    if os.path.exists(src):
        shutil.copy(src, os.path.join(brain, fname))

# Clean up any leftover variant8 files
for v8_file in ['v8_full.png', 'variant8_emulator.png', 'variant8.html', 'variant8_retro_poster.mjml']:
    p = os.path.join(workspace, v8_file)
    if os.path.exists(p):
        os.remove(p)

print("All screenshots successfully captured and synced to brain!")
