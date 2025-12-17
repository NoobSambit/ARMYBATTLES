'use client';

import { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import Link from 'next/link';

export default function DonationModal({ isOpen, onClose }) {
  const paypalRef = useRef(null);
  const [amount, setAmount] = useState('1.00');

  useEffect(() => {
    if (!isOpen || !paypalRef.current) return;

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) return;

    // Check if PayPal SDK is already loaded
    if (window.paypal) {
      renderPayPalButton();
      return;
    }

    // Load PayPal SDK
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
    script.async = true;
    script.onload = () => {
      if (window.paypal) {
        renderPayPalButton();
      }
    };
    document.body.appendChild(script);
  }, [isOpen, amount]);

  const renderPayPalButton = () => {
    if (!paypalRef.current || !window.paypal) return;

    paypalRef.current.innerHTML = '';

    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'donate',
      },
      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [{
            description: 'Support ARMYBATTLES',
            amount: {
              value: amount,
              currency_code: 'USD'
            }
          }]
        });
      },
      onApprove: async (data, actions) => {
        const order = await actions.order.capture();
        alert('Thank you for your donation! 💜');
        console.log('Donation successful:', order);
      },
      onError: (err) => {
        console.error('PayPal error:', err);
        alert('An error occurred. Please try again or use Ko-fi.');
      }
    }).render(paypalRef.current);
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Support ARMYBATTLES" size="md">
      <div className="space-y-6">
        <div className="space-y-4 text-gray-100 leading-relaxed">
          <p className="text-gray-100">
            I'm a student developer running this site entirely on my own, with no income source to cover server and platform costs.
          </p>

          <p className="text-gray-100">
            Hosting services often go above their free limits, and keeping the site online typically costs around $20/month (excluding costs of other services like database). Without support, I may not be able to keep the servers running once the free tier is exhausted.
          </p>

          <p className="text-gray-100">
            If you enjoy this project and want to help keep it alive for ARMY, any contribution—no matter the amount—truly helps. Your support directly goes into maintaining the site, upgrading features, and ensuring it stays free for everyone.
          </p>

          <p className="text-bts-purple font-semibold">
            Thank you so much for helping me continue this journey. 💜
          </p>
        </div>

        <div className="pt-4 border-t border-border-light space-y-4">
          <p className="text-sm text-white text-center font-medium">
            Choose your preferred payment method below
          </p>

          <div className="space-y-3">
            {/* Ko-fi */}
            <Link
              href="https://ko-fi.com/noobsambit"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <button className="w-full py-4 px-4 rounded-lg border-2 border-border-light hover:border-bts-purple bg-panel-hover hover:bg-panel-elevated transition-all duration-200 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-bts-purple" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <div className="text-left">
                    <div className="font-semibold text-white">Ko-fi</div>
                    <div className="text-xs text-gray-200">Quick & Easy donation</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-300 group-hover:text-bts-purple group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </Link>

            {/* Donation Amount Selection - Only for PayPal */}
            <div className="space-y-3 pt-2">
              <div className="space-y-2">
                <label htmlFor="amount" className="block text-sm font-semibold text-white">
                  Donation Amount (USD) - For PayPal
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['1.00', '2.00', '3.00', '5.00', '10.00', '20.00'].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAmount(preset)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 font-semibold ${
                        amount === preset
                          ? 'border-bts-purple bg-bts-purple/20 text-white'
                          : 'border-border-light bg-panel-hover text-gray-200 hover:border-bts-purple/50 hover:text-white'
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-lg">$</span>
                  <input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || parseFloat(value) > 0) {
                        setAmount(value);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-panel-hover border-2 border-border-light rounded-lg text-white placeholder:text-gray-400 focus:border-bts-purple focus:outline-none transition-colors"
                    placeholder="Enter custom amount"
                  />
                </div>
              </div>
            </div>

            {/* PayPal */}
            <div className="w-full py-4 px-4 rounded-lg border-2 border-gray-300 bg-gradient-to-br from-white to-gray-50 space-y-3">
              <div className="flex items-center gap-3 mb-3">
                <svg className="w-6 h-6 text-[#0070BA]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l1.12-7.106c.082-.518.526-.9 1.05-.9h2.19c4.298 0 7.664-1.747 8.647-6.797.03-.149.054-.294.077-.437a5.73 5.73 0 0 1 1.141 1.32z"/>
                </svg>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">PayPal</div>
                  <div className="text-xs text-gray-600">Credit/Debit card or PayPal account</div>
                </div>
              </div>
              <div ref={paypalRef} className="paypal-buttons-container"></div>
            </div>

          </div>

          <p className="text-xs text-gray-200 text-center pt-2">
            All payments are secure and processed through trusted payment providers
          </p>
        </div>
      </div>
    </Modal>
  );
}

