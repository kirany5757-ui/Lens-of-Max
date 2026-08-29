const fs = require('fs');
const file = 'app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace state definition
content = content.replace(
  /const cursorRef = useRef<HTMLDivElement \| null>\(null\);\s*const \[cursor, setCursor\] = useState\(\{ x: 0, y: 0, visible: false \}\);/g,
  `const cursorX = useSpring(0, { stiffness: 300, damping: 25 });
  const cursorY = useSpring(0, { stiffness: 300, damping: 25 });
  const [cursorVisible, setCursorVisible] = useState(false);`
);

// Replace grid image handlers
content = content.replace(
  /onMouseMove=\{\(e\) => \{\s*if \(cursorRef\.current\) \{\s*cursorRef\.current\.style\.transform =\s*`translate\(\$\{e\.clientX - 14\}px, \$\{e\.clientY - 14\}px\)`\s*;\s*\}\s*\}\}\s*onMouseEnter=\{\(e\) => setCursor\(\{ x: e\.clientX, y: e\.clientY, visible: true \}\)\}\s*onMouseLeave=\{.*?\}\}/,
  `onMouseMove={(e) => {
                      cursorX.set(e.clientX - 14);
                      cursorY.set(e.clientY - 14);
                    }}
                    onMouseEnter={() => setCursorVisible(true)}
                    onMouseLeave={() => setCursorVisible(false)}`
);

// Replace modal main image handlers
content = content.replace(
  /onMouseMove=\{\(e\) => \{\s*if \(cursorRef\.current\) \{\s*cursorRef\.current\.style\.transform = \s*`translate\(\$\{e\.clientX - 17\}px, \$\{e\.clientY - 17\}px\)`\s*;\s*\}\s*\}\}\s*onMouseEnter=\{\(e\) => setCursor\(\{ x: e\.clientX, y: e\.clientY, visible: true \}\)\}\s*onMouseLeave=\{.*?\}\}/,
  `onMouseMove={(e) => {
                    cursorX.set(e.clientX - 17);
                    cursorY.set(e.clientY - 17);
                  }}
                  onMouseEnter={() => setCursorVisible(true)}
                  onMouseLeave={() => setCursorVisible(false)}`
);

// Replace modal thumbnail handlers
content = content.replace(
  /onMouseMove=\{\(e\) => \{\s*if \(cursorRef\.current\) \{\s*cursorRef\.current\.style\.transform =\s*`translate\(\$\{e\.clientX - 14\}px, \$\{e\.clientY - 14\}px\)`\s*;\s*\}\s*\}\}\s*onMouseEnter=\{\(e\) => setCursor\(\{ x: e\.clientX, y: e\.clientY, visible: true \}\)\}\s*onMouseLeave=\{.*?\}\}/,
  `onMouseMove={(e) => {
                            cursorX.set(e.clientX - 14);
                            cursorY.set(e.clientY - 14);
                          }}
                          onMouseEnter={() => setCursorVisible(true)}
                          onMouseLeave={() => setCursorVisible(false)}`
);

// Replace cursor element
content = content.replace(
  /<div ref=\{cursorRef\} className=\{`camera-cursor \$\{cursor\.visible \? "" : "hidden"\}\`\}>\s*<span className="camera-cursor-icon">📷<\/span>\s*<\/div>/,
  `<motion.div 
        className={\`camera-cursor \${cursorVisible ? "" : "hidden"}\`}
        style={{ x: cursorX, y: cursorY }}
      >
        <span className="camera-cursor-icon">📷</span>
      </motion.div>`
);

fs.writeFileSync(file, content);
console.log("Cursor code updated.");
