// Inline script injected into <head> BEFORE hydration to prevent FOUC.
// Must be a plain string — no imports, no JSX deps.

const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('cc-theme') || 'system';
    var dark =
      t === 'dark' ||
      (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch(e) {}
})();
`.trim();

export function ThemeScript() {
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeScript }}
    />
  );
}
