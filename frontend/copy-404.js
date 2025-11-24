// Simple script to copy 404.html to dist folder
import { copyFileSync } from 'fs';
import { join } from 'path';

try {
  copyFileSync(
    join(process.cwd(), 'public', '404.html'),
    join(process.cwd(), 'dist', '404.html')
  );
  console.log('✓ 404.html copied to dist');
} catch (error) {
  console.error('Error copying 404.html:', error.message);
  process.exit(1);
}

