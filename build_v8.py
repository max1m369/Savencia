with open('SOL/dist/g.mjml', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace asset URLs with local filenames
content = content.replace('https://example.com/savencia-assets/g-logo.png', 'g-logo.png')
content = content.replace('https://example.com/savencia-assets/g-poster.png', 'g-poster.png')

with open('variant8_retro_poster.mjml', 'w', encoding='utf-8') as f:
    f.write(content)

print("Created variant8_retro_poster.mjml successfully.")
