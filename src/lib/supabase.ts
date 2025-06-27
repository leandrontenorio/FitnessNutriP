import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables before creating client
const validateConfig = () => {
  const errors = [];
  
  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL não encontrada');
  } else if (!supabaseUrl.startsWith('https://')) {
    errors.push('VITE_SUPABASE_URL inválida - deve começar com https://');
  }
  
  if (!supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY não encontrada');
  } else if (!supabaseAnonKey.includes('.')) {
    errors.push('VITE_SUPABASE_ANON_KEY inválida - formato JWT incorreto');
  }
  
  if (errors.length > 0) {
    const errorMessage = errors.join('\n');
    console.error('Supabase configuration error:', errorMessage);
    throw new Error(errorMessage);
  }
};

validateConfig();

// Enhanced fetch function with better error handling and CORS detection
const enhancedFetch = async (url: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Connection timeout - please check your internet connection and try again');
      }
      
      if (error.message === 'Failed to fetch') {
        // Check if we're online
        if (!navigator.onLine) {
          throw new Error('No internet connection detected. Please check your network connection and try again.');
        }
        
        // Check if this might be a CORS issue
        if (url.includes('supabase.co')) {
          throw new Error('Unable to connect to Supabase. This could be due to:\n• CORS configuration - add your domain to Supabase CORS settings\n• Network connectivity issues\n• Firewall or antivirus blocking the connection\n• VPN/proxy interference\n\nPlease check your Supabase project settings and network connection.');
        }
        
        // More specific error message for fetch failures
        throw new Error('Unable to connect to the server. This could be due to:\n• Network connectivity issues\n• Firewall or antivirus blocking the connection\n• VPN/proxy interference\n• Server maintenance\n\nPlease check your connection and try again.');
      }
      
      if (error.message.includes('NetworkError') || error.message.includes('net::')) {
        throw new Error('Network error detected. Please check your internet connection and firewall settings.');
      }
    }
    
    throw error;
  }
};

// Configuração do cliente Supabase com retry e timeout
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce'
  },
  global: {
    headers: { 
      'apikey': supabaseAnonKey,
      'X-Client-Info': 'supabase-js/2.39.7'
    },
    fetch: enhancedFetch
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// Enhanced connection check with better error reporting and graceful degradation
export const checkSupabaseConnection = async (retries = 2, delay = 1500) => {
  // First check if we're online
  if (!navigator.onLine) {
    console.warn('Device is offline');
    return false;
  }

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Connection attempt ${i + 1} of ${retries}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // Reduced timeout
      
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) {
        console.warn(`Connection attempt ${i + 1} failed:`, error);
        
        // Handle specific error cases
        switch (error.code) {
          case 'PGRST301':
            console.error('Invalid Supabase credentials');
            if (i === retries - 1) {
              toast.error('Credenciais do Supabase inválidas. Por favor, verifique a configuração.');
            }
            return false;
          case '20014':
            console.error('Database access error');
            if (i === retries - 1) {
              toast.error('Erro de acesso ao banco. Por favor, verifique as permissões.');
            }
            return false;
          case 'PGRST116':
            console.warn('Table not found - this might be expected for new users');
            // This error is acceptable - table might not exist yet
            return true;
          default:
            if (i === retries - 1) {
              const errorMsg = error.message || 'Unknown database error';
              console.error('Database connection failed:', errorMsg);
              
              // Don't show toast for connection errors - let the app handle graceful degradation
              console.warn('Connection failed, but continuing with offline mode');
              return false;
            }
        }
        
        // Wait before retry with exponential backoff
        if (i < retries - 1) {
          const waitTime = delay * Math.pow(1.5, i);
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        continue;
      }

      console.log('Connection successful');
      return true;
    } catch (error) {
      console.warn(`Connection attempt ${i + 1} failed:`, error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('Connection timeout');
          if (i === retries - 1) {
            console.warn('Connection timeout, but continuing with offline mode');
            return false;
          }
        } else if (error.message.includes('No internet connection')) {
          console.error('No internet connection');
          if (i === retries - 1) {
            toast.error('Sem conexão com a internet. Algumas funcionalidades podem estar limitadas.');
            return false;
          }
        } else if (error.message.includes('Unable to connect to Supabase')) {
          console.error('Supabase connection failed - likely CORS issue');
          if (i === retries - 1) {
            toast.error('Erro de conexão com o servidor. Verifique as configurações de CORS no Supabase.');
            return false;
          }
        } else if (error.message.includes('Unable to connect to the server')) {
          console.error('Server connection failed');
          if (i === retries - 1) {
            console.warn('Server connection failed, but continuing with offline mode');
            return false;
          }
        } else if (error.message.includes('Network error')) {
          console.error('Network error');
          if (i === retries - 1) {
            console.warn('Network error, but continuing with offline mode');
            return false;
          }
        } else {
          console.error('Unknown connection error:', error.message);
          if (i === retries - 1) {
            console.warn('Unknown connection error, but continuing with offline mode');
            return false;
          }
        }
      }
      
      if (i === retries - 1) {
        return false;
      }
      
      // Wait before retry with exponential backoff
      const waitTime = delay * Math.pow(1.5, i);
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  return false;
};

