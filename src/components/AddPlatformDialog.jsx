import React, { useState } from 'react';
import { X, Search } from 'lucide-react';

export const PLATFORMS = {
  // ── Réseaux sociaux ────────────────────────────────────────────────────────
  instagram: {
    label: 'Instagram',
    color: '#E1306C',
    category: 'Réseaux sociaux',
    placeholder: 'https://instagram.com/tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
        <defs>
          <radialGradient id="ig1" cx="30%" cy="107%" r="150%">
            <stop offset="0%" stopColor="#fdf497"/>
            <stop offset="5%" stopColor="#fdf497"/>
            <stop offset="45%" stopColor="#fd5949"/>
            <stop offset="60%" stopColor="#d6249f"/>
            <stop offset="90%" stopColor="#285AEB"/>
          </radialGradient>
        </defs>
        <rect width="24" height="24" rx="6" fill="url(#ig1)"/>
        <path d="M12 7.5A4.5 4.5 0 1 0 12 16.5 4.5 4.5 0 0 0 12 7.5z" stroke="white" strokeWidth="1.5"/>
        <circle cx="17" cy="7" r="1" fill="white"/>
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="white" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
  },
  tiktok: {
    label: 'TikTok',
    color: '#000000',
    category: 'Réseaux sociaux',
    placeholder: 'https://tiktok.com/@tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#000000"/>
        <path d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1-2.59-2.59 2.59 2.59 0 0 1 2.59-2.59c.28 0 .54.04.79.1V9.01a5.68 5.68 0 0 0-.79-.05 5.74 5.74 0 0 0-5.74 5.74 5.74 5.74 0 0 0 5.74 5.74 5.74 5.74 0 0 0 5.74-5.74V9.01a7.35 7.35 0 0 0 4.31 1.38V7.3s-1.88.09-3.25-1.48z" fill="white"/>
        <path d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1-2.59-2.59 2.59 2.59 0 0 1 2.59-2.59c.28 0 .54.04.79.1V9.01a5.68 5.68 0 0 0-.79-.05 5.74 5.74 0 0 0-5.74 5.74 5.74 5.74 0 0 0 5.74 5.74 5.74 5.74 0 0 0 5.74-5.74V9.01a7.35 7.35 0 0 0 4.31 1.38V7.3s-1.88.09-3.25-1.48z" fill="#69C9D0" opacity="0.5"/>
      </svg>
    ),
  },
  twitter: {
    label: 'X (Twitter)',
    color: '#000000',
    category: 'Réseaux sociaux',
    placeholder: 'https://x.com/tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#000000"/>
        <path d="M17.75 4h-2.81l-3.5 4.5L7.75 4H3l6.09 7.8L3.5 20h2.81l3.8-4.85L14.25 20H19l-6.31-8.05L17.75 4zm-1.3 14.25-3.26-4.15-3.64 4.15H7.56l4.22-5.4-4.56-5.85h2l3.06 3.9 3.42-3.9h2.05l-4.12 5.25 4.62 5.99h-2.79z" fill="white"/>
      </svg>
    ),
  },
  facebook: {
    label: 'Facebook',
    color: '#1877F2',
    category: 'Réseaux sociaux',
    placeholder: 'https://facebook.com/tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#1877F2"/>
        <path d="M13.2 20v-7.2h2.4l.36-2.8H13.2V8.4c0-.8.22-1.35 1.37-1.35H16V4.1A18.7 18.7 0 0 0 13.66 4C11.4 4 9.87 5.37 9.87 7.9V10H7.5v2.8h2.37V20h3.33z" fill="white"/>
      </svg>
    ),
  },
  linkedin: {
    label: 'LinkedIn',
    color: '#0A66C2',
    category: 'Réseaux sociaux',
    placeholder: 'https://linkedin.com/in/tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#0A66C2"/>
        <path d="M7.1 9.5H4.5V19h2.6V9.5zm-1.3-4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM19.5 13c0-2.2-1.2-3.7-3.1-3.7-1 0-1.9.5-2.4 1.3V9.5H11.5V19h2.5v-5c0-1 .6-1.8 1.6-1.8s1.4.7 1.4 1.8V19h2.5v-6z" fill="white"/>
      </svg>
    ),
  },
  snapchat: {
    label: 'Snapchat',
    color: '#FFFC00',
    category: 'Réseaux sociaux',
    placeholder: 'https://snapchat.com/add/tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#FFFC00"/>
        <path d="M12 3.5c-2.5 0-4.5 2-4.5 4.5v1c-.5.1-1 .3-1.2.7-.1.3 0 .6.3.8.5.3 1 .4 1.5.4-.3.5-.8 1-1.5 1.3-.3.1-.4.4-.3.7.1.5.7.8 1.7 1l.1.5c.1.5.5.7.8.7h.3c.5-.1 1-.1 1.5 0 .4.1.8.4 1.3.4s.9-.3 1.3-.4c.5-.1 1-.1 1.5 0h.3c.4 0 .7-.2.8-.7l.1-.5c1-.2 1.6-.5 1.7-1 .1-.3 0-.6-.3-.7-.7-.3-1.2-.8-1.5-1.3.5 0 1-.1 1.5-.4.3-.2.4-.5.3-.8-.2-.4-.7-.6-1.2-.7v-1c0-2.5-2-4.5-4.5-4.5z" fill="black"/>
      </svg>
    ),
  },
  pinterest: {
    label: 'Pinterest',
    color: '#E60023',
    category: 'Réseaux sociaux',
    placeholder: 'https://pinterest.com/tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#E60023"/>
        <path d="M12 2.5a9.5 9.5 0 0 0-3.4 18.4c-.1-.8-.1-2 .1-2.9l1-4.3s-.3-.5-.3-1.3c0-1.2.7-2.1 1.6-2.1.8 0 1.1.6 1.1 1.3 0 .8-.5 2-.8 3-.2.9.5 1.6 1.4 1.6 1.6 0 2.8-1.7 2.8-4.1 0-2.2-1.5-3.7-3.7-3.7-2.5 0-4 1.9-4 3.8 0 .8.3 1.6.6 2.1.1.1.1.2 0 .4l-.2.9c-.1.2-.2.3-.4.2-1.5-.7-2.4-2.9-2.4-4.6 0-3.8 2.7-7.2 7.9-7.2 4.1 0 7.3 2.9 7.3 6.8 0 4.1-2.6 7.4-6.1 7.4-1.2 0-2.3-.6-2.7-1.3l-.7 2.8c-.3 1-.9 2-1.4 2.7A9.5 9.5 0 1 0 12 2.5z" fill="white"/>
      </svg>
    ),
  },
  threads: {
    label: 'Threads',
    color: '#000000',
    category: 'Réseaux sociaux',
    placeholder: 'https://threads.net/@tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#000000"/>
        <path d="M15.9 11.4c-.1-.1-.3-.1-.4-.2-1.2-3.2-5.8-3-6.4.7-.1.8 0 1.5.3 2.1.9 1.8 3.1 2 4.2.6.2-.3.4-.6.5-1 .3.1.5.3.7.5.5.7.5 1.7 0 2.4-1 1.4-3.2 1.6-4.6.4-1.3-1.2-1.4-3.6-.3-5C10.9 10 12.4 9.5 14 9.6c.5 0 1 .1 1.4.3.1-.4.1-.8.2-1.2-.5-.2-1.1-.3-1.7-.4-2-.1-3.8.6-5 2-1.3 1.5-1.5 4.3-.4 6C9.6 17.7 11 18.5 12.6 18.5c1.2 0 2.3-.4 3.1-1.2.9-.9 1.1-2.2.7-3.3-.1-.6-.3-1-.9-1.4-.2-.1-.4-.2-.6-.2 0-.4-.1-.8-.2-1.1.3.1.6.3.9.5.8.7 1.1 1.7 1 2.8v.1c.2 0 .4-.1.6-.1.2-1.1-.1-2.3-.9-3-.4-.4-.8-.6-1.4-.7z" fill="white"/>
      </svg>
    ),
  },
  youtube: {
    label: 'YouTube',
    color: '#FF0000',
    category: 'Réseaux sociaux',
    placeholder: 'https://youtube.com/@tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#FF0000"/>
        <path d="M21 7.3s-.2-1.5-.9-2.1c-.8-.9-1.8-.9-2.2-.9C15.6 4.1 12 4.1 12 4.1s-3.6 0-5.9.2c-.4 0-1.4 0-2.2.9C3.2 5.8 3 7.3 3 7.3S2.8 9 2.8 10.8v1.6c0 1.7.2 3.5.2 3.5s.2 1.5.9 2.1c.8.9 2 .8 2.5.9C7.6 19 12 19 12 19s3.6 0 5.9-.2c.4 0 1.4 0 2.2-.9.7-.6.9-2.1.9-2.1s.2-1.7.2-3.5v-1.6C21.2 9 21 7.3 21 7.3zM10 14.6V8.8l5.9 2.9-5.9 2.9z" fill="white"/>
      </svg>
    ),
  },
  twitch: {
    label: 'Twitch',
    color: '#9146FF',
    category: 'Réseaux sociaux',
    placeholder: 'https://twitch.tv/tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#9146FF"/>
        <path d="M5 2L3 6v14h5v2h3l2-2h3l4-4V2H5zm13 9l-3 3h-4l-2 2v-2H6V4h12v7zm-3-4h-2v4h2V7zm-4 0H9v4h2V7z" fill="white"/>
      </svg>
    ),
  },
  bereal: {
    label: 'BeReal',
    color: '#000000',
    category: 'Réseaux sociaux',
    placeholder: 'https://bere.al/tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#000000"/>
        <text x="3.5" y="16.5" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="9" fill="white">Be</text>
        <text x="11.5" y="16.5" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="9" fill="white">Real</text>
      </svg>
    ),
  },

  // ── Messagerie ─────────────────────────────────────────────────────────────
  whatsapp: {
    label: 'WhatsApp',
    color: '#25D366',
    category: 'Messagerie',
    placeholder: 'https://wa.me/33600000000',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#25D366"/>
        <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2zm5.2 13.8c-.2.6-1.3 1.2-1.8 1.2-.5.1-1.1.1-1.6-.1-1-.3-2-1-2.8-1.8A9.2 9.2 0 0 1 9 12.4c-.2-.5-.2-1-.1-1.5.1-.5.6-1.1 1-1.3.3-.1.5-.1.7 0 .2 0 .3 0 .4.3l.6 1.6c0 .1.1.3 0 .4-.1.2-.2.3-.3.4-.1.1-.3.3-.2.5.4.7 1 1.3 1.7 1.7.2.1.4 0 .5-.1l.5-.6c.2-.2.4-.2.6-.1l1.4.7c.2.1.4.2.4.4.1.3 0 .8-.2 1z" fill="white"/>
      </svg>
    ),
  },
  telegram: {
    label: 'Telegram',
    color: '#26A5E4',
    category: 'Messagerie',
    placeholder: 'https://t.me/tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#26A5E4"/>
        <path d="M21.9 4.6L18.5 20c-.2.8-.8 1-1.5.6l-4-3-1.9 1.8c-.2.2-.4.3-.8.3l.3-4.2L17.7 8c.4-.3 0-.4-.5-.1L7.1 14.3l-3.9-1.2c-.8-.3-.8-.8.2-1.2l15.1-5.8c.8-.3 1.6.2 1.4 1.5z" fill="white"/>
      </svg>
    ),
  },
  discord: {
    label: 'Discord',
    color: '#5865F2',
    category: 'Messagerie',
    placeholder: 'https://discord.gg/tonserveur',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#5865F2"/>
        <path d="M18.9 5.8A16.5 16.5 0 0 0 15 4.6a.1.1 0 0 0-.1 0c-.2.3-.4.7-.5 1.1a15.2 15.2 0 0 0-4.6 0c-.1-.4-.3-.8-.5-1.1a.1.1 0 0 0-.1 0 16.5 16.5 0 0 0-3.9 1.2A.1.1 0 0 0 5 5.9C3 9 2.4 12 2.7 14.9a.1.1 0 0 0 .1.1A16.6 16.6 0 0 0 7.7 17a.1.1 0 0 0 .1 0c.4-.5.7-1 1-1.6a.1.1 0 0 0-.1-.1c-.5-.2-1-.4-1.4-.7a.1.1 0 0 1 0-.1c.1-.1.2-.1.3-.2a.1.1 0 0 1 .1 0c2.9 1.3 6 1.3 8.9 0a.1.1 0 0 1 .1 0c.1.1.2.1.3.2a.1.1 0 0 1 0 .1c-.5.3-.9.5-1.4.7a.1.1 0 0 0 0 .1c.3.6.6 1.1 1 1.6a.1.1 0 0 0 .1 0 16.6 16.6 0 0 0 4.9-2a.1.1 0 0 0 .1-.1c.3-3.3-.6-6.3-2.7-9.1a.1.1 0 0 0-.1-.1zM9.2 13c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm5.5 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z" fill="white"/>
      </svg>
    ),
  },
  signal: {
    label: 'Signal',
    color: '#3A76F0',
    category: 'Messagerie',
    placeholder: 'https://signal.me/#p/tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#3A76F0"/>
        <path d="M12 2a10 10 0 0 0-9.1 14.2L2 22l5.8-.9A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3.4.5.5-3.3-.2-.3A8 8 0 1 1 12 20z" fill="white"/>
        <circle cx="8.5" cy="12" r="1.5" fill="white"/>
        <circle cx="12" cy="12" r="1.5" fill="white"/>
        <circle cx="15.5" cy="12" r="1.5" fill="white"/>
      </svg>
    ),
  },

  // ── Musique ────────────────────────────────────────────────────────────────
  spotify: {
    label: 'Spotify',
    color: '#1DB954',
    category: 'Musique',
    placeholder: 'https://open.spotify.com/user/tonid',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="12" fill="#1DB954"/>
        <path d="M17.9 10.9C14.7 9 9.35 8.8 6.3 9.75c-.5.15-1-.15-1.15-.6-.15-.5.15-1 .6-1.15C9.1 6.9 15 7.1 18.75 9.3c.45.25.6.85.35 1.3-.25.35-.85.5-1.2.3zm-.1 2.8c-.25.35-.7.5-1.05.25-2.7-1.65-6.8-2.15-9.95-1.15-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 3.6-1.1 8.1-.55 11.2 1.35.3.15.45.65.2 1zm-1.2 2.7c-.2.3-.55.4-.85.2-2.35-1.45-5.3-1.75-8.8-.95-.35.1-.65-.15-.75-.45-.1-.35.15-.65.45-.75 3.8-.85 7.1-.5 9.7 1.1.35.15.4.55.25.85zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="white"/>
      </svg>
    ),
  },
  applemusic: {
    label: 'Apple Music',
    color: '#FA2C3A',
    category: 'Musique',
    placeholder: 'https://music.apple.com/profile/tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="am1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FC5C7D"/>
            <stop offset="100%" stopColor="#6A3093"/>
          </linearGradient>
        </defs>
        <rect width="24" height="24" rx="6" fill="url(#am1)"/>
        <path d="M18 5H6C5.4 5 5 5.4 5 6v12c0 .6.4 1 1 1h12c.6 0 1-.4 1-1V6c0-.6-.4-1-1-1zM16 14.7c0 .8-.5 1.5-1.3 1.8-.8.3-1.7.1-2.2-.5-.5-.6-.5-1.5 0-2.1s1.4-.8 2.2-.5v-4L10 10.3v5.4c0 .8-.5 1.5-1.3 1.8-.8.3-1.7.1-2.2-.5-.5-.6-.5-1.5 0-2.1s1.4-.8 2.2-.5V8.5c0-.4.3-.7.7-.8l5.7-1.2c.4-.1.8.2.8.6v7.6h.1z" fill="white"/>
      </svg>
    ),
  },
  amazonmusic: {
    label: 'Amazon Music',
    color: '#00A8E0',
    category: 'Musique',
    placeholder: 'https://music.amazon.com/profiles/tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#232F3E"/>
        <path d="M14.6 13.4c-.7.5-1.7.8-2.6.8-1.2 0-2.3-.4-3.1-1.2-.1-.1 0-.2.1-.1.9.5 2 .8 3.1.8.8 0 1.6-.2 2.3-.5.1-.1.3.1.2.2z" fill="#FF9900"/>
        <path d="M15 12.8c-.1-.2-.7-.1-1 0-.1 0-.1-.1 0-.1.5-.3 1.3-.3 1.4-.1.1.1-.1.5-.3.7-.1.1-.1 0-.1 0 .1-.2.1-.4 0-.5z" fill="#FF9900"/>
        <path d="M12 5.5c-3.6 0-6.5 2.9-6.5 6.5s2.9 6.5 6.5 6.5 6.5-2.9 6.5-6.5-2.9-6.5-6.5-6.5zm0 11.5c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z" fill="white"/>
        <path d="M9 10.2c0-.4.1-.7.4-.9.3-.2.6-.3.9-.3.4 0 .7.1.9.3.2.2.3.5.3.9v.1H9V10.2zm2 .4v.1c0 .3-.1.6-.3.8-.2.2-.5.3-.8.3-.3 0-.5-.1-.7-.3-.2-.2-.2-.5-.2-.8v-.1h2zm2.3-1.4c-.1.1-.3.3-.5.5-.1.1-.1.3 0 .4l.9 1.2c.1.1 0 .3-.1.3h-.5c-.1 0-.2-.1-.3-.2l-.6-.9c-.1-.1-.2-.1-.3 0l-.3.3c-.1.1-.1.2-.1.3v.5c0 .1-.1.2-.2.2h-.4c-.1 0-.2-.1-.2-.2V8.8c0-.1.1-.2.2-.2h.4c.1 0 .2.1.2.2v1.1c0 .1.1.2.2.1l.9-.9c.1-.1.2-.1.3-.1h.5c.2-.1.2.1.1.2z" fill="white"/>
      </svg>
    ),
  },
  deezer: {
    label: 'Deezer',
    color: '#A238FF',
    category: 'Musique',
    placeholder: 'https://deezer.com/profile/tonid',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#A238FF"/>
        <rect x="3" y="15" width="2.5" height="3" rx="0.5" fill="white" opacity="0.6"/>
        <rect x="6.5" y="13" width="2.5" height="5" rx="0.5" fill="white" opacity="0.7"/>
        <rect x="10" y="10" width="2.5" height="8" rx="0.5" fill="white" opacity="0.85"/>
        <rect x="13.5" y="7" width="2.5" height="11" rx="0.5" fill="white"/>
        <rect x="17" y="9" width="2.5" height="9" rx="0.5" fill="white" opacity="0.9"/>
      </svg>
    ),
  },
  soundcloud: {
    label: 'SoundCloud',
    color: '#FF5500',
    category: 'Musique',
    placeholder: 'https://soundcloud.com/tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#FF5500"/>
        <path d="M2 14.5c0 1.1.9 2 2 2H18.3c1.5 0 2.7-1.2 2.7-2.7 0-1.4-1.1-2.6-2.5-2.7-.1-2.2-1.9-4-4.2-4-.9 0-1.8.3-2.5.8-.7-1-1.8-1.6-3-1.6-2.1 0-3.8 1.7-3.8 3.8v.1C3 10.6 2 12.4 2 14.5zM5.5 12c-.2-.4-.3-.8-.3-1.3 0-1.7 1.4-3.1 3.1-3.1.9 0 1.7.4 2.3 1 .4-.2.9-.4 1.4-.4 1.7 0 3.1 1.4 3.1 3.1v.2c.1 0 .2 0 .2-.1.9 0 1.7.7 1.7 1.6s-.8 1.6-1.7 1.6H4c-.6 0-1-.4-1-1 0-.6.4-1 1-1H5c.2 0 .3-.1.4-.3l.1-.3z" fill="white"/>
      </svg>
    ),
  },

  // ── Navigation & Cartes ────────────────────────────────────────────────────
  googlemaps: {
    label: 'Google Maps',
    color: '#4285F4',
    category: 'Navigation',
    placeholder: 'https://maps.google.com/?q=tonlieu',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#ffffff"/>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335"/>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 1.9.68 3.63 1.8 4.97L12 2z" fill="#4285F4"/>
        <path d="M12 2v7l5.82 5.82C18.55 13.43 19 11.27 19 9c0-3.87-3.13-7-7-7z" fill="#FBBC04"/>
        <path d="M12 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="white"/>
        <path d="M6.8 13.97C7.87 18 10.25 22 12 22c1.75 0 4.13-4 5.2-8.03L12 9 6.8 13.97z" fill="#34A853"/>
      </svg>
    ),
  },
  applemaps: {
    label: 'Apple Maps',
    color: '#1996FF',
    category: 'Navigation',
    placeholder: 'https://maps.apple.com/?q=tonlieu',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="aplmaps" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34C759"/>
            <stop offset="50%" stopColor="#1996FF"/>
            <stop offset="100%" stopColor="#0071E3"/>
          </linearGradient>
        </defs>
        <rect width="24" height="24" rx="6" fill="url(#aplmaps)"/>
        <path d="M12 4C8.7 4 6 6.7 6 10c0 4.3 6 10 6 10s6-5.7 6-10c0-3.3-2.7-6-6-6zm0 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="white"/>
        <path d="M6.5 19.5c1.5.8 3.4 1.5 5.5 1.5s4-.7 5.5-1.5c.3-.2.3-.7-.1-.7H6.6c-.4 0-.4.5-.1.7z" fill="rgba(255,255,255,0.5)"/>
      </svg>
    ),
  },
  waze: {
    label: 'Waze',
    color: '#33CCFF',
    category: 'Navigation',
    placeholder: 'https://waze.com/ul?q=tonlieu',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#33CCFF"/>
        <path d="M12 3C7.6 3 4 6.5 4 11c0 2.5 1.1 4.7 2.8 6.3l-.5 2.3 2.3-.6c1 .5 2.2.8 3.4.8 4.4 0 8-3.5 8-8s-3.6-8-8-8z" fill="white"/>
        <circle cx="9.5" cy="10.5" r="1" fill="#33CCFF"/>
        <circle cx="14.5" cy="10.5" r="1" fill="#33CCFF"/>
        <path d="M9 13.5c.6.9 1.7 1.5 3 1.5s2.4-.6 3-1.5" stroke="#33CCFF" strokeWidth="1" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },

  // ── Développement & Tech ───────────────────────────────────────────────────
  github: {
    label: 'GitHub',
    color: '#181717',
    category: 'Développement',
    placeholder: 'https://github.com/tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#181717"/>
        <path d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.5.1.7-.2.7-.5v-1.7C6.7 19.4 6.1 17 6.1 17c-.4-1.1-1-1.4-1-1.4-.8-.6.1-.5.1-.5.9.1 1.4.9 1.4.9.8 1.4 2.1 1 2.6.8.1-.6.3-1 .5-1.2C7.4 15.4 5 14.5 5 10.7a3.7 3.7 0 0 1 1-2.6c-.1-.2-.4-1.2.1-2.5 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 4.9 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.5.6.7 1 1.6 1 2.6 0 3.8-2.3 4.6-4.5 4.9.4.3.7.9.7 1.8v2.6c0 .3.2.6.7.5A9.5 9.5 0 0 0 12 2.5z" fill="white"/>
      </svg>
    ),
  },
  gitlab: {
    label: 'GitLab',
    color: '#FC6D26',
    category: 'Développement',
    placeholder: 'https://gitlab.com/tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#FC6D26"/>
        <path d="M12 19.5l3.3-10.2H8.7L12 19.5z" fill="white" opacity="0.9"/>
        <path d="M12 19.5l-3.3-10.2H5L12 19.5z" fill="white" opacity="0.7"/>
        <path d="M5 9.3l-.9 2.7c-.1.2 0 .5.2.6L12 19.5 5 9.3z" fill="white" opacity="0.5"/>
        <path d="M5 9.3h3.7L7.1 4.8c-.1-.3-.5-.3-.6 0L5 9.3z" fill="white" opacity="0.7"/>
        <path d="M12 19.5l3.3-10.2H19L12 19.5z" fill="white" opacity="0.7"/>
        <path d="M19 9.3l.9 2.7c.1.2 0 .5-.2.6L12 19.5 19 9.3z" fill="white" opacity="0.5"/>
        <path d="M19 9.3h-3.7l1.6-4.5c.1-.3.5-.3.6 0L19 9.3z" fill="white" opacity="0.7"/>
      </svg>
    ),
  },
  producthunt: {
    label: 'Product Hunt',
    color: '#DA552F',
    category: 'Développement',
    placeholder: 'https://producthunt.com/@tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="12" fill="#DA552F"/>
        <path d="M13.5 9H10v2.5h3.5c.7 0 1.25-.56 1.25-1.25S14.2 9 13.5 9zM12 3a9 9 0 1 0 0 18A9 9 0 0 0 12 3zm1.5 10.5H10V16H8.5V8H13.5a2.75 2.75 0 0 1 0 5.5z" fill="white"/>
      </svg>
    ),
  },

  // ── Portfolio & Créatif ────────────────────────────────────────────────────
  behance: {
    label: 'Behance',
    color: '#1769FF',
    category: 'Créatif',
    placeholder: 'https://behance.net/tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#1769FF"/>
        <path d="M15.5 8h3.7v1H15.5V8zm-2.3 5.5c.5-.6.8-1.3.8-2.2C14 9.4 12.7 8 10.8 8H5v10h5.9c2 0 3.5-1.4 3.5-3.5 0-.7-.2-1.4-.7-2zM7 9.7h3.5c.8 0 1.3.5 1.3 1.2s-.5 1.2-1.3 1.2H7V9.7zm3.7 6.6H7v-2.7h3.7c.9 0 1.5.6 1.5 1.4s-.6 1.3-1.5 1.3zM19 13h-4.5c0 1.2.8 2 2 2 .7 0 1.3-.3 1.6-.9H19c-.5 1.5-1.7 2.4-3.5 2.4-2.1 0-3.7-1.5-3.7-3.8 0-2.2 1.6-3.8 3.7-3.8 2.2 0 3.6 1.7 3.6 3.8-.1.1-.1.2-.1.3zm-4.4-1.5h2.7c-.2-1-.8-1.5-1.3-1.5-.7 0-1.2.5-1.4 1.5z" fill="white"/>
      </svg>
    ),
  },
  dribbble: {
    label: 'Dribbble',
    color: '#EA4C89',
    category: 'Créatif',
    placeholder: 'https://dribbble.com/tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="12" fill="#EA4C89"/>
        <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm6.6 4.7c1.3 1.6 2.1 3.6 2.2 5.8-3.2-.7-6.1-.6-8.6.3-.2-.5-.4-1-.7-1.5 3.1-1.2 5.5-2.8 7.1-4.6zM12 4c2.1 0 4 .8 5.5 2-1.5 1.7-3.7 3.1-6.5 4.2-1.4-2.5-2.8-4.3-3.8-5.4C8.5 4.3 10.2 4 12 4zM5.5 5.6c1 1 2.5 2.8 3.8 5.3C6.5 12 4.5 13.5 3.2 15.6A8 8 0 0 1 4 8c.4-.9 1-1.7 1.5-2.4zm-1.3 12c1.2-1.9 3-3.3 5.8-4.5.9 2.5 1.5 5 1.6 7.2A8 8 0 0 1 4.2 17.6zm9.5 3c-.2-2.1-.7-4.5-1.6-6.9.8-.1 1.7-.2 2.6-.1 1.9.1 3.7.6 5.1 1.4A8 8 0 0 1 13.7 20.6z" fill="white"/>
      </svg>
    ),
  },

  // ── E-commerce & Business ──────────────────────────────────────────────────
  shopify: {
    label: 'Shopify',
    color: '#96BF48',
    category: 'Business',
    placeholder: 'https://tonshop.myshopify.com',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#96BF48"/>
        <path d="M15.3 5.6c0-.1 0-.1-.1-.2-.1 0-1.3-.1-1.3-.1s-1-.9-1.1-1H8.7L7 20h7.3l1.6-5.1 1.6-9.3h-2.2zm-2.2-.5c-.1 0-.3-.1-.4-.1 0-.2-.1-.5-.2-.7.4.2.6.5.6.8zm-.7-.2c-.3-.1-.6 0-.9.1 0-.4-.2-.8-.4-1 .6.1 1 .5 1.3.9zm-1.4.4c-.4.1-.7.3-1 .5.1-.4.3-.9.7-1.1.1.2.2.4.3.6zm3.8.5c-.3-1-.8-1.6-1.6-2 .4 0 1.1 0 1.4.2l.2 1.8zm1.5 11.5H10l-1 3.2H7L8.5 6.3h5.3l1.3 10.9c-.1.1-.4.1-.7.1z" fill="white"/>
      </svg>
    ),
  },
  etsy: {
    label: 'Etsy',
    color: '#F16521',
    category: 'Business',
    placeholder: 'https://etsy.com/shop/tonom',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#F16521"/>
        <path d="M8.5 5.5v12.8c0 .5.2.9.7 1.1l3.8 1.1v-.7l-3.5-1V5.5c0-.5-.2-.9-.5-1.1v7.4C8.7 11.3 8.5 10.8 8.5 10.5v-5zm7 0V8h-3.7V6.5c0-.5-.4-1-1-1h-1.3c.3.2.5.6.5 1V10h3.7v1.5h-3.7V15c0 .5.4 1 1 1h3.5v1.5h-4c-.7 0-1.3-.7-1.3-1.5V5c0-.8.6-1.5 1.3-1.5h5c.7 0 1 .3 1 1v1z" fill="white"/>
      </svg>
    ),
  },

  // ── Contact & Pro ──────────────────────────────────────────────────────────
  email: {
    label: 'Email',
    color: '#EA4335',
    category: 'Contact',
    placeholder: 'mailto:ton@email.com',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#EA4335"/>
        <path d="M20 6H4c-.6 0-1 .4-1 1v10c0 .6.4 1 1 1h16c.6 0 1-.4 1-1V7c0-.6-.4-1-1-1zm-1.3 1.5L12 13.1 5.3 7.5h13.4zM4 17V8.5l7.5 6c.1.1.3.2.5.2s.4-.1.5-.2L20 8.5V17H4z" fill="white"/>
      </svg>
    ),
  },
  phone: {
    label: 'Téléphone',
    color: '#34C759',
    category: 'Contact',
    placeholder: 'tel:+33600000000',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#34C759"/>
        <path d="M17.8 15.5l-2.5-.3c-.5-.1-.9.2-1.2.5l-1.7 1.7c-2.6-1.3-4.7-3.4-6-6l1.7-1.7c.3-.3.4-.7.3-1.2l-.3-2.5c-.1-.6-.6-1-1.2-1H5.5C4.8 5 4.1 5.7 4.2 6.5c.7 7.2 6.5 13 13.7 13.7.8.1 1.5-.6 1.5-1.3v-2.2c0-.6-.4-1.1-1-1.2z" fill="white"/>
      </svg>
    ),
  },
  calendly: {
    label: 'Calendly',
    color: '#0069FF',
    category: 'Contact',
    placeholder: 'https://calendly.com/tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#0069FF"/>
        <path d="M17 4h-1V3h-2v1H10V3H8v1H7C5.9 4 5 4.9 5 6v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H7V9h10v11z" fill="white"/>
        <circle cx="12" cy="14" r="2" fill="white" opacity="0.7"/>
      </svg>
    ),
  },

  // ── Paiement ───────────────────────────────────────────────────────────────
  paypal: {
    label: 'PayPal',
    color: '#00457C',
    category: 'Paiement',
    placeholder: 'https://paypal.me/tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#003087"/>
        <path d="M17.5 7c.3 2-1 3.5-3 3.5h-2l-.7 4.5H9.5L11 5h4c1.4 0 2.2.8 2.5 2z" fill="#009CDE"/>
        <path d="M15 8.5c.2 1.5-.8 2.5-2.2 2.5h-1.5l-.5 3H9l1.3-8.5h3c1 0 1.5.7 1.7 2z" fill="white"/>
      </svg>
    ),
  },
  cashapp: {
    label: 'Cash App',
    color: '#00D54B',
    category: 'Paiement',
    placeholder: 'https://cash.app/$tonpseudo',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#00D54B"/>
        <path d="M13.5 8.5c.7.2 1.3.6 1.8 1.2l1.2-1.2c-.7-.9-1.8-1.5-3-1.7V5.5h-1.5V7c-1.8.3-3 1.5-3 3 0 1.8 1.2 2.7 3 3.3 1.5.5 2 .9 2 1.7 0 .7-.6 1.2-1.5 1.2-.9 0-1.7-.4-2.3-1.1l-1.2 1.2c.8.9 1.9 1.5 3.2 1.7V19h1.5v-1.8c2-.3 3.2-1.6 3.2-3.2 0-1.9-1.3-2.9-3.2-3.5-1.3-.4-1.8-.8-1.8-1.5 0-.6.5-1 1.3-1 .8 0 1.4.3 1.8.8l.5.7z" fill="white"/>
      </svg>
    ),
  },

  // ── Divers ─────────────────────────────────────────────────────────────────
  website: {
    label: 'Site web',
    color: '#6366F1',
    category: 'Autre',
    placeholder: 'https://tonsite.com',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#6366F1"/>
        <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="1.5" fill="none"/>
        <ellipse cx="12" cy="12" rx="3.5" ry="8" stroke="white" strokeWidth="1.5" fill="none"/>
        <line x1="4" y1="12" x2="20" y2="12" stroke="white" strokeWidth="1.5"/>
        <line x1="5" y1="8" x2="19" y2="8" stroke="white" strokeWidth="1" opacity="0.7"/>
        <line x1="5" y1="16" x2="19" y2="16" stroke="white" strokeWidth="1" opacity="0.7"/>
      </svg>
    ),
  },
  other: {
    label: 'Autre lien',
    color: '#8B8B8B',
    category: 'Autre',
    placeholder: 'https://...',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="6" fill="#8B8B8B"/>
        <path d="M13.5 8.5l2-2a2.1 2.1 0 0 1 3 3l-2 2a2.1 2.1 0 0 1-2.8.1l-.7.7c.9.9 2.3 1 3.2.1l2-2a3.1 3.1 0 0 0-4.4-4.4l-2 2c-.9.9-.9 2.3 0 3.2l.7-.7a2.1 2.1 0 0 1 0-3z" fill="white"/>
        <path d="M10.5 15.5l-2 2a2.1 2.1 0 0 1-3-3l2-2a2.1 2.1 0 0 1 2.8-.1l.7-.7c-.9-.9-2.3-1-3.2-.1l-2 2a3.1 3.1 0 0 0 4.4 4.4l2-2c.9-.9.9-2.3 0-3.2l-.7.7a2.1 2.1 0 0 1 0 3z" fill="white"/>
      </svg>
    ),
  },
};

