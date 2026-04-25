/**
 * Global TopBar — sort bakgrunn, Simpleness-logo. Shopify-mønster.
 * Kan utvides med søk, notifications, user-menu senere.
 */
export default function TopBar() {
  return (
    <header className="bg-neutral-900 h-11 flex items-center px-5 flex-shrink-0 border-b border-neutral-800">
      <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <img
          src="https://simpleness-design-system.vercel.app/logo-standard.png"
          alt="Simpleness"
          className="h-3.5 w-auto"
          style={{ filter: "brightness(0) invert(1)" }}
        />
      </a>
    </header>
  );
}
