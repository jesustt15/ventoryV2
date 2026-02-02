'use client';
import { useState } from 'react';

export default function ChatDB() {
  const [pregunta, setPregunta] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [loading, setLoading] = useState(false);

  const preguntar = async () => {
    setLoading(true);
    const res = await fetch('/api/chat-sql', {
      method: 'POST',
      body: JSON.stringify({ question: pregunta }),
    });
    const data = await res.json();
    setRespuesta(data.answer); // Aquí llega la respuesta "semihumana"
    setLoading(false);
  };

  return (
    <div className="p-10">
      <input 
        value={pregunta} 
        onChange={(e) => setPregunta(e.target.value)}
        placeholder="Ej: ¿Cuántas computadoras hay?"
        className="border p-2 w-full mb-4 text-black"
      />
      <button onClick={preguntar} disabled={loading} className="bg-blue-500 text-white p-2 rounded">
        {loading ? 'Pensando...' : 'Consultar BD'}
      </button>
      {respuesta && <p className="mt-4 text-lg font-bold">{respuesta}</p>}
    </div>
  );
}