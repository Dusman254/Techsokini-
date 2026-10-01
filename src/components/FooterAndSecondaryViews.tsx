import React from 'react';
import { ArrowLeft, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';

export const WishlistView: React.FC = () => {
  const { products, wishlist, navigate } = useStore();
  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="min-h-[75vh] max-w-[1440px] mx-auto px-4 sm:px-8 py-12">
      <div className="pb-8 border-b border-[#141413]/10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono-num uppercase tracking-[0.22em] text-[#6E6D68] mb-2">
            TECH SOKONI · PERSONAL ARCHIVE
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#141413]">
            Saved Wishlist ({wishlistedProducts.length})
          </h1>
        </div>
        <button
          onClick={() => navigate({ page: 'category', categoryId: 'all' })}
          className="text-xs font-mono-num uppercase tracking-widest text-[#141413] hover:opacity-70 flex items-center gap-1.5 cursor-pointer self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Browsing</span>
        </button>
      </div>

      {wishlistedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-10">
          {wishlistedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center space-y-4">
          <h2 className="font-editorial text-3xl text-[#141413]">
            Your wishlist is currently empty.
          </h2>
          <p className="text-xs text-[#6E6D68] max-w-md mx-auto">
            Save configurations while browsing our showroom to compare
            specifications and track active privileges.
          </p>
          <button
            onClick={() => navigate({ page: 'home' })}
            className="px-6 py-2.5 bg-[#141413] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-widest cursor-pointer"
          >
            Return to Showroom
          </button>
        </div>
      )}
    </div>
  );
};

