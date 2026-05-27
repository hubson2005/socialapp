import React, { useRef, useState } from 'react';
import { Camera, User, Loader2 } from 'lucide-react';
import { supabase } from '../../supabase';

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
    <div className="bg-blue/10 backdrop-blur rounded-2xl border border-white/1 p-5 flex items-center gap-4">
      <div className="relative shrink-0">
        <div
          className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => fileRef.current && fileRef.current.click()}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : profile.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-7 h-7 text-white/60" />
          )}
        </div>
        <button
          onClick={() => fileRef.current && fileRef.current.click()}
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-primary flex items-center justify-center shadow-lg hover:opacity-80 transition-opacity"
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
          className="w-full bg-transparent text-white font-bold text-lg placeholder-white/40 focus:outline-none border-b border-transparent focus:border-white/30 transition-colors"
        />
        <input
          type="text"
          value={profile.bio || ''}
          onChange={(e) => onUpdate({ bio: e.target.value })}
          placeholder="Votre bio..."
          className="w-full bg-transparent text-white/70 text-sm placeholder-white/30 focus:outline-none border-b border-transparent focus:border-white/20 transition-colors"
        />
      </div>
    </div>
  );
}