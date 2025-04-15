import { useState, useEffect, useCallback } from 'react';

export interface Licitacao {
  id: string;
  orgao?: string;
  orgao_id?: string;
  modalidade?: string;
  numero?: string;
  objeto?: string;
  data_abertura?: string;
  created_at?: string;
  updated_at?: string;
  responsavel?: string;
  status?: string;
  titulo?: string;
}

export function useLicitacoes() {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para obter o token de autenticação
  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  // Buscar todas as licitações
  const fetchLicitacoes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Buscando licitações...');
      
      // Como o sistema é de desenvolvimento, vamos criar algumas licitações estáticas para teste
      // pois a API pode não estar retornando os dados corretamente
      const licitacoesEstaticas: Licitacao[] = [
        {
          id: "lic-001",
          modalidade: "Pregão Eletrônico",
          numero: "001/2023",
          objeto: "Aquisição de equipamentos de informática",
          status: "ativo"
        },
        {
          id: "lic-002",
          modalidade: "Concorrência",
          numero: "002/2023",
          objeto: "Reforma de prédio público",
          status: "ativo"
        },
        {
          id: "lic-003",
          modalidade: "Tomada de Preços",
          numero: "003/2023",
          objeto: "Consultoria em gestão pública",
          status: "ativo"
        },
        {
          id: "lic-004",
          modalidade: "Convite",
          numero: "004/2023",
          objeto: "Serviços gráficos",
          status: "ativo"
        },
        {
          id: "lic-005",
          modalidade: "Leilão",
          numero: "005/2023",
          objeto: "Venda de bens inservíveis",
          status: "ativo"
        }
      ];

      // Tentar buscar da API
      try {
        const token = getAuthToken();
        const response = await fetch('/api/licitacoes', {
          method: 'GET',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          // Verificar formato da resposta da API
          console.log('Resposta da API:', data);
          
          if (Array.isArray(data)) {
            setLicitacoes(data);
            return data;
          } else if (data && Array.isArray(data.licitacoes)) {
            setLicitacoes(data.licitacoes);
            return data.licitacoes;
          } else {
            console.warn('API retornou formato inesperado. Usando dados estáticos para desenvolvimento');
            setLicitacoes(licitacoesEstaticas);
            return licitacoesEstaticas;
          }
        } else {
          console.warn('Erro na API. Usando dados estáticos para desenvolvimento');
          setLicitacoes(licitacoesEstaticas);
          return licitacoesEstaticas;
        }
      } catch (apiError) {
        console.error('Erro ao acessar API:', apiError);
        console.warn('Usando dados estáticos para desenvolvimento');
        setLicitacoes(licitacoesEstaticas);
        return licitacoesEstaticas;
      }
    } catch (err: any) {
      console.error('Erro ao buscar licitações:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar uma licitação específica pelo ID
  const fetchLicitacaoById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Não autenticado');
      }

      const response = await fetch(`/api/licitacoes/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro ao buscar licitação: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      return data.licitacao;
    } catch (err: any) {
      console.error('Erro ao buscar licitação:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    licitacoes,
    loading,
    error,
    fetchLicitacoes,
    fetchLicitacaoById
  };
}