export const InfoSectionView: React.FC<{
  section:
    | 'about'
    | 'delivery'
    | 'returns'
    | 'warranty'
    | 'faq'
    | 'contact'
    | 'privacy'
    | 'terms';
}> = ({ section }) => {
  const { settings, navigate } = useStore();

  const contentMap = {
    about: {
      kicker: 'COMPANY · ABOUT TECH SOKONI KENYA',
      title: 'Premium Imports, Enterprise Computers & Curated Hardware.',
      body: [
        'Tech Sokoni Kenya (techsokoni.com) is a premier electronics showroom and enterprise hardware supplier located in Nairobi CBD at Kenyatta Pioneer Building, along Kenyatta Avenue, 5th Floor, Shop Number 514 (Next to I&M Building).',
        'We specialize in 100% genuine brand imports and enterprise computers — including Apple MacBooks, HP EliteBooks & Spectres, Dell XPS workstations, iPhones, Samsung Galaxy flagships, genuine Epson EcoTank & HP LaserJet printers, and Anker & Sony studio accessories.',
        'Every machine in our catalog is rigorously verified for battery health, thermal performance, and authentic serial provenance — backed by our 1-Year Local & Manufacturer Warranty, instant Lipa Na M-Pesa clearing (Buy Goods Till: 9309020), and Payment on Delivery nationwide.',
      ],
    },
    delivery: {
      kicker: 'CUSTOMER SUPPORT · DELIVERY & PAYMENT ON DELIVERY',
      title: '2-Hour Nairobi Express & 100% Free Nationwide Shipping.',
      body: [
        'We ship nationwide across all 47 counties of Kenya with 100% Free Shipping and zero delivery surcharge. Nairobi addresses (CBD, Westlands, Waiyaki Way, Kilimani, Karen, etc.) qualify for same-day 2-hour express rider delivery.',
        'Upcountry deliveries to Mombasa, Kisumu, Nakuru, Eldoret, Thika, Kiambu, Machakos, Meru, Nyeri, and Kajiado arrive within 24 to 48 hours via insured courier.',
        'Payment on Delivery (Inspect First): You are permitted to inspect the physical package and hardware upon arrival before paying via Cash or M-Pesa (Buy Goods Till No: 9309020) to the courier.',
      ],
    },
    returns: {
      kicker: 'CUSTOMER SUPPORT · RETURNS',
      title: '14-Day Showroom Exchange & Return Policy.',
      body: [
        'If a hardware system does not integrate seamlessly into your workflow, you may initiate a return or configuration exchange within 14 calendar days of delivery at our Nairobi CBD showroom (Kenyatta Pioneer Building, 5th Floor, Shop 514).',
        'For any factory hardware defect discovered within 30 days, Tech Sokoni provides an immediate verified replacement unit.',
      ],
    },
    warranty: {
      kicker: 'CUSTOMER SUPPORT · WARRANTY',
      title: '1-Year Official & Boutique Hardware Warranty.',
      body: [
        'Every laptop, phone, desktop, monitor, genuine Epson EcoTank printer, and Anker power system sold at Tech Sokoni is 100% manufacturer-certified and includes a 1-Year Local Kenya & Manufacturer Warranty.',
        'All warranty diagnostics, upgrades, and priority service are handled directly at Kenyatta Pioneer Building, 5th Floor, Shop 514, Kenyatta Avenue (Next to I&M Building), Nairobi CBD.',
      ],
    },
    faq: {
      kicker: 'CUSTOMER SUPPORT · FAQS',
      title: 'Frequently Asked Questions.',
      body: [
        'Where is Tech Sokoni located? — Visit our Nairobi CBD Storefront at Kenyatta Pioneer Building, along Kenyatta Avenue, 5th Floor, Shop Number 514 (Next to I&M Building). Orders Hotline & WhatsApp: +254 792 620 789.',
        'How does Payment on Delivery (Cash or M-Pesa on Delivery) work? — We offer Payment on Delivery across Nairobi County and major towns nationwide in Kenya. You inspect the physical package and hardware upon arrival before paying via Cash or M-Pesa (Buy Goods Till: 9309020).',
        'Are the products genuine and covered by warranty? — Absolutely. Every system is 100% genuine, serial-verified, and backed by a 1-year local service warranty.',
      ],
    },
    contact: {
      kicker: 'CONCIERGE · CONTACT TECH SOKONI',
      title: 'Visit Our Kenyatta Avenue Showroom or Chat on WhatsApp.',
      body: [
        'Physical Address: Kenyatta Pioneer Building, along Kenyatta Avenue, 5th Floor, Shop Number 514 (Next to I&M Building), Nairobi CBD, Kenya.',
        'Orders Hotline & WhatsApp: +254 792 620 789 / 0792 620 789 · Email: shop@techsokoni.com',
        'Lipa Na M-Pesa Buy Goods Till Number: 9309020 · Hours: Monday – Saturday, 8:30 AM – 6:30 PM EAT.',
      ],
    },
    privacy: {
      kicker: 'LEGAL · PRIVACY POLICY',
      title: 'Client Data & Serial Registration Privacy.',
      body: [
        'Tech Sokoni collects only the contact, delivery, and hardware serial registration data required to fulfill your order and honor your warranty.',
        'We never sell or share client records with third-party marketing networks.',
      ],
    },
    terms: {
      kicker: 'LEGAL · TERMS OF SERVICE',
      title: 'Terms of Sale & Hardware Guarantee.',
      body: [
        'All prices listed on Tech Sokoni reflect live inventory and active promotional privileges.',
        'Serial numbers are recorded on every invoice to guarantee authentic warranty service at Kenyatta Pioneer Building, Shop 514, Nairobi.',
      ],
    },
  }[section];

  return (
    <div className="min-h-[70vh] max-w-3xl mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-6">
      <button
        onClick={() => navigate({ page: 'home' })}
        className="text-xs font-mono-num uppercase tracking-widest text-[#6E6D68] hover:text-[#141413] flex items-center gap-1.5 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Showroom</span>
      </button>

      <p className="text-[11px] font-mono-num uppercase tracking-[0.22em] text-[#6E6D68]">
        {contentMap.kicker}
      </p>
      <h1 className="font-editorial text-3xl sm:text-5xl text-[#141413]">
        {contentMap.title}
      </h1>
      <div className="space-y-4 pt-4 border-t border-[#141413]/10 text-sm text-[#5E5D59] leading-relaxed">
        {contentMap.body.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {/* Showroom Location & Direct WhatsApp Contact Card */}
      <div className="mt-8 p-5 bg-[#EAE9E4]/70 border border-[#141413]/12 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <p className="font-mono-num text-[10px] uppercase tracking-wider text-[#6E6D68]">
              Nairobi CBD Storefront
            </p>
            <p className="font-semibold text-[#141413]">
              Kenyatta Pioneer Building, 5th Floor, Shop 514
            </p>
            <p className="text-[#5E5D59]">
              Along Kenyatta Avenue (Next to I&amp;M Building), Nairobi CBD
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-mono-num text-[10px] uppercase tracking-wider text-[#6E6D68]">
              Direct Contact &amp; M-Pesa Till
            </p>
            <p className="font-semibold text-[#141413]">
              Tel / WhatsApp: +254 792 620 789
            </p>
            <p className="text-[#5E5D59]">
              Email: shop@techsokoni.com · Buy Goods Till: 9309020
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href="https://wa.me/254792620789?text=Hello%20Tech%20Sokoni!%20I%20would%20like%20to%20make%20an%20inquiry."
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-[#1F6F43] text-[#F4F3EF] text-xs font-mono-num uppercase tracking-wider inline-flex items-center gap-2 hover:bg-[#185835] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp (+254 792 620 789)</span>
          </a>
          <a
            href="tel:+254792620789"
            className="px-4 py-2.5 border border-[#141413]/25 bg-[#F4F3EF] text-[#141413] text-xs font-mono-num uppercase tracking-wider inline-flex items-center gap-2 hover:border-[#141413] transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call +254 792 620 789</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export const Footer: React.FC = () => {
  const { settings, navigate } = useStore();

  return (
    <footer className="bg-[#F4F3EF] border-t border-[#141413]/12 text-[#141413]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-14 border-b border-[#141413]/10">
          {/* Brand & Authentic Showroom Column */}
          <div className="lg:col-span-4 space-y-4">
            <button
              onClick={() => navigate({ page: 'home' })}
              className="text-lg font-semibold tracking-[0.18em] uppercase text-[#141413] cursor-pointer"
            >
              TECH SOKONI
            </button>
            <p className="text-xs text-[#5E5D59] max-w-sm leading-relaxed">
              Technology that moves you. Premium laptops, smartphones, desktops,
              monitors, genuine Epson &amp; HP printers, and studio accessories.
              Inspect your package upon arrival before paying via Cash or M-Pesa.
            </p>
            <div className="pt-2 text-xs font-mono-num text-[#5E5D59] space-y-1.5">
              <p className="font-semibold text-[#141413] flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#D94E34]" />
                <span>
                  {settings.showroomAddress ||
                    'Kenyatta Pioneer Building, 5th Floor, Shop 514, Kenyatta Avenue (Next to I&M Building), Nairobi CBD'}
                </span>
              </p>
              <p className="pl-5">
                Tel / WhatsApp:{' '}
                <a
                  href="tel:+254792620789"
                  className="text-[#141413] font-semibold hover:underline"
                >
                  +254 792 620 789
                </a>{' '}
                · {settings.supportEmail || 'shop@techsokoni.com'}
              </p>
              <p className="pl-5 text-[11px] text-[#1F6F43] font-medium">
                Lipa Na M-Pesa Buy Goods Till No: 9309020
              </p>
            </div>
            <div className="pt-1 flex flex-wrap items-center gap-2.5">
              <a
                href="https://wa.me/254792620789?text=Hello%20Tech%20Sokoni!%20I%20am%20browsing%20your%20online%20showroom%20and%20have%20a%20question."
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-[#1F6F43] text-[#F4F3EF] text-[11px] font-mono-num uppercase tracking-wider inline-flex items-center gap-1.5 hover:bg-[#185835] transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Us</span>
              </a>
              <a
                href="tel:+254792620789"
                className="px-3.5 py-2 border border-[#141413]/20 text-[#141413] text-[11px] font-mono-num uppercase tracking-wider inline-flex items-center gap-1.5 hover:border-[#141413] transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>0792 620 789</span>
              </a>
            </div>
          </div>

          {/* Shop Column */}
          <div className="lg:col-span-3 space-y-3">
            <p className="text-[11px] font-mono-num uppercase tracking-[0.2em] text-[#6E6D68]">
              Shop
            </p>
            <ul className="space-y-2 text-xs text-[#5E5D59]">
              <li>
                <button
                  onClick={() =>
                    navigate({ page: 'category', categoryId: 'laptops' })
                  }
                  className="hover:text-[#141413] transition-colors cursor-pointer"
                >
                  Laptops
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    navigate({ page: 'category', categoryId: 'phones' })
                  }
                  className="hover:text-[#141413] transition-colors cursor-pointer"
                >
                  Phones
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    navigate({ page: 'category', categoryId: 'desktops' })
                  }
                  className="hover:text-[#141413] transition-colors cursor-pointer"
                >
                  Desktops
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    navigate({ page: 'category', categoryId: 'printers' })
                  }
                  className="hover:text-[#141413] transition-colors cursor-pointer"
                >
                  Printers
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    navigate({ page: 'category', categoryId: 'accessories' })
                  }
                  className="hover:text-[#141413] transition-colors cursor-pointer"
                >
                  Accessories
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate({ page: 'deals' })}
                  className="hover:text-[#141413] transition-colors text-[#D94E34] font-medium cursor-pointer"
                >
                  Deals
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Support Column */}
          <div className="lg:col-span-3 space-y-3">
            <p className="text-[11px] font-mono-num uppercase tracking-[0.2em] text-[#6E6D68]">
              Customer Support
            </p>
            <ul className="space-y-2 text-xs text-[#5E5D59]">
              <li>
                <button
                  onClick={() =>
                    navigate({ page: 'info', section: 'contact' })
                  }
                  className="hover:text-[#141413] transition-colors cursor-pointer"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    navigate({ page: 'info', section: 'delivery' })
                  }
                  className="hover:text-[#141413] transition-colors cursor-pointer"
                >
                  Delivery
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    navigate({ page: 'info', section: 'returns' })
                  }
                  className="hover:text-[#141413] transition-colors cursor-pointer"
                >
                  Returns
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    navigate({ page: 'info', section: 'warranty' })
                  }
                  className="hover:text-[#141413] transition-colors cursor-pointer"
                >
                  Warranty
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate({ page: 'info', section: 'faq' })}
                  className="hover:text-[#141413] transition-colors cursor-pointer"
                >
                  FAQs
                </button>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-[11px] font-mono-num uppercase tracking-[0.2em] text-[#6E6D68]">
              Company
            </p>
            <ul className="space-y-2 text-xs text-[#5E5D59]">
              <li>
                <button
                  onClick={() => navigate({ page: 'info', section: 'about' })}
                  className="hover:text-[#141413] transition-colors cursor-pointer"
                >
                  About Tech Sokoni
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    navigate({ page: 'info', section: 'contact' })
                  }
                  className="hover:text-[#141413] transition-colors cursor-pointer"
                >
                  Contact
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    navigate({ page: 'info', section: 'privacy' })
                  }
                  className="hover:text-[#141413] transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate({ page: 'info', section: 'terms' })}
                  className="hover:text-[#141413] transition-colors cursor-pointer"
                >
                  Terms
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate({ page: 'client-portal' })}
                  className="hover:text-[#141413] transition-colors cursor-pointer"
                >
                  Client Area & Receipts
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate({ page: 'admin' })}
                  className="hover:text-[#141413] transition-colors font-medium text-[#141413] cursor-pointer"
                >
                  Admin
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6E6D68]">
          <p>© {new Date().getFullYear()} TECH SOKONI. All rights reserved.</p>
          <p className="font-mono-num text-[11px]">
            Laptops · Smartphones · Desktops · Monitors · Printers · Accessories
          </p>
        </div>
      </div>
    </footer>
  );
};
