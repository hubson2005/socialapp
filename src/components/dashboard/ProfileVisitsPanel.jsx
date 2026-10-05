import { useState, useEffect } from "react";
import { supabase } from "../../supabase";


const PAGE_SIZE = 25;

export default function ProfileVisitsPanel({ profileId }) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchIp, setSearchIp] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  // Les visites de robots (Lighthouse, aperçus de liens, crawlers…) sont marquées is_bot par la base :
  // masquées par défaut pour ne pas fausser les statistiques, mais conservées et consultables.
  const [includeBots, setIncludeBots] = useState(false);
  const [botCount, setBotCount] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [searchIp, includeBots]);

  useEffect(() => {
    if (!profileId) return;
    supabase
      .from("profile_visits")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .eq("is_bot", true)
      .then(({ count }) => setBotCount(count ?? 0));
  }, [profileId]);

  useEffect(() => {
    fetchVisits();
  }, [profileId, searchIp, page, includeBots]);

  async function fetchVisits() {
    setLoading(true);

    let query = supabase
      .from("profile_visits")
      .select("*", { count: "exact" })
      .eq("profile_id", profileId)
      .order("visited_at", { ascending: false });

    if (!includeBots) query = query.eq("is_bot", false);

    if (searchIp.trim()) {
      // recherche partielle sur l'IP (ex: "192.168" retrouve toutes les IP contenant ce fragment)
      query = query.ilike("ip_address::text", `%${searchIp.trim()}%`);
    }

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await query.range(from, to);

    if (!error) {
      setVisits(data);
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Thème clair aligné sur Dashboard.jsx / UserDashboard.jsx :
  // carte #ffffff, bordures #e6e8f0, texte #161a2e / #6b7280, accent #6366f1.
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e6e8f0] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h3 className="text-lg font-extrabold text-[#161a2e]">Visiteurs du profil</h3>
        <input
          type="text"
          value={searchIp}
          onChange={(e) => setSearchIp(e.target.value)}
          placeholder="Rechercher une IP..."
          className="w-full sm:w-64 bg-[#f6f7fb] border border-[#e6e8f0] rounded-xl px-3 py-2 text-sm text-[#161a2e] placeholder-[#9095a5] focus:outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20"
        />
      </div>

      {botCount > 0 && (
        <label className="flex items-center gap-2 text-xs text-[#6b7280] mb-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeBots}
            onChange={(e) => setIncludeBots(e.target.checked)}
            className="accent-[#6366f1]"
          />
          Afficher les robots et tests automatiques ({botCount} {includeBots ? "inclus" : `masquée${botCount > 1 ? "s" : ""}`})
        </label>
      )}

      {loading ? (
        <div className="p-4 text-sm text-[#6b7280]">Chargement des visites...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-[#6b7280] border-b border-[#e6e8f0]">
                  <th className="py-2.5 pr-4 font-semibold">Date</th>
                  <th className="py-2.5 pr-4 font-semibold">Adresse IP</th>
                  <th className="py-2.5 pr-4 font-semibold">Appareil / Navigateur</th>
                  <th className="py-2.5 pr-4 font-semibold">Provenance</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.id} className={`border-b border-[#eef0f6] hover:bg-[#f6f7fb] transition-colors ${v.is_bot ? "opacity-60" : ""}`}>
                    <td className="py-2.5 pr-4 text-[#161a2e] whitespace-nowrap">
                      {new Date(v.visited_at).toLocaleString("fr-FR")}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[#c2410c] whitespace-nowrap">{v.ip_address}</td>
                    <td className="py-2.5 pr-4 text-[#374151]">
                      {parseUserAgent(v.user_agent)}
                      {v.is_bot && (
                        <span
                          title={v.bot_reason ? `Détecté : ${v.bot_reason}` : "Robot"}
                          className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#fef3c7] text-[#b45309] align-middle"
                        >
                          Robot
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-[#6b7280] truncate max-w-[200px]">
                      {v.referrer || "Direct"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visits.length === 0 && (
              <p className="text-[#6b7280] text-sm py-4">
                {searchIp ? "Aucune visite ne correspond à cette recherche." : "Aucune visite enregistrée pour le moment."}
              </p>
            )}
          </div>

          {totalCount > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-4 text-sm text-[#6b7280] gap-3 flex-wrap">
              <span>
                Page {page + 1} sur {totalPages} · {totalCount} visite{totalCount > 1 ? "s" : ""}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg border border-[#e6e8f0] bg-[#f6f7fb] text-[#161a2e] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#eceefb]"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 rounded-lg border border-[#e6e8f0] bg-[#f6f7fb] text-[#161a2e] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#eceefb]"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function parseUserAgent(ua) {
  if (!ua) return "Inconnu";
  const isMobile = /Mobile|Android|iPhone/i.test(ua);
  const browser = ua.match(/(Chrome|Safari|Firefox|Edge|Opera)\/[\d.]+/)?.[1] || "Navigateur inconnu";
  const os = ua.match(/(Windows|Mac OS X|Android|iOS|Linux)/)?.[1] || "OS inconnu";
  return `${browser} · ${os}${isMobile ? " (mobile)" : ""}`;
}