// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { useAuth } from '../../contexts/AuthContext';
// import { navigateAfterLogin } from '../../utils/navigationUtils';

// const Login = () => {
//   const [form, setForm] = useState({ email: '', password: '' });
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();
//   const { login } = useAuth();

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//     setError('');
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     try {
//       const res = await axios.post('http://localhost:3000/api/auth/login', form);
//       if (res.data.success) {
//         login(res.data.user, res.data.accessToken);
//         // Redirect to appropriate dashboard based on user role
//         navigateAfterLogin(res.data.user, navigate);
//       } else {
//         setError(res.data.message || 'Đăng nhập thất bại');
//       }
//     } catch (err: any) {
//       setError(err.response?.data?.details || 'Đăng nhập thất bại');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50">
//       <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
//         <h2 className="text-2xl font-bold mb-6 text-center">Đăng nhập</h2>
//         {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
//         <div className="mb-4">
//           <input
//             type="email"
//             name="email"
//             placeholder="Email"
//             value={form.email}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border rounded"
//             required
//           />
//         </div>
//         <div className="mb-6">
//           <input
//             type="password"
//             name="password"
//             placeholder="Mật khẩu"
//             value={form.password}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border rounded"
//             required
//           />
//         </div>
//         <button
//           type="submit"
//           className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
//           disabled={loading}
//         >
//           {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
//         </button>
//       </form>
//     </div>
//   );
// };

// export default Login;