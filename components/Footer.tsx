// Server component — static footer matching Stitch HTML exactly.
// 4-column grid: Brand, Legal, Customer Care, Connect (Instagram + Email icons).

export function Footer() {
  return (
    <footer className="bg-surface-container">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-16 py-[120px] w-full max-w-screen-2xl mx-auto">
        {/* Brand Column */}
        <div className="flex flex-col gap-4 md:col-span-1">
          <div className="font-display-lg text-display-lg text-primary mb-4">Sirini</div>
          <p className="font-body-md text-body-md text-on-surface">
            © Sirini Jewellery, Est. 2015. Handcrafted with Heritage and Intention.
          </p>
        </div>

        {/* Legal */}
        <div className="flex flex-col gap-4">
          <h4 className="font-label-caps text-label-caps font-semibold text-on-surface opacity-50 mb-2 uppercase tracking-widest">
            Legal
          </h4>
          <a
            className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
            href="/privacy"
          >
            Privacy Policy
          </a>
          <a
            className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
            href="/terms"
          >
            Terms of Service
          </a>
        </div>

        {/* Customer Care */}
        <div className="flex flex-col gap-4">
          <h4 className="font-label-caps text-label-caps font-semibold text-on-surface opacity-50 mb-2 uppercase tracking-widest">
            Customer Care
          </h4>
          <a
            className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
            href="/shipping"
          >
            Shipping &amp; Returns
          </a>
          <a
            className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors"
            href="/contact"
          >
            Contact Us
          </a>
        </div>

        {/* Connect */}
        <div className="flex flex-col gap-4">
          <h4 className="font-label-caps text-label-caps font-semibold text-on-surface opacity-50 mb-2 uppercase tracking-widest">
            Connect
          </h4>
          <div className="flex gap-4">
            {/* Instagram */}
            <a
              className="text-on-surface-variant hover:text-primary transition-colors"
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>

            {/* Email */}
            <a
              className="text-on-surface-variant hover:text-primary transition-colors"
              href="mailto:sirinijewellery@gmail.com"
              aria-label="Email"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