const CATEGORY_ORDER = ['Réseaux sociaux', 'Messagerie', 'Musique', 'Navigation', 'Développement', 'Créatif', 'Business', 'Contact', 'Paiement', 'Autre'];

export default function AddPlatformDialog({ open, onOpenChange, onSelect, existingPlatforms = [] }) {
  const [search, setSearch] = useState('');

  if (!open) return null;

  const filtered = Object.entries(PLATFORMS).filter(([key, p]) => {
    const q = search.toLowerCase();
    return (
      !existingPlatforms.includes(key) &&
      (p.label.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    );
  });

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = filtered.filter(([, p]) => p.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={() => onOpenChange(false)}
    >
      <div
        style={{
          background: '#0f0a1e',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ color: 'white', fontSize: '16px', fontWeight: 700, margin: 0 }}>Ajouter une plateforme</h2>
            <button
              onClick={() => onOpenChange(false)}
              style={{
                background: 'rgba(255,255,255,0.08)', border: 'none',
                cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
                width: '28px', height: '28px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px',
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '9px 12px 9px 34px',
                color: 'white', fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 20px 20px' }}>
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: '16px' }}>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', margin: '0 0 8px' }}>{cat}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {items.map(([key, platform]) => (
                  <button
                    key={key}
                    onClick={() => { onSelect(key); onOpenChange(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: '1px solid transparent',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      textAlign: 'left',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {platform.icon}
                    </div>
                    <div>
                      <p style={{ color: 'white', fontSize: '13px', fontWeight: 500, margin: 0 }}>{platform.label}</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0 }}>{platform.placeholder}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(grouped).length === 0 && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '13px', paddingTop: '32px' }}>
              Aucun résultat pour « {search} »
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

