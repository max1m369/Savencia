import subprocess
import tempfile
import shutil
import os

chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
workspace = r"g:\ПРОФИ\Елена Котсерова - Сцена\СИМА"
brain = r"C:\Users\desig\.gemini\antigravity\brain\76be1657-1fcf-4d1c-a641-5ed8b432f4da"
ws_url = "file:///" + workspace.replace("\\", "/")

with tempfile.TemporaryDirectory() as tmp:
    # Full email captures
    for vname, vfile in [
        ('v1_full.png', 'variant1.html'),
        ('v2_full.png', 'variant2.html'),
        ('v3_full.png', 'variant3.html'),
        ('v5_full.png', 'variant5.html')
    ]:
        subprocess.run([
            chrome, "--headless=new", f"--user-data-dir={tmp}",
            f"--screenshot={os.path.join(workspace, vname)}", "--window-size=650,2300",
            f"{ws_url}/{vfile}"
        ], capture_output=True)

    # Emulator Variant 5
    subprocess.run([
        chrome, "--headless=new", f"--user-data-dir={tmp}",
        f"--screenshot={os.path.join(workspace, 'variant5_emulator.png')}", "--window-size=1550,1050",
        f"{ws_url}/emulator.html"
    ], capture_output=True)

for fname in ["wireframe_shot.png", "v1_full.png", "v2_full.png", "v3_full.png", "v4_full.png", "v5_full.png", "variant1_emulator.png", "variant2_emulator.png", "variant3_emulator.png", "variant4_emulator.png", "variant5_emulator.png"]:
    src = os.path.join(workspace, fname)
    if os.path.exists(src):
        shutil.copy(src, os.path.join(brain, fname))

print("All screenshots generated and synced to brain directory!")
