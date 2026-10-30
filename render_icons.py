import os
import subprocess

cwd = os.path.dirname(os.path.abspath(__file__))
chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

for icon in ['icon_moscow', 'icon_ufa', 'icon_belebey']:
    svg_path = os.path.join(cwd, f"{icon}.svg")
    with open(svg_path, 'r', encoding='utf-8') as f:
        svg_code = f.read()
    
    html = f"""<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body {{ margin:0; padding:0; background:transparent; overflow:hidden; }} svg {{ display:block; width:80px; height:80px; }}</style>
</head><body>{svg_code}</body></html>"""
    
    tmp_html = os.path.join(cwd, f"render_{icon}.html")
    with open(tmp_html, 'w', encoding='utf-8') as f:
        f.write(html)
        
    png_path = os.path.join(cwd, f"{icon}.png")
    cmd = [
        chrome, "--headless=new", "--disable-gpu",
        "--window-size=80,80", "--device-scale-factor=2",
        "--default-background-color=00000000",
        f"--screenshot={png_path}",
        f"file:///{tmp_html.replace(os.sep, '/')}"
    ]
    subprocess.run(cmd, check=True)
    if os.path.exists(tmp_html):
        os.remove(tmp_html)
    print(f"Rendered {icon}.png ({os.path.getsize(png_path)} bytes)")
