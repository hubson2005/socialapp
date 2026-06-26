import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Zap, Link2, Copy, Check, ExternalLink,
  Loader2, RefreshCw, X, ChevronDown, ChevronRight,
  Eye, EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../supabase';

// ─── SVG Logos ────────────────────────────────────────────────────────────────
const ZapierLogo = () => (
  <svg viewBox="0 0 256 256" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M128 0C57.3 0 0 57.3 0 128s57.3 128 128 128 128-57.3 128-128S198.7 0 128 0z" fill="#FF4A00"/>
    <path d="M187.3 107.3l-51.6 7.4 32.6-57.4-16.4-9.3-35.2 61.9-7.4-51.6H91.7l8.1 56.7-40.4-40.4-12.8 12.8 40.4 40.4-56.7-8.1v17.6l51.6-7.4-32.6 57.4 16.4 9.3 35.2-61.9 7.4 51.6h17.6l-8.1-56.7 40.4 40.4 12.8-12.8-40.4-40.4 56.7 8.1v-17.8z" fill="#fff"/>
  </svg>
);

const MakeLogo = () => (
  <svg viewBox="0 0 100 100" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="50" fill="#6D00CC"/>
    <path d="M30 65V35l20 15 20-15v30" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GoogleAnalyticsLogo = () => (
  <svg viewBox="0 0 192 192" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M117 168.5c0 11.8-9.6 21.5-21.5 21.5S74 180.3 74 168.5V106c0-11.8 9.6-21.5 21.5-21.5S117 94.2 117 106v62.5z" fill="#F9AB00"/>
    <path d="M170 168.5c0 11.8-9.6 21.5-21.5 21.5S127 180.3 127 168.5V42.5C127 30.7 136.6 21 148.5 21S170 30.7 170 42.5v126z" fill="#E37400"/>
    <circle cx="43.5" cy="168.5" r="21.5" fill="#E37400"/>
  </svg>
);

const MetaLogo = () => (
  <svg viewBox="0 0 36 36" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="meta1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0064E1"/>
        <stop offset="100%" stopColor="#0082FB"/>
      </linearGradient>
      <linearGradient id="meta2" x1="0%" y1="0%" x2="100%" y2="60%">
        <stop offset="0%" stopColor="#0082FB"/>
        <stop offset="100%" stopColor="#00B2FF"/>
      </linearGradient>
    </defs>
    <path d="M4.5 18.3c0 2.6.6 4.6 1.5 5.9.9 1.2 2.1 1.8 3.3 1.8 1.6 0 3-.9 5.4-4.4l2.4-3.7c1.6-2.5 3.4-5.3 5.5-7.2 1.7-1.6 3.6-2.6 5.6-2.6 3.2 0 6.2 1.9 8.5 5.3C38.6 16.5 40 20.6 40 25c0 2.7-.5 4.7-1.4 6.2-.9 1.5-2.5 2.9-4.8 2.9v-3.8c2.1 0 2.6-2 2.6-5.1 0-3.8-1.1-7.3-3-9.8-1.4-1.9-3.1-3-5-3-1.9 0-3.5 1-5.5 3.8l-2.5 3.8c-.7 1.1-1.4 2.1-2.1 3.1l.9 1.5c1.2 2 2.5 3.7 3.4 4.6.9.8 1.7 1.1 2.6 1.1 1 0 2-.4 2.9-1.4.5-.5 1-1.3 1.3-2.3l3.3 1.8c-.5 1.5-1.2 2.7-2.1 3.6-1.5 1.5-3.4 2.2-5.4 2.2-1.9 0-3.6-.6-5.1-1.9-1.2-1-2.5-2.6-4-5.2-1.4 2.2-2.9 3.8-4.4 4.7-1.5.9-3.1 1.4-4.9 1.4C5 34.2 2 30.1 2 24.4c0-3.4.7-6.1 2-8.1z" fill="url(#meta1)"/>
    <path d="M4.5 18.3c0-4.7 1.6-8.5 3.8-10.7 1.4-1.4 3.1-2.1 4.9-2.1 2 0 3.8.8 5.6 2.5 1.7 1.6 3.5 4.3 5.7 8.2.5.9 1 1.7 1.5 2.5-.9 1.3-1.8 2.7-2.8 4.2l-2.4 3.7c-2.4 3.6-3.6 4.4-5.1 4.4-1.2 0-2.4-.6-3.3-1.8-.9-1.3-1.5-3.3-1.5-5.9z" fill="url(#meta2)"/>
  </svg>
);

const NotionLogo = () => (
  <svg viewBox="0 0 100 100" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="10" fill="white"/>
    <path d="M12 14.6c1.9 1.5 2.6 1.4 6.1 1.2l33.2-2c.7 0 .1-.7-.2-.8l-5.5-4c-1-.8-2.4-1.7-5.1-1.5L9.4 10.1c-1.1.1-1.3.7-.8 1.2L12 14.6zm1.8 7.7v34.8c0 1.9 1 2.6 3.1 2.5l36.4-2.1c2.1-.1 2.4-1.3 2.4-2.7V20.2c0-1.4-.6-2.2-1.8-2.1L15.9 20.2c-1.3.1-2.1.8-2.1 2.1zm34 1.6c.2 1 0 2-.9 2.1l-1.7.3v24.8c-1.5.8-2.9 1.3-4 1.3-1.8 0-2.3-.6-3.6-2.3L25.9 32.6v19.2l3.7.8s0 2-2.8 2L20.2 57c-.2-1 0-2 .7-2.2l1.9-.5V28.1l-2.6-.2c-.2-1 .4-2.4 2.2-2.5l5.6-.4L41 44.7V27.6l-3.1-.4c-.2-1.3.6-2.2 1.6-2.3l5.3-.2z" fill="#1a1a1a"/>
  </svg>
);

const AirtableLogo = () => (
  <svg viewBox="0 0 200 170" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M90.039 12.368L12.079 44.207c-4.215 1.768-4.186 7.733.047 9.46l78.284 31.177a32 32 0 0 0 23.678 0l78.284-31.177c4.233-1.727 4.262-7.692.048-9.46l-77.961-31.84a32 32 0 0 0-24.42.001" fill="#FCB400"/>
    <path d="M105.312 94.666v73.208a4 4 0 0 0 5.52 3.703l87.261-34.63A4 4 0 0 0 200.6 133.24V60.032a4 4 0 0 0-5.52-3.703l-87.261 34.63a4 4 0 0 0-2.507 3.707" fill="#18BFFF"/>
    <path d="M88.17 97.2L60.541 110.97l-2.935 1.468-52.48 26.15A4 4 0 0 1-.6 135V62.037a4.001 4.001 0 0 1 2.426-3.682 4 4 0 0 1 1.574-.32c.7 0 1.424.195 2.067.603L88.138 89.23a4 4 0 0 1 .032 7.97" fill="#F82B60"/>
  </svg>
);

const MailchimpLogo = () => (
  <svg viewBox="0 0 256 256" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="128" cy="128" r="128" fill="#FFE01B"/>
    <path d="M179.4 129.6c1.5-.4 2.8-.5 3.7-.2.5.2.7.4.8.6.3.8-.3 2.1-1 3.1-.7 1.1-1.6 2-1.6 2s1.7-.2 3-.9c.8-.4 1.4-1 1.4-1.8 0-1.1-1-2.1-2.8-2.6-.8-.2-1.7-.3-2.6-.3.3-.3.5-.6.8-.9-.3-.2-.6-.4-.9-.6-.3.2-.5.4-.8.6zM169 119.4c-2.7-1.3-6.2-2-10.1-2-4.2 0-8.7.8-12.8 2.7l.5 1.1c3.8-1.8 8.1-2.6 12-2.6 3.7 0 7 .7 9.5 1.9 4.2 2 5.8 5 5.3 8.7-.9 6.7-8.8 13.3-18.4 12.8-7.4-.4-11.4-4.2-11.4-9.2 0-1.9.6-3.9 1.9-5.8l-1-.7c-1.4 2.1-2.2 4.4-2.2 6.7 0 5.6 4.4 10.1 12.5 10.6 10.3.6 19.1-6.5 20.1-13.8.7-4.3-1.3-8.1-5.9-10.4z" fill="#241C15"/>
  </svg>
);

const SlackLogo = () => (
  <svg viewBox="0 0 2447.6 2452.5" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <g clipRule="evenodd" fillRule="evenodd">
      <path d="M897.4 0C762.9.1 653.8 109.5 653.9 244c0 134.5 109.4 243.7 244 243.7h243.6V244C1141.5 109.4 1032.1.1 897.4 0zm0 650H244C109.5 649.9.1 759.2 0 893.7c-.1 134.5 109.4 243.8 243.9 244h653.5c134.5 0 243.9-109.4 243.9-243.9-.1-134.6-109.4-243.9-244-243.8zm0 0" fill="#36c5f0"/>
      <path d="M2447.6 893.7c.1-134.5-109.4-243.8-243.9-244-134.5.1-243.8 109.5-243.7 244v243.6h243.7c134.5 0 243.9-109.4 243.9-243.6zm-650 0V244c.1-134.5-109.3-243.9-243.8-244-134.5.1-243.8 109.5-243.8 244v649.7c-.1 134.5 109.3 243.9 243.8 244 134.5-.1 243.8-109.5 243.8-244zm0 0" fill="#2eb67d"/>
      <path d="M1553.8 2452.5c134.5-.1 243.8-109.5 243.7-244-.1-134.5-109.4-243.8-244-243.7h-243.6v243.8c-.1 134.4 109.3 243.8 243.9 243.9zm0-650.1h653.5c134.5 0 243.9-109.4 243.9-243.9-.1-134.5-109.4-243.8-244-243.7H1553.9c-134.5 0-243.9 109.4-243.9 243.9.1 134.5 109.4 243.8 243.8 243.7zm0 0" fill="#ecb22e"/>
      <path d="M0 1558.5c-.1 134.5 109.4 243.8 243.9 244 134.5-.1 243.8-109.5 243.8-244v-243.6H244c-134.5 0-243.9 109.4-244 243.6zm650-.1v649.7c-.1 134.5 109.3 243.9 243.8 244 134.5-.1 243.8-109.5 243.8-244v-649.6c.1-134.5-109.3-243.9-243.8-244-134.5.1-243.8 109.5-243.8 244zm0 0" fill="#e01e5a"/>
    </g>
  </svg>
);

const HubSpotLogo = () => (
  <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="256" cy="256" r="256" fill="#FF7A59"/>
    <path d="M305 206.5v-52.3a34.5 34.5 0 1 0-33 0v52.3a97.5 97.5 0 0 0-46.5 25.8L109 148.4a38.5 38.5 0 1 0-22 30.3l114 81.2a97.3 97.3 0 0 0 0 92.2L87 433.3a38.5 38.5 0 1 0 22 30.3l114-81.2a97.5 97.5 0 1 0 82-175.9zm-16.5 146a49 49 0 1 1 0-98 49 49 0 0 1 0 98z" fill="white"/>
  </svg>
);

const SalesforceLogo = () => (
  <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="80" fill="#00A1E0"/>
    <path d="M213 150c18-20 43-32 71-32 38 0 71 21 88 52a80 80 0 0 1 108 76 80 80 0 0 1-80 80H152a72 72 0 0 1-72-72 72 72 0 0 1 72-72c4 0 8 0 12 1a96 96 0 0 1 49-33z" fill="white"/>
  </svg>
);

const PipedriveLogo = () => (
  <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="80" fill="#1A1A2E"/>
    <circle cx="256" cy="200" r="80" fill="#00C85A"/>
    <path d="M176 280h160v160H176z" fill="#00C85A"/>
    <rect x="232" y="440" width="48" height="40" rx="8" fill="#00C85A"/>
  </svg>
);

const BrevoLogo = () => (
  <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="80" fill="#0B996E"/>
    <path d="M140 160h120c44 0 80 36 80 80s-36 80-80 80H180v80h-40V160zm40 120h80c22 0 40-18 40-40s-18-40-40-40h-80v80z" fill="white"/>
  </svg>
);

const ActiveCampaignLogo = () => (
  <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="80" fill="#356AE6"/>
    <path d="M80 320l120-160 80 100 60-80 92 140H80z" fill="white"/>
  </svg>
);

const ConvertKitLogo = () => (
  <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="80" fill="#FB6970"/>
    <path d="M160 160h192v40H200v72h140v40H200v80h152v40H160V160z" fill="white"/>
  </svg>
);

const StripeLogo = () => (
  <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="80" fill="#635BFF"/>
    <path d="M234 197c0-17 14-24 37-24 33 0 75 10 108 28v-102c-36-14-71-20-108-20-88 0-147 46-147 122 0 119 164 100 164 151 0 20-17 27-42 27-36 0-82-15-118-35v103c40 17 81 25 118 25 90 0 152-44 152-122 0-129-165-106-165-153z" fill="white"/>
  </svg>
);

const PayPalLogo = () => (
  <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="80" fill="#003087"/>
    <path d="M208 120h120c50 0 86 28 80 82-8 70-56 96-112 96H256l-20 104H172L208 120zm48 40l-16 100h40c34 0 62-14 68-56 6-36-16-44-48-44h-44z" fill="white"/>
  </svg>
);

const WhatsAppLogo = () => (
  <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="80" fill="#25D366"/>
    <path d="M256 80C159 80 80 159 80 256c0 31 8 60 23 85L80 432l95-25c24 13 51 21 81 21 97 0 176-79 176-176S353 80 256 80zm0 320c-27 0-52-7-74-20l-52 14 14-50a144 144 0 1 1 112 56zm79-108c-4-2-24-12-28-13s-6-2-9 2-10 13-12 16-4 3-8 1c-4-2-17-6-32-20-12-11-20-24-22-28s0-6 2-8l6-7c2-2 2-4 3-6s0-5-1-7-9-22-12-30c-3-8-6-7-9-7h-8c-3 0-7 1-10 5s-14 13-14 33 14 38 16 41 28 42 67 59c39 16 39 11 46 10s24-10 27-19 3-17 2-19z" fill="white"/>
  </svg>
);

const TelegramLogo = () => (
  <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="256" cy="256" r="256" fill="#2CA5E0"/>
    <path d="M116 251l26-12 152-63c6-2 24-10 24-10s-96 85-96 145l-26 15-80-75z" fill="#C8DAEA"/>
    <path d="M196 326l-8 62s-3 11 8 0l28-26 56 42c10 6 17 3 20-9l35-164-139 95z" fill="white"/>
    <path d="M94 248l160-62c6-2 12 1 10 9l-28 132c-2 9-8 11-13 7l-44-33-21 20c-2 2-5 3-8 3l3-47z" fill="#C8DAEA"/>
  </svg>
);

const IntercomLogo = () => (
  <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="80" fill="#1F8DED"/>
    <path d="M256 120c-97 0-176 79-176 176 0 35 10 67 28 94l-28 82 86-27c26 16 56 25 90 25 97 0 176-79 176-176S353 120 256 120z" fill="none" stroke="white" strokeWidth="30"/>
    <circle cx="176" cy="248" r="20" fill="white"/>
    <circle cx="256" cy="248" r="20" fill="white"/>
    <circle cx="336" cy="248" r="20" fill="white"/>
  </svg>
);

const CrispLogo = () => (
  <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="80" fill="#1972F5"/>
    <path d="M256 130c-76 0-136 53-136 120 0 36 17 68 45 90l-15 72 68-34c12 3 25 4 38 4 76 0 136-54 136-120s-60-132-136-132z" fill="white"/>
  </svg>
);

const CalendlyLogo = () => (
  <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="80" fill="#006BFF"/>
    <rect x="152" y="120" width="208" height="272" rx="20" fill="none" stroke="white" strokeWidth="28"/>
    <line x1="192" y1="96" x2="192" y2="152" stroke="white" strokeWidth="28" strokeLinecap="round"/>
    <line x1="320" y1="96" x2="320" y2="152" stroke="white" strokeWidth="28" strokeLinecap="round"/>
    <line x1="152" y1="200" x2="360" y2="200" stroke="white" strokeWidth="24"/>
    <rect x="196" y="240" width="40" height="40" rx="6" fill="white"/>
    <rect x="276" y="240" width="40" height="40" rx="6" fill="white"/>
    <rect x="196" y="308" width="40" height="40" rx="6" fill="white"/>
  </svg>
);

const GoogleCalendarLogo = () => (
  <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <rect x="56" y="56" width="400" height="400" rx="32" fill="white" stroke="#E0E0E0" strokeWidth="8"/>
    <rect x="56" y="56" width="400" height="100" rx="32" fill="#4285F4"/>
    <rect x="56" y="120" width="400" height="36" fill="#4285F4"/>
    <rect x="152" y="32" width="28" height="72" rx="14" fill="#1565C0"/>
    <rect x="332" y="32" width="28" height="72" rx="14" fill="#1565C0"/>
    <text x="256" y="340" textAnchor="middle" fontSize="160" fontWeight="bold" fill="#4285F4" fontFamily="Arial">31</text>
  </svg>
);

const MixpanelLogo = () => (
  <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="80" fill="#7856FF"/>
    <path d="M120 360l80-160 60 90 50-100 80 170H120z" fill="white"/>
  </svg>
);

const HotjarLogo = () => (
  <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="80" fill="#FF3C00"/>
    <path d="M256 80c-48 0-80 36-80 80 0 28 12 52 32 68l-20 204h136l-20-204c20-16 32-40 32-68 0-44-32-80-80-80z" fill="white"/>
  </svg>
);

const ShopifyLogo = () => (
  <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="80" fill="#96BF48"/>
    <path d="M338 136s-2-2-4-2c-2 0-36-2-36-2s-24-24-26-26v270l88-22s-22-218-22-218zm-54-4s-14-4-30-4c0 0-8-24-34-24-46 0-68 58-68 58l-46 14s-2 8-6 22l100-26s16-60 50-60c14 0 20 8 20 8l14-4v16z" fill="white"/>
  </svg>
);

const WooCommerceLogo = () => (
  <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="80" fill="#7F54B3"/>
    <path d="M80 140c0-22 18-40 40-40h272c22 0 40 18 40 40v162c0 22-18 40-40 40h-96l24 70-88-70H120c-22 0-40-18-40-40V140z" fill="white"/>
    <path d="M130 180l30 90 32-60 32 60 30-90" stroke="#7F54B3" strokeWidth="16" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="360" cy="225" r="22" fill="#7F54B3"/>
    <circle cx="310" cy="225" r="22" fill="#7F54B3"/>
  </svg>
);

const GoogleSheetsLogo = () => (
  <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M300 40H152c-22 0-40 18-40 40v352c0 22 18 40 40 40h208c22 0 40-18 40-40V140L300 40z" fill="#23A566"/>
    <path d="M300 40v100h100L300 40z" fill="#1C8C57"/>
    <rect x="168" y="216" width="176" height="24" rx="4" fill="white"/>
    <rect x="168" y="264" width="176" height="24" rx="4" fill="white"/>
    <rect x="168" y="312" width="176" height="24" rx="4" fill="white"/>
    <line x1="256" y1="216" x2="256" y2="336" stroke="#23A566" strokeWidth="4"/>
  </svg>
);

const SupabaseLogo = () => (
  <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sb1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3ECF8E"/>
        <stop offset="100%" stopColor="#1C7A4A"/>
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="80" fill="url(#sb1)"/>
    <path d="M280 80L120 300h160V432l160-220H280V80z" fill="white"/>
  </svg>
);

const PostgresLogo = () => (
  <svg viewBox="0 0 512 512" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="80" fill="#336791"/>
    <ellipse cx="256" cy="180" rx="120" ry="80" fill="none" stroke="white" strokeWidth="24"/>
    <path d="M136 180v152c0 44 54 80 120 80s120-36 120-80V180" fill="none" stroke="white" strokeWidth="24"/>
    <line x1="256" y1="260" x2="256" y2="412" stroke="white" strokeWidth="24"/>
  </svg>
);

// ─── Catégories ───────────────────────────────────────────────────────────────
const CATEGORIES_CONFIG = [
  { id: 'Tous', label: 'Tous', emoji: '⚡' },
  { id: 'Automatisation', label: 'Automatisation', emoji: '🤖' },
  { id: 'CRM', label: 'CRM & Ventes', emoji: '💼' },
  { id: 'Email', label: 'Email', emoji: '📧' },
  { id: 'Paiements', label: 'Paiements', emoji: '💳' },
  { id: 'Messagerie', label: 'Messagerie', emoji: '💬' },
  { id: 'Calendrier', label: 'Calendrier', emoji: '📅' },
  { id: 'Analytics', label: 'Analytics', emoji: '📊' },
  { id: 'Ecommerce', label: 'E-commerce', emoji: '🛍️' },
  { id: 'Données', label: 'Données', emoji: '🗄️' },
];

const INTEGRATIONS = [
  { id: 'zapier', name: 'Zapier', desc: 'Automatisez plus de 6 000 apps sans coder', category: 'Automatisation', color: '#FF4A00', bg: 'rgba(255,74,0,0.12)', LogoComponent: ZapierLogo, docsUrl: 'https://zapier.com', hasWebhook: true, fields: [] },
  { id: 'make', name: 'Make (Integromat)', desc: 'Créez des scénarios automation visuels', category: 'Automatisation', color: '#6D00CC', bg: 'rgba(109,0,204,0.12)', LogoComponent: MakeLogo, docsUrl: 'https://make.com', hasWebhook: true, fields: [] },
  { id: 'hubspot', name: 'HubSpot', desc: 'CRM tout-en-un pour gérer vos leads', category: 'CRM', color: '#FF7A59', bg: 'rgba(255,122,89,0.12)', LogoComponent: HubSpotLogo, docsUrl: 'https://hubspot.com', hasWebhook: true, fields: [{ key: 'api_key', label: 'API Key', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'password' }, { key: 'portal_id', label: 'Portal ID', placeholder: '12345678', type: 'text' }] },
  { id: 'salesforce', name: 'Salesforce', desc: 'CRM enterprise leader du marché', category: 'CRM', color: '#00A1E0', bg: 'rgba(0,161,224,0.12)', LogoComponent: SalesforceLogo, docsUrl: 'https://salesforce.com', hasWebhook: true, fields: [{ key: 'instance_url', label: 'Instance URL', placeholder: 'https://yourinstance.salesforce.com', type: 'text' }, { key: 'access_token', label: 'Access Token', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' }] },
  { id: 'pipedrive', name: 'Pipedrive', desc: 'Pipeline de ventes visuel et intuitif', category: 'CRM', color: '#00C85A', bg: 'rgba(0,200,90,0.12)', LogoComponent: PipedriveLogo, docsUrl: 'https://pipedrive.com', hasWebhook: true, fields: [{ key: 'api_token', label: 'API Token', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' }] },
  { id: 'notion', name: 'Notion', desc: 'Synchronisez vos leads dans votre workspace', category: 'CRM', color: '#ffffff', bg: 'rgba(255,255,255,0.08)', LogoComponent: NotionLogo, docsUrl: 'https://notion.so', hasWebhook: true, fields: [{ key: 'database_id', label: 'Database ID', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', type: 'text' }] },
  { id: 'airtable', name: 'Airtable', desc: 'Exportez automatiquement vos contacts', category: 'CRM', color: '#18BFFF', bg: 'rgba(24,191,255,0.12)', LogoComponent: AirtableLogo, docsUrl: 'https://airtable.com', hasWebhook: true, fields: [{ key: 'base_id', label: 'Base ID', placeholder: 'appXXXXXXXXXXXXXX', type: 'text' }, { key: 'table_name', label: 'Table', placeholder: 'Leads', type: 'text' }] },
  { id: 'mailchimp', name: 'Mailchimp', desc: 'Ajoutez vos contacts à vos listes email', category: 'Email', color: '#FFE01B', bg: 'rgba(255,224,27,0.10)', LogoComponent: MailchimpLogo, docsUrl: 'https://mailchimp.com', hasWebhook: false, fields: [{ key: 'api_key', label: 'API Key', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us1', type: 'password' }, { key: 'list_id', label: 'Audience ID', placeholder: 'xxxxxxxxxx', type: 'text' }] },
  { id: 'brevo', name: 'Brevo', desc: 'Email marketing populaire en France', category: 'Email', color: '#0B996E', bg: 'rgba(11,153,110,0.12)', LogoComponent: BrevoLogo, docsUrl: 'https://brevo.com', hasWebhook: false, fields: [{ key: 'api_key', label: 'API Key', placeholder: 'xkeysib-xxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' }, { key: 'list_id', label: 'List ID', placeholder: '12', type: 'text' }] },
  { id: 'activecampaign', name: 'ActiveCampaign', desc: 'Email marketing & automation avancée', category: 'Email', color: '#356AE6', bg: 'rgba(53,106,230,0.12)', LogoComponent: ActiveCampaignLogo, docsUrl: 'https://activecampaign.com', hasWebhook: false, fields: [{ key: 'api_url', label: 'API URL', placeholder: 'https://youraccountname.api-us1.com', type: 'text' }, { key: 'api_key', label: 'API Key', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' }] },
  { id: 'convertkit', name: 'ConvertKit', desc: 'Email marketing pour créateurs de contenu', category: 'Email', color: '#FB6970', bg: 'rgba(251,105,112,0.12)', LogoComponent: ConvertKitLogo, docsUrl: 'https://convertkit.com', hasWebhook: false, fields: [{ key: 'api_key', label: 'API Key', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' }, { key: 'form_id', label: 'Form ID', placeholder: '1234567', type: 'text' }] },
  { id: 'stripe', name: 'Stripe', desc: 'Suivez paiements & abonnements en temps réel', category: 'Paiements', color: '#635BFF', bg: 'rgba(99,91,255,0.12)', LogoComponent: StripeLogo, docsUrl: 'https://stripe.com', hasWebhook: true, fields: [{ key: 'secret_key', label: 'Secret Key', placeholder: 'sk_live_xxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' }, { key: 'webhook_secret', label: 'Webhook Secret', placeholder: 'whsec_xxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' }] },
  { id: 'paypal', name: 'PayPal', desc: 'Notifications de transactions PayPal', category: 'Paiements', color: '#003087', bg: 'rgba(0,48,135,0.12)', LogoComponent: PayPalLogo, docsUrl: 'https://paypal.com', hasWebhook: true, fields: [{ key: 'client_id', label: 'Client ID', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', type: 'text' }, { key: 'client_secret', label: 'Client Secret', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' }] },
  { id: 'whatsapp', name: 'WhatsApp Business', desc: 'Messages entrants → leads + notifications automatiques', category: 'Messagerie', color: '#25D366', bg: 'rgba(37,211,102,0.12)', LogoComponent: WhatsAppLogo, docsUrl: 'https://business.whatsapp.com', hasWebhook: true, fields: [{ key: 'phone_id', label: 'Phone Number ID', placeholder: '123456789012345', type: 'text' }, { key: 'access_token', label: 'Access Token', placeholder: 'EAAxxxxxxxxxxxxxxxx', type: 'password' }, { key: 'notification_phone', label: 'Votre numéro (notifications)', placeholder: '2250700000000', type: 'text' }, { key: 'verify_token', label: 'Token de vérification webhook', placeholder: 'mon_token_secret', type: 'text' }] },
  { id: 'telegram', name: 'Telegram', desc: 'Bot notifications vers vos canaux Telegram', category: 'Messagerie', color: '#2CA5E0', bg: 'rgba(44,165,224,0.12)', LogoComponent: TelegramLogo, docsUrl: 'https://telegram.org', hasWebhook: true, fields: [{ key: 'bot_token', label: 'Bot Token', placeholder: '123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' }, { key: 'chat_id', label: 'Chat ID', placeholder: '-1001234567890', type: 'text' }] },
  { id: 'slack', name: 'Slack', desc: 'Recevez des notifications en temps réel', category: 'Messagerie', color: '#E01E5A', bg: 'rgba(74,21,75,0.15)', LogoComponent: SlackLogo, docsUrl: 'https://slack.com', hasWebhook: true, fields: [{ key: 'webhook_url', label: 'Webhook URL Slack', placeholder: 'https://hooks.slack.com/services/...', type: 'text' }] },
  { id: 'intercom', name: 'Intercom', desc: 'Support client & messaging en temps réel', category: 'Messagerie', color: '#1F8DED', bg: 'rgba(31,141,237,0.12)', LogoComponent: IntercomLogo, docsUrl: 'https://intercom.com', hasWebhook: true, fields: [{ key: 'access_token', label: 'Access Token', placeholder: 'dG9rxxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' }, { key: 'workspace_id', label: 'Workspace ID', placeholder: 'xxxxxxxx', type: 'text' }] },
  { id: 'crisp', name: 'Crisp', desc: 'Support client made in France 🇫🇷', category: 'Messagerie', color: '#1972F5', bg: 'rgba(25,114,245,0.12)', LogoComponent: CrispLogo, docsUrl: 'https://crisp.chat', hasWebhook: true, fields: [{ key: 'website_id', label: 'Website ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text' }, { key: 'token', label: 'Token', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' }] },
  { id: 'calendly', name: 'Calendly', desc: 'Suivi automatique de vos bookings', category: 'Calendrier', color: '#006BFF', bg: 'rgba(0,107,255,0.12)', LogoComponent: CalendlyLogo, docsUrl: 'https://calendly.com', hasWebhook: true, fields: [{ key: 'api_key', label: 'API Key', placeholder: 'eyJhbGxxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' }] },
  { id: 'google_calendar', name: 'Google Calendar', desc: 'Synchronisez vos événements automatiquement', category: 'Calendrier', color: '#4285F4', bg: 'rgba(66,133,244,0.12)', LogoComponent: GoogleCalendarLogo, docsUrl: 'https://calendar.google.com', hasWebhook: false, fields: [{ key: 'calendar_id', label: 'Calendar ID', placeholder: 'xxxxxxxxxxxx@group.calendar.google.com', type: 'text' }] },
  { id: 'google_analytics', name: 'Google Analytics', desc: 'Suivez vos visiteurs et conversions en détail', category: 'Analytics', color: '#E37400', bg: 'rgba(227,116,0,0.12)', LogoComponent: GoogleAnalyticsLogo, docsUrl: 'https://analytics.google.com', hasWebhook: false, fields: [{ key: 'measurement_id', label: 'Measurement ID', placeholder: 'G-XXXXXXXXXX', type: 'text' }] },
  { id: 'meta_pixel', name: 'Meta Pixel', desc: 'Trackez les conversions Facebook & Instagram', category: 'Analytics', color: '#0082FB', bg: 'rgba(0,130,251,0.12)', LogoComponent: MetaLogo, docsUrl: 'https://business.facebook.com', hasWebhook: false, fields: [{ key: 'pixel_id', label: 'Pixel ID', placeholder: '123456789012345', type: 'text' }] },
  { id: 'mixpanel', name: 'Mixpanel', desc: 'Analytics produit avancée & funnels', category: 'Analytics', color: '#7856FF', bg: 'rgba(120,86,255,0.12)', LogoComponent: MixpanelLogo, docsUrl: 'https://mixpanel.com', hasWebhook: false, fields: [{ key: 'project_token', label: 'Project Token', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', type: 'text' }] },
  { id: 'hotjar', name: 'Hotjar', desc: 'Heatmaps & enregistrements de sessions', category: 'Analytics', color: '#FF3C00', bg: 'rgba(255,60,0,0.12)', LogoComponent: HotjarLogo, docsUrl: 'https://hotjar.com', hasWebhook: false, fields: [{ key: 'site_id', label: 'Site ID', placeholder: '1234567', type: 'text' }] },
  { id: 'shopify', name: 'Shopify', desc: 'Synchronisez commandes & clients Shopify', category: 'Ecommerce', color: '#96BF48', bg: 'rgba(150,191,72,0.12)', LogoComponent: ShopifyLogo, docsUrl: 'https://shopify.com', hasWebhook: true, fields: [{ key: 'shop_domain', label: 'Shop Domain', placeholder: 'yourstore.myshopify.com', type: 'text' }, { key: 'access_token', label: 'Admin API Token', placeholder: 'shpat_xxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' }] },
  { id: 'woocommerce', name: 'WooCommerce', desc: 'Sync automatique pour boutiques WordPress', category: 'Ecommerce', color: '#7F54B3', bg: 'rgba(127,84,179,0.12)', LogoComponent: WooCommerceLogo, docsUrl: 'https://woocommerce.com', hasWebhook: true, fields: [{ key: 'store_url', label: 'Store URL', placeholder: 'https://yourstore.com', type: 'text' }, { key: 'consumer_key', label: 'Consumer Key', placeholder: 'ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' }, { key: 'consumer_secret', label: 'Consumer Secret', placeholder: 'cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' }] },
  { id: 'google_sheets', name: 'Google Sheets', desc: 'Export automatique de vos données en tableur', category: 'Données', color: '#23A566', bg: 'rgba(35,165,102,0.12)', LogoComponent: GoogleSheetsLogo, docsUrl: 'https://sheets.google.com', hasWebhook: false, fields: [{ key: 'spreadsheet_id', label: 'Spreadsheet ID', placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms', type: 'text' }, { key: 'sheet_name', label: 'Sheet Name', placeholder: 'Leads', type: 'text' }] },
  { id: 'supabase', name: 'Supabase', desc: 'Base de données PostgreSQL open source', category: 'Données', color: '#3ECF8E', bg: 'rgba(62,207,142,0.12)', LogoComponent: SupabaseLogo, docsUrl: 'https://supabase.com', hasWebhook: false, fields: [{ key: 'project_url', label: 'Project URL', placeholder: 'https://xxxxxxxxxxxx.supabase.co', type: 'text' }, { key: 'anon_key', label: 'Anon Key', placeholder: 'eyJhbGxxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' }] },
  { id: 'postgres', name: 'PostgreSQL', desc: 'Connexion directe à votre base de données', category: 'Données', color: '#336791', bg: 'rgba(51,103,145,0.12)', LogoComponent: PostgresLogo, docsUrl: 'https://postgresql.org', hasWebhook: false, fields: [{ key: 'connection_string', label: 'Connection String', placeholder: 'postgresql://user:password@host:5432/db', type: 'password' }] },
];

function generateWebhookUrl(profileId, integrationId) {
  return `https://admin.socialapp.work/webhooks/${profileId}/${integrationId}`;
}

// ─── Carte intégration ────────────────────────────────────────────────────────
function IntegrationCard({ integration, config, onSave, onDisconnect }) {
  const [expanded, setExpanded] = useState(false);
  const [fields, setFields] = useState(config?.fields || {});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState({});

  const isConnected = !!config?.connected;
  const webhookUrl = config?.webhook_url || generateWebhookUrl('preview', integration.id);
  const { LogoComponent } = integration;

  const toggleExpanded = () => setExpanded(v => !v);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copié !');
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(integration.id, { fields, connected: true });
      setExpanded(false);
      toast.success(`${integration.name} connecté !`);
    } catch {
      // erreur déjà gérée dans onSave
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm(`Déconnecter ${integration.name} ?`)) return;
    try {
      await onDisconnect(integration.id);
      setFields({});
      toast.success(`${integration.name} déconnecté`);
    } catch {
      // erreur déjà gérée dans onDisconnect
    }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${isConnected ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '16px',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
      minWidth: 0,
    }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', minWidth: 0 }}>

        {/* Zone cliquable logo + texte */}
        <div
          onClick={toggleExpanded}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, cursor: 'pointer' }}
        >
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: integration.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            border: `1px solid ${integration.color}33`,
          }}>
            <LogoComponent />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span style={{ color: 'white', fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {integration.name}
              </span>
              {isConnected && (
                <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', letterSpacing: '0.05em', flexShrink: 0 }}>
                  ✓ CONNECTÉ
                </span>
              )}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {integration.desc}
            </p>
          </div>
        </div>

        {/* Boutons — frères (pas enfants) de la zone cliquable */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {isConnected && (
            <button
              onClick={handleDisconnect}
              style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={11} />
            </button>
          )}
          <button
            onClick={toggleExpanded}
            style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        </div>
      </div>

      {/* ── Contenu déployé ── */}
      {expanded && (
        <div style={{ padding: '12px 14px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Webhook URL */}
          {integration.hasWebhook && (
            <div>
              <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Webhook URL
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '8px 12px', minWidth: 0 }}>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                  {webhookUrl}
                </span>
                <button
                  onClick={() => handleCopy(webhookUrl)}
                  style={{ width: '24px', height: '24px', borderRadius: '6px', background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  {copied ? <Check size={10} color="#22c55e" /> : <Copy size={10} color="rgba(255,255,255,0.5)" />}
                </button>
              </div>
            </div>
          )}

          {/* Champs */}
          {integration.fields.map(f => (
            <div key={f.key}>
              <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                {f.label}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={f.type === 'password' && !showSecret[f.key] ? 'password' : 'text'}
                  value={fields[f.key] || ''}
                  onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', boxSizing: 'border-box', padding: f.type === 'password' ? '8px 36px 8px 12px' : '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '12px', outline: 'none', fontFamily: f.type === 'password' ? 'inherit' : 'monospace' }}
                />
                {f.type === 'password' && (
                  <button
                    type="button"
                    onClick={() => setShowSecret(prev => ({ ...prev, [f.key]: !prev[f.key] }))}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex' }}
                  >
                    {showSecret[f.key] ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ flex: 1, padding: '9px', background: `linear-gradient(135deg, ${integration.color}, ${integration.color}aa)`, border: 'none', borderRadius: '10px', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? <Loader2 size={11} /> : <Check size={11} />}
              {isConnected ? 'Mettre à jour' : 'Connecter'}
            </button>
            <a
              href={integration.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ width: '34px', height: '34px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}
            >
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Panel principal ───────────────────────────────────────────────────────────
export default function IntegrationsPanel({ profileId }) {
  const [configs, setConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Tous');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!profileId) return;
    loadConfigs();
  }, [profileId]);

  const loadConfigs = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profile_integrations').select('*').eq('profile_id', profileId);
    if (error) {
      toast.error('Erreur de chargement des intégrations : ' + error.message);
      setConfigs({});
      setLoading(false);
      return;
    }
    const map = {};
    (data || []).forEach(row => {
      map[row.integration_id] = { connected: row.is_connected, fields: row.config || {}, webhook_url: generateWebhookUrl(profileId, row.integration_id) };
    });
    setConfigs(map);
    setLoading(false);
  };

  const handleSave = useCallback(async (integrationId, data) => {
    const { error } = await supabase.from('profile_integrations').upsert({
      profile_id: profileId,
      integration_id: integrationId,
      is_connected: data.connected,
      config: data.fields || {},
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id,integration_id' });

    if (error) {
      toast.error('Échec de la connexion : ' + error.message);
      throw error;
    }

    setConfigs(prev => ({
      ...prev,
      [integrationId]: { ...data, webhook_url: generateWebhookUrl(profileId, integrationId) },
    }));
  }, [profileId]);

  const handleDisconnect = useCallback(async (integrationId) => {
    const { error } = await supabase.from('profile_integrations')
      .update({ is_connected: false, config: {} })
      .eq('profile_id', profileId)
      .eq('integration_id', integrationId);

    if (error) {
      toast.error('Échec de la déconnexion : ' + error.message);
      throw error;
    }

    setConfigs(prev => { const next = { ...prev }; delete next[integrationId]; return next; });
  }, [profileId]);

  const filtered = INTEGRATIONS.filter(i => {
    const matchCat = category === 'Tous' || i.category === category;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const connectedCount = Object.values(configs).filter(c => c?.connected).length;

  const categoriesWithItems = category === 'Tous'
    ? CATEGORIES_CONFIG.filter(c => c.id !== 'Tous').filter(c => filtered.some(i => i.category === c.id))
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0 }}>Intégrations</h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: '4px 0 0' }}>
            {connectedCount} active{connectedCount !== 1 ? 's' : ''} · {INTEGRATIONS.length} disponibles
          </p>
        </div>
        <button onClick={loadConfigs} style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <RefreshCw size={13} color="rgba(255,255,255,0.5)" />
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', minWidth: 0 }}>
        {[
          { label: 'Connectées', value: connectedCount, icon: Check, color: '#22c55e' },
          { label: 'Disponibles', value: INTEGRATIONS.length, icon: Sparkles, color: '#6366f1' },
          { label: 'Automations', value: INTEGRATIONS.filter(i => i.category === 'Automatisation' && configs[i.id]?.connected).length, icon: Zap, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px', minWidth: 0, overflow: 'hidden', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', minWidth: 0, gap: '6px' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
              <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: s.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.icon size={12} color={s.color} />
              </div>
            </div>
            <span style={{ color: 'white', fontSize: '24px', fontWeight: 800 }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Webhook universel */}
      <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Link2 size={16} color="#a78bfa" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'white', fontSize: '12px', fontWeight: 700, margin: 0 }}>Webhook universel</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
            {generateWebhookUrl(profileId, '{integration}')}
          </p>
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(generateWebhookUrl(profileId, 'universal')); toast.success('URL copiée !'); }}
          style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <Copy size={13} color="rgba(255,255,255,0.5)" />
        </button>
      </div>

      {/* Recherche */}
      <div style={{ position: 'relative', minWidth: 0 }}>
        <Sparkles size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une intégration…"
          style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 34px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '12px', outline: 'none' }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex' }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', minWidth: 0 }}>
        {CATEGORIES_CONFIG.map(cat => {
          const count = cat.id === 'Tous' ? INTEGRATIONS.length : INTEGRATIONS.filter(i => i.category === cat.id).length;
          const active = category === cat.id;
          return (
            <button key={cat.id} onClick={() => setCategory(cat.id)} style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid', borderColor: active ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.1)', background: active ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)', color: active ? '#a78bfa' : 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: active ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, whiteSpace: 'nowrap' }}>
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
              {cat.id !== 'Tous' && <span style={{ opacity: 0.5, marginLeft: '2px' }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Loader2 size={24} color="rgba(99,102,241,0.6)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
          <Sparkles size={24} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 10px', display: 'block' }} />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: 0 }}>Aucune intégration trouvée</p>
        </div>
      ) : category === 'Tous' && !search ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          {connectedCount > 0 && (
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Actives</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                {INTEGRATIONS.filter(i => configs[i.id]?.connected).map(integration => (
                  <IntegrationCard key={integration.id} integration={integration} config={configs[integration.id]} onSave={handleSave} onDisconnect={handleDisconnect} />
                ))}
              </div>
            </div>
          )}
          {categoriesWithItems.map(cat => (
            <div key={cat.id} style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px' }}>{cat.emoji}</span>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>{cat.label}</p>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                {filtered.filter(i => i.category === cat.id && !configs[i.id]?.connected).map(integration => (
                  <IntegrationCard key={integration.id} integration={integration} config={configs[integration.id]} onSave={handleSave} onDisconnect={handleDisconnect} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
          {filtered.filter(i => configs[i.id]?.connected).map(integration => (
            <IntegrationCard key={integration.id} integration={integration} config={configs[integration.id]} onSave={handleSave} onDisconnect={handleDisconnect} />
          ))}
          {filtered.filter(i => !configs[i.id]?.connected).map(integration => (
            <IntegrationCard key={integration.id} integration={integration} config={configs[integration.id]} onSave={handleSave} onDisconnect={handleDisconnect} />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}