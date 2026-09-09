// ============================================================================
// PONTO DE INTEGRAÇÃO COM GOOGLE DRIVE (ARMAZENAMENTO DE FOTOS ANTES/DEPOIS E TERMOS)
// ============================================================================
// TODO: [INTEGRAÇÃO GOOGLE DRIVE]
// Configurar credenciais OAuth 2.0 da conta institucional (mesmo projeto Google do Calendar).
// Escopo necessário: https://www.googleapis.com/auth/drive.file
//
// Estrutura de pastas padronizada:
// /Clientes/{nome_cliente}_{id}/Atendimentos/{data}/
// /Clientes/{nome_cliente}_{id}/LGPD_Termos/
//
// Regra: Armazenar no banco (via repository) APENAS a referência (file_id / URL)
// da imagem no Google Drive, NUNCA o binário direto.
// ============================================================================

export interface UploadArquivoResultado {
  fileId: string;
  urlVisualizacao: string;
  urlDownload?: string;
  caminhoPasta: string;
}

export class GoogleDriveIntegration {
  /**
   * Garante a criação da estrutura de pastas para um cliente no Google Drive institucional.
   */
  static async obterOuCriarPastaCliente(clienteId: string, nomeCliente: string): Promise<string> {
    const nomePasta = `${nomeCliente.replace(/[^a-zA-Z0-9 ]/g, '')}_${clienteId}`;
    console.log(`[Google Drive Sync] Verificando/Criando pasta do cliente: /Clientes/${nomePasta}`);

    // TODO: [INTEGRAÇÃO GOOGLE DRIVE]
    // const drive = google.drive({ version: 'v3', auth: oauth2Client });
    // Busca se a pasta já existe; se não, cria com mimeType 'application/vnd.google-apps.folder'
    return `gdrive_folder_${clienteId}`;
  }

  /**
   * Faz upload de foto Antes/Depois para a pasta de atendimento do cliente.
   */
  static async uploadFotoAtendimento(
    clienteId: string,
    nomeCliente: string,
    dataAtendimento: string,
    tipo: 'antes' | 'depois',
    nomeArquivo: string,
    bufferOuBase64: string
  ): Promise<UploadArquivoResultado> {
    const caminho = `/Clientes/${nomeCliente}_${clienteId}/Atendimentos/${dataAtendimento}/${tipo}_${nomeArquivo}`;
    console.log(`[Google Drive Sync] Upload de foto de procedimento para: ${caminho}`);

    // TODO: [INTEGRAÇÃO GOOGLE DRIVE]
    // const drive = google.drive({ version: 'v3', auth: oauth2Client });
    // const res = await drive.files.create({
    //   requestBody: { name: `${tipo}_${nomeArquivo}`, parents: [pastaAtendimentoId] },
    //   media: { mimeType: 'image/jpeg', body: stream }
    // });
    // return { fileId: res.data.id!, urlVisualizacao: res.data.webViewLink!, caminhoPasta: caminho };

    return {
      fileId: `gdrive_file_${tipo}_${Date.now()}`,
      urlVisualizacao: `https://drive.google.com/file/d/mock-foto-${tipo}-${Date.now()}/view`,
      caminhoPasta: caminho
    };
  }

  /**
   * Faz upload do termo de consentimento LGPD assinado digitalmente.
   */
  static async uploadTermoLGPD(
    clienteId: string,
    nomeCliente: string,
    termoAssinadoPdfOuPng: string
  ): Promise<UploadArquivoResultado> {
    const caminho = `/Clientes/${nomeCliente}_${clienteId}/LGPD_Termos/termo_consentimento_${Date.now()}.pdf`;
    console.log(`[Google Drive Sync] Armazenando termo de consentimento assinado em: ${caminho}`);

    // TODO: [INTEGRAÇÃO GOOGLE DRIVE]
    return {
      fileId: `gdrive_termo_${clienteId}_${Date.now()}`,
      urlVisualizacao: `https://drive.google.com/file/d/mock-termo-lgpd-${clienteId}/view`,
      caminhoPasta: caminho
    };
  }
}
