import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo_corte_electoral from '../../assets/Logo_corte_electoral.jpg';

const LoginCorteElectoral: React.FC = () => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Credenciales hardcodeadas
    const USUARIO_CORRECTO = 'Corte Electoral';
    const PASSWORD_CORRECTO = '123456';

    // Simular delay de red
    setTimeout(() => {
      if (usuario === USUARIO_CORRECTO && password === PASSWORD_CORRECTO) {
        // Guardar información de sesión
        localStorage.setItem('corteElectoralToken', 'corte-electoral-session');
        localStorage.setItem('corteElectoralUser', JSON.stringify({
          usuario: usuario,
          rol: 'corte_electoral'
        }));
        navigate('/resultados-corte');
      } else {
        setError('Usuario o contraseña incorrectos');
      }
      setLoading(false);
    }, 1000);
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
              Corte Electoral
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Acceso a Resultados Generales
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="usuario" className="sr-only">
                  Usuario
                </label>
                <input
                  id="usuario"
                  name="usuario"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

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

          {/* Botones para navegar a otros logins */}
          <div className="text-center">
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600 mb-2">Otros accesos:</p>
              <div className="space-y-2">
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                >
                  Login Votantes
                </Link>
                <Link
                  to="/login-presidente"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Login Presidente
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginCorteElectoral; 