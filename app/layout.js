import './globals.css';

export const metadata = {
  title: 'OmniHealth Copilot',
  description: 'All-in-one patient safety, posture, hydration, and medical assistant platform.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen selection:bg-cyan-500 selection:text-white antialiased">
        {children}
      </body>
    </html>
  );
}