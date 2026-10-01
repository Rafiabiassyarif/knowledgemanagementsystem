import React, { useState } from 'react';
import Navbar from '../landing/Navbar';
import Hero from '../landing/Hero';
import RAGIntro from '../landing/RAGIntro';
import ProblemSolution from '../landing/ProblemSolution';
import Features from '../landing/Features';
import HowItWorks from '../landing/HowItWorks';
import Pricing from '../landing/Pricing';
import FAQ from '../landing/FAQ';
import CTASection from '../landing/CTASection';
import Footer from '../landing/Footer';
import CheckoutModal from '../landing/CheckoutModal';
import type { CheckoutPlan } from '../landing/CheckoutModal';
import FadeIn from '../landing/FadeIn';
import '../landing/landing.css';

interface Plan extends CheckoutPlan {
  features: string[];
  ctaText: string;
  buttonVariant: string;
}

/**
 * Landing Page KnowBase AI (porting dari proyek Landingpage).
 * Menggabungkan seluruh section landing page RAG Knowledge Management System
 * dengan anchor scroll, animasi fade-in, dan modal checkout.
 */
export function LandingPage() {
  // SEMENTARA DISEMBUNYIKAN: fitur paket/checkout belum dipublikasikan.
  // State & handler dibiarkan ada agar mudah diaktifkan kembali — cukup
  // render ulang <Pricing /> dan <CheckoutModal /> di bawah.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isAnnualCheckout, setIsAnnualCheckout] = useState(false);

  // Buka modal dengan paket terpilih (belum dipakai selama Pricing disembunyikan)
  const handleSelectPlan = (_plan: Plan, _isAnnual: boolean = false) => {
    setSelectedPlan(_plan);
    setIsAnnualCheckout(_isAnnual);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  void handleSelectPlan;
  void isModalOpen;

  return (
    <div className="landing-root min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900 dark:selection:text-blue-100 flex flex-col transition-colors duration-200">
      {/* Sticky Top Navbar */}
      <Navbar />

      {/* Main Content Sections with Intersection Observer Animations */}
      <main className="flex-1">
        {/* Split Hero with 3D Knowledge Network */}
        <Hero />

        {/* Penjelasan Teknologi RAG, Tujuan & Manfaat */}
        <FadeIn threshold={0.08} rootMargin="0px 0px -40px 0px">
          <RAGIntro />
        </FadeIn>

        {/* 3 Core Capabilities */}
        <FadeIn threshold={0.08} rootMargin="0px 0px -40px 0px">
          <Features />
        </FadeIn>

        {/* 3 Core Pain Points vs RAG Solution */}
        <FadeIn threshold={0.08} rootMargin="0px 0px -40px 0px">
          <ProblemSolution />
        </FadeIn>

        {/* 4 Step Workflow */}
        <FadeIn threshold={0.08} rootMargin="0px 0px -40px 0px">
          <HowItWorks />
        </FadeIn>

        {/* SEMENTARA DISEMBUNYIKAN: Section Paket/Harga + Checkout
        <FadeIn threshold={0.08} rootMargin="0px 0px -40px 0px">
          <Pricing onSelectPlan={handleSelectPlan} />
        </FadeIn>
        */}

        {/* Keyboard Accessible Accordion FAQ */}
        <FadeIn threshold={0.08} rootMargin="0px 0px -40px 0px">
          <FAQ />
        </FadeIn>

        {/* Call to Action Section */}
        <FadeIn threshold={0.08} rootMargin="0px 0px -40px 0px">
          <CTASection />
        </FadeIn>
      </main>

      {/* Footer */}
      <Footer />

      {/* SEMENTARA DISEMBUNYIKAN: Modal Checkout Paket
      <CheckoutModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedPlan={selectedPlan}
        isAnnual={isAnnualCheckout}
      />
      */}
    </div>
  );
}
