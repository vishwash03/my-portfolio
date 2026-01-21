#!/usr/bin/env python3
import os
import sys

pages_to_fix = ['about.html', 'contact.html', 'experience.html', 'stack.html']

for page in pages_to_fix:
    if not os.path.exists(page):
        print(f'❌ {page} not found')
        continue
        
    with open(page, 'r', encoding='utf-8') as f:
        content = f.read()
    
    first_close = content.find('</style>')
    if first_close == -1:
        print(f'⚠️ No </style> found in {page}')
        continue
    
    second_close = content.find('</style>', first_close + 1)
    if second_close == -1:
        print(f'✅ {page} already fixed (only one </style>)')
        continue
    
    # Calculate what we're removing
    orphaned = content[first_close + 8:second_close]
    print(f'Removing {len(orphaned)} chars of orphaned CSS from {page}...')
    
    # Reconstruct without orphaned content
    before = content[:first_close + 8]
    after = content[second_close + 8:]
    fixed = before + after
    
    # Verify we have content
    if len(fixed) > 100:
        with open(page, 'w', encoding='utf-8') as f:
            f.write(fixed)
        print(f'✅ Fixed {page}')
    else:
        print(f'❌ {page} would be too short, skipping')

print('\n✨ Done fixing CSS!')
