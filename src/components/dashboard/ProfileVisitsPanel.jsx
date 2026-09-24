import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const PAGE_SIZE = 25;

export default function ProfileVisitsPanel({ profileId }) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchIp, setSearchIp] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [searchIp]);

  useEffect(() => {
    fetchVisits();
  }, [profileId, searchIp, page]);

  async function fetchVisits() {
    setLoading(true);

    let query = supabase
      .from("profile_visits")
      .select("*", { count: "exact" })
      .eq("profile_id", profileId)
      .order("visited_at", { ascending: false });

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

  return (
    <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h3 className="text-lg font-semibold">Visiteurs du profil</h3>
        <input
          type="text"
          value={searchIp}
          onChange={(e) => setSearchIp(e.target.value)}
          placeholder="Rechercher une IP..."
          className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500"
        />
      </div>

      {loading ? (
        <div className="p-4 text-sm text-gray-400">Chargement des visites...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-neutral-800">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Adresse IP</th>
                  <th className="py-2 pr-4">Appareil / Navigateur</th>
                  <th className="py-2 pr-4">Provenance</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30">
                    <td className="py-2 pr-4 text-gray-300">
                      {new Date(v.visited_at).toLocaleString("fr-FR")}
                    </td>
                    <td className="py-2 pr-4 font-mono text-orange-400">{v.ip_address}</td>
                    <td className="py-2 pr-4 text-gray-300">{parseUserAgent(v.user_agent)}</td>
                    <td className="py-2 pr-4 text-gray-400 truncate max-w-[200px]">
                      {v.referrer || "Direct"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visits.length === 0 && (
              <p className="text-gray-500 text-sm py-4">
                {searchIp ? "Aucune visite ne correspond à cette recherche." : "Aucune visite enregistrée pour le moment."}
              </p>
            )}
          </div>

          {totalCount > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
              <span>
                Page {page + 1} sur {totalPages} · {totalCount} visite{totalCount > 1 ? "s" : ""}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 rounded-lg border border-neutral-700 disabled:opacity-40 hover:bg-neutral-800"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 rounded-lg border border-neutral-700 disabled:opacity-40 hover:bg-neutral-800"
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