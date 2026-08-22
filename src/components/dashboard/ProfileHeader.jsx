import React, { useRef, useState } from 'react';
import { Camera, User, Loader2 } from 'lucide-react';
import { supabase } from '../../supabase';
import { useTranslation } from 'react-i18next';

export default function ProfileHeader({ profile, onUpdate }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = 'avatar-' + profile.id + '-' + Date.now() + '.' + fileExt;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // ✅ Sauvegarde immédiate en base
      const { error: updateError } = await supabase
        .from('link_profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      onUpdate({ avatar_url: data.publicUrl });
    } catch (err) {
      console.error('Upload error:', err);
      alert('Erreur lors du chargement de la photo : ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    // Thème clair, cohérent avec le reste du dashboard : carte blanche,
    // bordure #e6e8f0, texte #161a2e (mêmes tokens que UserDashboard.jsx).
    <div className="bg-white rounded-2xl border border-[#e6e8f0] shadow-sm p-5 flex items-center gap-4">
      <div className="relative shrink-0">
        <div
          className="w-16 h-16 rounded-2xl bg-[#f6f7fb] border border-[#e6e8f0] flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => fileRef.current && fileRef.current.click()}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-[#6366f1] animate-spin" />
          ) : profile.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-7 h-7 text-[#9095a5]" />
          )}
        </div>
        <button
          onClick={() => fileRef.current && fileRef.current.click()}
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#6366f1] flex items-center justify-center shadow-lg hover:opacity-80 transition-opacity"
        >
          <Camera className="w-3 h-3 text-white" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <input
          type="text"
          value={profile.display_name || ''}
          onChange={(e) => onUpdate({ display_name: e.target.value })}
          placeholder="Votre nom"
          className="w-full bg-transparent text-[#161a2e] font-bold text-lg placeholder-[#9095a5] focus:outline-none border-b border-transparent focus:border-[#c7cdfb] transition-colors"
        />
        <input
          type="text"
          value={profile.bio || ''}
          onChange={(e) => onUpdate({ bio: e.target.value })}
          placeholder="Votre bio..."
          className="w-full bg-transparent text-[#6b7280] text-sm placeholder-[#9095a5] focus:outline-none border-b border-transparent focus:border-[#e6e8f0] transition-colors"
        />
      </div>
    </div>
  );
}