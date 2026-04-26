import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiUrl } from '../config/api';

const AuthCartContext = createContext(null);

function normalizeCartItem(row) {
  return {
    carrinhoId: row.id,
    produto_id: row.produto_id ?? row.id,
    id: row.produto_id ?? row.id,
    nome: row.produtos?.nome ?? row.nome ?? '',
    preco_venda: Number(row.produtos?.preco_venda ?? row.preco_venda ?? 0),
    imagem_url: row.produtos?.imagem_url ?? row.imagem_url ?? null,
    qtd: Number(row.quantidade ?? row.qtd ?? 0),
  };
}

export function AuthCartProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const id = localStorage.getItem('id_cliente');
    const nome = localStorage.getItem('nome_cliente');
    return token && id ? { token, id, nome, role: 'client' } : null;
  });
  const [cart, setCart] = useState([]);
  const [loadingCart, setLoadingCart] = useState(false);

  const redirectToLogin = (message) => {
    toast.error(message || 'Faça login para continuar.');
    navigate('/login', {
      state: { from: location.pathname, message: message || 'Faça login para continuar.' }
    });
  };

  const loadCartFromServer = async () => {
    if (!user?.token) return;
    setLoadingCart(true);

    try {
      const res = await fetch(apiUrl('/api/carrinho'), {
        headers: { 'x-access-token': user.token }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Não foi possível carregar o carrinho.');
      }

      const data = await res.json();
      setCart(Array.isArray(data) ? data.map(normalizeCartItem) : []);
    } catch (err) {
      console.error('Erro ao carregar carrinho:', err);
      toast.error('Erro ao carregar o carrinho.');
      setCart([]);
    } finally {
      setLoadingCart(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      loadCartFromServer();
    } else {
      setCart([]);
    }
  }, [user?.token]);

  const login = ({ token, id, nome }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('id_cliente', id);
    localStorage.setItem('nome_cliente', nome);
    setUser({ token, id, nome, role: 'client' });
    loadCartFromServer();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nome_cliente');
    localStorage.removeItem('id_cliente');
    localStorage.removeItem('carrinho_cliente');
    setUser(null);
    setCart([]);
    navigate('/login-cliente');
  };

  const addItemToCart = async (produto) => {
    if (!user?.token) {
      redirectToLogin('Faça login para adicionar itens ao carrinho.');
      return false;
    }

    try {
      const existing = cart.find((item) => item.produto_id === produto.id);
      const nextQuantity = existing ? existing.qtd + 1 : 1;

      const res = await fetch(apiUrl('/api/carrinho'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': user.token
        },
        body: JSON.stringify({ produto_id: produto.id, quantidade: nextQuantity })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Não foi possível atualizar o carrinho.');
      }

      await loadCartFromServer();
      toast.success(`${produto.nome} adicionado ao carrinho.`);
      return true;
    } catch (err) {
      console.error('Erro adicionar ao carrinho:', err);
      toast.error(err.message || 'Erro ao adicionar ao carrinho.');
      return false;
    }
  };

  const updateCartQuantity = async (produto_id, delta) => {
    if (!user?.token) {
      redirectToLogin('Faça login para alterar o carrinho.');
      return;
    }

    const existing = cart.find((item) => item.produto_id === produto_id);
    if (!existing) return;

    const nextQuantity = existing.qtd + delta;
    if (nextQuantity <= 0) {
      return removeItemFromCart(existing.carrinhoId);
    }

    try {
      const res = await fetch(apiUrl('/api/carrinho'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': user.token
        },
        body: JSON.stringify({ produto_id, quantidade: nextQuantity })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Não foi possível atualizar o carrinho.');
      }

      await loadCartFromServer();
    } catch (err) {
      console.error('Erro atualizar quantidade:', err);
      toast.error(err.message || 'Erro ao atualizar quantidade do carrinho.');
    }
  };

  const removeItemFromCart = async (carrinhoId) => {
    if (!user?.token) {
      redirectToLogin('Faça login para remover itens do carrinho.');
      return;
    }

    try {
      const res = await fetch(apiUrl(`/api/carrinho/${carrinhoId}`), {
        method: 'DELETE',
        headers: { 'x-access-token': user.token }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Não foi possível remover o item.');
      }

      await loadCartFromServer();
      toast.success('Item removido do carrinho.');
    } catch (err) {
      console.error('Erro remover item:', err);
      toast.error(err.message || 'Erro ao remover item do carrinho.');
    }
  };

  const clearCart = async () => {
    if (!user?.token) {
      redirectToLogin('Faça login para limpar o carrinho.');
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/carrinho'), {
        method: 'DELETE',
        headers: { 'x-access-token': user.token }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Não foi possível limpar o carrinho.');
      }
      setCart([]);
    } catch (err) {
      console.error('Erro limpar carrinho:', err);
      toast.error(err.message || 'Erro ao limpar o carrinho.');
    }
  };

  const value = useMemo(() => ({
    user,
    cart,
    loadingCart,
    login,
    logout,
    addItemToCart,
    updateCartQuantity,
    removeItemFromCart,
    clearCart,
    redirectToLogin
  }), [user, cart, loadingCart]);

  return <AuthCartContext.Provider value={value}>{children}</AuthCartContext.Provider>;
}

export function useAuthCart() {
  const context = useContext(AuthCartContext);
  if (!context) {
    throw new Error('useAuthCart must be used within AuthCartProvider');
  }
  return context;
}
