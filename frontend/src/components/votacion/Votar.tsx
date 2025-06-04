import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Partido {
  ID: number;
  nombre: string;
}

interface Lista {
  FK_Partido_politico_ID: number;
  ID: number;
  numero: number;
  integrantes: string;
}

type TipoVoto = 'comun' | 'anulado' | 'observado';

const Votar: React.FC = () => {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [listas, setListas] = useState<Lista[]>([]);
  const [selectedPartido, setSelectedPartido] = useState<number | null>(null);
  const [selectedLista, setSelectedLista] = useState<number | null>(null);
  const [tipoVoto, setTipoVoto] = useState<TipoVoto>('comun');
  const [esObservado, setEsObservado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [votoEnviado, setVotoEnviado] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Cargar partidos y listas
    const cargarDatos = async () => {
      try {
        const [partidosRes, listasRes] = await Promise.all([
          axios.get('http://localhost:3001/api/partidos', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:3001/api/listas', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setPartidos(partidosRes.data);
        setListas(listasRes.data);
      } catch (error) {
        setError('Error al cargar los datos');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Si el voto es observado, forzar el tipo a 'observado'
      const tipoVotoFinal = esObservado ? 'observado' : tipoVoto;

      await axios.post(
        'http://localhost:3001/api/votos',
        {
          partidoId: selectedPartido,
          listaId: selectedLista,
          tipoVoto: tipoVotoFinal
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setVotoEnviado(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.mensaje || 'Error al emitir el voto');
      } else {
        setError('Error al conectar con el servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  if (votoEnviado) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-green-600">¡Voto emitido exitosamente!</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-8">
            Emitir Voto
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Voto
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tipoVoto"
                  value="comun"
                  checked={tipoVoto === 'comun'}
                  onChange={(e) => setTipoVoto(e.target.value as TipoVoto)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2">Voto Común</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tipoVoto"
                  value="anulado"
                  checked={tipoVoto === 'anulado'}
                  onChange={(e) => setTipoVoto(e.target.value as TipoVoto)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2">Voto Anulado</span>
              </label>
            </div>
          </div>

          {tipoVoto === 'comun' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Partido Político
                </label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={selectedPartido || ''}
                  onChange={(e) => {
                    setSelectedPartido(Number(e.target.value));
                    setSelectedLista(null);
                  }}
                >
                  <option value="">Seleccione un partido</option>
                  {partidos.map((partido) => (
                    <option key={partido.ID} value={partido.ID}>
                      {partido.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Lista
                </label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={selectedLista || ''}
                  onChange={(e) => setSelectedLista(Number(e.target.value))}
                  disabled={!selectedPartido}
                >
                  <option value="">Seleccione una lista</option>
                  {listas
                    .filter((lista) => lista.FK_Partido_politico_ID === selectedPartido)
                    .map((lista) => (
                      <option key={lista.ID} value={lista.ID}>
                        Lista {lista.numero}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="observado"
                  checked={esObservado}
                  onChange={(e) => setEsObservado(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="observado" className="ml-2 block text-sm text-gray-900">
                  No estoy votando en mi circuito
                </label>
              </div>
            </>
          )}

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || (tipoVoto === 'comun' && (!selectedPartido || !selectedLista))}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Enviando voto...' : 'Emitir Voto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Votar; 