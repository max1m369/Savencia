with open('variant7_editorial_window.mjml', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace png with svg for pure vector rendering
text = text.replace('src="f-window.png"', 'src="f-window.svg"')

# Protect from line breaks on short words
text = text.replace('— Вылет в Новый ГОД!', '&mdash;&nbsp;Вылет в&nbsp;Новый&nbsp;ГОД!')

with open('variant7_editorial_window.mjml', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated variant7_editorial_window.mjml successfully!')
