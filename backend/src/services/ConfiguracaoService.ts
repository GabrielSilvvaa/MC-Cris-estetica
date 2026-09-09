import { IConfiguracaoRepository, IUsuarioRepository } from '../repositories/interfaces';
import { ConfiguracaoHorario, BloqueioData, Usuario, UserRole } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ConfiguracaoService {
  constructor(
    private configRepo: IConfiguracaoRepository,
    private usuarioRepo: IUsuarioRepository
  ) {}

  async listarHorarios(): Promise<ConfiguracaoHorario[]> {
    return this.configRepo.listarHorarios();
  }

  async salvarHorarios(horarios: ConfiguracaoHorario[]): Promise<ConfiguracaoHorario[]> {
    return this.configRepo.salvarHorarios(horarios);
  }

  async listarBloqueios(): Promise<BloqueioData[]> {
    return this.configRepo.listarBloqueios();
  }

  async criarBloqueio(dados: { data: string; motivo: string; dia_inteiro?: boolean }): Promise<BloqueioData> {
    const novo: BloqueioData = {
      id: `bloq-${uuidv4().slice(0, 8)}`,
      data: dados.data,
      motivo: dados.motivo,
      dia_inteiro: dados.dia_inteiro !== false
    };
    return this.configRepo.salvarBloqueio(novo);
  }

  async removerBloqueio(id: string): Promise<boolean> {
    return this.configRepo.removerBloqueio(id);
  }

  // Gestão de Usuários (Recepcionistas)
  async listarUsuarios(): Promise<Usuario[]> {
    return this.usuarioRepo.listar();
  }

  async criarUsuario(dados: {
    nome: string;
    email: string;
    role: UserRole;
  }): Promise<Usuario> {
    const existe = await this.usuarioRepo.buscarPorEmail(dados.email);
    if (existe) {
      throw new Error('Já existe um usuário com este e-mail cadastrado.');
    }

    const novo: Usuario = {
      id: `user-${uuidv4().slice(0, 8)}`,
      nome: dados.nome,
      email: dados.email,
      role: dados.role,
      ativo: true
    };
    return this.usuarioRepo.salvar(novo);
  }

  async atualizarUsuario(id: string, dados: Partial<Usuario>): Promise<Usuario | null> {
    return this.usuarioRepo.atualizar(id, dados);
  }

  async removerUsuario(id: string): Promise<boolean> {
    return this.usuarioRepo.remover(id);
  }

  /**
   * Status da conexão institucional com Google Workspace.
   */
  async obterStatusContaGoogle(): Promise<{
    conectado: boolean;
    emailInstitucional: string;
    calendarAtivo: boolean;
    driveAtivo: boolean;
    ultimoSync: string;
  }> {
    return {
      conectado: true,
      emailInstitucional: 'esteticabemestarmc@gmail.com',
      calendarAtivo: true,
      driveAtivo: true,
      ultimoSync: new Date().toISOString()
    };
  }
}
