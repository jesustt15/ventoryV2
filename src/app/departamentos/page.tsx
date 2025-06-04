"use client";

import { useState, useEffect } from "react";
import { ModelosTable } from "@/components/modelos-table";
import ModeloForm from "@/components/ModeloForm";
import { Spinner } from "@/components/ui/spinner";

async function fetchData() {
  try {
    const response = await fetch("/api/departamentos");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status.toString()}`);
    }
    const result: any[] = await response.json();
    return result;
  } catch (e: any) {
    throw new Error(e.message);
  }
}

export default function DepartamentoPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const result = await fetchData();
        setData(result);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleCreateModel = async (formData: FormData) => {
    try {
      const response = await fetch("/api/departamento", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status.toString()}`);
      }

      // Refresh data after creating a new model
      const result = await fetchData();
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
  };


  if (loading) {
    return <Spinner size="lg" className="bg-black dark:bg-white" />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      < onCreateModel={handleCreateModel} />
      <ModelosTable data={data.length > 0 ? data : []} />
      {data.length === 0 && (
        <div>No hay modelos yet.</div>
      )}
    </div>
  );
}
