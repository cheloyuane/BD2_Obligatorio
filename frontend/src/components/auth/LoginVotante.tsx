import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Logo_corte_electoral from '../../assets/Logo_corte_electoral.jpg';

const LoginVotante: React.FC = () => {
  const [ci, setCi] = useState('');
  const [enCircuitoAsignado, setEnCircuitoAsignado] = useState(false);
  const [departamentos, setDepartamentos] = useState<Array<{ID: number, nombre: string}>>([]);
  const [circuitos, setCircuitos] = useState<Array<{ID: number, establecimiento_nombre: string}>>([]);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<number | ''>('');
  const [circuitoSeleccionado, setCircuitoSeleccionado] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDepartamentos, setLoadingDepartamentos] = useState(false);
  const [loadingCircuitos, setLoadingCircuitos] = useState(false);
  const navigate = useNavigate();

  // Cargar departamentos solo cuando se marca el checkbox
  React.useEffect(() => {
    if (enCircuitoAsignado) {
      cargarDepartamentos();
    } else {
      // Limpiar datos cuando se desmarca el checkbox
      setDepartamentos([]);
      setCircuitos([]);
      setDepartamentoSeleccionado('');
      setCircuitoSeleccionado('');
    }
  }, [enCircuitoAsignado]);

  // Cargar circuitos cuando se selecciona un departamento
  React.useEffect(() => {
    console.log('useEffect circuitos - departamentoSeleccionado:', departamentoSeleccionado, 'enCircuitoAsignado:', enCircuitoAsignado);
    if (departamentoSeleccionado && enCircuitoAsignado) {
      console.log('Llamando a cargarCircuitos con departamentoId:', departamentoSeleccionado);
      cargarCircuitos(departamentoSeleccionado);
    } else {
      console.log('Limpiando circuitos');
      setCircuitos([]);
      setCircuitoSeleccionado('');
    }
  }, [departamentoSeleccionado, enCircuitoAsignado]);

  const cargarDepartamentos = async () => {
    // Solo cargar si el checkbox está marcado
    if (!enCircuitoAsignado) {
      return;
    }
    
    console.log('Iniciando carga de departamentos...');
    setLoadingDepartamentos(true);
    setError(''); // Limpiar errores anteriores
    try {
      console.log('Haciendo request a: http://localhost:3001/api/departamentos');
      const response = await axios.get('http://localhost:3001/api/departamentos');
      console.log('Respuesta de departamentos:', response.data);
      setDepartamentos(response.data);
    } catch (error) {
      console.error('Error cargando departamentos:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error de Axios:', error.response?.data);
      }
      setError('Error al cargar departamentos');
    } finally {
      setLoadingDepartamentos(false);
    }
  };

  const cargarCircuitos = async (departamentoId: number) => {
    // Solo cargar si el checkbox está marcado y hay un departamento seleccionado
    if (!enCircuitoAsignado || !departamentoId) {
      return;
    }
    
    console.log('Iniciando carga de circuitos para departamento:', departamentoId);
    setLoadingCircuitos(true);
    setError(''); // Limpiar errores anteriores
    try {
      console.log('Haciendo request a: http://localhost:3001/api/circuitos/${departamentoId}');
      const response = await axios.get(`http://localhost:3001/api/circuitos/${departamentoId}`);
      console.log('Respuesta de circuitos:', response.data);
      setCircuitos(response.data);
      setCircuitoSeleccionado(''); // Resetear selección de circuito
    } catch (error) {
      console.error('Error cargando circuitos:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error de Axios:', error.response?.data);
      }
      setError('Error al cargar circuitos');
    } finally {
      setLoadingCircuitos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const requestData: any = {
        credencial: ci,
        enCircuitoAsignado: enCircuitoAsignado
      };

      // Si no está en su circuito asignado, enviar el nuevo circuito seleccionado
      if (enCircuitoAsignado && departamentoSeleccionado && circuitoSeleccionado) {
        requestData.nuevoCircuito = {
          departamentoId: departamentoSeleccionado,
          circuitoId: circuitoSeleccionado
        };
      }

      const response = await axios.post('http://localhost:3001/api/auth/votante', requestData);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify({
        ...response.data.ciudadano,
        circuito: response.data.circuito
      }));
      
      navigate('/votar');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.mensaje || 'Error al iniciar sesión');
      } else {
        setError('Error al conectar con el servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="absolute top-4 left-4">
        <img src={Logo_corte_electoral} alt="Logo Corte Electoral" className="h-25 w-auto" />
      </div>
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sesión como Votante
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="ci" className="sr-only">
                Credencial Cívica
              </label>
              <input
                id="ci"
                name="ci"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Credencial Cívica"
                value={ci}
                onChange={(e) => setCi(e.target.value)}
              />
            </div>
          </div>

          {/* Checkbox para confirmar ubicación en circuito asignado */}
          <div className="flex items-center">
            <input
              id="enCircuitoAsignado"
              name="enCircuitoAsignado"
              type="checkbox"
              checked={enCircuitoAsignado}
              onChange={(e) => setEnCircuitoAsignado(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="enCircuitoAsignado" className="ml-2 block text-sm text-gray-900">
              No me encuentro en mi Circuito Asignado
            </label>
          </div>

          {/* Menús desplegables para seleccionar nuevo circuito */}
          {enCircuitoAsignado && (
            <div className="space-y-4">
              <div>
                <label htmlFor="departamento" className="block text-sm font-medium text-gray-700 mb-1">
                  Seleccionar Departamento
                </label>
                <select
                  id="departamento"
                  value={departamentoSeleccionado || ''}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : '';
                    console.log('Departamento seleccionado:', value);
                    setDepartamentoSeleccionado(value);
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  disabled={loadingDepartamentos}
                >
                  <option value="">Seleccione un departamento</option>
                  {departamentos.map((depto) => (
                    <option key={`depto-${depto.ID}`} value={depto.ID}>
                      {depto.nombre}
                    </option>
                  ))}
                </select>
                {loadingDepartamentos && (
                  <p className="text-sm text-gray-500 mt-1">Cargando departamentos...</p>
                )}
              </div>

              {departamentoSeleccionado && (
                <div>
                  <label htmlFor="circuito" className="block text-sm font-medium text-gray-700 mb-1">
                    Seleccionar Circuito
                  </label>
                  <select
                    id="circuito"
                    value={circuitoSeleccionado || ''}
                    onChange={(e) => setCircuitoSeleccionado(e.target.value ? Number(e.target.value) : '')}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    disabled={loadingCircuitos}
                  >
                    <option value="">Seleccione un circuito</option>
                    {circuitos.map((circuito) => (
                      <option key={`circuito-${circuito.ID}`} value={circuito.ID}>
                        Circuito {circuito.ID} - {circuito.establecimiento_nombre}
                      </option>
                    ))}
                  </select>
                  {loadingCircuitos && (
                    <p className="text-sm text-gray-500 mt-1">Cargando circuitos...</p>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>

        {/* Botones para otros accesos */}
        <div className="text-center">
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600 mb-2">Otros accesos:</p>
            <div className="space-y-2">
              <Link
                to="/login-presidente"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
              >
                Login Presidente
              </Link>
              <Link
                to="/login-corte"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Corte Electoral
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default LoginVotante; 