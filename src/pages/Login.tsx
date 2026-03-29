import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleLogin = async () => {
    try {
      await signIn();
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-zinc-900/10"
          >
            <BookOpen className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold text-zinc-900 tracking-tight mb-3"
          >
            SmartStudy
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-500 text-lg"
          >
            Master your schedule, track your progress.
          </motion.p>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-zinc-200 p-8 rounded-3xl shadow-xl shadow-zinc-200/50"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-zinc-900">Welcome back</h2>
              <p className="text-zinc-500">Sign in with your Google account to continue.</p>
            </div>
            
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-lg shadow-zinc-900/10 group"
            >
              <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              Sign in with Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-zinc-400 font-medium">Secure Authentication</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-zinc-400 leading-relaxed">
                By signing in, you agree to our Terms of Service and Privacy Policy. 
                Your data is securely stored and never shared.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
