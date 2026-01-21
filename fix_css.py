import os

pages_to_fix = ['about.html', 'contact.html', 'experience.html', 'stack.html']

for page in pages_to_fix:
    with open(page, 'r', encoding='utf-8') as f:
        content = f.read()
    
    first_close = content.find('</style>')
    if first_close == -1:
        print(f'No </style> found in {page}')
        continue
    
    second_close = content.find('</style>', first_close + 1)
    if second_close == -1:
        print(f'Only one </style> in {page}')
        continue
    
    before = content[:first_close + len('</style>')]
    after = content[second_close + len('</style>'):]
    fixed = before + after
    
    with open(page, 'w', encoding='utf-8') as f:
        f.write(fixed)
    
    print(f'Fixed {page}')

print('All fixed!')
