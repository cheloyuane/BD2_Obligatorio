import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo_corte_electoral from '../../assets/Logo_corte_electoral.jpg';

interface CircuitoInfo {
  id: number;
  establecimiento: {
    id: number;
    nombre: string;
    tipo: string;
    direccion: string;
  };
}

interface ResultadosVotos {
  circuito: {
    id: number;
    estado: string;
    establecimiento: {
      nombre: string;
      tipo: string;
      direccion: string;
    };
  };
  resumen: {
    totalVotos: number;
    votosComunes: number;
    votosBlanco: number;
    votosAnulados: number;
    votosObservados: number;
  };
  resultadosPorLista: Array<{
    lista_id: number;
    lista_numero: number;
    partido_id: number;
    partido_nombre: string;
    votos: number;
    porcentaje: string;
  }>;
  porcentajes: {
    comunes: string;
    blanco: string;
    anulados: string;
    observados: string;
  };
  resultadosPorPartido?: Array<{
    partido_id: number;
    partido_nombre: string;
    votos: number;
    porcentaje: string;
  }>;
  resultadosPorCandidato?: Array<{
    partido_id: number | null;
    partido_nombre: string;
    candidato_cc: string | null;
    candidato_nombre: string;
    votos: number;
    porcentaje: string;
  }>;
}

