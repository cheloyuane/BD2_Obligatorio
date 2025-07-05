import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo_corte_electoral from '../../assets/Logo_corte_electoral.jpg';

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

interface CircuitoInfo {
  id: number;
  establecimiento: {
    nombre: string;
    tipo: string;
    direccion: string;
  };
}

type TipoVoto = 'comun' | 'anulado' | 'blanco';

const Votar: React.FC = () => {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [listas, setListas] = useState<Lista[]>([]);
  const [selectedPartido, setSelectedPartido] = useState<number | null>(null);
  const [selectedLista, setSelectedLista] = useState<number | null>(null);
  const [tipoVoto, setTipoVoto] = useState<TipoVoto>('comun');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [votoEnviado, setVotoEnviado] = useState(false);
  const [circuitoActual, setCircuitoActual] = useState<CircuitoInfo | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Cargar partidos, listas y obtener información del circuito actual
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

        // Obtener información del circuito actual
        try {
          console.log('Solicitando información del circuito actual...');
          const circuitoRes = await axios.get('http://localhost:3001/api/votos/circuito-actual', {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000 // 5 segundos de timeout
          });
          console.log('Circuito actual recibido:', circuitoRes.data);
          setCircuitoActual(circuitoRes.data);
        } catch (error) {
          console.log('No se pudo obtener información del circuito actual:', error);
          if (axios.isAxiosError(error)) {
            console.log('Status:', error.response?.status);
            console.log('Data:', error.response?.data);
          }
          // No es crítico, continuamos sin mostrar la información del circuito
        }

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

      await axios.post(
        'http://localhost:3001/api/votos',
        {
          partidoId: selectedPartido,
          listaId: selectedLista,
          tipoVoto: tipoVoto
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
    <div className="w-full max-w-2xl bg-white rounded-xl shadow-md p-8 space-y-8">
      <div className="text-center">
        <img
          src={Logo_corte_electoral}
          alt="Logo Corte Electoral"
          className="h-20 mx-auto mb-4"
        />
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
          Emitir Voto
        </h2>
        <p className="text-sm text-gray-600">Seleccione el tipo de voto y los datos correspondientes</p>
      </div>
      
        {circuitoActual && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Información del Circuito
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Establecimiento:</span> {circuitoActual.establecimiento.nombre}</p>
              <p><span className="font-medium">Tipo:</span> {circuitoActual.establecimiento.tipo}</p>
              <p><span className="font-medium">Dirección:</span> {circuitoActual.establecimiento.direccion}</p>
              <p><span className="font-medium">Circuito:</span> {circuitoActual.id}</p>
            </div>
          </div>
        )}
  
        <form onSubmit={handleSubmit} className="space-y-6 border-t pt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Voto
            </label>
            <div className="space-y-2">
              {['comun', 'blanco', 'anulado'].map((tipo) => (
                <label key={tipo} className="flex items-center">
                  <input
                    type="radio"
                    name="tipoVoto"
                    value={tipo}
                    checked={tipoVoto === tipo}
                    onChange={(e) => setTipoVoto(e.target.value as TipoVoto)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-2 capitalize">Voto {tipo}</span>
                </label>
              ))}
            </div>
          </div>
  
          {tipoVoto === 'comun' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partido Político
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lista
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
            </>
          )}
  
          {error && (
            <div className="text-red-600 text-sm text-center font-medium">{error}</div>
          )}
  
          <div>
            <button
              type="submit"
              disabled={loading || (tipoVoto === 'comun' && (!selectedPartido || !selectedLista))}
              className="w-full py-2 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Enviando voto...' : 'Emitir Voto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Votar; 