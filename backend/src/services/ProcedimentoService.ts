import { IProcedimentoRepository } from '../repositories/interfaces';
import { Procedimento } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ProcedimentoService {
  constructor(private procedimentoRepo: IProcedimentoRepository) {}

  async listar(apenasAtivos = true): Promise<Procedimento[]> {
    return this.procedimentoRepo.listar(apenasAtivos);
  }

  async buscarPorId(id: string): Promise<Procedimento | null> {
    return this.procedimentoRepo.buscarPorId(id);
  }

  async criar(dados: {
    nome: string;
    descricao: string;
    preco_padrao: number;
  }): Promise<Procedimento> {
    const novo: Procedimento = {
      id: `proc-${uuidv4().slice(0, 8)}`,
      nome: dados.nome,
      descricao: dados.descricao,
      preco_padrao: dados.preco_padrao,
      duracao_minutos: 120, // 2 horas fixas sempre
      ativo: true
    };
    return this.procedimentoRepo.salvar(novo);
  }

  async atualizar(id: string, dados: Partial<Procedimento>): Promise<Procedimento | null> {
    return this.procedimentoRepo.atualizar(id, {
      ...dados,
      duracao_minutos: 120 // Preserva 2 horas fixas
    });
  }

  async remover(id: string): Promise<boolean> {
    return this.procedimentoRepo.remover(id);
  }
}
