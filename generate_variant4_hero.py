import math
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1120, 480

def create_first_class_hero():
    # Base image - Deep Savencia Night Blue
    img = Image.new("RGBA", (W, H), (0, 35, 47, 255))
    draw = ImageDraw.Draw(img)

    # 1. Luxury Aéropostale Diagonal Chevron Ribbon (Top & Bottom)
    stripe_w = 24
    border_h = 12
    
    # Top chevron strip
    for i, x in enumerate(range(-stripe_w, W + stripe_w, stripe_w)):
        col = [(222, 106, 9, 255), (0, 75, 98, 255), (255, 255, 255, 255)][(i // 1) % 3]
        draw.polygon([(x, 0), (x + stripe_w, 0), (x + stripe_w - 8, border_h), (x - 8, border_h)], fill=col)
    
    # Bottom chevron strip
    for i, x in enumerate(range(-stripe_w, W + stripe_w, stripe_w)):
        col = [(222, 106, 9, 255), (0, 75, 98, 255), (255, 255, 255, 255)][(i // 1) % 3]
        draw.polygon([(x, H - border_h), (x + stripe_w, H - border_h), (x + stripe_w - 8, H), (x - 8, H)], fill=col)

    # 2. Golden & Cyan Double Border Framing
    pad = 28
    draw.rectangle([(pad, pad), (W - pad, H - pad)], outline=(222, 106, 9, 180), width=1)
    draw.rectangle([(pad + 6, pad + 6), (W - pad - 6, H - pad - 6)], outline=(0, 143, 208, 90), width=1)
    
    # Corner brackets with golden dots
    b_len = 22
    for bx, by in [(pad, pad), (W - pad, pad), (pad, H - pad), (W - pad, H - pad)]:
        dx = 1 if bx == pad else -1
        dy = 1 if by == pad else -1
        draw.line([(bx, by), (bx + dx * b_len, by)], fill=(244, 184, 96, 255), width=2)
        draw.line([(bx, by), (bx, by + dy * b_len)], fill=(244, 184, 96, 255), width=2)
        draw.ellipse([(bx + dx*8 - 3, by + dy*8 - 3), (bx + dx*8 + 3, by + dy*8 + 3)], fill=(222, 106, 9, 255))

    # 3. Central Circular Embossed Travel Seal (Штамп первого класса)
    cx, cy = W // 2, H // 2
    seal_r = 135

    # Outer decorative notched ring
    for angle in range(0, 360, 3):
        rad = math.radians(angle)
        sx1 = cx + int((seal_r + 3) * math.cos(rad))
        sy1 = cy + int((seal_r + 3) * math.sin(rad))
        sx2 = cx + int((seal_r + 8) * math.cos(rad))
        sy2 = cy + int((seal_r + 8) * math.sin(rad))
        draw.line([(sx1, sy1), (sx2, sy2)], fill=(222, 106, 9, 140), width=1)

    draw.ellipse([(cx - seal_r, cy - seal_r), (cx + seal_r, cy + seal_r)], outline=(244, 184, 96, 240), width=2)
    draw.ellipse([(cx - seal_r + 8, cy - seal_r + 8), (cx + seal_r - 8, cy + seal_r - 8)], outline=(0, 143, 208, 120), width=1)
    draw.ellipse([(cx - seal_r + 32, cy - seal_r + 32), (cx + seal_r - 32, cy + seal_r - 32)], outline=(222, 106, 9, 200), width=1)

    # 4. Golden Airplane Silhouette inside the seal
    draw.polygon([
        (cx, cy - 55),      # Nose
        (cx - 9, cy - 22),
        (cx - 80, cy + 16), # Left wingtip
        (cx - 70, cy + 24),
        (cx - 11, cy + 10),
        (cx - 11, cy + 42),
        (cx - 32, cy + 58), # Left stabilizer
        (cx - 27, cy + 63),
        (cx, cy + 50),      # Tail tip
        (cx + 27, cy + 63), # Right stabilizer
        (cx + 32, cy + 58),
        (cx + 11, cy + 42),
        (cx + 11, cy + 10),
        (cx + 70, cy + 24),
        (cx + 80, cy + 16), # Right wingtip
        (cx + 9, cy - 22)
    ], fill=(244, 184, 96, 240), outline=(222, 106, 9, 255))

    # Center fuselage core highlight
    draw.ellipse([(cx - 12, cy - 10), (cx + 12, cy + 18)], fill=(255, 255, 255, 230))

    # Circular text around seal top and bottom
    # Top arc label
    draw.text((cx - 115, cy - seal_r + 14), "★  GROUPE SAVENCIA  ★", fill=(244, 184, 96, 230))
    # Bottom arc label
    draw.text((cx - 110, cy + seal_r - 28), "★ FIRST CLASS FLIGHT ★", fill=(244, 184, 96, 230))

    # 5. Constellation Flight Route (Left: MOW -> UFA -> BEL -> Right: NEW YEAR)
    # Left nodes
    mx, my = pad + 90, cy + 50
    ux, uy = pad + 220, cy - 45
    bx, by = pad + 320, cy + 65
    # Right destination
    nx, ny = W - pad - 110, cy - 30

    nodes = [(mx, my, "MOSCOW", "DEP 17:00"), (ux, uy, "UFA", "DEP 17:00"), (bx, by, "BELEBEY", "DEP 15:00")]
    for i in range(len(nodes) - 1):
        x1, y1 = nodes[i][0], nodes[i][1]
        x2, y2 = nodes[i+1][0], nodes[i+1][1]
        draw.line([(x1, y1), (x2, y2)], fill=(244, 184, 96, 180), width=2)
        mx_mid, my_mid = (x1 + x2) // 2, (y1 + y2) // 2
        draw.ellipse([(mx_mid - 2, my_mid - 2), (mx_mid + 2, my_mid + 2)], fill=(255, 255, 255, 255))
    
    # Connect to seal and then to New Year
    draw.line([(bx, by), (cx - seal_r + 10, cy + 20)], fill=(222, 106, 9, 180), width=2)
    draw.line([(cx + seal_r - 10, cy - 10), (nx, ny)], fill=(222, 106, 9, 220), width=2)

    # Draw city node points
    for x, y, city, time_str in nodes:
        draw.ellipse([(x - 9, y - 9), (x + 9, y + 9)], outline=(222, 106, 9, 255), width=2)
        draw.ellipse([(x - 4, y - 4), (x + 4, y + 4)], fill=(255, 255, 255, 255))
        draw.text((x - 24, y + 14), city, fill=(255, 255, 255, 255))
        draw.text((x - 24, y + 28), time_str, fill=(0, 143, 208, 220))

    # Right Destination: Glowing Golden Star of 2026
    draw.ellipse([(nx - 14, ny - 14), (nx + 14, ny + 14)], outline=(244, 184, 96, 255), width=2)
    draw.ellipse([(nx - 5, ny - 5), (nx + 5, ny + 5)], fill=(255, 255, 255, 255))
    for angle in [0, 45, 90, 135, 180, 225, 270, 315]:
        rad = math.radians(angle)
        draw.line([(nx + int(15*math.cos(rad)), ny + int(15*math.sin(rad))),
                   (nx + int(25*math.cos(rad)), ny + int(25*math.sin(rad)))],
                  fill=(222, 106, 9, 240), width=2)
    draw.text((nx - 45, ny + 18), "NEW YEAR 2026", fill=(244, 184, 96, 255))
    draw.text((nx - 45, ny + 32), "FINAL DESTINATION", fill=(52, 211, 153, 230))

    # 6. Metadata labels in luxury serif / monospace
    draw.text((pad + 20, pad + 16), "GROUPE SAVENCIA // FIRST CLASS AIRMAIL EXPEDITION", fill=(222, 106, 9, 255))
    draw.text((pad + 20, pad + 32), "OFFICIAL CORPORATE COMMUNIQUÉ · FLIGHT SV-2026 · 10.DEC.2026", fill=(148, 163, 184, 255))

    draw.text((W - pad - 280, pad + 16), "SERVICE DE PREMIÈRE CLASSE", fill=(244, 184, 96, 255))
    draw.text((W - pad - 280, pad + 32), "STATUS: CONFIRMED ALL-TEAM FLIGHT", fill=(52, 211, 153, 255))

    # Floating golden stars / embers
    random.seed(1012)
    for _ in range(35):
        ex = random.randint(pad + 15, W - pad - 15)
        ey = random.randint(pad + 15, H - pad - 15)
        # Avoid center seal
        if (ex - cx)**2 + (ey - cy)**2 < (seal_r + 15)**2:
            continue
        er = random.randint(1, 2)
        draw.ellipse([(ex - er, ey - er), (ex + er, ey + er)], fill=(244, 184, 96, random.randint(80, 200)))

    # Save output
    img = img.convert("RGB")
    img.save("hero_first_class_folio.jpg", "JPEG", quality=92, optimize=True)
    print("hero_first_class_folio.jpg generated successfully!")

if __name__ == "__main__":
    create_first_class_hero()
