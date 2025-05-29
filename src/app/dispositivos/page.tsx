"use client";

import { useState, useEffect } from "react";
import { EquiposTable } from "@/components/equipos-table";
import { Dispositivo } from "@/components/equipos-table";

export default function DispositivosPage() {
  const [data, setData] = useState<Dispositivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/dispositivos");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status.toString()}`);
        }
        const result: Dispositivo[] = await response.json();
        setData(result);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <EquiposTable data={data.length > 0 ? data : []} />
      {data.length === 0 && (
        <div>No hay dispositivos yet.</div>
      )}
    </div>
  );
}
