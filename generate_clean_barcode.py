import random
from PIL import Image, ImageDraw, ImageFont

def make_barcode():
    # Width 400, Height 80 (high res)
    W, H = 400, 80
    im = Image.new("RGBA", (W, H), (255, 255, 255, 0))
    draw = ImageDraw.Draw(im)

    # We will draw vertical bars from y=4 to y=48 (height 44px)
    # Then a clear blank gap from y=48 to y=56 (8px gap)
    # Then clean text from y=58 to y=74
    bar_y_start = 4
    bar_y_end = 46

    # Random pseudo-barcode pattern (reproducible seed)
    random.seed(2027)
    x = 24
    max_x = W - 24

    while x < max_x:
        w = random.choice([2, 3, 4, 6])
        if x + w > max_x:
            break
        # Draw black bar
        draw.rectangle([x, bar_y_start, x + w - 1, bar_y_end], fill=(15, 23, 42, 255))
        # Gap
        gap = random.choice([2, 3, 4, 5])
        x += w + gap

    # Text under barcode with clean margin
    text = "* SV-2027-MOW-UFA-BEL *"
    try:
        font = ImageFont.truetype("arial.ttf", 13)
    except:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    tx = (W - tw) // 2
    ty = 54  # well below bar_y_end (46) with 8px of clear space!

    draw.text((tx, ty), text, fill=(51, 65, 85, 255), font=font)

    im.save("barcode.png")
    print("Generated pristine barcode.png with 2027 text and no overlap!")

make_barcode()