const AdminPanel: React.FC = () => {
  const [circuitoActual, setCircuitoActual] = useState<CircuitoInfo | null>(null);
  const [circuitoConfigurado, setCircuitoConfigurado] = useState<number | null>(null);
  const [eleccionActiva, setEleccionActiva] = useState<any>(null);
  const [urnaAbierta, setUrnaAbierta] = useState(false);
  const [resultados, setResultados] = useState<ResultadosVotos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login-presidente');
      return;
    }

    cargarDatosIniciales();
  }, [navigate]);

  const cargarDatosIniciales = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Cargar información del presidente y circuito
      const [presidenteRes, eleccionRes] = await Promise.all([
        axios.get('http://localhost:3001/api/admin/presidente-info', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:3001/api/admin/eleccion-activa', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setCircuitoActual(presidenteRes.data.circuito);
      setEleccionActiva(eleccionRes.data);
      setCircuitoConfigurado(presidenteRes.data.circuito?.id || null);
      setUrnaAbierta(presidenteRes.data.urnaAbierta || false);

    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const configurarCircuito = async (circuitoId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!circuitoActual || !eleccionActiva) {
        setError('No hay información de circuito o elección disponible');
        return;
      }
      
      await axios.post('http://localhost:3001/api/admin/configurar-circuito', 
        { 
          circuitoId: circuitoId,
          establecimientoId: circuitoActual.establecimiento.id,
          eleccionId: eleccionActiva.id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCircuitoConfigurado(circuitoId);
      setError('');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.mensaje || 'Error al configurar circuito');
      } else {
        setError('Error al conectar con el servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  const abrirUrna = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.post('http://localhost:3001/api/admin/abrir-urna', 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Recargar datos para actualizar el estado
      await cargarDatosIniciales();
      setError('');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.mensaje || 'Error al abrir urna');
      } else {
        setError('Error al conectar con el servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  const cerrarUrna = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.post('http://localhost:3001/api/admin/cerrar-urna', 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Recargar datos para actualizar el estado
      await cargarDatosIniciales();
      setError('');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.mensaje || 'Error al cerrar urna');
      } else {
        setError('Error al conectar con el servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  const obtenerResultados = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!circuitoConfigurado) {
        setError('Debe configurar un circuito primero');
        return;
      }

      const response = await axios.get(
        'http://localhost:3001/api/admin/resultados',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResultados(response.data);
      setError('');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.mensaje || 'Error al obtener resultados');
      } else {
        setError('Error al conectar con el servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/*Logo+ titulo*/ }
            <div className="flex items-center space-x-4">
              <img src={Logo_corte_electoral} alt="Logo Corte Electoral" className="h-25 w-auto" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Panel de Administración
              </h1>
              <p className="text-sm text-gray-600">
                Presidente de Mesa - Circuito {circuitoActual?.id || 'No configurado'}
              </p>
            </div>
            <button
              onClick={cerrarSesion}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuración del Circuito */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Configuración del Circuito
              </h3>
              
              {circuitoActual ? (
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Establecimiento:</span> {circuitoActual.establecimiento.nombre}
                  </div>
                  <div>
                    <span className="font-medium">Tipo:</span> {circuitoActual.establecimiento.tipo}
                  </div>
                  <div>
                    <span className="font-medium">Dirección:</span> {circuitoActual.establecimiento.direccion}
                  </div>
                  <div>
                    <span className="font-medium">Circuito:</span> {circuitoActual.id}
                  </div>
                  
                  {/* Se saca este boton que no tenia ninguna funcion 
                  <button
                    onClick={() => configurarCircuito(circuitoActual.id)}
                    disabled={loading || circuitoConfigurado === circuitoActual.id}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {circuitoConfigurado === circuitoActual.id ? 'Circuito Configurado' : 'Configurar Este Circuito'}
                  </button>*/}
                </div>
              ) : (
                <p className="text-gray-500">No hay circuito disponible</p>
              )}
            </div>
          </div>

          {/* Control de Urna */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                CONTROL DE CIRCUITO
              </h3>
              
              {/* Esto lo saque porque no estaba mostrando nada si tiene que tener una funcion descomentarlo
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="font-medium mr-2">Estado:</span>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    urnaAbierta ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {urnaAbierta ? 'Votación Activa' : 'Sin Votos'}
                  </span>
                </div>*/}
                
                <div className="space-y-2">
                  <button
                    onClick={abrirUrna}
                    disabled={loading || urnaAbierta || !circuitoConfigurado}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Abrir Urna del Circuito
                  </button>
                  
                  <button
                    onClick={cerrarUrna}
                    disabled={loading || !urnaAbierta}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    Cerrar Urna del Circuito
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div className="bg-white overflow-hidden shadow rounded-lg lg:col-span-2">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Resultados de la Elección
                </h3>
                <button
                  onClick={obtenerResultados}
                  disabled={loading || urnaAbierta}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {urnaAbierta ? 'Cierre la urna para ver resultados' : 'Ver Resultados del Circuito'}
                </button>
              </div>
              
              {resultados && (
                <div className="space-y-6">
                  {/* Información del Circuito */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Información del Circuito</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div><span className="font-medium">Establecimiento:</span> {resultados.circuito.establecimiento.nombre}</div>
                      <div><span className="font-medium">Tipo:</span> {resultados.circuito.establecimiento.tipo}</div>
                      <div><span className="font-medium">Dirección:</span> {resultados.circuito.establecimiento.direccion}</div>
                      <div><span className="font-medium">Estado:</span> <span className="text-green-600 font-semibold">{resultados.circuito.estado}</span></div>
                    </div>
                  </div>

                  {/* Resumen de Votos */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-gray-900">{resultados.resumen.totalVotos}</div>
                      <div className="text-sm text-gray-600">Total de Votos</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-900">{resultados.resumen.votosComunes}</div>
                      <div className="text-sm text-green-600">Votos Comunes</div>
                      <div className="text-xs text-green-500">{resultados.porcentajes.comunes}%</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-900">{resultados.resumen.votosBlanco}</div>
                      <div className="text-sm text-blue-600">Votos en Blanco</div>
                      <div className="text-xs text-blue-500">{resultados.porcentajes.blanco}%</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-900">{resultados.resumen.votosAnulados}</div>
                      <div className="text-sm text-red-600">Votos Anulados</div>
                      <div className="text-xs text-red-500">{resultados.porcentajes.anulados}%</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-900">{resultados.resumen.votosObservados}</div>
                      <div className="text-sm text-yellow-600">Votos Observados</div>
                      <div className="text-xs text-yellow-500">{resultados.porcentajes.observados}%</div>
                    </div>
                  </div>
                  
                  {/* Resultados por Lista */}
                  {resultados.resultadosPorLista.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Resultados por Lista:</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Lista
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Partido
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Votos
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Porcentaje
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {resultados.resultadosPorLista.map((resultado, index) => (
                              <tr key={index} className={index === 0 ? 'bg-green-50' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {resultado.lista_numero}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {resultado.partido_nombre}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                  {resultado.votos}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {resultado.porcentaje}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Resultados por Partido */}
                  {resultados.resultadosPorPartido && resultados.resultadosPorPartido.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mt-8 mb-4">Resultados por Partido:</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Partido
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Votos
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Porcentaje
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {resultados.resultadosPorPartido.map((resultado, index) => (
                              <tr key={index} className={index === 0 ? 'bg-green-50' : (resultado.partido_nombre === 'Votos en Blanco' || resultado.partido_nombre === 'Votos Anulados' ? 'bg-gray-100' : '')}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {resultado.partido_nombre}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                  {resultado.votos}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {resultado.porcentaje}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Resultados por Candidato */}
                  {resultados.resultadosPorCandidato && resultados.resultadosPorCandidato.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mt-8 mb-4">Resultados por Candidato:</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Candidato
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Partido
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Votos
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Porcentaje
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {resultados.resultadosPorCandidato.map((resultado, index) => {
                              const esBlanco = resultado.candidato_nombre === 'Votos en Blanco';
                              const esAnulado = resultado.candidato_nombre === 'Votos Anulados';
                              const partidoMostrar = esBlanco ? 'Votos en Blanco' : esAnulado ? 'Votos Anulados' : resultado.partido_nombre;
                              return (
                                <tr key={index} className={index === 0 ? 'bg-green-50' : (esBlanco || esAnulado ? 'bg-gray-100' : '')}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {resultado.candidato_nombre}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {partidoMostrar}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                    {resultado.votos}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {resultado.porcentaje}%
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};

export default AdminPanel; 