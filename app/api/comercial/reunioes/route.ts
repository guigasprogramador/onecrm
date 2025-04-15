import { NextRequest, NextResponse } from 'next/server';
import { Reuniao } from '@/types/comercial';

// Simulação de banco de dados em memória
let reunioes: Reuniao[] = [
  {
    id: "r1",
    oportunidadeId: "1",
    titulo: "Apresentação inicial",
    data: "2023-06-15",
    hora: "14:30",
    local: "Online - Microsoft Teams",
    participantes: ["Ana Silva", "João Silva"],
    notas: "Apresentar portfólio de soluções e entender necessidades específicas.",
    concluida: false,
  },
  {
    id: "r2",
    oportunidadeId: "2",
    titulo: "Demonstração de produto",
    data: "2023-06-20",
    hora: "10:00",
    local: "Sede do cliente",
    participantes: ["Carlos Oliveira", "Maria Oliveira", "Pedro Santos"],
    notas: "Demonstrar módulos específicos solicitados pelo cliente.",
    concluida: false,
  },
  {
    id: "r3",
    oportunidadeId: "3",
    titulo: "Levantamento técnico",
    data: "2023-06-25",
    hora: "09:30",
    local: "Hospital Municipal",
    participantes: ["Ana Silva", "Roberto Santos", "Técnico de TI"],
    notas: "Avaliar infraestrutura atual e requisitos técnicos.",
    concluida: false,
  },
  {
    id: "r4",
    oportunidadeId: "4",
    titulo: "Apresentação da proposta",
    data: "2023-06-10",
    hora: "15:00",
    local: "Online - Zoom",
    participantes: ["Pedro Santos", "Carlos Ferreira", "Equipe de Logística"],
    notas: "Apresentar proposta detalhada com cronograma de implementação.",
    concluida: true,
  },
  {
    id: "r5",
    oportunidadeId: "5",
    titulo: "Negociação de valores",
    data: "2023-06-30",
    hora: "11:00",
    local: "Escritório central",
    participantes: ["Carlos Oliveira", "Ana Pereira", "Diretor Financeiro"],
    notas: "Discutir condições comerciais e possíveis descontos.",
    concluida: false,
  },
];

// GET - Listar todas as reuniões ou filtrar
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parâmetros de filtro
    const oportunidadeId = searchParams.get('oportunidadeId');
    const data = searchParams.get('data');
    const concluida = searchParams.get('concluida');
    
    let resultado = [...reunioes];
    
    // Aplicar filtros
    if (oportunidadeId) {
      resultado = resultado.filter((reuniao) => reuniao.oportunidadeId === oportunidadeId);
    }
    
    if (data) {
      resultado = resultado.filter((reuniao) => reuniao.data === data);
    }
    
    if (concluida !== null && concluida !== undefined) {
      const concluidaBoolean = concluida === 'true';
      resultado = resultado.filter((reuniao) => reuniao.concluida === concluidaBoolean);
    }
    
    // Ordenar por data e hora
    resultado.sort((a, b) => {
      const dataA = new Date(`${a.data}T${a.hora}`);
      const dataB = new Date(`${b.data}T${b.hora}`);
      return dataA.getTime() - dataB.getTime();
    });
    
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar reuniões:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar reuniões' },
      { status: 500 }
    );
  }
}

// POST - Criar nova reunião
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validação básica
    if (!data.oportunidadeId || !data.titulo || !data.data || !data.hora) {
      return NextResponse.json(
        { error: 'ID da oportunidade, título, data e hora são obrigatórios' },
        { status: 400 }
      );
    }
    
    const novaReuniao: Reuniao = {
      id: `meeting-${Date.now()}`,
      oportunidadeId: data.oportunidadeId,
      titulo: data.titulo,
      data: data.data,
      hora: data.hora,
      local: data.local || 'A definir',
      participantes: data.participantes || [],
      notas: data.notas || '',
      concluida: false,
    };
    
    reunioes.push(novaReuniao);
    
    return NextResponse.json(novaReuniao, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar reunião:', error);
    return NextResponse.json(
      { error: 'Erro ao criar reunião' },
      { status: 500 }
    );
  }
}
