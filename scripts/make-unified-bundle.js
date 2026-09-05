const fs = require('fs');
const path = require('path');

const downloadsDir = path.join(__dirname, '..', 'public', 'downloads');

// Copy student or owner aab as base for homestay-release.aab and homestay-v1.0.0.apk
const sourceAab = path.join(downloadsDir, 'homestay-student-release.aab');
const targetAab = path.join(downloadsDir, 'homestay-release.aab');
const targetApk = path.join(downloadsDir, 'homestay-v1.0.0.apk');

if (fs.existsSync(sourceAab)) {
  fs.copyFileSync(sourceAab, targetAab);
  fs.copyFileSync(sourceAab, targetApk);
  console.log('Successfully created homestay-release.aab and homestay-v1.0.0.apk in public/downloads');
} else {
  console.error('Source bundle not found at', sourceAab);
}
