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
  imagen_url: string;
}

interface CircuitoInfo {
  id: number;
  estado: string;
  urnaAbierta: boolean;
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
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // Función para obtener la imagen de la lista
  const getListaImage = (lista: Lista): string => {
    if (lista.imagen_url) {
      return lista.imagen_url;
    }
    // Imagen por defecto si no hay URL
    return '/images/listas/default-lista.png';
  };

  // Función para manejar la selección del partido
  const handlePartidoSelect = (partidoId: number) => {
    setSelectedPartido(partidoId);
    setSelectedLista(null);
    setShowModal(true);
  };

  // Función para cerrar el modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLista(null);
  };

  // Función para confirmar la selección y emitir voto
  const handleConfirmVote = async () => {
    if (!selectedLista) {
      setError('Debe seleccionar una lista');
      return;
    }
    await emitirVoto();
  };

  // Función para emitir el voto
  const emitirVoto = async () => {
    if (!selectedLista || !selectedPartido) {
      setError('Debe seleccionar un partido y una lista');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
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
      setShowModal(false);
      console.log('Voto emitido:', response.data);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error: any) {
      console.error('Error al emitir voto:', error);
      setError(error.response?.data?.mensaje || 'Error al emitir el voto');
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar el estado del circuito
  const actualizarEstadoCircuito = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      console.log('Actualizando estado del circuito...');
      const circuitoRes = await axios.get('http://localhost:3001/api/votos/circuito-actual', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      
      console.log('Nuevo estado del circuito:', circuitoRes.data);
      setCircuitoActual(circuitoRes.data);
      
      // Si la urna ahora está abierta, cargar partidos y listas
      if (circuitoRes.data.urnaAbierta && partidos.length === 0) {
        console.log('Urna ahora abierta, cargando partidos y listas...');
        await cargarPartidosYListas(token);
      }
    } catch (error) {
      console.error('Error al actualizar estado del circuito:', error);
      setError('Error al actualizar el estado del circuito');
    } finally {
      setLoading(false);
    }
  };

  // Función separada para cargar partidos y listas
  const cargarPartidosYListas = async (token: string) => {
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
      console.log('Partidos y listas cargados:', partidosRes.data.length, listasRes.data.length);
    } catch (error) {
      console.error('Error al cargar partidos y listas:', error);
      setError('Error al cargar los datos de votación');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      navigate('/login');
      return;
    }

    // Cargar información del circuito primero
    const cargarCircuito = async () => {
      try {
        // Obtener información del circuito desde el localStorage o del backend
        let circuitoInfo = null;
        
        // Primero intentar obtener del localStorage (datos del login)
        if (userData) {
          try {
            const user = JSON.parse(userData);
            if (user.circuito) {
              console.log('Usando información del circuito del login:', user.circuito);
              circuitoInfo = user.circuito;
            }
          } catch (error) {
            console.log('Error al parsear datos del usuario:', error);
          }
        }

        // Si no hay información del circuito en localStorage, obtener del backend
        if (!circuitoInfo) {
          try {
            console.log('Solicitando información del circuito actual desde backend...');
            const circuitoRes = await axios.get('http://localhost:3001/api/votos/circuito-actual', {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000 // 5 segundos de timeout
            });
            console.log('Circuito actual recibido del backend:', circuitoRes.data);
            circuitoInfo = circuitoRes.data;
          } catch (error) {
            console.log('No se pudo obtener información del circuito actual:', error);
            if (axios.isAxiosError(error)) {
              console.log('Status:', error.response?.status);
              console.log('Data:', error.response?.data);
            }
          }
        }

        // Establecer la información del circuito
        if (circuitoInfo) {
          setCircuitoActual(circuitoInfo);
          
          // Solo cargar partidos y listas si la urna está abierta
          if (circuitoInfo.urnaAbierta) {
            console.log('Urna abierta, cargando partidos y listas...');
            await cargarPartidosYListas(token);
          } else {
            console.log('Urna cerrada, no es necesario cargar partidos y listas');
            setLoading(false);
          }
        } else {
          setLoading(false);
        }

      } catch (error) {
        setError('Error al cargar la información del circuito');
        console.error('Error:', error);
        setLoading(false);
      }
    };

    cargarCircuito();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Si es voto común, no procesar aquí, el modal se encargará
    if (tipoVoto === 'comun') {
      return;
    }
    
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

  // Verificar si la urna está cerrada
  if (circuitoActual && !circuitoActual.urnaAbierta) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-md p-8 space-y-8 text-center">
          <div>
            <img
              src={Logo_corte_electoral}
              alt="Logo Corte Electoral"
              className="h-20 mx-auto mb-4"
            />
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Urna Cerrada
            </h2>
            <div className="text-red-600 text-xl font-semibold mb-4">
              ⚠️ No se pueden emitir votos en este momento
            </div>
            <p className="text-gray-600 mb-6">
              La urna del circuito {circuitoActual.id} se encuentra cerrada. 
              Por favor, espere a que el presidente de mesa abra la urna para poder emitir su voto.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Información del Circuito
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Establecimiento:</span> {circuitoActual.establecimiento.nombre}</p>
                <p><span className="font-medium">Tipo:</span> {circuitoActual.establecimiento.tipo}</p>
                <p><span className="font-medium">Dirección:</span> {circuitoActual.establecimiento.direccion}</p>
                <p><span className="font-medium">Circuito:</span> {circuitoActual.id}</p>
                <p><span className="font-medium">Estado:</span> <span className="text-red-600 font-semibold">{circuitoActual.estado}</span></p>
              </div>
            </div>

            <button
              onClick={actualizarEstadoCircuito}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Actualizando...' : 'Actualizar Estado'}
            </button>
          </div>
        </div>
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
              <p><span className="font-medium">Estado:</span> <span className="text-green-600 font-semibold">✅ {circuitoActual.estado}</span></p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {partidos.map((partido) => (
                    <div
                      key={partido.ID}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md ${
                        selectedPartido === partido.ID
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => handlePartidoSelect(partido.ID)}
                    >
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900">{partido.nombre}</h3>
                        <p className="text-sm text-gray-500 mt-1">Click para ver listas</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
  
              
            </>
          )}
  
          {error && (
            <div className="text-red-600 text-sm text-center font-medium">{error}</div>
          )}
  
          <div>
            <button
              type="submit"
              disabled={loading || (tipoVoto === 'comun' && !selectedPartido)}
              className="w-full py-2 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Enviando voto...' : 'Emitir Voto'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal para selección de listas */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">
                  Seleccione una Lista - {partidos.find(p => p.ID === selectedPartido)?.nombre}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-6">
                {listas
                  .filter((lista) => lista.FK_Partido_politico_ID === selectedPartido)
                  .map((lista) => (
                    <div
                      key={lista.ID}
                      className={`relative cursor-pointer rounded-lg border-2 p-8 transition-all hover:shadow-lg ${
                        selectedLista === lista.ID
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedLista(lista.ID)}
                    >
                      <div className="flex flex-col items-center">
                        <div className="h-64 w-64 mb-6 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={getListaImage(lista)}
                            alt={`Lista ${lista.numero}`}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="text-gray-500 text-sm text-center">Lista ${lista.numero}</div>`;
                              }
                            }}
                          />
                        </div>
                        <span className="text-xl font-bold text-gray-900">
                          Lista {lista.numero}
                        </span>
                        {selectedLista === lista.ID && (
                          <div className="absolute top-6 right-6">
                            <div className="h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center">
                              <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {selectedPartido && listas.filter((lista) => lista.FK_Partido_politico_ID === selectedPartido).length === 0 && (
                <p className="text-center text-gray-500 mb-6">No hay listas disponibles para este partido.</p>
              )}

              <div className="flex justify-between items-center pt-6 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium text-lg"
                >
                  ← Volver a seleccionar partido
                </button>
                
                <div className="flex gap-4">
                  {selectedLista && (
                    <button
                      type="button"
                      onClick={() => setSelectedLista(null)}
                      className="px-6 py-3 text-indigo-600 hover:text-indigo-500 font-medium text-lg"
                    >
                      Limpiar selección
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={handleConfirmVote}
                    disabled={!selectedLista || loading}
                    className={`px-8 py-3 rounded-md font-medium text-lg ${
                      selectedLista && !loading
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {loading ? 'Emitiendo voto...' : 'Confirmar y Emitir Voto'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Votar; 