// Wrapper para queries com retry automático e backoff exponencial
export const safeQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  retries = 2,
  initialDelay = 1000
): Promise<{ data: T | null; error: any }> => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await queryFn();
      if (result.error) {
        console.warn(`Query attempt ${i + 1} of ${retries} failed:`, result.error);
        
        // Don't retry on authentication or permission errors
        if (result.error.code === 'PGRST301' || result.error.code === '20014') {
          return result;
        }
        
        if (i === retries - 1) {
          return result;
        }
        await new Promise(resolve => setTimeout(resolve, initialDelay * Math.pow(2, i)));
        continue;
      }

      return result;
    } catch (error) {
      console.warn(`Query attempt ${i + 1} of ${retries} failed:`, error);
      
      if (error instanceof Error && (
        error.message.includes('Failed to fetch') || 
        error.message.includes('Network error') ||
        error.name === 'AbortError'
      )) {
        if (i === retries - 1) {
          return { data: null, error: new Error('Network connection failed. Please check your internet connection.') };
        }
      } else if (i === retries - 1) {
        return { data: null, error };
      }
      
      await new Promise(resolve => setTimeout(resolve, initialDelay * Math.pow(2, i)));
    }
  }
  return { data: null, error: new Error('Max retries reached') };
};

// Enhanced connection status check with graceful degradation
export const getConnectionStatus = async () => {
  // Check if device is online first
  if (!navigator.onLine) {
    return {
      isConnected: false,
      error: 'Dispositivo offline. Verifique sua conexão com a internet.'
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Reduced timeout
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Table not found is acceptable
        return {
          isConnected: true,
          error: null
        };
      }
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('Network error')) {
        return {
          isConnected: false,
          error: 'Erro de conexão com a internet. Algumas funcionalidades podem estar limitadas.'
        };
      }
      
      return {
        isConnected: false,
        error: error.message || 'Erro ao conectar com Supabase'
      };
    }
    
    return {
      isConnected: true,
      error: null
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          isConnected: false,
          error: 'Tempo limite de conexão excedido.'
        };
      }
      if (error.message.includes('No internet connection')) {
        return {
          isConnected: false,
          error: 'Sem conexão com a internet.'
        };
      }
      if (error.message.includes('Unable to connect to Supabase')) {
        return {
          isConnected: false,
          error: 'Erro de conexão - verifique as configurações de CORS no Supabase.'
        };
      }
      if (error.message.includes('Unable to connect to the server')) {
        return {
          isConnected: false,
          error: 'Não foi possível conectar ao servidor.'
        };
      }
      return {
        isConnected: false,
        error: error.message
      };
    }
    return {
      isConnected: false,
      error: 'Erro desconhecido'
    };
  }
};

// Helper function to check if the app should work in offline mode
export const shouldWorkOffline = () => {
  return !navigator.onLine || localStorage.getItem('supabase_offline_mode') === 'true';
};

// Helper function to enable offline mode
export const enableOfflineMode = () => {
  localStorage.setItem('supabase_offline_mode', 'true');
  console.log('Offline mode enabled');
};

// Helper function to disable offline mode
export const disableOfflineMode = () => {
  localStorage.removeItem('supabase_offline_mode');
  console.log('Offline mode disabled');
};