import { INotificacaoRepository } from '../repositories/interfaces';
import { Notificacao, TipoNotificacao } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class NotificacaoService {
  constructor(private notificacaoRepo: INotificacaoRepository) {}

  async listar(apenasNaoLidas = false): Promise<Notificacao[]> {
    return this.notificacaoRepo.listar(apenasNaoLidas);
  }

  async criarNotificacao(dados: {
    tipo: TipoNotificacao;
    titulo: string;
    mensagem: string;
    meta?: Record<string, any>;
  }): Promise<Notificacao> {
    const nova: Notificacao = {
      id: `notif-${uuidv4().slice(0, 8)}`,
      tipo: dados.tipo,
      titulo: dados.titulo,
      mensagem: dados.mensagem,
      data_hora: new Date().toISOString(),
      lida: false,
      meta: dados.meta
    };

    console.log(`[Notificação Disparada / Web Push] ${nova.titulo} - ${nova.mensagem}`);
    return this.notificacaoRepo.salvar(nova);
  }

  async marcarComoLida(id: string): Promise<boolean> {
    return this.notificacaoRepo.marcarComoLida(id);
  }

  async marcarTodasComoLidas(): Promise<boolean> {
    return this.notificacaoRepo.marcarTodasComoLidas();
  }
}
