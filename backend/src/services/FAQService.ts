import { IFAQRepository } from '../repositories/interfaces';
import { FAQ } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class FAQService {
  constructor(private faqRepo: IFAQRepository) {}

  async listar(categoria?: string): Promise<FAQ[]> {
    return this.faqRepo.listar(categoria);
  }

  async buscarPorId(id: string): Promise<FAQ | null> {
    return this.faqRepo.buscarPorId(id);
  }

  async criar(dados: {
    pergunta: string;
    resposta: string;
    categoria?: 'horarios' | 'pagamentos' | 'endereco' | 'cancelamentos' | 'procedimentos' | 'geral';
  }): Promise<FAQ> {
    const novo: FAQ = {
      id: `faq-${uuidv4().slice(0, 8)}`,
      pergunta: dados.pergunta,
      resposta: dados.resposta,
      categoria: dados.categoria || 'geral',
      ativo: true
    };
    return this.faqRepo.salvar(novo);
  }

  async atualizar(id: string, dados: Partial<FAQ>): Promise<FAQ | null> {
    return this.faqRepo.atualizar(id, dados);
  }

  async remover(id: string): Promise<boolean> {
    return this.faqRepo.remover(id);
  }
}
