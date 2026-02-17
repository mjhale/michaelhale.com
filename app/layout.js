import './globals.css';
import { Abril_Fatface, Inter, Playfair_Display } from 'next/font/google';
import Header from '@/src/components/header';
import Footer from '@/src/components/footer';
import SkipLink from '@/src/components/skip-link';
import { site } from '@/src/lib/site';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-sans-next',
  display: 'swap'
});

// Include both italic and normal
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['700'],
  style: ['normal', 'italic'],
  variable: '--font-serif-next',
  display: 'swap'
});

const abrilFatface = Abril_Fatface({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display-next',
  display: 'swap'
});

export const metadata = {
  metadataBase: new URL(site.siteUrl),
  title: {
    default: site.title,
    template: `%s | ${site.title}`
  },
  description: site.description,
  icons: {
    icon: '/images/portfolio-icon.png'
  }
};

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.variable} ${playfairDisplay.variable} ${abrilFatface.variable}`} lang="en">
      <body className={inter.className}>
        <SkipLink />
        <Header />
        <main className="bg-brand-cream py-6" id="content">
          <div className="mx-auto w-full max-w-[1040px] px-5">{children}</div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
