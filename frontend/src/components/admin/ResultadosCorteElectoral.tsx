import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo_corte_electoral from '../../assets/Logo_corte_electoral.jpg';

interface CandidatoGanador {
  cc: string;
  nombre: string;
  id: number;
  lista: {
    id: number;
    numero: number;
  };
  partido: {
    id: number;
    nombre: string;
  };
  votos: number;
  porcentaje: number;
}

interface ListaResultado {
  lista_id: number;
  lista_numero: number;
  partido_id: number;
  partido_nombre: string;
  votos: number;
  porcentaje: number;
}

interface ResumenVotos {
  totalVotos: number;
  votosBlanco: number;
  votosAnulados: number;
  votosObservados: number;
}

interface ResultadosFinales {
  candidatoGanador?: CandidatoGanador;
  listaGanadora: ListaResultado;
  todasLasListas: ListaResultado[];
  resumen: ResumenVotos;
}

interface ResultadosGenerales {
  totalCiudadanos: number;
  totalVotantes: number;
  porcentajeParticipacion: number;
  circuitosAbiertos: number;
  circuitosCerrados: number;
  totalCircuitos: number;
  todosCerrados: boolean;
  resultadosFinales?: ResultadosFinales;
}

const ResultadosCorteElectoral: React.FC = () => {
  const [resultados, setResultados] = useState<ResultadosGenerales | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchResultados = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/corte-electoral/resultados-generales');
      setResultados(response.data);
      setError('');
    } catch (error) {
      console.error('Error al obtener resultados:', error);
      setError('Error al cargar los resultados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResultados();
    const interval = setInterval(fetchResultados, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('corteElectoralToken');
    localStorage.removeItem('corteElectoralUser');
    navigate('/login-corte');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchResultados}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!resultados) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No se pudieron cargar los resultados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img src={Logo_corte_electoral} alt="Logo Corte Electoral" className="h-16 w-auto mr-4" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Corte Electoral</h1>
                <p className="text-sm text-gray-600">Resultados Generales de las Elecciones</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estado de los Circuitos */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Estado de los Circuitos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{resultados.circuitosAbiertos}</div>
              <div className="text-sm text-blue-600">Circuitos Abiertos</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{resultados.circuitosCerrados}</div>
              <div className="text-sm text-green-600">Circuitos Cerrados</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{resultados.totalCircuitos}</div>
              <div className="text-sm text-gray-600">Total de Circuitos</div>
            </div>
          </div>
        </div>

        {/* Participación Electoral */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Participación Electoral</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{resultados.totalVotantes.toLocaleString()}</div>
              <div className="text-sm text-indigo-600">Ciudadanos que Votaron</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{resultados.totalCiudadanos.toLocaleString()}</div>
              <div className="text-sm text-purple-600">Total de Ciudadanos</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{resultados.porcentajeParticipacion.toFixed(2)}%</div>
              <div className="text-sm text-yellow-600">Porcentaje de Participación</div>
            </div>
          </div>
          
          {/* Barra de progreso */}
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-indigo-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${resultados.porcentajeParticipacion}%` }}
            ></div>
          </div>
        </div>

        {/* Resultados Finales */}
        {resultados.todosCerrados && resultados.resultadosFinales && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Resultados Finales de las Elecciones</h2>
            
            {/* Candidato Ganador */}
            {resultados.resultadosFinales.candidatoGanador && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">👑 Candidato Ganador</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-yellow-600">Candidato</div>
                    <div className="text-xl font-bold text-yellow-800">{resultados.resultadosFinales.candidatoGanador.nombre}</div>
                  </div>
                  <div>
                    <div className="text-sm text-yellow-600">Lista</div>
                    <div className="text-xl font-bold text-yellow-800">{resultados.resultadosFinales.candidatoGanador.lista.numero}</div>
                  </div>
                  <div>
                    <div className="text-sm text-yellow-600">Partido</div>
                    <div className="text-xl font-bold text-yellow-800">{resultados.resultadosFinales.candidatoGanador.partido.nombre}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Lista Ganadora */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-green-800 mb-2">🏆 Lista Ganadora</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-green-600">Lista</div>
                  <div className="text-xl font-bold text-green-800">{resultados.resultadosFinales.listaGanadora.lista_numero}</div>
                </div>
                <div>
                  <div className="text-sm text-green-600">Partido</div>
                  <div className="text-xl font-bold text-green-800">{resultados.resultadosFinales.listaGanadora.partido_nombre}</div>
                </div>
                <div>
                  <div className="text-sm text-green-600">Votos</div>
                  <div className="text-xl font-bold text-green-800">{resultados.resultadosFinales.listaGanadora.votos.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-green-600">Porcentaje</div>
                  <div className="text-xl font-bold text-green-800">{resultados.resultadosFinales.listaGanadora.porcentaje.toFixed(2)}%</div>
                </div>
              </div>
            </div>

            {/* Todas las Listas */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultados por Lista</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lista</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partido</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Votos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Porcentaje</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {resultados.resultadosFinales.todasLasListas.map((lista, index) => (
                      <tr key={`${lista.lista_id}-${lista.partido_id}`} className={index === 0 ? 'bg-green-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {lista.lista_numero}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lista.partido_nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lista.votos.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lista.porcentaje.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-lg font-bold text-blue-600">{resultados.resultadosFinales.resumen.totalVotos.toLocaleString()}</div>
                <div className="text-sm text-blue-600">Total de Votos</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-lg font-bold text-gray-600">{resultados.resultadosFinales.resumen.votosBlanco.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Votos en Blanco</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-lg font-bold text-red-600">{resultados.resultadosFinales.resumen.votosAnulados.toLocaleString()}</div>
                <div className="text-sm text-red-600">Votos Anulados</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-lg font-bold text-yellow-600">{resultados.resultadosFinales.resumen.votosObservados.toLocaleString()}</div>
                <div className="text-sm text-yellow-600">Votos Observados</div>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje cuando no todos los circuitos están cerrados */}
        {!resultados.todosCerrados && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Elecciones en Progreso
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Los resultados finales se mostrarán cuando todos los circuitos estén cerrados. 
                    Actualmente hay {resultados.circuitosAbiertos} circuito(s) aún abierto(s).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botón de actualización manual */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchResultados}
            className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Actualizar Resultados
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultadosCorteElectoral; 