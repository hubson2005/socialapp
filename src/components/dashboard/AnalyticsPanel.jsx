import React, { useState, useEffect } from 'react';
import {
  Loader2, Eye, MousePointerClick, TrendingUp, Globe,
  ArrowUpRight, ArrowDownRight, Phone, Waves, Link2,
} from 'lucide-react';
import { supabase } from '../../supabase';

// ─── Vrais logos de marques (tracés SVG officiels, source : Simple Icons, CC0) ───
// Viewbox 24x24, rendus en <svg fill="currentColor"> : aucune dépendance, aucun appel réseau.
const BRAND_PATHS = {
  youtube: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  tiktok: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  instagram: 'M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077',
  facebook: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
  linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
  telegram: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
  snapchat: 'M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z',
  pinterest: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z',
  x: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
  bitcoin: 'M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z',
  github: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  spotify: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z',
  discord: 'M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z',
  twitch: 'M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z',
  paypal: 'M7.016 19.198h-4.2a.562.562 0 0 1-.555-.65L5.093.584A.692.692 0 0 1 5.776 0h7.222c3.417 0 5.904 2.488 5.846 5.5-.006.25-.027.5-.066.747A6.794 6.794 0 0 1 12.071 12H8.743a.69.69 0 0 0-.682.583l-.325 2.056-.013.083-.692 4.39-.015.087zM19.79 6.142c-.01.087-.01.175-.023.261a7.76 7.76 0 0 1-7.695 6.598H9.007l-.283 1.795-.013.083-.692 4.39-.134.843-.014.088H6.86l-.497 3.15a.562.562 0 0 0 .555.65h3.612c.34 0 .63-.249.683-.585l.952-6.031a.692.692 0 0 1 .683-.584h2.126a6.793 6.793 0 0 0 6.707-5.752c.306-1.95-.466-3.744-1.89-4.906z',
};

// color = couleur de marque (tuile + barre) · glyph = couleur du logo · bg = fond spécial (optionnel)
const PLATFORMS = {
  youtube:   { label: 'YouTube',   brand: 'youtube',   color: '#FF0000' },
  tiktok:    { label: 'TikTok',    brand: 'tiktok',    color: '#000000' },
  instagram: { label: 'Instagram', brand: 'instagram', color: '#E1306C', bg: 'linear-gradient(45deg,#F9CE34,#EE2A7B 55%,#6228D7)' },
  facebook:  { label: 'Facebook',  brand: 'facebook',  color: '#1877F2' },
  linkedin:  { label: 'LinkedIn',  brand: 'linkedin',  color: '#0A66C2' },
  whatsapp:  { label: 'WhatsApp',  brand: 'whatsapp',  color: '#25D366' },
  telegram:  { label: 'Telegram',  brand: 'telegram',  color: '#229ED9' },
  snapchat:  { label: 'Snapchat',  brand: 'snapchat',  color: '#FFFC00', glyph: '#000000', bar: '#EAB308' },
  pinterest: { label: 'Pinterest', brand: 'pinterest', color: '#E60023' },
  x:         { label: 'X',         brand: 'x',         color: '#000000' },
  bitcoin:   { label: 'Bitcoin',   brand: 'bitcoin',   color: '#F7931A' },
  github:    { label: 'GitHub',    brand: 'github',    color: '#181717' },
  spotify:   { label: 'Spotify',   brand: 'spotify',   color: '#1DB954' },
  discord:   { label: 'Discord',   brand: 'discord',   color: '#5865F2' },
  twitch:    { label: 'Twitch',    brand: 'twitch',    color: '#9146FF' },
  paypal:    { label: 'PayPal',    brand: 'paypal',    color: '#003087' },
};

// Variantes de noms rencontrées dans profile_stats.platform
const PLATFORM_ALIASES = {
  twitter: 'x', 'x.com': 'x', yt: 'youtube', fb: 'facebook', ig: 'instagram',
  wa: 'whatsapp', tg: 'telegram', btc: 'bitcoin',
};

// Liens sans logo de marque officiel : icônes génériques (lucide)
const GENERIC_PLATFORMS = {
  phone:     { label: 'Téléphone', Icon: Phone,  color: '#10b981' },
  tel:       { label: 'Téléphone', Icon: Phone,  color: '#10b981' },
  wave:      { label: 'Wave',      Icon: Waves,  color: '#1DC8FF' },
};

