import fs from 'fs';
fetch('https://www.alibabacloud.com/help/en/model-studio/other-tools-coding-plan')
  .then(res => res.text())
  .then(text => fs.writeFileSync('fetch_result.html', text));
