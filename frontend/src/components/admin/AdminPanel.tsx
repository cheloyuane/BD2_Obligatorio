import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
  resultadosComunes: any[];
  totalVotos: number;
  votosBlanco: number;
  votosAnulados: number;
  votosObservados: number;
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
      
      if (!circuitoConfigurado || !circuitoActual || !eleccionActiva) {
        setError('Debe configurar un circuito primero');
        return;
      }

      const response = await axios.get(
        `http://localhost:3001/api/admin/resultados/${circuitoConfigurado}/${circuitoActual.establecimiento.id}/${eleccionActiva.id}`,
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
                  
                  <button
                    onClick={() => configurarCircuito(circuitoActual.id)}
                    disabled={loading || circuitoConfigurado === circuitoActual.id}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {circuitoConfigurado === circuitoActual.id ? 'Circuito Configurado' : 'Configurar Este Circuito'}
                  </button>
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
                Estado de Votación
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="font-medium mr-2">Estado:</span>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    urnaAbierta ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {urnaAbierta ? 'Votación Activa' : 'Sin Votos'}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={abrirUrna}
                    disabled={loading || urnaAbierta || !circuitoConfigurado}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Verificar Estado de Urna
                  </button>
                  
                  <button
                    onClick={cerrarUrna}
                    disabled={loading || !urnaAbierta}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    Verificar Cierre de Urna
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
                  disabled={loading || !urnaAbierta}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Contar Votos del Circuito
                </button>
              </div>
              
              {resultados && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{resultados.totalVotos}</div>
                      <div className="text-sm text-gray-600">Total de Votos</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-900">{resultados.votosBlanco}</div>
                      <div className="text-sm text-blue-600">Votos en Blanco</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-900">{resultados.votosAnulados}</div>
                      <div className="text-sm text-red-600">Votos Anulados</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-900">{resultados.votosObservados}</div>
                      <div className="text-sm text-yellow-600">Votos Observados</div>
                    </div>
                  </div>
                  
                  {resultados.resultadosComunes.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Votos por Lista:</h4>
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
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {resultados.resultadosComunes.map((resultado: any, index: number) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {resultado.lista_numero}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {resultado.partido_nombre}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {resultado.votos}
                                </td>
                              </tr>
                            ))}
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
    </div>
  );
};

export default AdminPanel; 