function resolvePlatform(raw) {
  const key = (raw || '').toString().toLowerCase().trim();
  const k = PLATFORM_ALIASES[key] || key;
  if (PLATFORMS[k]) return PLATFORMS[k];
  if (GENERIC_PLATFORMS[k]) return GENERIC_PLATFORMS[k];
  return {
    label: raw ? String(raw).charAt(0).toUpperCase() + String(raw).slice(1) : 'Lien',
    Icon: Link2,
    color: '#6366f1',
  };
}

// Tuile logo : fond couleur de marque + glyphe blanc (ou noir pour Snapchat)
function PlatformLogo({ platform, size = 28 }) {
  const glyph = platform.glyph || '#ffffff';
  const inner = Math.round(size * 0.56);
  return (
    <div
      aria-hidden="true"
      style={{
        width: size + 'px', height: size + 'px', borderRadius: '8px',
        background: platform.bg || platform.color,
        color: glyph,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: platform.color === '#FFFC00' ? 'inset 0 0 0 1px rgba(0,0,0,0.06)' : 'none',
      }}
    >
      {platform.brand ? (
        <svg width={inner} height={inner} viewBox="0 0 24 24" fill="currentColor" role="img" focusable="false">
          <path d={BRAND_PATHS[platform.brand]} />
        </svg>
      ) : (
        <platform.Icon size={inner} color={glyph} strokeWidth={2.2} />
      )}
    </div>
  );
}

// ─── Palette (thème clair, cohérent avec le reste du dashboard) ─
const T = {
  bgCard:     '#ffffff',
  bgCardAlt:  '#f8f9fc',
  border:     '#e6e8f0',
  track:      '#eef0f6',
  textPrimary:   '#151329',
  textSecondary: '#6b6f85',
  textMuted:     '#9a9db0',
  shadow: '0 1px 2px rgba(16,18,40,0.04), 0 1px 8px rgba(16,18,40,0.03)',
};

// ─── Hook : largeur de la fenêtre ─────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

