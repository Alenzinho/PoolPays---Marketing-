
import { Task, TaskStatus, VectorDocument } from './types';

const createDate = (day: number, month: number) => new Date(2024, month - 1, day);

export const INITIAL_TASKS: Task[] = [
  {
    id: '1.1.1', code: '1.1.1', title: 'Manifesto Oficial',
    subtasks: ['Redigir versão PT', 'Traduzir EN/CH/ES', 'Validar com cliente'],
    owner: 'Copywriter', deadline: createDate(27, 11), status: TaskStatus.IN_PROGRESS, week: 'Semana 1', category: 'Brand Strategy',
    demandType: 'CREATIVE',
    briefing: {
      idea: 'Texto manifesto para site e vídeo',
      format: 'Google Doc',
      copy: 'The House Always Wins...'
    }
  },
  {
    id: '3.2.1', code: '3.2.1', title: 'Reels: O que é PoolPays',
    subtasks: ['Roteiro', 'Locução', 'Edição'],
    owner: 'Video Editor', deadline: createDate(14, 12), status: TaskStatus.TODO, week: 'Semana 3', category: 'Conteúdo',
    demandType: 'REELS',
    briefing: {
      idea: 'Explicar o conceito de "Be The House" em 30s',
      format: '9:16 Vertical',
      duration: '30s',
      soundtrack: 'Cyberpunk Lofi (No Copyright)',
      reference: 'Link do concorrente X',
      copy: 'Legenda do vídeo aqui...'
    }
  }
];

// --- INITIAL MEMORY FOR THE BRAIN ---
// These documents will be loaded into the Vector Store on first boot
export const INITIAL_KNOWLEDGE: VectorDocument[] = [
  {
    id: 'manifesto-core',
    type: 'KNOWLEDGE',
    content: `
"THE HOUSE ALWAYS WINS" — MANIFESTO POOLPAYS.
Por séculos, você foi ensinado a aceitar essa verdade: A casa sempre ganha. E você sempre perde.
Em Las Vegas. Em Macau. Nos apps que prometem diversão mas entregam frustração.
Nós olhamos para esse sistema e perguntamos: POR QUE?
A PoolPays existe para APAGAR essas perguntas.
Nós removemos: O CEO (substituído por código), A burocracia (substituída por sua carteira).
VOCÊ NÃO É MAIS O JOGADOR. VOCÊ É A CASA.
    `,
    metadata: { title: 'PoolPays Manifesto', originalId: 'init-1', category: 'CORE_IDENTITY' }
  },
  {
    id: 'tech-architecture',
    type: 'KNOWLEDGE',
    content: `
ARQUITETURA TÉCNICA (Under the Hood).
1. Infraestrutura Arbitrum: Velocidade de milissegundos, taxas de centavos.
2. O Motor de Liquidez: O dinheiro não fica com um CEO. Fica no contrato 0x1D26... (Uniswap V3).
3. Identidade Soberana (No-KYC): Conexão via Wallet (Metamask/Trust). Sem email, sem passaporte.
Code is Law. Tudo verificável na blockchain.
    `,
    metadata: { title: 'Technical Architecture', originalId: 'init-2', category: 'TECH_DOCS' }
  },
  {
    id: 'yield-mechanics',
    type: 'KNOWLEDGE',
    content: `
ECONOMIA DO TOKEN & RENDIMENTO.
O modelo de Liquidez Compartilhada (LP).
Ciclo do Dinheiro: Aposta -> Lucro da Banca -> Retorno para a Piscina -> Saque do Investidor.
Staking Tiers:
- Day Trader: 1 Dia = 0.5%
- House Owner: 20 Dias = 18%
House Edge: A vantagem matemática (3-4%) garante o lucro do protocolo a longo prazo.
    `,
    metadata: { title: 'Yield Mechanics', originalId: 'init-3', category: 'TECH_DOCS' }
  },
  {
    id: 'brand-voice',
    type: 'KNOWLEDGE',
    content: `
TOM DE VOZ DA MARCA.
Valores Nucleares:
- TRUSTLESS: "Não confie em nós. Confie no código."
- PERMISSIONLESS: "Sua carteira = Seu passaporte"
- FAIR: Matemática, não manipulação.
Palavras Proibidas: Aposta, Sorte, Cassino Online.
Palavras Permitidas: Protocolo, Liquidez, Yield, Gaming Descentralizado.
    `,
    metadata: { title: 'Brand Voice Guidelines', originalId: 'init-4', category: 'CORE_IDENTITY' }
  }
];