// ─── Mini Stat ────────────────────────────────────────────────
function MiniStat({ label, value, icon: Icon, color, trend, trendUp }) {
  return (
    <div style={{
      background: T.bgCard,
      border: `1px solid ${T.border}`,
      boxShadow: T.shadow,
      borderRadius: '14px',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
        <span style={{
          color: T.textMuted, fontSize: '10px', fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textTransform: 'uppercase', letterSpacing: '0.02em',
        }}>
          {label}
        </span>
        <div style={{
          width: '26px', height: '26px', borderRadius: '7px',
          background: color + '1a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={12} color={color} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ color: T.textPrimary, fontSize: '20px', fontWeight: 800, lineHeight: 1 }}>
          {value}
        </span>
        {trend != null && (
          <span style={{
            fontSize: '11px',
            color: trendUp ? '#16a34a' : '#dc2626',
            fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '2px',
            flexShrink: 0,
          }}>
            {trendUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ─── AnalyticsPanel ───────────────────────────────────────────
export default function AnalyticsPanel({ profileId }) {
  const [period, setPeriod]   = useState('7d');
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [geoData, setGeoData] = useState([]);
  const [totalCountries, setTotalCountries] = useState(0);
  const [topLinks, setTopLinks] = useState([]);
  const [daily, setDaily]     = useState([]);

  const windowWidth = useWindowWidth();
  const isMobile  = windowWidth < 480;
  const isTablet  = windowWidth >= 480 && windowWidth < 768;
  const isDesktop = windowWidth >= 768;

  useEffect(() => {
    if (!profileId) return;
    (async () => {
      setLoading(true);
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const from = new Date();
      from.setDate(from.getDate() - days);

      const { data: viewsData } = await supabase
        .from('profile_stats')
        .select('created_at, country, country_name, platform')
        .eq('profile_id', profileId)
        .gte('created_at', from.toISOString());

      const { data: prevData } = await supabase
        .from('profile_stats')
        .select('id')
        .eq('profile_id', profileId)
        .eq('event_type', 'view')
        .gte('created_at', new Date(from.getTime() - days * 86400000).toISOString())
        .lt('created_at', from.toISOString());

      const views     = (viewsData || []).filter(r => !r.platform);
      const clicks    = (viewsData || []).filter(r =>  r.platform);
      const prevCount = prevData?.length || 0;
      const trend     = prevCount > 0
        ? Math.round(((views.length - prevCount) / prevCount) * 100)
        : null;

      setStats({
        views:   views.length,
        clicks:  clicks.length,
        ctr:     views.length > 0 ? Math.round((clicks.length / views.length) * 100) : 0,
        trend,
        trendUp: trend !== null ? trend >= 0 : true,
      });

      // ── Geo ──
      const geoMap = {};
      views.forEach(r => {
        const k = r.country_name || r.country || 'Inconnu';
        geoMap[k] = { count: (geoMap[k]?.count || 0) + 1, code: r.country };
      });
      const geoEntries = Object.entries(geoMap).sort((a, b) => b[1].count - a[1].count);
      setTotalCountries(geoEntries.length);
      setGeoData(geoEntries.slice(0, 5));

      // ── Top links ──
      const clickMap = {};
      clicks.forEach(r => { clickMap[r.platform] = (clickMap[r.platform] || 0) + 1; });
      setTopLinks(
        Object.entries(clickMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
      );

      // ── Daily bars (7 derniers jours) ──
      const buckets = {};
      const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        buckets[key] = { day: DAY_LABELS[d.getDay()], views: 0, clicks: 0 };
      }
      (viewsData || []).forEach(r => {
        const key = r.created_at?.split('T')[0];
        if (!buckets[key]) return;
        if (!r.platform) buckets[key].views++;
        else             buckets[key].clicks++;
      });
      setDaily(Object.values(buckets));

      setLoading(false);
    })();
  }, [profileId, period]);

  const flagEmoji = (code) => {
    try {
      return code?.length === 2
        ? String.fromCodePoint(...[...code.toUpperCase()].map(c => c.charCodeAt(0) + 127397))
        : '🌐';
    } catch { return '🌐'; }
  };

  const maxGeo    = geoData[0]?.[1]?.count || 1;
  const maxLink   = topLinks[0]?.[1]        || 1;
  const maxViews  = Math.max(...daily.map(d => d.views),  1);
  const maxClicks = Math.max(...daily.map(d => d.clicks), 1);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '16px',
      WebkitOverflowScrolling: 'touch',
      overscrollBehavior: 'contain',
      minWidth: 0, width: '100%',
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ color: T.textPrimary, fontSize: '18px', fontWeight: 800, margin: 0 }}>
            Analytics
          </h2>
          <p style={{ color: T.textSecondary, fontSize: '12px', margin: '4px 0 0' }}>
            Performance de votre profil
          </p>
        </div>

        {/* Boutons de période */}
        <div style={{
          display: 'flex', gap: '4px',
          background: T.track,
          borderRadius: '10px', padding: '3px',
          flexShrink: 0,
        }}>
          {['7d', '30d', '90d'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '6px 12px',
                minHeight: '36px',
                borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '11px', fontWeight: 600,
                transition: 'all 0.15s',
                background: period === p ? '#ede9fe' : 'transparent',
                color:      period === p ? '#7c3aed' : T.textSecondary,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <Loader2 size={24} className="animate-spin" color="#6366f1" />
        </div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop
              ? 'repeat(4, 1fr)'
              : isTablet
                ? 'repeat(4, 1fr)'
                : 'repeat(2, 1fr)',
            gap: isMobile ? '8px' : '10px',
          }}>
            <MiniStat label="Vues"      value={stats?.views   || 0}        icon={Eye}               color="#6366f1" trend={stats?.trend} trendUp={stats?.trendUp} />
            <MiniStat label="Clics"     value={stats?.clicks  || 0}        icon={MousePointerClick}  color="#f59e0b" />
            <MiniStat label="CTR"       value={(stats?.ctr    || 0) + '%'} icon={TrendingUp}         color="#22c55e" />
            <MiniStat label="Pays"      value={totalCountries}             icon={Globe}              color="#0ea5e9" />
          </div>

          {/* ── Bar chart ── */}
          <div style={{
            background: T.bgCard,
            border: `1px solid ${T.border}`,
            boxShadow: T.shadow,
            borderRadius: '18px',
            padding: isMobile ? '12px' : '16px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              flexWrap: 'wrap', gap: '8px',
            }}>
              <span style={{ color: T.textPrimary, fontSize: '13px', fontWeight: 700 }}>
                Activité — 7 derniers jours
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { color: '#e5683b', label: 'Vues' },
                  { color: '#22c55e', label: 'Clics' },
                ].map(({ color, label }) => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: T.textSecondary, fontSize: '11px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: color, display: 'inline-block', flexShrink: 0 }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: isMobile ? '3px' : '6px',
              height: isMobile ? '64px' : '80px',
              overflow: 'hidden',
            }}>
              {daily.map(d => (
                <div key={d.day} style={{
                  flex: 1,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '3px',
                  height: '100%',
                  minWidth: 0,
                }}>
                  <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', gap: '1px' }}>
                    {/* Vues */}
                    <div style={{
                      flex: 1,
                      height: `${Math.round((d.views / maxViews) * 100)}%`,
                      minHeight: '3px',
                      background: '#e5683b',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.5s ease',
                    }} />
                    {/* Clics */}
                    <div style={{
                      flex: 1,
                      height: `${Math.round((d.clicks / maxClicks) * 100)}%`,
                      minHeight: '3px',
                      background: '#22c55e',
                      borderRadius: '3px 3px 0 0',
                      transition: 'height 0.5s ease',
                    }} />
                  </div>
                  <span style={{
                    color: T.textMuted,
                    fontSize: isMobile ? '8px' : '9px',
                    lineHeight: 1,
                    userSelect: 'none',
                  }}>
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Bottom row : Top pays + Top liens ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '12px',
          }}>

            {/* Top pays */}
            <div style={{
              background: T.bgCard,
              border: `1px solid ${T.border}`,
              boxShadow: T.shadow,
              borderRadius: '18px',
              padding: isMobile ? '12px' : '16px',
              minWidth: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Globe size={14} color="#7c3aed" />
                <span style={{ color: T.textPrimary, fontSize: '13px', fontWeight: 700 }}>Top pays</span>
                {totalCountries > geoData.length && (
                  <span style={{ color: T.textMuted, fontSize: '10px', fontWeight: 500, marginLeft: 'auto' }}>
                    Top {geoData.length} / {totalCountries}
                  </span>
                )}
              </div>
              {geoData.length === 0 ? (
                <p style={{ color: T.textMuted, fontSize: '12px', textAlign: 'center', padding: '12px 0', margin: 0 }}>
                  Pas encore de données
                </p>
              ) : geoData.map(([country, { count, code }]) => (
                <div key={country} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', minWidth: 0 }}>
                  <span style={{ fontSize: '15px', width: '20px', flexShrink: 0 }}>
                    {flagEmoji(code)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', gap: '4px' }}>
                      <span style={{
                        color: T.textPrimary, fontSize: '11px', fontWeight: 500,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {country}
                      </span>
                      <span style={{ color: T.textSecondary, fontSize: '11px', flexShrink: 0 }}>
                        {count}
                      </span>
                    </div>
                    <div style={{ height: '3px', background: T.track, borderRadius: '2px' }}>
                      <div style={{
                        width: Math.round((count / maxGeo) * 100) + '%',
                        height: '100%',
                        background: 'linear-gradient(90deg,#a78bfa,#6366f1)',
                        borderRadius: '2px',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top liens */}
            <div style={{
              background: T.bgCard,
              border: `1px solid ${T.border}`,
              boxShadow: T.shadow,
              borderRadius: '18px',
              padding: isMobile ? '12px' : '16px',
              minWidth: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <MousePointerClick size={14} color="#f59e0b" />
                <span style={{ color: T.textPrimary, fontSize: '13px', fontWeight: 700 }}>Top liens</span>
              </div>
              {topLinks.length === 0 ? (
                <p style={{ color: T.textMuted, fontSize: '12px', textAlign: 'center', padding: '12px 0', margin: 0 }}>
                  Pas encore de données
                </p>
              ) : topLinks.map(([platform, count]) => {
                const social = resolvePlatform(platform);
                return (
                  <div key={platform} style={{ marginBottom: '14px', minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                      gap: '6px',
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        minWidth: 0, flex: 1,
                      }}>
                        <PlatformLogo platform={social} size={28} />
                        <span style={{
                          color: T.textPrimary, fontSize: '12px', fontWeight: 600,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {social.label}
                        </span>
                      </div>
                      <span style={{ color: T.textSecondary, fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                        {count}
                      </span>
                    </div>
                    <div style={{ height: '4px', background: T.track, borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.round((count / maxLink) * 100)}%`,
                        height: '100%',
                        background: social.bar || social.color,
                        borderRadius: '999px',
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}